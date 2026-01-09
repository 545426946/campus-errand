const path = require('path');
const fs = require('fs');

class UploadController {
  // 获取上传目录
  static getUploadDir(type) {
    const typeMap = {
      'avatar': 'avatars',
      'avatars': 'avatars',
      'order': 'orders',
      'orders': 'orders',
      'feedback': 'feedbacks',
      'feedbacks': 'feedbacks',
      'certification': 'certifications',
      'certifications': 'certifications'
    };
    return typeMap[type] || 'general';
  }

  // 上传单张图片
  static async uploadSingle(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的图片'
        });
      }

      const uploadType = req.body.type || req.query.type || req.body.category || 'general';
      const uploadDir = UploadController.getUploadDir(uploadType);
      const imageUrl = `/uploads/${uploadDir}/${req.file.filename}`;

      res.json({
        success: true,
        message: '上传成功',
        data: {
          url: imageUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } catch (error) {
      console.error('上传失败:', error);
      res.status(500).json({
        success: false,
        message: '上传失败',
        error: error.message
      });
    }
  }

  // 上传多张图片
  static async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的图片'
        });
      }

      const uploadType = req.body.type || req.query.type || req.body.category || 'general';
      const uploadDir = UploadController.getUploadDir(uploadType);
      const images = req.files.map(file => ({
        url: `/uploads/${uploadDir}/${file.filename}`,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      }));

      res.json({
        success: true,
        message: '上传成功',
        data: {
          images,
          count: images.length
        }
      });
    } catch (error) {
      console.error('上传失败:', error);
      res.status(500).json({
        success: false,
        message: '上传失败',
        error: error.message
      });
    }
  }

  // 删除图片
  static async deleteImage(req, res) {
    try {
      const { filename, type } = req.body;

      if (!filename) {
        return res.status(400).json({
          success: false,
          message: '缺少文件名'
        });
      }

      const uploadType = type || 'orders';
      const filePath = path.join(
        __dirname,
        '../../uploads',
        uploadType === 'avatar' ? 'avatars' : 'orders',
        filename
      );

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: '文件不存在'
        });
      }

      // 删除文件
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除失败:', error);
      res.status(500).json({
        success: false,
        message: '删除失败',
        error: error.message
      });
    }
  }
}

module.exports = UploadController;
