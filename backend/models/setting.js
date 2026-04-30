// const pool = require('../config/database');
const pool = require('../config/db_pool');

/**
 * Parse a JSON text column. Returns parsed object or null.
 */
function parseJsonCol(val) {
  if (val == null) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return null; }
}

function normalizeIdArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalized = values
    .map((value) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      return null;
    })
    .filter(Boolean);

  return Array.from(new Set(normalized));
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => (typeof value === 'string' && value.trim() ? value.trim() : null))
    .filter(Boolean);
}

/**
 * Build a minimal base_assistant_config from legacy scalar fields.
 */
function backfillBaseConfig(row) {
  return {
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
  };
}

/**
 * Build a minimal advanced_assistant_config from legacy scalar fields,
 * migrating aes_enable / aes_key into the richer model.
 */
function backfillAdvancedConfig(row) {
  return {
    name: '',
    description: '',
    cross_domain_enabled: false,
    cross_domain_origins: '',
    interface_endpoint: '',
    timeout: 30000,
    aes_enable: !!row.aes_enable,
    aes_key: row.aes_key || '',
    workspace_ids: [],
    datasource_ids: [],
    workspace_names: [],
    datasource_names: [],
    auto_ds: false,
    credential_mappings: [],
  };
}

async function getNamesByIds(tableName, ids) {
  const normalizedIds = normalizeIdArray(ids);
  if (!normalizedIds.length) {
    return [];
  }

  const result = await pool.query(
    `SELECT id::text AS id, name FROM ${tableName} WHERE id::text = ANY($1::text[])`,
    [normalizedIds]
  );
  const nameById = new Map(result.rows.map((row) => [String(row.id), row.name]));
  return normalizedIds.map((id) => nameById.get(String(id)) || String(id));
}

async function enrichBaseAssistantConfig(config, assistantId) {
  if (!assistantId) {
    return config;
  }

  const result = await pool.query(
    'SELECT name, description, domain, configuration, oid::text AS oid FROM sys_assistant WHERE id::text = $1 LIMIT 1',
    [String(assistantId)]
  );

  if (!result.rows.length) {
    return config;
  }

  const row = result.rows[0];
  const remoteConfig = parseJsonCol(row.configuration) || {};
  const workspaceIds = normalizeIdArray(config.workspace_ids).length
    ? normalizeIdArray(config.workspace_ids)
    : (row.oid ? [String(row.oid)] : normalizeIdArray(remoteConfig.workspace_ids || (remoteConfig.oid != null ? [remoteConfig.oid] : [])));
  const datasourceIds = normalizeIdArray(config.datasource_ids).length
    ? normalizeIdArray(config.datasource_ids)
    : normalizeIdArray(remoteConfig.datasource_ids || remoteConfig.public_list || []);
  const publicList = normalizeIdArray(config.public_list).length
    ? normalizeIdArray(config.public_list)
    : normalizeIdArray(remoteConfig.public_list || []);
  const privateList = normalizeIdArray(config.private_list).length
    ? normalizeIdArray(config.private_list)
    : normalizeIdArray(remoteConfig.private_list || []);

  return {
    ...config,
    name: config.name || row.name || '',
    description: config.description || row.description || '',
    cross_domain_enabled: config.cross_domain_enabled ?? !!row.domain,
    cross_domain_origins: config.cross_domain_origins || row.domain || '',
    workspace_ids: workspaceIds,
    datasource_ids: datasourceIds,
    workspace_names: await getNamesByIds('sys_workspace', workspaceIds),
    datasource_names: await getNamesByIds('core_datasource', datasourceIds),
    public_list: publicList,
    public_list_names: await getNamesByIds('core_datasource', publicList),
    private_list: privateList,
    private_list_names: await getNamesByIds('core_datasource', privateList),
    auto_ds: typeof config.auto_ds === 'boolean' ? config.auto_ds : !!remoteConfig.auto_ds,
  };
}

