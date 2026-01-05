const Certification = require('../models/Certification');
const User = require('../models/User');

// 提交认证申请
exports.submitCertification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      type,
      realName,
      idCard,
      studentId,
      school,
      college,
      major,
      grade,
      department,
      idCardFront,
      idCardBack,
      studentCard
    } = req.body;

    // 验证必填字段
    if (!type || !realName || !idCard || !school) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请填写完整的认证信息'
      });
    }

    // 验证认证类型
    if (!['student', 'teacher', 'staff'].includes(type)) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '无效的认证类型'
      });
    }

    // 验证身份证号格式
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    if (!idCardRegex.test(idCard)) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '身份证号格式不正确'
      });
    }

    // 检查是否已有待审核的申请
    const existingCert = await Certification.findByUserId(userId);
    if (existingCert && existingCert.status === 'pending') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '您已有待审核的认证申请，请等待审核结果'
      });
    }

    // 检查是否已认证
    const userCertStatus = await Certification.isUserCertified(userId);
    if (userCertStatus && userCertStatus.is_certified) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '您已完成身份认证'
      });
    }

    // 创建认证申请
    const certId = await Certification.create({
      user_id: userId,
      type,
      real_name: realName,
      id_card: idCard,
      student_id: studentId,
      school,
      college,
      major,
      grade,
      department,
      id_card_front: idCardFront,
      id_card_back: idCardBack,
      student_card: studentCard
    });

    res.json({
      success: true,
      code: 0,
      data: { certificationId: certId },
      message: '认证申请已提交，请等待审核'
    });
  } catch (error) {
    next(error);
  }
};

// 获取认证状态
exports.getCertificationStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const certification = await Certification.findByUserId(userId);
    const userCertStatus = await Certification.isUserCertified(userId);

    if (!certification) {
      return res.json({
        success: true,
        code: 0,
        data: {
          status: 'none',
          isCertified: false,
          message: '未提交认证申请'
        }
      });
    }

    res.json({
      success: true,
      code: 0,
      data: {
        status: certification.status,
        isCertified: userCertStatus?.is_certified || false,
        certificationType: userCertStatus?.certification_type || null,
        realName: certification.real_name,
        type: certification.type,
        school: certification.school,
        submittedAt: certification.submitted_at,
        reviewedAt: certification.reviewed_at,
        rejectReason: certification.reject_reason,
        message: this.getStatusMessage(certification.status)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取认证详情
exports.getCertificationDetail = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const certification = await Certification.findByUserId(userId);

    if (!certification) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '未找到认证记录'
      });
    }

    // 隐藏敏感信息
    const safeData = {
      ...certification,
      id_card: certification.id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
    };

    res.json({
      success: true,
      code: 0,
      data: safeData
    });
  } catch (error) {
    next(error);
  }
};

// 获取认证历史
exports.getCertificationHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const history = await Certification.getHistoryByUserId(userId);

    // 隐藏敏感信息并格式化数据
    const safeHistory = history.map(cert => ({
      id: cert.id,
      type: cert.type,
      real_name: cert.real_name,
      id_card: cert.id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2'),
      student_id: cert.student_id,
      school: cert.school,
      college: cert.college,
      major: cert.major,
      grade: cert.grade,
      department: cert.department,
      status: cert.status,
      reject_reason: cert.reject_reason,
      submitted_at: cert.submitted_at,
      reviewed_at: cert.reviewed_at,
      created_at: cert.created_at
    }));

    res.json({
      success: true,
      code: 0,
      data: safeHistory
    });
  } catch (error) {
    next(error);
  }
};

// 管理员：获取待审核列表
exports.getPendingCertifications = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;

    const result = await Certification.getPendingList(
      parseInt(page),
      parseInt(pageSize)
    );

    res.json({
      success: true,
      code: 0,
      data: {
        list: result.list,
        total: result.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 管理员：审核认证
exports.reviewCertification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;
    const reviewerId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '无效的审核状态'
      });
    }

    if (status === 'rejected' && !rejectReason) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '拒绝时必须提供原因'
      });
    }

    const certification = await Certification.findById(id);
    if (!certification) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '认证记录不存在'
      });
    }

    if (certification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '该认证已被审核'
      });
    }

    await Certification.review(id, {
      status,
      reject_reason: rejectReason,
      reviewer_id: reviewerId
    });

    res.json({
      success: true,
      code: 0,
      message: status === 'approved' ? '认证已通过' : '认证已拒绝'
    });
  } catch (error) {
    next(error);
  }
};

// 获取认证统计
exports.getCertificationStats = async (req, res, next) => {
  try {
    const stats = await Certification.getStats();

    res.json({
      success: true,
      code: 0,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// 辅助方法：获取状态消息
exports.getStatusMessage = function(status) {
  const messages = {
    pending: '认证审核中，请耐心等待',
    approved: '认证已通过',
    rejected: '认证未通过，请查看拒绝原因后重新提交',
    none: '未提交认证申请'
  };
  return messages[status] || '';
};

module.exports = exports;
