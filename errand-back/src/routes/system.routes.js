const express = require('express');
const {
  getConfig,
  getServiceTypes,
  getVersion,
  checkUpdate,
  getLocation,
  searchLocation,
  getWeather,
  getAnnouncements,
  getHotSearch,
  getRecommendedKeywords,
  checkSensitive,
  submitFeedback,
  getHelp,
  getAbout,
  getPrivacy,
  getAgreement
} = require('../controllers/system.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 系统配置（公开）
router.get('/config', getConfig);
router.get('/service-types', getServiceTypes);
router.get('/version', getVersion);
router.post('/check-update', checkUpdate);

// 位置服务（公开）
router.get('/location', getLocation);
router.get('/search-location', searchLocation);
router.get('/weather', getWeather);

// 内容管理（公开）
router.get('/announcements', getAnnouncements);
router.get('/hot-search', getHotSearch);
router.get('/recommended-keywords', getRecommendedKeywords);

// 敏感词检查（需要认证）
router.post('/check-sensitive', protect, checkSensitive);

// 用户反馈（需要认证）
router.post('/feedback', protect, submitFeedback);

// 帮助和关于（公开）
router.get('/help', getHelp);
router.get('/about', getAbout);
router.get('/privacy', getPrivacy);
router.get('/agreement', getAgreement);

module.exports = router;