async function enrichAdvancedAssistantConfig(config, assistantId) {
  if (!assistantId) {
    return config;
  }

  const result = await pool.query(
    'SELECT name, description, domain, configuration, oid::text AS oid FROM sys_assistant WHERE id::text = $1 LIMIT 1',
    [String(assistantId)]
  );

  if (!result.rows.length) {
    return config;
  }

  const row = result.rows[0];
  const remoteConfig = parseJsonCol(row.configuration) || {};
  const workspaceIds = normalizeIdArray(config.workspace_ids).length
    ? normalizeIdArray(config.workspace_ids)
    : (row.oid ? [String(row.oid)] : normalizeIdArray(remoteConfig.workspace_ids || (remoteConfig.oid != null ? [remoteConfig.oid] : [])));
  const datasourceIds = normalizeIdArray(config.datasource_ids).length
    ? normalizeIdArray(config.datasource_ids)
    : normalizeIdArray(remoteConfig.datasource_ids || []);

  return {
    ...config,
    name: config.name || row.name || '',
    description: config.description || row.description || '',
    cross_domain_enabled: config.cross_domain_enabled ?? !!row.domain,
    cross_domain_origins: config.cross_domain_origins || row.domain || '',
    interface_endpoint: config.interface_endpoint || remoteConfig.endpoint || '',
    timeout: config.timeout || (remoteConfig.timeout ? Number(remoteConfig.timeout) * 1000 : 30000),
    aes_enable: typeof config.aes_enable === 'boolean' ? config.aes_enable : !!remoteConfig.encrypt,
    aes_key: config.aes_key || remoteConfig.aes_key || '',
    workspace_ids: workspaceIds,
    datasource_ids: datasourceIds,
    workspace_names: await getNamesByIds('sys_workspace', workspaceIds),
    datasource_names: await getNamesByIds('core_datasource', datasourceIds),
    auto_ds: typeof config.auto_ds === 'boolean' ? config.auto_ds : !!remoteConfig.auto_ds,
    credential_mappings: Array.isArray(config.credential_mappings) && config.credential_mappings.length
      ? config.credential_mappings
      : Array.isArray(remoteConfig.certificate)
        ? remoteConfig.certificate.map((item) => ({
            source_type: item.type || '',
            source_name: item.source || '',
            target_location: item.target || 'header',
            target_name: item.target_key || '',
            target_value_expression: item.target_val || '',
          }))
        : [],
  };
}

function normalizeEmbeddedField(val) {
  return val == null ? '' : val;
}

/**
 * Derive base_assistant_id from base_assistant_config.
 * If the config carries an explicit assistant_id, use it;
 * otherwise fall back to the legacy column value.
 */
function deriveBaseAssistantId(config, legacyId) {
  if (config && config.assistant_id != null && config.assistant_id !== '') return config.assistant_id;
  return legacyId || null;
}

/**
 * Derive advanced_assistant_id from advanced_assistant_config.
 */
function deriveAdvancedAssistantId(config, legacyId) {
  if (config && config.assistant_id != null && config.assistant_id !== '') return config.assistant_id;
  return legacyId || null;
}

const createTable = async () => {
  const setting_ddl = `
    CREATE TABLE IF NOT EXISTS setting (
      id SERIAL PRIMARY KEY,
      domain VARCHAR(255) NOT NULL,
      base_assistant_id VARCHAR(255),
      advanced_assistant_id VARCHAR(255),
      embedded_app_id VARCHAR(255),
      embedded_app_secret VARCHAR(255),
      base_embedded_app_id VARCHAR(255),
      base_embedded_app_secret VARCHAR(255),
      advanced_embedded_app_id VARCHAR(255),
      advanced_embedded_app_secret VARCHAR(255),
      aes_enable BOOL,
      aes_key VARCHAR(255)
    );
    ALTER TABLE setting ADD COLUMN IF NOT EXISTS aes_enable BOOL;
    ALTER TABLE setting ADD COLUMN IF NOT EXISTS aes_key VARCHAR(255);
    ALTER TABLE setting ADD COLUMN IF NOT EXISTS base_embedded_app_id VARCHAR(255);
    ALTER TABLE setting ADD COLUMN IF NOT EXISTS base_embedded_app_secret VARCHAR(255);
    ALTER TABLE setting ADD COLUMN IF NOT EXISTS advanced_embedded_app_id VARCHAR(255);
    ALTER TABLE setting ADD COLUMN IF NOT EXISTS advanced_embedded_app_secret VARCHAR(255);
    ALTER TABLE setting ADD COLUMN IF NOT EXISTS base_assistant_config TEXT;
    ALTER TABLE setting ADD COLUMN IF NOT EXISTS advanced_assistant_config TEXT;
    ALTER TABLE setting ADD COLUMN IF NOT EXISTS embedded_account VARCHAR(255);
  `
  await pool.query(setting_ddl)
};

