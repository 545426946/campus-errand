const express = require('express');
const router = express.Router();
const certificationController = require('../controllers/certification.controller');
const { authenticate } = require('../middleware/auth');

// 所有认证路由都需要登录
router.use(authenticate);

// 用户认证相关
router.post('/submit', certificationController.submitCertification);
router.get('/status', certificationController.getCertificationStatus);
router.get('/detail', certificationController.getCertificationDetail);
router.get('/history', certificationController.getCertificationHistory);

// 管理员认证审核（需要管理员权限，暂时开放）
router.get('/pending', certificationController.getPendingCertifications);
router.post('/:id/review', certificationController.reviewCertification);
router.get('/stats', certificationController.getCertificationStats);

module.exports = router;
