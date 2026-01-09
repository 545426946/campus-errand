const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { verifyAdminToken, requireSuperAdmin, requireAdmin } = require('../middleware/adminAuth');

// 公开路由
router.post('/login', AdminController.login);

// 需要管理员认证的路由
router.use(verifyAdminToken);

// 当前管理员信息
router.get('/me', AdminController.getCurrentAdmin);

// 统计数据
router.get('/statistics', AdminController.getStatistics);

// 用户管理
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserDetail);
router.put('/users/:id', requireAdmin, AdminController.updateUser);
router.delete('/users/:id', requireSuperAdmin, AdminController.deleteUser);

// 订单管理
router.get('/orders', AdminController.getOrders);
router.get('/orders/:id', AdminController.getOrderDetail);
router.put('/orders/:id', requireAdmin, AdminController.updateOrder);
router.delete('/orders/:id', requireSuperAdmin, AdminController.deleteOrder);

// 认证管理
router.get('/certifications', AdminController.getCertifications);
router.post('/certifications/:id/review', requireAdmin, AdminController.reviewCertification);

// 提现管理
router.get('/withdraws', AdminController.getWithdrawRequests);
router.post('/withdraws/:id/review', requireAdmin, AdminController.reviewWithdrawRequest);

// 反馈管理
router.get('/feedbacks', AdminController.getFeedbacks);
router.post('/feedbacks/:id/reply', requireAdmin, AdminController.replyFeedback);
router.put('/feedbacks/:id/status', requireAdmin, AdminController.updateFeedbackStatus);

// 管理员管理（仅超级管理员）
router.get('/admins', requireSuperAdmin, AdminController.getAdmins);
router.post('/admins', requireSuperAdmin, AdminController.createAdmin);
router.put('/admins/:id', requireSuperAdmin, AdminController.updateAdmin);
router.delete('/admins/:id', requireSuperAdmin, AdminController.deleteAdmin);

module.exports = router;
