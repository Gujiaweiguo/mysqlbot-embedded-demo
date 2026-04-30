const { Pool } = require('pg');
const { registerProvider } = require('./index');

const GS_SCRM_DATASOURCE_ID = '17';
const GS_SCRM_DATABASE = process.env.GS_SCRM_DB_NAME || 'gs_scrm';
const GS_SCRM_SCHEMA = process.env.GS_SCRM_SCHEMA || 'public';

const gsScrmPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: GS_SCRM_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let gsScrmSchemaCache = null;

async function introspectSchema() {
  if (gsScrmSchemaCache) {
    return gsScrmSchemaCache;
  }

  const tableResult = await gsScrmPool.query(
    `
      SELECT
        c.relname AS table_name,
        COALESCE(obj_description(c.oid, 'pg_class'), '') AS table_comment
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1 AND c.relkind = 'r'
      ORDER BY c.relname
    `,
    [GS_SCRM_SCHEMA]
  );

  const fieldResult = await gsScrmPool.query(
    `
      SELECT
        c.relname AS table_name,
        a.attname AS field_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) AS field_type,
        COALESCE(col_description(c.oid, a.attnum), '') AS field_comment
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid
      WHERE n.nspname = $1
        AND c.relkind = 'r'
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY c.relname, a.attnum
    `,
    [GS_SCRM_SCHEMA]
  );

  const fieldsByTable = new Map();
  fieldResult.rows.forEach((row) => {
    const fields = fieldsByTable.get(row.table_name) || [];
    fields.push({
      name: row.field_name,
      comment: row.field_comment || row.field_name,
      type: row.field_type ? String(row.field_type).toUpperCase() : '',
    });
    fieldsByTable.set(row.table_name, fields);
  });

  gsScrmSchemaCache = tableResult.rows.map((row) => ({
    name: row.table_name,
    comment: row.table_comment || row.table_name,
    fields: fieldsByTable.get(row.table_name) || [],
  }));

  return gsScrmSchemaCache;
}

async function getDescriptor() {
  const tables = await introspectSchema();
  return {
    id: GS_SCRM_DATASOURCE_ID,
    name: 'GS SCRM',
    type: 'pg',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dataBase: GS_SCRM_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    schema: GS_SCRM_SCHEMA,
    comment: 'GS SCRM analytics datasource',
    tables,
  };
}

const provider = {
  id: GS_SCRM_DATASOURCE_ID,
  name: 'GS SCRM',
  type: 'pg',
  defaultSelected: true,
  introspectSchema,
  getDescriptor,
};

registerProvider(provider);

module.exports = provider;
