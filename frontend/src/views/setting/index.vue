<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { SettingApi, type SettingRecord } from '@/api/setting'
import { useSettingStore } from '@/store/setting'

const router = useRouter()
const settingStore = useSettingStore()

const formRef = ref<FormInstance>()

const form = reactive({
  domain: '',
  embedded_app_id: '',
  embedded_app_secret: '',
})

const rules: FormRules = {
  domain: [{ required: true, message: '请输入 SQLBot 服务地址', trigger: 'blur' }],
}

const baseAssistantId = computed(() => settingStore.getBaseAssistantId)
const advancedAssistantId = computed(() => settingStore.getAdvancedAssistantId)

const syncForm = () => {
  const data = settingStore.getData
  form.domain = data.domain
  form.embedded_app_id = data.embedded_app_id
  form.embedded_app_secret = data.embedded_app_secret
}

const buildPayload = (): SettingRecord => ({
  ...settingStore.getData,
  domain: form.domain.trim(),
  embedded_app_id: form.embedded_app_id.trim(),
  embedded_app_secret: form.embedded_app_secret.trim(),
})

const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) {
    return
  }

  const valid = await formEl.validate().catch(() => false)
  if (!valid) {
    return
  }

  try {
    const res = await SettingApi.save(buildPayload())
    await settingStore.init(res.data)
    ElMessage.success('配置保存成功')
    window.location.reload()
  } catch {
    ElMessage.error('配置保存失败')
  }
}

onMounted(() => {
  syncForm()
})
</script>

<template>
  <div class="setting-page">
    <div class="setting-page__header">
      <div class="setting-page__eyebrow">通用设置</div>
      <div class="setting-page__hero">
        <div class="setting-page__hero-copy">
          <h2 class="setting-page__title">通用设置</h2>
          <p class="setting-page__description">
            配置 SQLBot 服务地址和页面嵌入凭据，用于建立宿主应用与 SQLBot 之间的连接。
          </p>
        </div>

        <div class="setting-page__status">
          <div class="setting-page__status-card">
            <div class="setting-page__status-label">基础助手运行时 ID</div>
            <div class="setting-page__status-value">{{ baseAssistantId || '未配置' }}</div>
          </div>
          <div class="setting-page__status-card">
            <div class="setting-page__status-label">高级助手运行时 ID</div>
            <div class="setting-page__status-value">{{ advancedAssistantId || '未配置' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="setting-page__content">
      <el-alert title="助手相关配置请前往下方独立页面维护。" type="info" show-icon :closable="false" />

      <div class="setting-page__actions">
        <el-button type="primary" plain @click="router.push('/setting/base-assistant')">基础助手配置</el-button>
        <el-button type="primary" plain @click="router.push('/setting/advanced-assistant')">高级助手配置</el-button>
        <el-button type="primary" plain @click="router.push('/setting/embedded-assistant')">嵌入式小助手配置</el-button>
      </div>

      <div class="setting-page__panel">
        <div class="setting-page__panel-header">
          <div class="setting-page__panel-copy">
            <h3 class="setting-page__panel-title">接入配置</h3>
            <p class="setting-page__panel-description">
              配置 SQLBot 服务地址与页面嵌入凭据，供当前宿主应用接入使用。
            </p>
          </div>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" status-icon>
          <div class="setting-page__grid">
            <el-form-item label="SQLBot 服务地址" prop="domain" class="setting-page__full">
              <el-input v-model="form.domain" placeholder="例如：https://sqlbot.example.com" clearable />
            </el-form-item>

            <el-form-item label="页面嵌入 APP ID" prop="embedded_app_id">
              <el-input v-model="form.embedded_app_id" placeholder="请输入页面嵌入 APP ID" clearable />
            </el-form-item>

            <el-form-item label="页面嵌入 APP Secret" prop="embedded_app_secret">
              <el-input
                v-model="form.embedded_app_secret"
                placeholder="请输入页面嵌入 APP Secret"
                type="password"
                show-password
                clearable
              />
            </el-form-item>
          </div>
        </el-form>
      </div>

    </div>

    <div class="setting-page__footer">
      <div class="setting-page__footer-note">保存后会通过 <code>/api/setting</code> 同步 SQLBot 服务地址与页面嵌入凭据，供当前 Demo 的通用接入能力使用。</div>
      <el-button type="primary" size="large" @click="handleSubmit(formRef)">保存配置</el-button>
    </div>
  </div>
</template>

<style scoped>
@import './page.css';
</style>
