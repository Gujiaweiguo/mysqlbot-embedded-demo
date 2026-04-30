import { defineStore } from 'pinia'
import { store } from './index'
import {
  SettingApi,
  type AdvancedAssistantConfig,
  type BaseAssistantConfig,
  type CredentialMapping,
  type EmbeddedAssistantConfig,
  type SettingRecord,
  normalizeEmbeddedAssistantConfig,
  normalizeSettingRecord,
} from '@/api/setting'

interface SettingState extends SettingRecord {
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
  loaded: boolean
}

const cloneCredentialMappings = (mappings: CredentialMapping[]): CredentialMapping[] => {
  return mappings.map((mapping) => ({ ...mapping }))
}

const cloneIdArray = (values: string[]): string[] => {
  return [...values]
}

const cloneSettingRecord = (record: SettingRecord): SettingRecord => ({
  ...record,
  base_assistant_config: {
    ...record.base_assistant_config,
    workspace_ids: cloneIdArray(record.base_assistant_config.workspace_ids),
    datasource_ids: cloneIdArray(record.base_assistant_config.datasource_ids),
    workspace_names: cloneIdArray(record.base_assistant_config.workspace_names),
    datasource_names: cloneIdArray(record.base_assistant_config.datasource_names),
    public_list: cloneIdArray(record.base_assistant_config.public_list),
    public_list_names: cloneIdArray(record.base_assistant_config.public_list_names),
    private_list: cloneIdArray(record.base_assistant_config.private_list),
    private_list_names: cloneIdArray(record.base_assistant_config.private_list_names),
  },
  advanced_assistant_config: {
    ...record.advanced_assistant_config,
    workspace_ids: cloneIdArray(record.advanced_assistant_config.workspace_ids),
    datasource_ids: cloneIdArray(record.advanced_assistant_config.datasource_ids),
    workspace_names: cloneIdArray(record.advanced_assistant_config.workspace_names),
    datasource_names: cloneIdArray(record.advanced_assistant_config.datasource_names),
    credential_mappings: cloneCredentialMappings(record.advanced_assistant_config.credential_mappings),
  },
})

