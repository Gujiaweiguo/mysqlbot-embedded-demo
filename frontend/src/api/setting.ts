import { request } from '@/utils/request'

export interface BaseAssistantConfig {
  assistant_id: string
  name: string
  description: string
  cross_domain_enabled: boolean
  cross_domain_origins: string
  workspace_scope: string
  datasource_exposure: string
  workspace_ids: string[]
  datasource_ids: string[]
  workspace_names: string[]
  datasource_names: string[]
  public_list: string[]
  public_list_names: string[]
  private_list: string[]
  private_list_names: string[]
  auto_ds: boolean
}

export interface CredentialMapping {
  source_type: string
  source_name: string
  target_location: string
  target_name: string
  target_value_expression: string
}

export interface AdvancedAssistantConfig {
  assistant_id: string
  name: string
  description: string
  cross_domain_enabled: boolean
  cross_domain_origins: string
  interface_endpoint: string
  timeout: number
  aes_enable: boolean
  aes_key: string
  workspace_ids: string[]
  datasource_ids: string[]
  workspace_names: string[]
  datasource_names: string[]
  auto_ds: boolean
  credential_mappings: CredentialMapping[]
}

export interface EmbeddedAssistantAppConfig {
  app_id: string
  app_secret: string
}

export interface EmbeddedAssistantConfig {
  account: string
  basic_app: EmbeddedAssistantAppConfig
  advanced_app: EmbeddedAssistantAppConfig
}

export interface SettingRecord {
  domain: string
  base_assistant_id: string
  advanced_assistant_id: string
  embedded_app_id: string
  embedded_app_secret: string
  base_embedded_app_id: string
  base_embedded_app_secret: string
  advanced_embedded_app_id: string
  advanced_embedded_app_secret: string
  aes_enable: boolean
  aes_key: string
  base_assistant_config: BaseAssistantConfig
  advanced_assistant_config: AdvancedAssistantConfig
  embedded_account: string
}

export interface SettingApiResponse {
  success: boolean
  data: SettingRecord | null
}

const toStringValue = (value: unknown): string => {
  return typeof value === 'string' ? value : ''
}

const toBooleanValue = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value
  }
  return fallback
}

const toNumberValue = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return fallback
}

const toIdArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (typeof item === 'number' && Number.isFinite(item)) {
        return String(item)
      }
      if (typeof item === 'string') {
        return item.trim() ? item : null
      }
      return null
    })
    .filter((item): item is string => item != null)
}

export const createDefaultBaseAssistantConfig = (): BaseAssistantConfig => ({
  assistant_id: '',
  name: '',
  description: '',
  cross_domain_enabled: false,
  cross_domain_origins: '',
  workspace_scope: '',
  datasource_exposure: 'none',
  workspace_ids: [],
  datasource_ids: [],
  workspace_names: [],
  datasource_names: [],
  public_list: [],
  public_list_names: [],
  private_list: [],
  private_list_names: [],
  auto_ds: false,
})

export const createDefaultCredentialMapping = (): CredentialMapping => ({
  source_type: '',
  source_name: '',
  target_location: 'header',
  target_name: '',
  target_value_expression: '',
})

export const createDefaultAdvancedAssistantConfig = (): AdvancedAssistantConfig => ({
  assistant_id: '',
  name: '',
  description: '',
  cross_domain_enabled: false,
  cross_domain_origins: '',
  interface_endpoint: '',
  timeout: 30000,
  aes_enable: false,
  aes_key: '',
  workspace_ids: [],
  datasource_ids: [],
  workspace_names: [],
  datasource_names: [],
  auto_ds: false,
  credential_mappings: [],
})

export const createDefaultEmbeddedAssistantConfig = (): EmbeddedAssistantConfig => ({
  account: 'admin',
  basic_app: {
    app_id: '',
    app_secret: '',
  },
  advanced_app: {
    app_id: '',
    app_secret: '',
  },
})

export const normalizeBaseAssistantConfig = (
  config?: Partial<BaseAssistantConfig> | null,
  legacyAssistantId = ''
): BaseAssistantConfig => ({
  assistant_id: toStringValue(config?.assistant_id) || toStringValue(legacyAssistantId),
  name: toStringValue(config?.name),
  description: toStringValue(config?.description),
  cross_domain_enabled: toBooleanValue(config?.cross_domain_enabled),
  cross_domain_origins: toStringValue(config?.cross_domain_origins),
  workspace_scope: toStringValue(config?.workspace_scope),
  datasource_exposure: toStringValue(config?.datasource_exposure) || 'none',
  workspace_ids: toIdArray(config?.workspace_ids),
  datasource_ids: toIdArray(config?.datasource_ids),
  workspace_names: toIdArray(config?.workspace_names),
  datasource_names: toIdArray(config?.datasource_names),
  public_list: toIdArray(config?.public_list),
  public_list_names: toIdArray(config?.public_list_names),
  private_list: toIdArray(config?.private_list),
  private_list_names: toIdArray(config?.private_list_names),
  auto_ds: toBooleanValue(config?.auto_ds),
})

