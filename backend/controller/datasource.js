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
      const account = req.user?.account || 'developer'
      const dsList = await Sales.getDsData(account)
      const settingData = await Setting.getById(1);

      // 对敏感字段进行AES加密(可选)
      if (dsList?.length && settingData?.aes_enable) {
        const aes_key = settingData.aes_key
        dsList.forEach(ds => {
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
        data: dsList
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
