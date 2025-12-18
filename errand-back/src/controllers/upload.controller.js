const path = require('path');
const fs = require('fs').promises;

// 图片上传
exports.uploadImage = async (req, res, next) => {
  try {
    // 简化版：模拟文件上传
    // 实际项目中应该使用 multer 等中间件处理文件上传
    
    const { images } = req.body;

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请提供要上传的图片'
      });
    }

    // 模拟上传成功，返回图片URL
    const uploadedImages = images.map((img, index) => ({
      url: `http://192.168.1.133:3000/uploads/images/${Date.now()}_${index}.jpg`,
      size: Math.floor(Math.random() * 1000000),
      name: `image_${index}.jpg`
    }));

    res.json({
      success: true,
      code: 0,
      data: {
        images: uploadedImages
      },
      message: '图片上传成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