export const SettingStore = defineStore('setting', {
  state: (): SettingState => {
    const defaultData = normalizeSettingRecord()
    return {
      ...defaultData,
      loaded: false
    }
  },
  getters: {
    getDomain(): string {
      return this.domain
    },
    getBaseAssistantId(): string {
      return this.base_assistant_config.assistant_id || this.base_assistant_id
    },
    getAdvancedAssistantId(): string {
      return this.advanced_assistant_config.assistant_id || this.advanced_assistant_id
    },
    getEmbeddedAppId(): string {
      return this.embedded_app_id
    },
    getEmbeddedAppSecret(): string {
      return this.embedded_app_secret
    },
    getBaseEmbeddedAppId(): string {
      return this.base_embedded_app_id
    },
    getBaseEmbeddedAppSecret(): string {
      return this.base_embedded_app_secret
    },
    getAdvancedEmbeddedAppId(): string {
      return this.advanced_embedded_app_id
    },
    getAdvancedEmbeddedAppSecret(): string {
      return this.advanced_embedded_app_secret
    },
    getEmbeddedAssistantConfig(): EmbeddedAssistantConfig {
      return normalizeEmbeddedAssistantConfig(this.getData)
    },
    getEmbeddedAccount(): string {
      return this.embedded_account || 'admin'
    },
    getEmbeddedAssistantChatAppId(): string {
      return this.base_embedded_app_id
    },
    getEmbeddedAssistantChatAppSecret(): string {
      return this.base_embedded_app_secret
    },
    getEmbeddedAssistantDatasourceAppId(): string {
      return this.advanced_embedded_app_id
    },
    getEmbeddedAssistantDatasourceAppSecret(): string {
      return this.advanced_embedded_app_secret
    },
    getBaseAssistantConfig(): BaseAssistantConfig {
      return {
        ...this.base_assistant_config,
        workspace_ids: cloneIdArray(this.base_assistant_config.workspace_ids),
        datasource_ids: cloneIdArray(this.base_assistant_config.datasource_ids),
        workspace_names: cloneIdArray(this.base_assistant_config.workspace_names),
        datasource_names: cloneIdArray(this.base_assistant_config.datasource_names),
        public_list: cloneIdArray(this.base_assistant_config.public_list),
        public_list_names: cloneIdArray(this.base_assistant_config.public_list_names),
        private_list: cloneIdArray(this.base_assistant_config.private_list),
        private_list_names: cloneIdArray(this.base_assistant_config.private_list_names),
      }
    },
    getAdvancedAssistantConfig(): AdvancedAssistantConfig {
      return {
        ...this.advanced_assistant_config,
        workspace_ids: cloneIdArray(this.advanced_assistant_config.workspace_ids),
        datasource_ids: cloneIdArray(this.advanced_assistant_config.datasource_ids),
        workspace_names: cloneIdArray(this.advanced_assistant_config.workspace_names),
        datasource_names: cloneIdArray(this.advanced_assistant_config.datasource_names),
        credential_mappings: cloneCredentialMappings(this.advanced_assistant_config.credential_mappings),
      }
    },
    getLoaded(): boolean {
      return this.loaded
    },
    getData(): SettingRecord {
      return cloneSettingRecord({
        domain: this.domain,
        base_assistant_id: this.getBaseAssistantId,
        advanced_assistant_id: this.getAdvancedAssistantId,
        embedded_app_id: this.embedded_app_id,
        embedded_app_secret: this.embedded_app_secret,
        base_embedded_app_id: this.base_embedded_app_id,
        base_embedded_app_secret: this.base_embedded_app_secret,
        advanced_embedded_app_id: this.advanced_embedded_app_id,
        advanced_embedded_app_secret: this.advanced_embedded_app_secret,
        aes_enable: this.advanced_assistant_config.aes_enable,
        aes_key: this.advanced_assistant_config.aes_key,
        base_assistant_config: {
          ...this.base_assistant_config,
          workspace_ids: cloneIdArray(this.base_assistant_config.workspace_ids),
          datasource_ids: cloneIdArray(this.base_assistant_config.datasource_ids),
          workspace_names: cloneIdArray(this.base_assistant_config.workspace_names),
          datasource_names: cloneIdArray(this.base_assistant_config.datasource_names),
          public_list: cloneIdArray(this.base_assistant_config.public_list),
          public_list_names: cloneIdArray(this.base_assistant_config.public_list_names),
          private_list: cloneIdArray(this.base_assistant_config.private_list),
          private_list_names: cloneIdArray(this.base_assistant_config.private_list_names),
        },
        advanced_assistant_config: {
          ...this.advanced_assistant_config,
          workspace_ids: cloneIdArray(this.advanced_assistant_config.workspace_ids),
          datasource_ids: cloneIdArray(this.advanced_assistant_config.datasource_ids),
          workspace_names: cloneIdArray(this.advanced_assistant_config.workspace_names),
          datasource_names: cloneIdArray(this.advanced_assistant_config.datasource_names),
          credential_mappings: cloneCredentialMappings(this.advanced_assistant_config.credential_mappings),
        },
        embedded_account: this.embedded_account,
      })
    }
  },
  actions: {
    async init(data?: SettingRecord | null) {
      if (!data) {
        const res = await SettingApi.query()
        data = res.data
      }
      const normalized = normalizeSettingRecord(data)
      this.domain = normalized.domain
      this.base_assistant_id = normalized.base_assistant_id
      this.advanced_assistant_id = normalized.advanced_assistant_id
      this.embedded_app_id = normalized.embedded_app_id
      this.embedded_app_secret = normalized.embedded_app_secret
      this.base_embedded_app_id = normalized.base_embedded_app_id
      this.base_embedded_app_secret = normalized.base_embedded_app_secret
      this.advanced_embedded_app_id = normalized.advanced_embedded_app_id
      this.advanced_embedded_app_secret = normalized.advanced_embedded_app_secret
      this.aes_enable = normalized.aes_enable
      this.aes_key = normalized.aes_key
      this.base_assistant_config = {
        ...normalized.base_assistant_config,
        workspace_ids: cloneIdArray(normalized.base_assistant_config.workspace_ids),
        datasource_ids: cloneIdArray(normalized.base_assistant_config.datasource_ids),
        workspace_names: cloneIdArray(normalized.base_assistant_config.workspace_names),
        datasource_names: cloneIdArray(normalized.base_assistant_config.datasource_names),
        public_list: cloneIdArray(normalized.base_assistant_config.public_list),
        public_list_names: cloneIdArray(normalized.base_assistant_config.public_list_names),
        private_list: cloneIdArray(normalized.base_assistant_config.private_list),
        private_list_names: cloneIdArray(normalized.base_assistant_config.private_list_names),
      }
      this.advanced_assistant_config = {
        ...normalized.advanced_assistant_config,
        workspace_ids: cloneIdArray(normalized.advanced_assistant_config.workspace_ids),
        datasource_ids: cloneIdArray(normalized.advanced_assistant_config.datasource_ids),
        workspace_names: cloneIdArray(normalized.advanced_assistant_config.workspace_names),
        datasource_names: cloneIdArray(normalized.advanced_assistant_config.datasource_names),
        credential_mappings: cloneCredentialMappings(normalized.advanced_assistant_config.credential_mappings),
      }
      this.embedded_account = normalized.embedded_account
      this.loaded = true
    },
    clear() {
      this.$reset()
    },
  },
})

export const useSettingStore = () => {
  return SettingStore(store)
}