/**
 * Backfill richer config columns from existing legacy data on startup.
 */
const backfillConfigs = async () => {
  try {
    const result = await pool.query(`
      SELECT id, base_assistant_config, advanced_assistant_config, aes_enable, aes_key,
             base_assistant_id, advanced_assistant_id,
             base_embedded_app_id, base_embedded_app_secret,
             advanced_embedded_app_id, advanced_embedded_app_secret,
             embedded_account
      FROM setting
    `);
    for (const row of result.rows) {
      const updates = [];
      const params = [];
      let idx = 1;
      if (!row.base_assistant_config) {
        updates.push(`base_assistant_config = $${idx++}`);
        params.push(JSON.stringify(await enrichBaseAssistantConfig(backfillBaseConfig(row), row.base_assistant_id)));
      }
      if (!row.advanced_assistant_config) {
        updates.push(`advanced_assistant_config = $${idx++}`);
        params.push(JSON.stringify(await enrichAdvancedAssistantConfig(backfillAdvancedConfig(row), row.advanced_assistant_id)));
      }
      if (row.base_embedded_app_id == null) {
        updates.push(`base_embedded_app_id = $${idx++}`);
        params.push('');
      }
      if (row.base_embedded_app_secret == null) {
        updates.push(`base_embedded_app_secret = $${idx++}`);
        params.push('');
      }
      if (row.advanced_embedded_app_id == null) {
        updates.push(`advanced_embedded_app_id = $${idx++}`);
        params.push('');
      }
      if (row.advanced_embedded_app_secret == null) {
        updates.push(`advanced_embedded_app_secret = $${idx++}`);
        params.push('');
      }
      if (row.embedded_account == null) {
        updates.push(`embedded_account = $${idx++}`);
        params.push('admin');
      }
      if (updates.length) {
        params.push(row.id);
        await pool.query(`UPDATE setting SET ${updates.join(', ')} WHERE id = $${idx}`, params);
      }
    }
  } catch (_) {
    // Table may not exist yet on first boot; ignore.
  }
};

// 初始化表
createTable().then(() => backfillConfigs());

/**
 * Decorate a setting row: parse JSON columns and ensure derived IDs.
 */
async function decorate(row) {
  if (!row) return row;
   row.base_embedded_app_id = normalizeEmbeddedField(row.base_embedded_app_id);
   row.base_embedded_app_secret = normalizeEmbeddedField(row.base_embedded_app_secret);
   row.advanced_embedded_app_id = normalizeEmbeddedField(row.advanced_embedded_app_id);
   row.advanced_embedded_app_secret = normalizeEmbeddedField(row.advanced_embedded_app_secret);
   row.embedded_account = row.embedded_account || 'admin';
  const baseCfg = parseJsonCol(row.base_assistant_config);
  const advCfg = parseJsonCol(row.advanced_assistant_config);
  row.base_assistant_config = await enrichBaseAssistantConfig(baseCfg || backfillBaseConfig(row), row.base_assistant_id);
  row.advanced_assistant_config = await enrichAdvancedAssistantConfig(advCfg || backfillAdvancedConfig(row), row.advanced_assistant_id);
  row.base_assistant_id = deriveBaseAssistantId(row.base_assistant_config, row.base_assistant_id);
  row.advanced_assistant_id = deriveAdvancedAssistantId(row.advanced_assistant_config, row.advanced_assistant_id);
  return row;
}

