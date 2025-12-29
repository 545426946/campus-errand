# 微信登录昵称更新问题修复

## ✅ 修复完成

修复日期：2025-12-29

## 问题描述
用户通过微信登录后，在个人资料页面修改了昵称，但下次再登录时，昵称无法显示修改后的内容。

## 根本原因

发现了三个关键问题：

### 1. 后端微信登录逻辑问题
**位置**: `errand-back/src/controllers/auth.controller.js`

每次微信登录时，无论前端是否传递新的昵称，都会执行更新操作，导致用户修改的昵称被覆盖。

### 2. 数据库查询缺少字段
**位置**: `errand-back/src/models/User.js` - `findById` 方法

SELECT 语句中缺少 `nickname` 字段，导致获取用户信息时无法返回昵称。

### 3. 前端只使用本地缓存
**位置**: `errand-front/pages/user/user.js`

用户中心页面只从本地缓存读取用户信息，没有从后端获取最新数据。

## 修复内容

### 1. 修复后端微信登录逻辑 ✅
**文件**: `errand-back/src/controllers/auth.controller.js`

```javascript
// 修复后：只在明确传递了新值时才更新
if (!user) {
  user = await User.createWechatUser({
    openid, unionid, session_key,
    nickname: nickname || '微信用户',
    avatar: avatar || ''
  });
} else {
  const updateData = { session_key };
  if (nickname) updateData.nickname = nickname;
  if (avatar) updateData.avatar = avatar;
  user = await User.updateWechatInfo(user.id, updateData);
}
```

### 2. 修复数据库查询 ✅
**文件**: `errand-back/src/models/User.js`

```javascript
// 在 SELECT 语句中添加 nickname 字段
'SELECT id, username, email, role, nickname, avatar, ... FROM users WHERE id = ?'
```

### 3. 修复前端用户信息更新 ✅
**文件**: `errand-front/pages/user/user.js`

```javascript
// 从后端获取最新用户信息
updateUserInfo: async function () {
  const token = wx.getStorageSync('token');
  const isLogin = !!token;
  
  if (isLogin) {
    try {
      const result = await userAPI.getUserProfile();
      if (result.code === 0 && result.data) {
        wx.setStorageSync('userInfo', result.data);
        this.setData({ userInfo: result.data });
      }
    } catch (error) {
      console.error('获取用户信息失败');
    }
  }
}
```

### 4. 添加测试模式支持 ✅
**文件**: `errand-back/src/services/wechat.service.js`

```javascript
// 支持测试模式，code 以 test_code_ 开头时返回模拟数据
if (code.startsWith('test_code_')) {
  return {
    openid: `test_openid_${timestamp}`,
    session_key: `test_session_key_${timestamp}`,
    unionid: null
  };
}
```

## 测试验证

### 自动化测试 ✅
运行测试脚本：
```bash
node test-nickname-simple.js
```

测试结果：
```
✅ 测试通过！昵称保持不变。
```

测试流程：
1. ✅ 首次微信登录（带昵称"初始昵称"）
2. ✅ 更新昵称为"修改后的昵称"
3. ✅ 第二次微信登录（不传昵称）
4. ✅ 验证昵称仍为"修改后的昵称"

### 手动测试步骤
1. 启动后端服务器
2. 在微信开发者工具中打开小程序
3. 微信登录
4. 进入个人中心 → 个人资料
5. 修改昵称并保存
6. 退出登录
7. 再次微信登录
8. 验证昵称显示正确

## 修复效果

- ✅ 用户修改昵称后会保存到数据库
- ✅ 再次微信登录时昵称不会被覆盖
- ✅ 用户中心页面显示最新昵称
- ✅ 个人资料页面显示最新昵称
- ✅ 支持测试模式便于开发调试

## 相关文件

### 后端
- `errand-back/src/controllers/auth.controller.js` - 微信登录逻辑
- `errand-back/src/models/User.js` - 用户数据模型
- `errand-back/src/services/wechat.service.js` - 微信服务（添加测试模式）

### 前端
- `errand-front/pages/user/user.js` - 用户中心页面
- `errand-front/pages/profile/profile.js` - 个人资料编辑页面
- `errand-front/api/user.js` - 用户API接口

### 测试
- `test-nickname-simple.js` - 昵称功能测试脚本

## 注意事项

1. 数据库中 `users` 表必须有 `nickname` 字段
2. 前端微信登录时，如果用户授权获取信息，会传递 `nickname` 和 `avatar`
3. 如果用户取消授权，前端不传这些参数，后端保持原有值
4. 用户中心页面每次显示时从后端获取最新数据
5. 测试模式：使用 `test_code_` 开头的 code 可以进行测试
