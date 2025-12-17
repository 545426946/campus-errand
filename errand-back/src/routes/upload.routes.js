const express = require('express');
const { uploadImage } = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 所有上传路由都需要认证
router.use(protect);

// 图片上传
router.post('/image', uploadImage);

module.exports = router;