export const normalizeCredentialMapping = (
  mapping?: Partial<CredentialMapping> | null
): CredentialMapping => ({
  source_type: toStringValue(mapping?.source_type),
  source_name: toStringValue(mapping?.source_name),
  target_location: toStringValue(mapping?.target_location) || 'header',
  target_name: toStringValue(mapping?.target_name),
  target_value_expression: toStringValue(mapping?.target_value_expression),
})

export const normalizeAdvancedAssistantConfig = (
  config?: Partial<AdvancedAssistantConfig> | null,
  legacyAssistantId = '',
  legacyAesEnable = false,
  legacyAesKey = ''
): AdvancedAssistantConfig => ({
  assistant_id: toStringValue(config?.assistant_id) || toStringValue(legacyAssistantId),
  name: toStringValue(config?.name),
  description: toStringValue(config?.description),
  cross_domain_enabled: toBooleanValue(config?.cross_domain_enabled),
  cross_domain_origins: toStringValue(config?.cross_domain_origins),
  interface_endpoint: toStringValue(config?.interface_endpoint),
  timeout: toNumberValue(config?.timeout, 30000),
  aes_enable: toBooleanValue(config?.aes_enable, legacyAesEnable),
  aes_key: toStringValue(config?.aes_key) || toStringValue(legacyAesKey),
  workspace_ids: toIdArray(config?.workspace_ids),
  datasource_ids: toIdArray(config?.datasource_ids),
  workspace_names: toIdArray(config?.workspace_names),
  datasource_names: toIdArray(config?.datasource_names),
  auto_ds: toBooleanValue(config?.auto_ds),
  credential_mappings: Array.isArray(config?.credential_mappings)
    ? config.credential_mappings.map((item) => normalizeCredentialMapping(item))
    : [],
})

export const normalizeEmbeddedAssistantConfig = (
  data?: Partial<SettingRecord> | null
): EmbeddedAssistantConfig => ({
  account: toStringValue(data?.embedded_account) || 'admin',
  basic_app: {
    app_id: toStringValue(data?.base_embedded_app_id),
    app_secret: toStringValue(data?.base_embedded_app_secret),
  },
  advanced_app: {
    app_id: toStringValue(data?.advanced_embedded_app_id),
    app_secret: toStringValue(data?.advanced_embedded_app_secret),
  },
})

export const normalizeSettingRecord = (data?: Partial<SettingRecord> | null): SettingRecord => {
  const baseAssistantId = toStringValue(data?.base_assistant_id)
  const advancedAssistantId = toStringValue(data?.advanced_assistant_id)
  const baseAssistantConfig = normalizeBaseAssistantConfig(data?.base_assistant_config, baseAssistantId)
  const advancedAssistantConfig = normalizeAdvancedAssistantConfig(
    data?.advanced_assistant_config,
    advancedAssistantId,
    toBooleanValue(data?.aes_enable),
    toStringValue(data?.aes_key)
  )

  return {
    domain: toStringValue(data?.domain),
    base_assistant_id: baseAssistantConfig.assistant_id || baseAssistantId,
    advanced_assistant_id: advancedAssistantConfig.assistant_id || advancedAssistantId,
    embedded_app_id: toStringValue(data?.embedded_app_id),
    embedded_app_secret: toStringValue(data?.embedded_app_secret),
    base_embedded_app_id: toStringValue(data?.base_embedded_app_id),
    base_embedded_app_secret: toStringValue(data?.base_embedded_app_secret),
    advanced_embedded_app_id: toStringValue(data?.advanced_embedded_app_id),
    advanced_embedded_app_secret: toStringValue(data?.advanced_embedded_app_secret),
    aes_enable: advancedAssistantConfig.aes_enable,
    aes_key: advancedAssistantConfig.aes_key,
    base_assistant_config: baseAssistantConfig,
    advanced_assistant_config: advancedAssistantConfig,
    embedded_account: toStringValue(data?.embedded_account) || 'admin',
  }
}

export const SettingApi = {
  query: () => request.get<SettingApiResponse>('/setting'),
  save: (data: SettingRecord) => request.post<SettingApiResponse>('/setting', data)
}
