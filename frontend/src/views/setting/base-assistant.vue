<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  SettingApi,
  type BaseAssistantConfig,
  type SettingRecord,
  normalizeBaseAssistantConfig,
} from '@/api/setting'
import { useSettingStore } from '@/store/setting'

const settingStore = useSettingStore()
const formRef = ref<FormInstance>()

const workspaceScopeOptions = [
  { label: '当前工作空间', value: 'current_workspace' },
  { label: '调用方上下文', value: 'caller_context' },
  { label: '全部工作空间', value: 'all_workspaces' },
]

const datasourceExposureOptions = [
  { label: '不暴露数据源', value: 'none' },
  { label: '仅当前工作空间可见数据源', value: 'workspace_visible' },
  { label: '仅授权数据源', value: 'authorized_only' },
  { label: '全部已接入数据源', value: 'all_visible' },
]

const form = reactive<BaseAssistantConfig>(normalizeBaseAssistantConfig())

const rules: FormRules = {
  name: [{ required: true, message: '请输入基础助手名称', trigger: 'blur' }],
  assistant_id: [{ required: true, message: '请输入运行时兼容 assistant_id', trigger: 'blur' }],
}

const hasDomain = computed(() => !!settingStore.getDomain)

const formatBindingList = (ids: string[] = [], names: string[] = []) => {
  if (!ids.length) {
    return '无'
  }

  return ids
    .map((id, index) => {
      const name = names[index]
      return name && name !== id ? `${name}（id=${id}）` : `id=${id}`
    })
    .join('、')
}

const bindingOverview = computed(() => {
  const config = form
  const workspaceName = config.workspace_names[0]
  const workspaceId = config.workspace_ids[0]
  const currentWorkspace = workspaceName && workspaceId ? `${workspaceName}（id=${workspaceId}）` : workspaceName || workspaceId || '未配置'
  const currentDatasource = config.datasource_ids.length
    ? formatBindingList(config.datasource_ids, config.datasource_names)
    : formatBindingList(config.public_list, config.datasource_names)

  return [
    { label: '当前工作区', value: currentWorkspace },
    { label: '工作区范围', value: config.workspace_scope || '未配置' },
    { label: '当前绑定数据源', value: currentDatasource },
    { label: '公开数据源', value: formatBindingList(config.public_list, config.public_list_names) },
    { label: '私有数据源', value: formatBindingList(config.private_list, config.private_list_names) },
    { label: '自动选择数据源', value: config.auto_ds ? '是' : '否' },
  ]
})

const syncForm = () => {
  Object.assign(form, normalizeBaseAssistantConfig(settingStore.getBaseAssistantConfig, settingStore.getBaseAssistantId))
}

const buildPayload = (): SettingRecord => ({
  ...settingStore.getData,
  base_assistant_id: form.assistant_id.trim(),
  base_assistant_config: {
    ...form,
    assistant_id: form.assistant_id.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    cross_domain_origins: form.cross_domain_origins.trim(),
  },
})

const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl || !hasDomain.value) {
    return
  }

  const valid = await formEl.validate().catch(() => false)
  if (!valid) {
    return
  }

  try {
    const res = await SettingApi.save(buildPayload())
    await settingStore.init(res.data)
    ElMessage.success('基础助手配置保存成功')
    window.location.reload()
  } catch {
    ElMessage.error('基础助手配置保存失败')
  }
}

onMounted(() => {
  syncForm()
})
</script>

