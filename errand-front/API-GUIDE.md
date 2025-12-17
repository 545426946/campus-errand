# 校园跑腿小程序 - 前端API使用指南

##  API文件结构

\\\
errand-front/api/
 index.js           # API统一导出
 request.js         # HTTP请求封装
 user.js           # 用户相关API
 order.js          # 订单相关API
 notification.js   # 通知相关API
 system.js         # 系统相关API
 upload.js         # 文件上传API
\\\

##  快速开始

### 1. 导入API

\\\javascript
// 方式1: 导入所有API
const API = require('../../api/index.js')

// 方式2: 按需导入
const userAPI = require('../../api/user.js')
const orderAPI = require('../../api/order.js')
\\\

### 2. 使用示例

\\\javascript
Page({
  data: {
    userInfo: null
  },

  onLoad() {
    this.loadUserInfo()
  },

  // 获取用户信息
  async loadUserInfo() {
    try {
      const res = await API.user.getUserInfo()
      this.setData({
        userInfo: res.data
      })
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }
})
\\\

##  API接口清单

### 一、用户相关 (user.js)

#### 认证相关
\\\javascript
// 用户登录
API.user.login(code)

// 发送验证码
API.user.sendVerificationCode(phone, type)

// 验证验证码
API.user.verifyCode(phone, code, type)

// 退出登录
API.user.logout()
\\\

#### 用户信息
\\\javascript
// 获取用户信息
API.user.getUserInfo()

// 更新用户信息
API.user.updateUserInfo({ nickname, phone })

// 获取用户资料
API.user.getUserProfile()

// 更新用户资料
API.user.updateUserProfile(profileData)
\\\

#### 头像管理
\\\javascript
// 获取头像
API.user.getUserAvatar()

// 更新头像
API.user.updateUserAvatar(filePath)
\\\

#### 实名认证
\\\javascript
// 提交实名认证
API.user.certifyUser({
  realName: '张三',
  idCard: '110101199001011234'
})

// 获取认证状态
API.user.getCertificationStatus()

// 获取认证信息
API.user.getCertificationInfo()
\\\

#### 钱包功能
\\\javascript
// 获取钱包信息
API.user.getWalletInfo()

// 获取钱包明细
API.user.getWalletDetails({ page: 1, pageSize: 20 })

// 提现
API.user.withdraw({ amount: 50, account: 'alipay@example.com' })

// 充值
API.user.recharge({ amount: 100, paymentMethod: 'wechat' })
\\\

#### 收藏和历史
\\\javascript
// 获取收藏列表
API.user.getFavoriteList({ page: 1, pageSize: 20 })

// 添加收藏
API.user.addToFavorite(orderId)

// 取消收藏
API.user.removeFromFavorite(orderId)

// 获取历史记录
API.user.getHistory({ page: 1, pageSize: 20 })

// 删除历史记录
API.user.deleteHistoryItem(id)
\\\

### 二、订单相关 (order.js)

#### 订单CRUD
\\\javascript
// 获取订单列表
API.order.getOrderList({
  page: 1,
  pageSize: 10,
  status: 'pending',
  type: 1,
  keyword: '快递'
})

// 获取订单详情
API.order.getOrderDetail(orderId)

// 创建订单
API.order.createOrder({
  title: '快递代取',
  description: '帮忙取个快递',
  type: 1,
  price: 5.00,
  pickupLocation: '菜鸟驿站',
  deliveryLocation: '宿舍楼下',
  contactPhone: '13800138000',
  images: []
})

// 更新订单
API.order.updateOrder(orderId, { title: '新标题' })

// 删除订单
API.order.deleteOrder(orderId)
\\\

#### 订单状态操作
\\\javascript
// 接单
API.order.acceptOrder(orderId)

// 取消订单
API.order.cancelOrder(orderId, '取消原因')

// 完成订单
API.order.completeOrder(orderId)

// 确认收货
API.order.confirmOrder(orderId)
\\\

#### 订单查询
\\\javascript
// 我发布的订单
API.order.getMyPublishOrders({ page: 1, status: 'pending' })

// 我接受的订单
API.order.getMyAcceptedOrders({ page: 1, status: 'accepted' })

// 搜索订单
API.order.searchOrders('快递', { page: 1 })

// 热门订单
API.order.getHotOrders({ limit: 10 })

// 推荐订单
API.order.getRecommendedOrders({ limit: 10 })

// 订单统计
API.order.getOrderStats()
\\\

#### 订单评价和举报
\\\javascript
// 订单评价
API.order.evaluateOrder(orderId, {
  rating: 5,
  comment: '服务很好',
  tags: ['快速', '友好']
})

// 获取订单评价
API.order.getOrderEvaluations(orderId)

// 举报订单
API.order.reportOrder(orderId, {
  reason: '违规内容',
  description: '详细描述'
})

// 分享订单
API.order.shareOrder(orderId)
\\\

### 三、通知相关 (notification.js)

\\\javascript
// 获取通知列表
API.notification.getNotifications({
  page: 1,
  pageSize: 20,
  unreadOnly: false
})

// 获取未读通知数量
API.notification.getUnreadCount()

// 标记通知为已读
API.notification.markAsRead(notificationId)

// 标记所有通知为已读
API.notification.markAllAsRead()

// 删除通知
API.notification.deleteNotification(notificationId)
\\\

### 四、系统相关 (system.js)

#### 系统配置
\\\javascript
// 获取系统配置
API.system.getConfig()

// 获取服务类型列表
API.system.getServiceTypes()

// 获取版本信息
API.system.getVersion()

// 检查更新
API.system.checkUpdate('1.0.0')
\\\

#### 位置服务
\\\javascript
// 获取位置信息
API.system.getLocation(39.9042, 116.4074)

// 搜索地点
API.system.searchLocation('北京大学')

// 获取天气信息
API.system.getWeather('北京')
\\\

#### 内容管理
\\\javascript
// 获取公告列表
API.system.getAnnouncements({ page: 1, pageSize: 10 })

// 获取热门搜索
API.system.getHotSearch()

// 获取推荐关键词
API.system.getRecommendedKeywords()

// 敏感词检查
API.system.checkSensitive('要检查的内容')
\\\

#### 用户反馈
\\\javascript
// 提交意见反馈
API.system.submitFeedback({
  type: 'bug',
  content: '反馈内容',
  contact: '联系方式',
  images: []
})

// 获取帮助信息
API.system.getHelp()

// 获取关于我们
API.system.getAbout()

// 获取隐私政策
API.system.getPrivacy()

// 获取用户协议
API.system.getAgreement()
\\\

### 五、文件上传 (upload.js)

\\\javascript
// 上传单张图片
API.upload.uploadImage(filePath)

// 批量上传图片
API.upload.uploadImages([filePath1, filePath2])

// 上传头像
API.upload.uploadAvatar(filePath)

// 上传认证图片
API.upload.uploadCertification(filePath, 'idCardFront')
\\\

##  使用技巧

### 1. 错误处理

\\\javascript
async loadData() {
  try {
    const res = await API.order.getOrderList()
    this.setData({ orders: res.data })
  } catch (error) {
    console.error('加载失败:', error)
    wx.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}
\\\

### 2. 加载状态

\\\javascript
async loadData() {
  wx.showLoading({ title: '加载中...' })
  try {
    const res = await API.order.getOrderList()
    this.setData({ orders: res.data })
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    wx.hideLoading()
  }
}
\\\

### 3. 分页加载

\\\javascript
Page({
  data: {
    orders: [],
    page: 1,
    hasMore: true
  },

  async loadMore() {
    if (!this.data.hasMore) return

    try {
      const res = await API.order.getOrderList({
        page: this.data.page,
        pageSize: 10
      })

      this.setData({
        orders: [...this.data.orders, ...res.data],
        page: this.data.page + 1,
        hasMore: res.data.length === 10
      })
    } catch (error) {
      console.error('加载失败:', error)
    }
  }
})
\\\

### 4. 图片上传

\\\javascript
// 选择并上传图片
chooseAndUploadImage() {
  wx.chooseImage({
    count: 1,
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      
      try {
        const uploadRes = await API.upload.uploadImage(filePath)
        console.log('上传成功:', uploadRes.data.images[0].url)
        
        this.setData({
          imageUrl: uploadRes.data.images[0].url
        })
      } catch (error) {
        console.error('上传失败:', error)
      }
    }
  })
}
\\\

##  配置说明

### 修改API基础URL

编辑 \pp.js\:

\\\javascript
App({
  globalData: {
    baseUrl: 'http://your-api-server.com/api'  // 修改为你的服务器地址
  }
})
\\\

### 修改请求超时时间

编辑 \utils/config.js\:

\\\javascript
module.exports = {
  getApiConfig() {
    return {
      baseUrl: getApp().globalData.baseUrl,
      timeout: 15000  // 修改超时时间（毫秒）
    }
  }
}
\\\

##  注意事项

1. **Token管理**: 所有需要认证的接口会自动携带token，无需手动添加
2. **错误处理**: 请求失败时会自动显示错误提示，也可以自定义处理
3. **网络状态**: 建议在发起请求前检查网络状态
4. **数据缓存**: 可以使用wx.setStorageSync缓存常用数据
5. **请求取消**: 长时间请求建议添加取消机制

##  完整示例

### 订单发布页面

\\\javascript
const API = require('../../api/index.js')

Page({
  data: {
    title: '',
    description: '',
    price: '',
    images: []
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 3,
      success: async (res) => {
        wx.showLoading({ title: '上传中...' })
        
        try {
          const uploadRes = await API.upload.uploadImages(res.tempFilePaths)
          const imageUrls = uploadRes.map(r => r.data.images[0].url)
          
          this.setData({
            images: [...this.data.images, ...imageUrls]
          })
        } catch (error) {
          wx.showToast({ title: '上传失败', icon: 'none' })
        } finally {
          wx.hideLoading()
        }
      }
    })
  },

  // 提交订单
  async submitOrder() {
    const { title, description, price, images } = this.data

    if (!title || !description || !price) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    wx.showLoading({ title: '发布中...' })

    try {
      await API.order.createOrder({
        title,
        description,
        type: 1,
        price: parseFloat(price),
        pickupLocation: '菜鸟驿站',
        deliveryLocation: '宿舍楼下',
        contactPhone: '13800138000',
        images
      })

      wx.showToast({ title: '发布成功', icon: 'success' })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      wx.showToast({ title: '发布失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  }
})
\\\

---

**更新时间**: 2024年12月16日
**API版本**: v1.0.0
