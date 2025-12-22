const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/upload.controller');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');

// 所有上传接口都需要登录
router.use(authenticate);

// 上传单张图片（头像或订单图片）
router.post('/single', uploadSingle, UploadController.uploadSingle);

// 上传多张图片（订单图片）
router.post('/multiple', uploadMultiple, UploadController.uploadMultiple);

// 删除图片
router.delete('/delete', UploadController.deleteImage);

module.exports = router;
