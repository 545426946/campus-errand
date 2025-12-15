const config = require('./config.js')

// 验证器类
class Validator {
  constructor() {
    this.rules = {}
  }

  // 添加验证规则
  addRule(field, rules) {
    this.rules[field] = rules
    return this
  }

  // 验证数据
  validate(data) {
    const errors = {}
    
    for (const field in this.rules) {
      const value = data[field]
      const fieldRules = this.rules[field]
      
      for (const rule of fieldRules) {
        const result = this.validateField(value, rule)
        if (result !== true) {
          errors[field] = result
          break // 一个字段只显示第一个错误
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  // 验证单个字段
  validateField(value, rule) {
    // 必填验证
    if (rule.required && this.isEmpty(value)) {
      return rule.message || '此字段为必填项'
    }

    // 如果不是必填且值为空，跳过其他验证
    if (!rule.required && this.isEmpty(value)) {
      return true
    }

    // 类型验证
    if (rule.type && !this.validateType(value, rule.type)) {
      return rule.message || `请输入正确的${rule.type}类型`
    }

    // 长度验证
    if (rule.minLength && value.length < rule.minLength) {
      return rule.message || `最少需要${rule.minLength}个字符`
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return rule.message || `最多允许${rule.maxLength}个字符`
    }

    // 正则验证
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message || '格式不正确'
    }

    // 自定义验证
    if (rule.validator && typeof rule.validator === 'function') {
      const result = rule.validator(value)
      if (result !== true) {
        return rule.message || result
      }
    }

    return true
  }

  // 检查是否为空
  isEmpty(value) {
    return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
  }

  // 验证类型
  validateType(value, type) {
    switch (type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number' && !isNaN(value)
      case 'boolean':
        return typeof value === 'boolean'
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      case 'phone':
        return config.regex.phone.test(value)
      case 'idCard':
        return config.regex.idCard.test(value)
      case 'positiveInteger':
        return config.regex.positiveInteger.test(value)
      default:
        return true
    }
  }
}

// 常用验证规则
const commonRules = {
  // 手机号验证
  phone: {
    required: true,
    type: 'phone',
    message: '请输入正确的手机号'
  },

  // 密码验证
  password: {
    required: true,
    minLength: 6,
    maxLength: 20,
    message: '密码长度为6-20位'
  },

  // 确认密码验证
  confirmPassword: (password) => ({
    required: true,
    validator: (value) => value === password,
    message: '两次输入的密码不一致'
  }),

  // 姓名验证
  name: {
    required: true,
    minLength: 2,
    maxLength: 20,
    pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/,
    message: '请输入2-20位的中文或英文字母'
  },

  // 身份证验证
  idCard: {
    required: true,
    type: 'idCard',
    message: '请输入正确的身份证号'
  },

  // 金额验证
  amount: {
    required: true,
    pattern: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    validator: (value) => parseFloat(value) > 0,
    message: '请输入正确的金额'
  },

  // 描述验证
  description: {
    required: true,
    minLength: 10,
    maxLength: 500,
    message: '请输入10-500字的描述'
  },

  // 位置验证
  location: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: '请输入2-100字的地址'
  }
}

// 快速验证方法
const quickValidate = {
  // 验证手机号
  phone: (phone) => {
    return config.regex.phone.test(phone)
  },

  // 验证身份证
  idCard: (idCard) => {
    return config.regex.idCard.test(idCard)
  },

  // 验证密码强度
  passwordStrength: (password) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[@$!%*?&]/.test(password)) strength++
    
    return {
      score: strength,
      level: ['弱', '一般', '中等', '强', '很强'][Math.min(strength - 1, 4)]
    }
  },

  // 验证订单描述
  orderDescription: (description) => {
    if (!description || description.length < 10) {
      return { valid: false, message: '请输入至少10字的订单描述' }
    }
    if (description.length > 500) {
      return { valid: false, message: '描述不能超过500字' }
    }
    return { valid: true }
  },

  // 验证价格
  price: (price) => {
    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice <= 0) {
      return { valid: false, message: '请输入正确的价格' }
    }
    if (numPrice > 1000) {
      return { valid: false, message: '价格不能超过1000元' }
    }
    return { valid: true }
  },

  // 验证图片
  images: (images, maxCount = 9, maxSize = 10 * 1024 * 1024) => {
    if (!Array.isArray(images)) {
      return { valid: false, message: '图片格式错误' }
    }
    
    if (images.length > maxCount) {
      return { valid: false, message: `最多上传${maxCount}张图片` }
    }
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      if (image.size > maxSize) {
        return { valid: false, message: `第${i + 1}张图片大小不能超过${maxSize / 1024 / 1024}MB` }
      }
    }
    
    return { valid: true }
  }
}

module.exports = {
  Validator,
  commonRules,
  quickValidate
}