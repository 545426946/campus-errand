// 时间格式化
const formatTime = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

// 格式化数字（补零）
const formatNumber = (n) => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

// 相对时间格式化
const formatRelativeTime = (timestamp) => {
  const now = new Date().getTime()
  const time = new Date(timestamp).getTime()
  const diff = now - time

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前'
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前'
  } else if (diff < week) {
    return Math.floor(diff / day) + '天前'
  } else if (diff < month) {
    return Math.floor(diff / week) + '周前'
  } else {
    return formatTime(new Date(timestamp))
  }
}

// 防抖函数
const debounce = (func, delay) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

// 节流函数
const throttle = (func, delay) => {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      func.apply(this, args)
      lastTime = now
    }
  }
}

// 深拷贝
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

// 生成唯一ID
const generateId = (prefix = 'id') => {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 手机号验证
const validatePhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// 身份证验证
const validateIdCard = (idCard) => {
  const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return idCardRegex.test(idCard)
}

// 价格格式化
const formatPrice = (price) => {
  return parseFloat(price).toFixed(2)
}

// 数量验证（正整数）
const validatePositiveInteger = (num) => {
  const regex = /^[1-9]\d*$/
  return regex.test(num)
}

// URL参数解析
const parseUrlParams = (url) => {
  const params = {}
  const queryString = url.split('?')[1]
  if (queryString) {
    const pairs = queryString.split('&')
    pairs.forEach(pair => {
      const [key, value] = pair.split('=')
      params[decodeURIComponent(key)] = decodeURIComponent(value || '')
    })
  }
  return params
}

// 存储工具
const storage = {
  set: (key, value) => {
    try {
      wx.setStorageSync(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.error('存储失败:', e)
      return false
    }
  },

  get: (key, defaultValue = null) => {
    try {
      const value = wx.getStorageSync(key)
      return value ? JSON.parse(value) : defaultValue
    } catch (e) {
      console.error('读取存储失败:', e)
      return defaultValue
    }
  },

  remove: (key) => {
    try {
      wx.removeStorageSync(key)
      return true
    } catch (e) {
      console.error('删除存储失败:', e)
      return false
    }
  },

  clear: () => {
    try {
      wx.clearStorageSync()
      return true
    } catch (e) {
      console.error('清空存储失败:', e)
      return false
    }
  }
}

// 提示工具
const toast = {
  success: (title, duration = 2000) => {
    wx.showToast({
      title,
      icon: 'success',
      duration
    })
  },

  error: (title, duration = 2000) => {
    wx.showToast({
      title,
      icon: 'none',
      duration
    })
  },

  loading: (title = '加载中...') => {
    wx.showLoading({
      title,
      mask: true
    })
  },

  hideLoading: () => {
    wx.hideLoading()
  }
}

// 权限检查
const checkAuth = () => {
  const app = getApp()
  return app.globalData.isLogin
}

// 获取位置信息
const getLocation = () => {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: resolve,
      fail: reject
    })
  })
}

// 拨打电话
const makePhoneCall = (phoneNumber) => {
  wx.makePhoneCall({
    phoneNumber,
    fail: (err) => {
      console.error('拨打电话失败:', err)
    }
  })
}

// 复制到剪贴板
const copyToClipboard = (text) => {
  wx.setClipboardData({
    data: text,
    success: () => {
      toast.success('复制成功')
    },
    fail: () => {
      toast.error('复制失败')
    }
  })
}

// 预览图片
const previewImage = (urls, current = 0) => {
  wx.previewImage({
    current: typeof current === 'number' ? urls[current] : current,
    urls: typeof urls === 'string' ? [urls] : urls
  })
}

module.exports = {
  formatTime,
  formatNumber,
  formatRelativeTime,
  debounce,
  throttle,
  deepClone,
  generateId,
  validatePhone,
  validateIdCard,
  formatPrice,
  validatePositiveInteger,
  parseUrlParams,
  storage,
  toast,
  checkAuth,
  getLocation,
  makePhoneCall,
  copyToClipboard,
  previewImage
}