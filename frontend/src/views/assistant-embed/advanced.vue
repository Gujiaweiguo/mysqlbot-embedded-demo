<template>
  <div v-loading="loading" class="assistant-embed-advanced"/>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed, ref } from 'vue';
import { useSettingStore } from '@/store/setting'
import { EmbeddedTokenApi } from '@/api/token'

const settingStore = useSettingStore()
const datasourceAppId = computed(() => settingStore.getEmbeddedAssistantDatasourceAppId)
const sqlbotDomain = computed(() => settingStore.getDomain)
const loading = ref(true)

let messageHandler: ((event: MessageEvent) => void) | null = null

const init = async () => {
  const res = await EmbeddedTokenApi.generage(datasourceAppId.value)
  const token = res.data

  messageHandler = (event: MessageEvent) => {
    const data = event.data
    if (data?.eventName === 'sqlbot_embedded_event' && data?.messageId === datasourceAppId.value) {
      if (data?.busi === 'ready' && data?.ready) {
        const iframe = document.querySelector('.assistant-embed-advanced iframe') as HTMLIFrameElement
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({
            eventName: 'sqlbot_embedded_event',
            busiFlag: 'ds',
            busi: 'certificate',
            type: 4,
            certificate: token,
            hostOrigin: window.location.origin,
            messageId: datasourceAppId.value
          }, '*')
        }
      }
    }
  }
  window.addEventListener('message', messageHandler)

  const root = document.querySelector('.assistant-embed-advanced')
  if (root) {
    root.innerHTML = ''
    const iframe = document.createElement('iframe')
    const baseUrl = sqlbotDomain.value.replace(/\/$/, '')
    iframe.src = `${baseUrl}/#/embeddedCommon?id=${datasourceAppId.value}`
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

  const root = document.querySelector('.assistant-embed-advanced')
  if (root) {
    root.innerHTML = ''
  }
})
</script>

<style scoped>
.assistant-embed-advanced {
  width: 100%;
  height: 100%;
}
</style>
