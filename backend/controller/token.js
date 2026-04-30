const Setting = require('../models/setting');
const { SignJWT } = require('jose');

async function generateJWT(payload, secret, expiresIn) {
  try {
    const secretKey = new TextEncoder().encode(secret);
    
    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt();
    
    if (expiresIn) {
      jwt.setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn);
    }
    
    return await jwt.sign(secretKey);
  } catch (error) {
    console.error('JWT generation error:', error);
    return null;
  }
}


const tokenController = {
  
  async generate(req, res, next) {
    try {
      const configData = await Setting.getById(1);
      if (!configData) {
        throw new Error("no setting info!");
      }
      const requestedAppId = req.query.appId;
      const account = configData.embedded_account || 'admin'
      let resolvedAppId = configData.embedded_app_id;
      let resolvedSecret = configData.embedded_app_secret;

      if (requestedAppId) {
        if (requestedAppId === configData.base_embedded_app_id) {
          resolvedAppId = configData.base_embedded_app_id;
          resolvedSecret = configData.base_embedded_app_secret;
        } else if (requestedAppId === configData.advanced_embedded_app_id) {
          resolvedAppId = configData.advanced_embedded_app_id;
          resolvedSecret = configData.advanced_embedded_app_secret;
        } else if (requestedAppId === configData.embedded_app_id) {
          resolvedAppId = configData.embedded_app_id;
          resolvedSecret = configData.embedded_app_secret;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Unrecognized appId'
          });
        }
      }

      const payload = { appId: resolvedAppId, embeddedId: resolvedAppId, account }
      const token = await generateJWT(payload, resolvedSecret )
      
      res.status(200).json({
        success: true,
        data: token
      });
    } catch (error) {
      next(error);
    }
  },
};

const apiHandler = {
  prefix: '/token',
  mapping: [
    { path: '/', method: 'get', handler: tokenController.generate }
  ]
}

module.exports = apiHandler;
