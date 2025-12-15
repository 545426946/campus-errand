const config = require('../utils/config.js')
const { toast } = require('../utils/util.js')

// HTTP请求封装类
class Request {
  constructor() {
    this.baseUrl = config.getApiConfig().baseUrl
    this.timeout = config.getApiConfig().timeout
    this.interceptors = {
      request: [],
      response: []
    }

    // 添加默认拦截器
    this.addRequestInterceptor(this.defaultRequestInterceptor)
    this.addResponseInterceptor(this.defaultResponseInterceptor)
  }

  // 添加请求拦截器
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor)
  }

  // 添加响应拦截器
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor)
  }

  // 默认请求拦截器
  defaultRequestInterceptor(config) {
    // 添加token
    const token = wx.getStorageSync('token')
    if (token) {
      config.header = config.header || {}
      config.header['Authorization'] = `Bearer ${token}`
    }

    // 添加通用header
    config.header = {
      'Content-Type': 'application/json',
      ...config.header
    }

    console.log('请求配置:', config)
    return config
  }

  // 默认响应拦截器
  defaultResponseInterceptor(response) {
    console.log('响应数据:', response)

    const { statusCode, data } = response

    // HTTP状态码处理
    if (statusCode >= 200 && statusCode < 300) {
      // 业务状态码处理
      if (data.code === 0 || data.success) {
        return data
      } else {
        // 业务错误
        const message = data.message || '请求失败'
        toast.error(message)
        return Promise.reject(new Error(message))
      }
    } else if (statusCode === 401) {
      // 未授权，跳转登录
      toast.error('请先登录')
      wx.removeStorageSync('token')
      const app = getApp()
      app.globalData.isLogin = false
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return Promise.reject(new Error('未授权'))
    } else if (statusCode === 403) {
      // 权限不足
      toast.error('权限不足')
      return Promise.reject(new Error('权限不足'))
    } else if (statusCode === 404) {
      // 资源不存在
      toast.error('请求的资源不存在')
      return Promise.reject(new Error('资源不存在'))
    } else if (statusCode >= 500) {
      // 服务器错误
      toast.error('服务器错误，请稍后重试')
      return Promise.reject(new Error('服务器错误'))
    } else {
      // 其他错误
      toast.error('网络错误，请检查网络连接')
      return Promise.reject(new Error('网络错误'))
    }
  }

  // 基础请求方法
  request(options) {
    return new Promise((resolve, reject) => {
      // 合并默认配置
      const config = {
        url: this.baseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: options.header || {},
        timeout: options.timeout || this.timeout
      }

      // 执行请求拦截器
      let processedConfig = config
      for (const interceptor of this.interceptors.request) {
        processedConfig = interceptor(processedConfig)
        if (!processedConfig) {
          return reject(new Error('请求拦截器返回空配置'))
        }
      }

      // 发起请求
      wx.request({
        ...processedConfig,
        success: (response) => {
          // 执行响应拦截器
          let processedResponse = response
          for (const interceptor of this.interceptors.response) {
            try {
              processedResponse = interceptor(response) || response
            } catch (error) {
              return reject(error)
            }
          }
          resolve(processedResponse)
        },
        fail: (error) => {
          console.error('请求失败:', error)
          
          // 网络错误处理
          if (error.errMsg.includes('timeout')) {
            toast.error('请求超时，请检查网络连接')
          } else if (error.errMsg.includes('fail')) {
            toast.error('网络连接失败，请检查网络')
          } else {
            toast.error('请求失败，请稍后重试')
          }
          
          reject(error)
        }
      })
    })
  }

  // GET请求
  get(url, params = {}, options = {}) {
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    
    const requestUrl = queryString ? `${url}?${queryString}` : url
    
    return this.request({
      url: requestUrl,
      method: 'GET',
      ...options
    })
  }

  // POST请求
  post(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    })
  }

  // PUT请求
  put(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  }

  // DELETE请求
  delete(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      data,
      ...options
    })
  }

  // 文件上传
  uploadFile(url, filePath, formData = {}, options = {}) {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token')
      const header = {
        'Authorization': token ? `Bearer ${token}` : ''
      }

      wx.showLoading({
        title: options.loadingText || '上传中...',
        mask: true
      })

      wx.uploadFile({
        url: this.baseUrl + url,
        filePath,
        name: options.name || 'file',
        formData,
        header: { ...header, ...options.header },
        success: (response) => {
          wx.hideLoading()
          
          try {
            const data = JSON.parse(response.data)
            if (data.code === 0 || data.success) {
              resolve(data)
            } else {
              toast.error(data.message || '上传失败')
              reject(new Error(data.message || '上传失败'))
            }
          } catch (e) {
            toast.error('上传失败')
            reject(e)
          }
        },
        fail: (error) => {
          wx.hideLoading()
          toast.error('上传失败')
          reject(error)
        }
      })
    })
  }

  // 下载文件
  downloadFile(url, options = {}) {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token')
      const header = {
        'Authorization': token ? `Bearer ${token}` : ''
      }

      wx.showLoading({
        title: options.loadingText || '下载中...',
        mask: true
      })

      wx.downloadFile({
        url: this.baseUrl + url,
        header: { ...header, ...options.header },
        success: (response) => {
          wx.hideLoading()
          
          if (response.statusCode === 200) {
            resolve(response)
          } else {
            toast.error('下载失败')
            reject(new Error('下载失败'))
          }
        },
        fail: (error) => {
          wx.hideLoading()
          toast.error('下载失败')
          reject(error)
        }
      })
    })
  }
}

// 创建请求实例
const request = new Request()

module.exports = request