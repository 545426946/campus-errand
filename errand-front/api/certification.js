const request = require('./request.js');

// 提交认证申请
function submitCertification(data) {
  return request.post('/certification/submit', data);
}

// 获取认证状态
function getCertificationStatus() {
  return request.get('/certification/status');
}

// 获取认证详情
function getCertificationDetail() {
  return request.get('/certification/detail');
}

// 获取认证历史
function getCertificationHistory() {
  return request.get('/certification/history');
}

// 获取待审核列表（管理员）
function getPendingCertifications(params) {
  return request.get('/certification/pending', params);
}

// 审核认证（管理员）
function reviewCertification(id, data) {
  return request.post(`/certification/${id}/review`, data);
}

// 获取认证统计（管理员）
function getCertificationStats() {
  return request.get('/certification/stats');
}

module.exports = {
  submitCertification,
  getCertificationStatus,
  getCertificationDetail,
  getCertificationHistory,
  getPendingCertifications,
  reviewCertification,
  getCertificationStats
};
