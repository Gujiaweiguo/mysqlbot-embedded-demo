<template>
  <div v-loading="loading" class="assistant-embed-base"/>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed, ref } from 'vue';
import { useSettingStore } from '@/store/setting'
import { useUserStore } from '@/store/user'
import { EmbeddedTokenApi } from '@/api/token'

const settingStore = useSettingStore()
const userStore = useUserStore()
const assistantId = computed(() => settingStore.getBaseAssistantId)
const chatAppId = computed(() => settingStore.getEmbeddedAssistantChatAppId)
const sqlbotDomain = computed(() => settingStore.getDomain)
const online = computed(() => userStore.getOnline)
const userFlag = computed(() => {
  if (!online.value) {
    return null
  }
  return userStore.getUid
})
const loading = ref(true)

const activeId = computed(() => assistantId.value || chatAppId.value)
const useAssistantPath = computed(() => !!assistantId.value)

const iframeId = computed(() => `sqlbot-embedded-chat-iframe-${activeId.value}`)
const getTargetOrigin = () => {
  try {
    return new URL(sqlbotDomain.value).origin
  } catch {
    return ''
  }
}
const getIframe = () => document.getElementById(iframeId.value) as HTMLIFrameElement | null

const buildCertificate = (): string | null => {
  const sourceVal = window.localStorage.getItem('sqlbot-embedded-token')
  if (!sourceVal) {
    return null
  }
  let token = sourceVal
  try {
    const parsed = JSON.parse(sourceVal)
    if (parsed && typeof parsed.v === 'string') {
      token = parsed.v
    }
  } catch {
    // keep raw storage value
  }
  return JSON.stringify([
    {
      target: 'header',
      key: 'sqlbot-embedded-token',
      value: `Bearer ${token}`,
    },
  ])
}

let messageHandler: ((event: MessageEvent) => void) | null = null

const init = async () => {
  if (!sqlbotDomain.value || !activeId.value) {
    return
  }

  // Fallback path needs a JWT token from the backend
  let jwtToken: string | null = null
  if (!useAssistantPath.value) {
    const res = await EmbeddedTokenApi.generage(chatAppId.value)
    jwtToken = res.data
  }

  const targetOrigin = getTargetOrigin()

  messageHandler = (event: MessageEvent) => {
    if (event.origin !== targetOrigin) {
      return
    }
    const data = event.data
    if (data?.eventName !== 'sqlbot_embedded_event') {
      return
    }
    if (data?.messageId !== activeId.value) {
      return
    }
    if (data?.busi === 'ready' && data?.ready) {
      const iframe = getIframe()
      if (iframe?.contentWindow) {
        if (useAssistantPath.value) {
          // Assistant-id / header-injection path (type 1, no busiFlag)
          const certificate = buildCertificate()
          iframe.contentWindow.postMessage({
            eventName: 'sqlbot_embedded_event',
            hostOrigin: window.location.origin,
            busi: 'certificate',
            type: 1,
            certificate,
            messageId: activeId.value
          }, targetOrigin)
        } else {
          // Legacy appId / JWT path (type 4, with busiFlag)
          iframe.contentWindow.postMessage({
            eventName: 'sqlbot_embedded_event',
            busiFlag: 'ds',
            busi: 'certificate',
            type: 4,
            certificate: jwtToken,
            hostOrigin: window.location.origin,
            messageId: chatAppId.value
          }, targetOrigin)
        }
      }
    }
  }
  window.addEventListener('message', messageHandler)

  const root = document.querySelector('.assistant-embed-base')
  if (root) {
    root.innerHTML = ''
    const iframe = document.createElement('iframe')
    const baseUrl = sqlbotDomain.value.replace(/\/$/, '')

    if (useAssistantPath.value) {
      let srcUrl = `${baseUrl}/#/embeddedPage?id=${assistantId.value}&online=${online.value}`
      if (online.value) {
        srcUrl += `&userFlag=${userFlag.value}`
      }
      iframe.src = srcUrl
    } else {
      iframe.src = `${baseUrl}/#/embeddedPage?id=${chatAppId.value}`
    }

    iframe.id = iframeId.value
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.border = '0'
    root.appendChild(iframe)
  }

  setTimeout(() => {
    loading.value = false
  }, 5000)
}

onMounted(async () => {
  await init()
})

onBeforeUnmount(() => {
  if (messageHandler) {
    window.removeEventListener('message', messageHandler)
    messageHandler = null
  }

  const root = document.querySelector('.assistant-embed-base')
  if (root) {
    root.innerHTML = ''
  }
})
</script>

<style scoped>
.assistant-embed-base {
  width: 100%;
  height: 100%;
}
</style>
