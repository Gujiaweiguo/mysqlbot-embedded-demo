<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import {
  SettingApi,
  type EmbeddedAssistantConfig,
  type SettingRecord,
  normalizeEmbeddedAssistantConfig,
} from '@/api/setting'
import { useSettingStore } from '@/store/setting'

const settingStore = useSettingStore()
const formRef = ref<FormInstance>()

const form = reactive<EmbeddedAssistantConfig>(normalizeEmbeddedAssistantConfig())

const hasDomain = computed(() => !!settingStore.getDomain)
const activeAppCount = computed(() => {
  const ids = [form.basic_app.app_id, form.advanced_app.app_id].filter((item) => !!item.trim())
  return ids.length
})

const syncForm = () => {
  Object.assign(form, normalizeEmbeddedAssistantConfig(settingStore.getData))
}

const buildPayload = (): SettingRecord => ({
  ...settingStore.getData,
  base_embedded_app_id: form.basic_app.app_id.trim(),
  base_embedded_app_secret: form.basic_app.app_secret.trim(),
  advanced_embedded_app_id: form.advanced_app.app_id.trim(),
  advanced_embedded_app_secret: form.advanced_app.app_secret.trim(),
  embedded_account: form.account.trim() || 'admin',
})

const handleSubmit = async () => {
  if (!hasDomain.value) {
    return
  }

  try {
    const res = await SettingApi.save(buildPayload())
    await settingStore.init(res.data)
    ElMessage.success('嵌入式小助手配置保存成功')
    window.location.reload()
  } catch {
    ElMessage.error('嵌入式小助手配置保存失败')
  }
}

onMounted(() => {
  syncForm()
})
</script>

<template>
  <div class="setting-page">
    <div class="setting-page__header">
      <div class="setting-page__eyebrow">Embedded assistant</div>
      <div class="setting-page__hero">
        <div class="setting-page__hero-copy">
          <h2 class="setting-page__title">嵌入式小助手配置</h2>
          <p class="setting-page__description">
            独立维护嵌入式小助手接入所需的页面嵌入应用凭据，使其与基础助手、高级助手配置并列管理。
          </p>
        </div>

      <div class="setting-page__status">
          <div class="setting-page__status-card">
            <div class="setting-page__status-label">SQLBot 服务地址</div>
            <div class="setting-page__status-value">{{ settingStore.getDomain || '请先在通用设置页配置' }}</div>
          </div>
          <div class="setting-page__status-card">
              <div class="setting-page__status-label">已配置页面</div>
              <div class="setting-page__status-value">{{ activeAppCount }}/2</div>
          </div>
        </div>
      </div>
    </div>

    <div class="setting-page__content">
      <el-alert
        v-if="!hasDomain"
        title="请先设置 SQLBot 服务地址"
        description="/api/setting 保存要求 domain 存在。请先回到“通用设置”填写服务地址，再保存嵌入式小助手配置。"
        type="warning"
        show-icon
        :closable="false"
      />

      <el-form ref="formRef" :model="form" label-position="top" status-icon>
        <div class="setting-page__panel">
          <div class="setting-page__panel-header">
            <div class="setting-page__panel-copy">
              <h3 class="setting-page__panel-title">SQLBot 账号</h3>
              <p class="setting-page__panel-description">
                嵌入式小助手以该 SQLBot 账号身份运行，账号决定可访问的工作区及数据源范围。
              </p>
            </div>
          </div>
          <div class="setting-page__grid">
            <el-form-item label="SQLBot 账号">
              <el-input v-model="form.account" placeholder="admin" clearable />
            </el-form-item>
          </div>
        </div>

        <div class="setting-page__panel">
          <div class="setting-page__panel-header">
            <div class="setting-page__panel-copy">
              <h3 class="setting-page__panel-title">问数页</h3>
              <p class="setting-page__panel-description">
                配置嵌入式小助手“问数页”所需的页面嵌入 APP ID 与 APP Secret，用于加载对话型页面。
              </p>
            </div>
          </div>

          <div class="setting-page__grid">
            <el-form-item label="问数页 APP ID">
              <el-input v-model="form.basic_app.app_id" placeholder="请输入问数页的页面嵌入 APP ID" clearable />
            </el-form-item>

            <el-form-item label="问数页 APP Secret">
              <el-input
                v-model="form.basic_app.app_secret"
                placeholder="请输入问数页的页面嵌入 APP Secret"
                type="password"
                show-password
                clearable
              />
            </el-form-item>
          </div>
        </div>

        <div class="setting-page__panel">
          <div class="setting-page__panel-header">
            <div class="setting-page__panel-copy">
              <h3 class="setting-page__panel-title">数据源页</h3>
              <p class="setting-page__panel-description">
                配置嵌入式小助手“数据源页”所需的页面嵌入 APP ID 与 APP Secret，用于加载带数据源语义的页面。
              </p>
            </div>
          </div>

          <div class="setting-page__grid">
            <el-form-item label="数据源页 APP ID">
              <el-input v-model="form.advanced_app.app_id" placeholder="请输入数据源页的页面嵌入 APP ID" clearable />
            </el-form-item>

            <el-form-item label="数据源页 APP Secret">
              <el-input
                v-model="form.advanced_app.app_secret"
                placeholder="请输入数据源页的页面嵌入 APP Secret"
                type="password"
                show-password
                clearable
              />
            </el-form-item>
          </div>
        </div>
      </el-form>
    </div>

    <div class="setting-page__footer">
      <div class="setting-page__footer-note">
        保存后将继续通过 <code>/api/setting</code> 复用现有后端配置与 token 签发能力，无需额外迁移数据库字段。
      </div>
      <el-button type="primary" size="large" :disabled="!hasDomain" @click="handleSubmit">保存嵌入式小助手配置</el-button>
    </div>
  </div>
</template>

<style scoped>
@import './page.css';
</style>
