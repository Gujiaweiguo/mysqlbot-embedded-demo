<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  SettingApi,
  createDefaultCredentialMapping,
  type AdvancedAssistantConfig,
  type CredentialMapping,
  type SettingRecord,
  normalizeAdvancedAssistantConfig,
} from '@/api/setting'
import { useSettingStore } from '@/store/setting'

const settingStore = useSettingStore()
const formRef = ref<FormInstance>()

const targetLocationOptions = [
  { label: 'Header', value: 'header' },
  { label: 'Query', value: 'query' },
  { label: 'Body', value: 'body' },
  { label: 'Cookie', value: 'cookie' },
]

const form = reactive<AdvancedAssistantConfig>(normalizeAdvancedAssistantConfig())

const rules: FormRules = {
  name: [{ required: true, message: '请输入高级助手名称', trigger: 'blur' }],
  assistant_id: [{ required: true, message: '请输入运行时兼容 assistant_id', trigger: 'blur' }],
  interface_endpoint: [{ required: true, message: '请输入接口地址', trigger: 'blur' }],
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

const advancedBindingOverview = computed(() => {
  const workspaceName = form.workspace_names[0]
  const workspaceId = form.workspace_ids[0]
  const targetWorkspace = workspaceName && workspaceId ? `${workspaceName}（id=${workspaceId}）` : workspaceName || workspaceId || '未配置'

  return {
    source: [
      { label: '来源方式', value: '外部动态接口' },
      { label: '接口地址', value: form.interface_endpoint || '未配置' },
      { label: '请求超时', value: form.timeout ? `${form.timeout} ms` : '未配置' },
      { label: 'AES 加密', value: form.aes_enable ? '已启用' : '未启用' },
    ],
    target: [
      { label: '目标工作区', value: targetWorkspace },
      { label: '目标数据源', value: formatBindingList(form.datasource_ids, form.datasource_names) },
      { label: '数据源 ID 列表', value: form.datasource_ids.length ? form.datasource_ids.join('、') : '无' },
      { label: '工作区 ID 列表', value: form.workspace_ids.length ? form.workspace_ids.join('、') : '无' },
      { label: '自动选择数据源', value: form.auto_ds ? '是' : '否' },
    ],
  }
})

const syncForm = () => {
  const config = normalizeAdvancedAssistantConfig(
    settingStore.getAdvancedAssistantConfig,
    settingStore.getAdvancedAssistantId,
    settingStore.getData.aes_enable,
    settingStore.getData.aes_key
  )
  Object.assign(form, {
    ...config,
    credential_mappings: config.credential_mappings.map((item) => ({ ...item })),
  })
}

const generateRandomString = (length = 32): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

const ensureAesKey = () => {
  if (form.aes_enable && !form.aes_key) {
    form.aes_key = generateRandomString(32)
  }
}

const addCredentialMapping = () => {
  form.credential_mappings.push(createDefaultCredentialMapping())
}

const removeCredentialMapping = (index: number) => {
  form.credential_mappings.splice(index, 1)
}

const sanitizeCredentialMappings = (mappings: CredentialMapping[]): CredentialMapping[] => {
  return mappings.map((mapping) => ({
    source_type: mapping.source_type.trim(),
    source_name: mapping.source_name.trim(),
    target_location: mapping.target_location.trim(),
    target_name: mapping.target_name.trim(),
    target_value_expression: mapping.target_value_expression.trim(),
  }))
}

const buildPayload = (): SettingRecord => ({
  ...settingStore.getData,
  advanced_assistant_id: form.assistant_id.trim(),
  aes_enable: form.aes_enable,
  aes_key: form.aes_key.trim(),
  advanced_assistant_config: {
    ...form,
    assistant_id: form.assistant_id.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    cross_domain_origins: form.cross_domain_origins.trim(),
    interface_endpoint: form.interface_endpoint.trim(),
    aes_key: form.aes_key.trim(),
    credential_mappings: sanitizeCredentialMappings(form.credential_mappings),
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
    ElMessage.success('高级助手配置保存成功')
    window.location.reload()
  } catch {
    ElMessage.error('高级助手配置保存失败')
  }
}

onMounted(() => {
  syncForm()
})
</script>

<template>
  <div class="setting-page">
    <div class="setting-page__header">
      <div class="setting-page__eyebrow">Advanced assistant</div>
      <div class="setting-page__hero">
        <div class="setting-page__hero-copy">
          <h2 class="setting-page__title">高级助手配置</h2>
          <p class="setting-page__description">
            按 thxtd advanced 语义维护本地镜像配置：接口地址、超时、AES 与凭据映射，并继续为旧运行页派生兼容 assistant ID。
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
        description="/api/setting 保存要求 domain 存在。请先回到“通用设置”填写当前服务地址，再保存高级助手配置。"
        type="warning"
        show-icon
        :closable="false"
      />

      <div class="setting-page__panel">
        <div class="setting-page__panel-copy">
          <h3 class="setting-page__panel-title">数据源来源与绑定概览</h3>
          <p class="setting-page__panel-description">
            展示高级小助手当前通过哪个接口获取数据源，以及目标工作区与目标数据源范围。
          </p>
        </div>

        <div class="setting-page__panel-copy">
          <h4 class="setting-page__panel-title">数据源来源方式</h4>
        </div>
        <div class="setting-page__meta-grid">
          <div v-for="item in advancedBindingOverview.source" :key="item.label" class="setting-page__meta-item">
            <div class="setting-page__meta-label">{{ item.label }}</div>
            <div class="setting-page__meta-value">{{ item.value }}</div>
          </div>
        </div>

        <div class="setting-page__panel-copy">
          <h4 class="setting-page__panel-title">当前目标绑定</h4>
        </div>
        <div class="setting-page__meta-grid">
          <div v-for="item in advancedBindingOverview.target" :key="item.label" class="setting-page__meta-item">
            <div class="setting-page__meta-label">{{ item.label }}</div>
            <div class="setting-page__meta-value">{{ item.value }}</div>
          </div>
        </div>

        <el-alert
          title="运行时说明"
          description="当前区域展示的是高级小助手的目标数据源配置。最终实际返回的数据源，以 /api/datasource 接口运行时结果为准。"
          type="info"
          show-icon
          :closable="false"
        />
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" status-icon>
        <div class="setting-page__panel">
          <div class="setting-page__panel-header">
            <div class="setting-page__panel-copy">
              <h3 class="setting-page__panel-title">应用信息与接口参数</h3>
              <p class="setting-page__panel-description">维护 thxtd advanced 的元数据、调用入口（通常对接 <code>/api/datasource</code>）、超时与跨域策略。</p>
            </div>
            <div class="setting-page__tag">接口级配置</div>
          </div>

          <div class="setting-page__grid">
            <el-form-item label="兼容 assistant_id" prop="assistant_id">
              <el-input v-model="form.assistant_id" placeholder="请输入 thxtd advanced 对应的兼容 assistant_id" clearable />
            </el-form-item>

            <el-form-item label="应用名称" prop="name">
              <el-input v-model="form.name" placeholder="例如：thxtd 高级助手" clearable />
            </el-form-item>

            <el-form-item label="应用说明" class="setting-page__full">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                placeholder="说明该 thxtd advanced 接口的用途、调用约束与适用场景"
              />
            </el-form-item>

            <el-form-item label="接口 Endpoint" prop="interface_endpoint" class="setting-page__full">
              <el-input v-model="form.interface_endpoint" placeholder="例如：/api/datasource 或代理后的高级数据源入口" clearable />
            </el-form-item>

            <el-form-item label="请求超时（ms）" prop="timeout">
              <el-input-number v-model="form.timeout" :min="1000" :max="120000" :step="1000" controls-position="right" />
            </el-form-item>

            <el-form-item label="开启跨域" prop="cross_domain_enabled">
              <el-switch v-model="form.cross_domain_enabled" />
            </el-form-item>

            <el-form-item label="允许跨域来源" class="setting-page__full" v-if="form.cross_domain_enabled">
              <el-input
                v-model="form.cross_domain_origins"
                type="textarea"
                :rows="3"
                placeholder="多个来源可使用逗号分隔，例如：https://demo.example.com,https://ops.example.com"
              />
            </el-form-item>
          </div>
        </div>

        <div class="setting-page__panel">
          <div class="setting-page__panel-header">
            <div class="setting-page__panel-copy">
              <h3 class="setting-page__panel-title">AES 与凭据映射</h3>
              <p class="setting-page__panel-description">配置 thxtd advanced 数据源链路的 AES 加密与凭据映射，全部保存在本地 demo 配置里。</p>
            </div>
            <el-button class="setting-page__compact-button" type="primary" plain @click="addCredentialMapping">新增映射</el-button>
          </div>

          <div class="setting-page__grid">
            <el-form-item label="启用 AES" prop="aes_enable">
              <el-switch v-model="form.aes_enable" @change="ensureAesKey" />
            </el-form-item>

            <div class="setting-page__inline-row setting-page__full">
              <el-form-item label="AES Key" prop="aes_key" class="setting-page__full">
                <el-input
                  v-model="form.aes_key"
                  placeholder="启用 AES 时建议生成或填写 32 位 Key"
                  type="password"
                  show-password
                  clearable
                />
              </el-form-item>
              <el-button plain class="setting-page__compact-button" @click="form.aes_key = generateRandomString(32)">生成随机 Key</el-button>
            </div>
          </div>

          <div class="setting-page__mapping-list">
            <div v-if="!form.credential_mappings.length" class="setting-page__empty">
              暂无凭据映射。可按需新增从当前凭据到 thxtd advanced 请求参数的转发规则。
            </div>

            <div
              v-for="(mapping, index) in form.credential_mappings"
              :key="`${index}-${mapping.source_name}-${mapping.target_name}`"
              class="setting-page__mapping-card"
            >
              <div class="setting-page__mapping-header">
                <div class="setting-page__mapping-copy">
                  <div class="setting-page__mapping-index">Mapping {{ index + 1 }}</div>
                  <h4 class="setting-page__mapping-title">凭据映射规则</h4>
                   <p class="setting-page__mapping-description">定义本地凭据与 thxtd advanced 请求参数之间的映射关系。</p>
                </div>
                <el-button text type="danger" @click="removeCredentialMapping(index)">删除</el-button>
              </div>

              <div class="setting-page__mapping-grid">
                <el-form-item label="source_type">
                  <el-input v-model="mapping.source_type" placeholder="例如：credential / header / user" clearable />
                </el-form-item>

                <el-form-item label="source_name">
                  <el-input v-model="mapping.source_name" placeholder="源字段名称" clearable />
                </el-form-item>

                <el-form-item label="target_location">
                  <el-select v-model="mapping.target_location" placeholder="请选择目标位置">
                    <el-option
                      v-for="item in targetLocationOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="target_name">
                  <el-input v-model="mapping.target_name" placeholder="目标字段名称" clearable />
                </el-form-item>

                <el-form-item label="target_value_expression" class="setting-page__full">
                  <el-input
                    v-model="mapping.target_value_expression"
                    type="textarea"
                    :rows="3"
                    placeholder="例如：{{ source_value }} 或 {{ user.uid }}"
                  />
                </el-form-item>
              </div>
            </div>
          </div>
        </div>
      </el-form>
    </div>

    <div class="setting-page__footer">
      <div class="setting-page__footer-note">保存后会通过 <code>/api/setting</code> 同步 <code>advanced_assistant_config</code>，同时保持 <code>advanced_assistant_id</code> 兼容输出。</div>
      <el-button type="primary" size="large" :disabled="!hasDomain" @click="handleSubmit(formRef)">保存高级助手配置</el-button>
    </div>
  </div>
</template>

<style scoped>
@import './page.css';
</style>
