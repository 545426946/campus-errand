const request = require('./request.js')

// 文件上传相关的API
const uploadAPI = {
  // 上传图片
  uploadImage(filePath, formData = {}) {
    return request.uploadFile('/upload/image', filePath, formData, {
      name: 'image',
      loadingText: '上传图片中...'
    })
  },

  // 批量上传图片
  uploadImages(filePaths) {
    const uploadPromises = filePaths.map(filePath => 
      this.uploadImage(filePath)
    )
    return Promise.all(uploadPromises)
  },

  // 上传头像
  uploadAvatar(filePath) {
    return request.uploadFile('/upload/image', filePath, {}, {
      name: 'avatar',
      loadingText: '上传头像中...'
    })
  },

  // 上传认证图片
  uploadCertification(filePath, type) {
    return request.uploadFile('/upload/image', filePath, { type }, {
      name: 'certification',
      loadingText: '上传认证图片中...'
    })
  }
}

module.exports = uploadAPI
