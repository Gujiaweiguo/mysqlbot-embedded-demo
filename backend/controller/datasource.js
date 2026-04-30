const Sales = require('../models/sales');
const Setting = require('../models/setting');
const crypto = require('crypto');
const SQLBOT_SIMPLE_AES_IV = 'sqlbot_em_aes_iv'
const aes_encrypt = (text, key) => {
  const keyBuffer = Buffer.from(String(key).slice(0, 32).padEnd(32, '\0'));
  const ivBuffer = Buffer.from(SQLBOT_SIMPLE_AES_IV.slice(0, 16).padEnd(16, '\0'));
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted
}
const aes_encrypt_fields = ['host', 'user', 'password', 'dataBase', 'schema']
const dsController = {
  async getDsList(req, res, next) {
    try {
      const settingData = await Setting.getById(1);
      const account = req.user?.account || 'developer'
      const datasourceIds = settingData?.advanced_assistant_config?.datasource_ids
      const dsList = await Sales.getDsData(account, Array.isArray(datasourceIds) ? datasourceIds : null)
      // IMPORTANT: Shallow-clone before encrypting. Providers (e.g. thxtd.js) cache
      // descriptor objects and return the same reference on every call. Without cloning,
      // in-place AES encryption would corrupt the cache, causing double-encryption on
      // subsequent requests and making SQLBot report "datasource invalid" at runtime.
      const responseDsList = Array.isArray(dsList)
        ? dsList.map((ds) => ({ ...ds }))
        : []

      let aes_enabled = false;
      let aes_key = '';
      if (settingData?.advanced_assistant_config?.aes_enable != null) {
        aes_enabled = !!settingData.advanced_assistant_config.aes_enable;
        aes_key = settingData.advanced_assistant_config.aes_key || '';
      } else {
        aes_enabled = !!settingData?.aes_enable;
        aes_key = settingData?.aes_key || '';
      }

      if (responseDsList.length && aes_enabled) {
        responseDsList.forEach(ds => {
          aes_encrypt_fields.forEach(fieldName => {
            const val = ds[fieldName]
            if (val) {
              ds[fieldName] = aes_encrypt(val, aes_key)
            }
          })
        })
      }
      res.json({
        success: true,
        code: 0,
        data: responseDsList
      });
    } catch (error) {
      next(error);
    }
  },
};

const apiHandler = {
  prefix: '/datasource',
  mapping: [
    { path: '/', method: 'get', handler: dsController.getDsList }
  ]
}
module.exports = apiHandler;