const Setting = {

  async getById(id) {
    const result = await pool.query('SELECT * FROM setting WHERE id = $1', [id]);
    if (result?.rows?.length) {
      return decorate(result.rows[0]);
    }
    return null;
  },

  async create(settingData) {
    const {
      domain,
      base_assistant_id,
      advanced_assistant_id,
      embedded_app_id,
      embedded_app_secret,
      base_embedded_app_id,
      base_embedded_app_secret,
      advanced_embedded_app_id,
      advanced_embedded_app_secret,
      aes_enable,
      aes_key,
      base_assistant_config,
      advanced_assistant_config,
      embedded_account,
    } = settingData;

    let baseCfg = parseJsonCol(base_assistant_config) || backfillBaseConfig(settingData);
    let advCfg = parseJsonCol(advanced_assistant_config) || backfillAdvancedConfig(settingData);

    const resolvedBaseId = deriveBaseAssistantId(baseCfg, base_assistant_id);
    const resolvedAdvId = deriveAdvancedAssistantId(advCfg, advanced_assistant_id);
    baseCfg = await enrichBaseAssistantConfig(baseCfg, resolvedBaseId);
    advCfg = await enrichAdvancedAssistantConfig(advCfg, resolvedAdvId);

    const result = await pool.query(
      `INSERT INTO setting
        (domain, base_assistant_id, advanced_assistant_id, embedded_app_id, embedded_app_secret, base_embedded_app_id, base_embedded_app_secret, advanced_embedded_app_id, advanced_embedded_app_secret, aes_enable, aes_key, base_assistant_config, advanced_assistant_config, embedded_account)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [domain, resolvedBaseId, resolvedAdvId, embedded_app_id, embedded_app_secret,
       normalizeEmbeddedField(base_embedded_app_id), normalizeEmbeddedField(base_embedded_app_secret),
       normalizeEmbeddedField(advanced_embedded_app_id), normalizeEmbeddedField(advanced_embedded_app_secret),
       aes_enable, aes_key, JSON.stringify(baseCfg), JSON.stringify(advCfg), embedded_account || 'admin']
    );
    return decorate(result.rows[0]);
  },

  async update(id, settingData) {
    const {
      domain,
      base_assistant_id,
      advanced_assistant_id,
      embedded_app_id,
      embedded_app_secret,
      base_embedded_app_id,
      base_embedded_app_secret,
      advanced_embedded_app_id,
      advanced_embedded_app_secret,
      aes_enable,
      aes_key,
      base_assistant_config,
      advanced_assistant_config,
      embedded_account,
    } = settingData;

    let baseCfg = parseJsonCol(base_assistant_config) || backfillBaseConfig(settingData);
    let advCfg = parseJsonCol(advanced_assistant_config) || backfillAdvancedConfig(settingData);

    const resolvedBaseId = deriveBaseAssistantId(baseCfg, base_assistant_id);
    const resolvedAdvId = deriveAdvancedAssistantId(advCfg, advanced_assistant_id);
    baseCfg = await enrichBaseAssistantConfig(baseCfg, resolvedBaseId);
    advCfg = await enrichAdvancedAssistantConfig(advCfg, resolvedAdvId);

    const result = await pool.query(
      `UPDATE setting SET
        domain = $1, base_assistant_id = $2, advanced_assistant_id = $3,
        embedded_app_id = $4, embedded_app_secret = $5,
        base_embedded_app_id = $6, base_embedded_app_secret = $7,
        advanced_embedded_app_id = $8, advanced_embedded_app_secret = $9,
        aes_enable = $10, aes_key = $11,
        base_assistant_config = $12, advanced_assistant_config = $13,
        embedded_account = $14
       WHERE id = $15 RETURNING *`,
      [domain, resolvedBaseId, resolvedAdvId, embedded_app_id, embedded_app_secret,
       normalizeEmbeddedField(base_embedded_app_id), normalizeEmbeddedField(base_embedded_app_secret),
       normalizeEmbeddedField(advanced_embedded_app_id), normalizeEmbeddedField(advanced_embedded_app_secret),
       aes_enable, aes_key, JSON.stringify(baseCfg), JSON.stringify(advCfg), embedded_account || 'admin', id]
    );
    return decorate(result.rows[0]);
  },

  async delete(id) {
    await pool.query('DELETE FROM setting WHERE id = $1', [id]);
  },
};

module.exports = Setting;
