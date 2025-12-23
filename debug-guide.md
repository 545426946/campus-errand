# 钱包充值功能调试指南

## ✅ 后端状态确认

后端API完全正常工作，已通过完整测试：
- 初始余额: ¥100
- 充值¥50后余额: ¥150 ✅
- 交易记录正确生成 ✅
- API响应数据格式正确 ✅

## 🔧 前端问题排查步骤

### 1. 检查登录状态
在小程序控制台执行：
```javascript
console.log('Token:', wx.getStorageSync('token'));
console.log('用户信息:', wx.getStorageSync('userInfo'));
console.log('登录状态:', require('../../utils/auth.js').isLoggedIn());
```

### 2. 检查API调用
打开钱包页面，查看控制台是否有以下日志：
```
=== 钱包页面加载 ===
=== 开始加载钱包信息 ===
钱包API原始响应: {...}
```

### 3. 检查充值流程
点击充值后应该看到：
```
=== 开始充值 ===
充值金额: 50
充值API响应: {...}
✅ 充值成功
=== 开始刷新数据 ===
```

### 4. 常见问题及解决方案

#### 问题1: 控制台无日志输出
**原因**: 页面可能没有正确加载新版代码
**解决**: 
- 重新编译小程序
- 清除缓存
- 确保使用的是修改后的wallet.js

#### 问题2: 显示"未授权"错误
**原因**: Token过期或无效
**解决**:
- 重新登录账号
- 检查token是否正确存储

#### 问题3: 数据加载成功但页面不更新
**原因**: setData调用失败
**解决**:
- 检查this.data.walletInfo的值
- 确认setData调用完成

## 📱 完整测试流程

1. **打开微信开发者工具**
2. **导入项目**: `C:\Users\Administrator\Desktop\campus-errand\errand-front`
3. **清理缓存**: 开发者工具 → 清除缓存
4. **重新编译**: Ctrl+B 或点击编译
5. **登录账号**: test / 123456
6. **进入钱包**: 点击"我的" → 钱包
7. **查看初始余额**: 应该显示¥100.00
8. **执行充值**: 点击充值按钮，输入50
9. **确认成功**: 看到充值成功弹窗
10. **验证余额**: 余额应该更新为¥150.00

## 🛠️ 调试命令

如果仍有问题，请在控制台执行以下命令调试：

```javascript
// 手动调用钱包API
const userAPI = require('../../api/user.js');

userAPI.getWalletInfo().then(res => {
  console.log('手动获取钱包信息:', res);
}).catch(err => {
  console.error('手动调用失败:', err);
});

// 手动执行充值
userAPI.recharge({ amount: 20, paymentMethod: 'wechat' }).then(res => {
  console.log('手动充值结果:', res);
}).catch(err => {
  console.error('手动充值失败:', err);
});
```

## 📞 获取帮助

如果按照以上步骤仍有问题，请提供：
1. 控制台的完整日志输出
2. 网络请求的详细信息
3. 当前显示的错误信息

服务器运行状态: ✅ 正常 (http://192.168.1.163:3000)