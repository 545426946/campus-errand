const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// AI相关路由（暂时返回空数据）
router.get('/recommend', protect, (req, res) => {
  res.json({
    success: true,
    code: 0,
    data: [],
    message: 'AI推荐功能开发中'
  });
});

module.exports = router;