<template>
  <div class="setting-page">
    <div class="setting-page__header">
      <div class="setting-page__eyebrow">Base assistant</div>
      <div class="setting-page__hero">
        <div class="setting-page__hero-copy">
          <h2 class="setting-page__title">基础助手配置</h2>
          <p class="setting-page__description">
            按 thxtd basic 语义维护本地镜像配置：应用元信息、跨域策略、工作空间范围与数据源可见范围。
          </p>
        </div>

        <div class="setting-page__status">
          <div class="setting-page__status-card">
            <div class="setting-page__status-label">当前服务地址</div>
            <div class="setting-page__status-value">{{ settingStore.getDomain || '请先在通用设置页配置' }}</div>
          </div>
          <div class="setting-page__status-card">
            <div class="setting-page__status-label">Derived runtime ID</div>
            <div class="setting-page__status-value">{{ form.assistant_id || '未配置' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="setting-page__content">
      <el-alert
        v-if="!hasDomain"
        title="请先设置服务地址"
        description="/api/setting 保存要求 domain 存在。请先回到“通用设置”填写当前服务地址，再保存基础助手配置。"
        type="warning"
        show-icon
        :closable="false"
      />

      <div class="setting-page__panel">
        <div class="setting-page__panel-copy">
          <h3 class="setting-page__panel-title">数据源绑定概览</h3>
          <p class="setting-page__panel-description">
            展示当前从 SQLBot 同步过来的工作区与数据源绑定信息，用于确认基础小助手的访问范围。
          </p>
        </div>

        <div class="setting-page__meta-grid">
          <div v-for="item in bindingOverview" :key="item.label" class="setting-page__meta-item">
            <div class="setting-page__meta-label">{{ item.label }}</div>
            <div class="setting-page__meta-value">{{ item.value }}</div>
          </div>
        </div>

        <p class="setting-page__meta-note">
          基础小助手的数据源访问范围来自 SQLBot assistant 配置同步结果，当前页面仅展示本地镜像信息。
        </p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" status-icon>
        <div class="setting-page__panel">
          <div class="setting-page__panel-header">
            <div class="setting-page__panel-copy">
              <h3 class="setting-page__panel-title">应用基础信息</h3>
              <p class="setting-page__panel-description">维护 thxtd basic 的名称、说明与兼容 assistant_id，确保旧运行页仍能读取派生 ID。</p>
            </div>
            <div class="setting-page__tag">运行时兼容字段保留</div>
          </div>

          <div class="setting-page__grid">
            <el-form-item label="兼容 assistant_id" prop="assistant_id">
              <el-input v-model="form.assistant_id" placeholder="请输入 thxtd basic 对应的兼容 assistant_id" clearable />
            </el-form-item>

            <el-form-item label="应用名称" prop="name">
              <el-input v-model="form.name" placeholder="例如：thxtd 基础助手" clearable />
            </el-form-item>

            <el-form-item label="应用说明" class="setting-page__full">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                placeholder="说明当前工作空间内 thxtd basic 的适用场景与能力边界"
              />
            </el-form-item>
          </div>
        </div>

        <div class="setting-page__panel">
          <div class="setting-page__panel-copy">
            <h3 class="setting-page__panel-title">跨域与暴露策略</h3>
              <p class="setting-page__panel-description">配置 thxtd basic 在当前工作空间下的跨域能力、作用范围与数据源可见语义。</p>
          </div>

          <div class="setting-page__grid">
            <el-form-item label="开启跨域" prop="cross_domain_enabled">
              <el-switch v-model="form.cross_domain_enabled" />
            </el-form-item>

            <el-form-item label="工作空间范围" prop="workspace_scope">
              <el-select v-model="form.workspace_scope" placeholder="请选择工作空间范围" clearable>
                <el-option
                  v-for="item in workspaceScopeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="允许跨域来源" class="setting-page__full" v-if="form.cross_domain_enabled">
              <el-input
                v-model="form.cross_domain_origins"
                type="textarea"
                :rows="3"
                placeholder="多个来源可使用逗号分隔，例如：https://demo.example.com,https://ops.example.com"
              />
            </el-form-item>

             <el-form-item label="数据源可见范围" class="setting-page__full" prop="datasource_exposure">
               <el-select v-model="form.datasource_exposure" placeholder="请选择数据源可见策略">
                <el-option
                  v-for="item in datasourceExposureOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
        </div>
      </el-form>
    </div>

    <div class="setting-page__footer">
      <div class="setting-page__footer-note">保存后会通过 <code>/api/setting</code> 同步结构化 <code>base_assistant_config</code>，并继续派生兼容的 <code>base_assistant_id</code>。</div>
      <el-button type="primary" size="large" :disabled="!hasDomain" @click="handleSubmit(formRef)">保存基础助手配置</el-button>
    </div>
  </div>
</template>

<style scoped>
@import './page.css';
</style>
