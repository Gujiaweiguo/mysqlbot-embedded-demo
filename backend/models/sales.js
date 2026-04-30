const pool = require('../config/db_pool');
const datasourceRegistry = require('../providers');

const { sales_ddl, sales_data_sql } = require('./business');

require('../providers/gs_scrm');
require('../providers/thxtd');

const createTable = async () => {
  await pool.query(sales_ddl);
  await initData();
};

const initData = async () => {
  const result = await pool.query('SELECT count(*) FROM regions');
  if (result?.rows?.length && result.rows[0].count > 0) {
    return;
  }
  await pool.query(sales_data_sql);
};

// 初始化表
createTable();

const Sales = {
  async getDsData(_account, datasourceIds = null) {
    const defaultProviders = datasourceRegistry.getDefaultProviders();
    const selectedProviders = Array.isArray(datasourceIds) && datasourceIds.length
      ? datasourceRegistry.findProvidersByIds(datasourceIds)
      : defaultProviders;

    const resolveProviders = async (providers, allowFallback = false) => {
      const results = await Promise.allSettled(providers.map((provider) => provider.getDescriptor()));
      const fulfilled = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

      if (fulfilled.length) {
        return fulfilled;
      }

      const firstRejected = results.find((result) => result.status === 'rejected');
      if (allowFallback && defaultProviders.length) {
        console.warn('[datasource] selected providers failed, falling back to default providers', {
          datasourceIds,
          error: firstRejected?.reason?.message || String(firstRejected?.reason || 'unknown error'),
        });
        return resolveProviders(defaultProviders, false);
      }

      throw firstRejected?.reason || new Error('Failed to resolve datasource providers');
    };

    return resolveProviders(selectedProviders, Array.isArray(datasourceIds) && datasourceIds.length);
  },
};

module.exports = Sales;
