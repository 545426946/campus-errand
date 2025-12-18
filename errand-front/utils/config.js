// 小程序配置文件
const config = {
  // 环境配置
  env: 'development', // development, production
  
  // API配置
  api: {
    // 开发环境API
    development: {
      baseUrl: 'http://192.168.1.133:3000/api',
      timeout: 10000
    },
    // 生产环境API
    production: {
      baseUrl: 'https://your-api-domain.com/api',
      timeout: 10000
    }
  },

  // 获取当前环境API配置
  getApiConfig() {
    return this.api[this.env]
  },

  // 订单状态配置
  orderStatus: {
    PENDING: 'pending', // 待接单
    ACCEPTED: 'accepted', // 已接单
    COMPLETED: 'completed', // 已完成
    CANCELLED: 'cancelled' // 已取消
  },

  // 订单状态映射
  orderStatusMap: {
    pending: '待接单',
    accepted: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  },

  // 服务类型配置
  serviceTypes: {
    EXPRESS: 1,    // 快递代取
    FOOD: 2,       // 外卖配送
    SHOPPING: 3,   // 代购服务
    OTHER: 4       // 其他服务
  },

  // 服务类型映射
  serviceTypeMap: {
    1: '快递代取',
    2: '外卖配送',
    3: '代购服务',
    4: '其他服务'
  },

  // 认证状态配置
  certificationStatus: {
    UNVERIFIED: 'unverified', // 未认证
    PENDING: 'pending',       // 认证中
    VERIFIED: 'verified',     // 已认证
    REJECTED: 'rejected'       // 认证失败
  },

  // 认证状态映射
  certificationStatusMap: {
    unverified: '未认证',
    pending: '认证中',
    verified: '已认证',
    rejected: '认证失败'
  },

  // 支付方式配置
  paymentMethods: {
    WECHAT: 'wechat',     // 微信支付
    BALANCE: 'balance'    // 余额支付
  },

  // 支付方式映射
  paymentMethodMap: {
    wechat: '微信支付',
    balance: '余额支付'
  },

  // 页面路由配置
  pages: {
    // 主要页面
    INDEX: '/pages/index/index',
    ORDER: '/pages/order/order',
    USER: '/pages/user/user',
    DETAIL: '/pages/detail/detail',
    
    // 功能页面
    LOGIN: '/pages/login/login',
    PUBLISH: '/pages/publish/publish',
    CERTIFICATION: '/pages/certification/certification',
    WALLET: '/pages/wallet/wallet',
    
    // 辅助页面
    SETTING: '/pages/setting/setting',
    HELP: '/pages/help/help',
    FEEDBACK: '/pages/feedback/feedback',
    ABOUT: '/pages/about/about'
  },

  // 存储键名配置
  storageKeys: {
    TOKEN: 'token',
    USER_INFO: 'userInfo',
    LOCATION_INFO: 'locationInfo',
    SEARCH_HISTORY: 'searchHistory',
    FAVORITE_ORDERS: 'favoriteOrders'
  },

  // 地图配置
  map: {
    // 默认经纬度（可以根据学校位置设置）
    defaultCenter: {
      latitude: 39.908823,
      longitude: 116.397470
    },
    // 默认缩放级别
    defaultScale: 16,
    // 地图密钥（如果使用地图服务需要配置）
    key: ''
  },

  // 分页配置
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 50
  },

  // 正则表达式配置
  regex: {
    phone: /^1[3-9]\d{9}$/, // 手机号
    idCard: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, // 身份证
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,20}$/, // 密码
    positiveInteger: /^[1-9]\d*$/ // 正整数
  },

  // 常用文字配置
  constants: {
    APP_NAME: '校园跑腿',
    APP_VERSION: '1.0.0',
    DEFAULT_AVATAR: '/images/default-avatar.png',
    ORDER_TIMEOUT: 30 * 60 * 1000, // 订单超时时间（30分钟）
    MAX_IMAGES: 9, // 最大图片数量
    MAX_IMAGE_SIZE: 10 * 1024 * 1024 // 最大图片大小（10MB）
  },

  // 主题色彩配置
  colors: {
    primary: '#007aff',
    secondary: '#ff6b35',
    success: '#4caf50',
    warning: '#ff9500',
    danger: '#f44336',
    info: '#2196f3',
    light: '#f8f9fa',
    dark: '#343a40'
  },

  // 表单验证规则
  rules: {
    required: (value) => {
      if (!value && value !== 0) return '此字段为必填项'
      return true
    },
    
    phone: (value) => {
      if (!value) return true
      if (!config.regex.phone.test(value)) return '请输入正确的手机号'
      return true
    },
    
    minLength: (min) => (value) => {
      if (!value) return true
      if (value.length < min) return `最少需要${min}个字符`
      return true
    },
    
    maxLength: (max) => (value) => {
      if (!value) return true
      if (value.length > max) return `最多允许${max}个字符`
      return true
    }
  }
}

module.exports = config