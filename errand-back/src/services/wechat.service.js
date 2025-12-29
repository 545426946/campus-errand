const axios = require('axios');

class WechatService {
  constructor() {
    this.appid = process.env.WECHAT_APPID;
    this.secret = process.env.WECHAT_SECRET;
  }

  /**
   * 通过 code 换取 openid 和 session_key
   * @param {string} code - 微信登录凭证
   * @returns {Promise<{openid: string, session_key: string, unionid?: string}>}
   */
  async code2Session(code) {
    try {
      // 测试模式：如果 code 以 test_code_ 开头，返回模拟数据
      if (code.startsWith('test_code_')) {
        const timestamp = code.replace('test_code_', '');
        return {
          openid: `test_openid_${timestamp}`,
          session_key: `test_session_key_${timestamp}`,
          unionid: null
        };
      }

      const url = 'https://api.weixin.qq.com/sns/jscode2session';
      const response = await axios.get(url, {
        params: {
          appid: this.appid,
          secret: this.secret,
          js_code: code,
          grant_type: 'authorization_code'
        }
      });

      const { openid, session_key, unionid, errcode, errmsg } = response.data;

      if (errcode) {
        throw new Error(`微信接口错误: ${errmsg} (${errcode})`);
      }

      if (!openid || !session_key) {
        throw new Error('获取微信用户信息失败');
      }

      return {
        openid,
        session_key,
        unionid
      };
    } catch (error) {
      console.error('微信登录失败:', error);
      throw new Error(error.message || '微信登录失败');
    }
  }

  /**
   * 解密手机号
   * @param {string} encryptedData - 加密数据
   * @param {string} iv - 加密算法的初始向量
   * @param {string} sessionKey - 会话密钥
   * @returns {Object} 解密后的手机号信息
   */
  decryptPhoneNumber(encryptedData, iv, sessionKey) {
    const crypto = require('crypto');
    
    try {
      // Base64 decode
      const sessionKeyBuffer = Buffer.from(sessionKey, 'base64');
      const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
      const ivBuffer = Buffer.from(iv, 'base64');

      // 解密
      const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer);
      decipher.setAutoPadding(true);
      
      let decoded = decipher.update(encryptedDataBuffer, null, 'utf8');
      decoded += decipher.final('utf8');
      
      const decryptedData = JSON.parse(decoded);

      // 验证 appid
      if (decryptedData.watermark.appid !== this.appid) {
        throw new Error('appid 不匹配');
      }

      return {
        phoneNumber: decryptedData.phoneNumber,
        purePhoneNumber: decryptedData.purePhoneNumber,
        countryCode: decryptedData.countryCode
      };
    } catch (error) {
      console.error('解密手机号失败:', error);
      throw new Error('解密手机号失败');
    }
  }

  /**
   * 获取小程序码
   * @param {string} scene - 场景值
   * @param {string} page - 页面路径
   * @returns {Promise<Buffer>} 小程序码图片
   */
  async getUnlimitedQRCode(scene, page = 'pages/index/index') {
    try {
      // 先获取 access_token
      const accessToken = await this.getAccessToken();
      
      const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;
      const response = await axios.post(url, {
        scene,
        page,
        width: 430,
        auto_color: false,
        line_color: { r: 0, g: 0, b: 0 }
      }, {
        responseType: 'arraybuffer'
      });

      return response.data;
    } catch (error) {
      console.error('获取小程序码失败:', error);
      throw new Error('获取小程序码失败');
    }
  }

  /**
   * 获取 access_token
   * @returns {Promise<string>}
   */
  async getAccessToken() {
    try {
      const url = 'https://api.weixin.qq.com/cgi-bin/token';
      const response = await axios.get(url, {
        params: {
          grant_type: 'client_credential',
          appid: this.appid,
          secret: this.secret
        }
      });

      const { access_token, errcode, errmsg } = response.data;

      if (errcode) {
        throw new Error(`获取 access_token 失败: ${errmsg} (${errcode})`);
      }

      return access_token;
    } catch (error) {
      console.error('获取 access_token 失败:', error);
      throw new Error('获取 access_token 失败');
    }
  }
}

module.exports = new WechatService();
