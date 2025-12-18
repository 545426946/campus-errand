// 认证工具函数

/**
 * 检查是否已登录
 */
function isLoggedIn() {
  const token = wx.getStorageSync('token');
  const userInfo = wx.getStorageSync('userInfo');
  return !!(token && userInfo);
}

/**
 * 获取当前用户信息
 */
function getCurrentUser() {
  return wx.getStorageSync('userInfo');
}

/**
 * 获取当前用户ID
 */
function getCurrentUserId() {
  const userInfo = getCurrentUser();
  return userInfo ? userInfo.id : null;
}

/**
 * 获取Token
 */
function getToken() {
  return wx.getStorageSync('token');
}

/**
 * 保存登录信息
 */
function saveLoginInfo(token, userInfo) {
  wx.setStorageSync('token', token);
  wx.setStorageSync('userInfo', userInfo);
  
  // 更新全局状态
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.isLogin = true;
    app.globalData.userInfo = userInfo;
    app.globalData.loginReady = true;
  }
}

/**
 * 清除登录信息
 */
function clearLoginInfo() {
  wx.removeStorageSync('token');
  wx.removeStorageSync('userInfo');
  
  // 更新全局状态
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.isLogin = false;
    app.globalData.userInfo = null;
  }
}

/**
 * 要求登录（如果未登录则跳转到登录页）
 */
function requireLogin(options = {}) {
  if (!isLoggedIn()) {
    const { title = '提示', content = '请先登录', showCancel = true } = options;
    
    return new Promise((resolve, reject) => {
      wx.showModal({
        title,
        content,
        showCancel,
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login',
              success: () => resolve(false),
              fail: () => reject(new Error('跳转登录页失败'))
            });
          } else {
            reject(new Error('用户取消登录'));
          }
        },
        fail: () => reject(new Error('显示登录提示失败'))
      });
    });
  }
  
  return Promise.resolve(true);
}

/**
 * 检查是否有权限（例如：是否是订单发布者或接单者）
 */
function checkPermission(order, type = 'publisher') {
  const userId = getCurrentUserId();
  if (!userId) return false;
  
  if (type === 'publisher') {
    return order.user_id === userId;
  } else if (type === 'acceptor') {
    return order.acceptor_id === userId;
  } else if (type === 'both') {
    return order.user_id === userId || order.acceptor_id === userId;
  }
  
  return false;
}

module.exports = {
  isLoggedIn,
  getCurrentUser,
  getCurrentUserId,
  getToken,
  saveLoginInfo,
  clearLoginInfo,
  requireLogin,
  checkPermission
};
