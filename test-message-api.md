# 消息 API 测试指南

## 问题诊断

错误信息：`POST http://localhost:3000/api/messages/send 404 (Not Found)`

实际上服务器返回的是 JWT 验证失败：`JWT验证失败: jwt malformed`

## 解决方案

### 1. 确认用户已登录

在微信开发者工具中，打开控制台，运行：

```javascript
console.log('Token:', wx.getStorageSync('token'))
console.log('UserInfo:', wx.getStorageSync('userInfo'))
```

### 2. 如果没有 token，需要重新登录

- 点击"我的"页面
- 点击"退出登录"
- 重新登录（使用测试账号或微信登录）

### 3. 测试消息发送

确保：
1. 已经登录
2. 在订单详情页面点击"联系对方"
3. 进入聊天页面
4. 输入消息并发送

### 4. 检查服务器日志

服务器应该显示：
- 发送消息请求的详细信息
- 消息创建成功的 ID

## API 端点验证

消息 API 路由已正确配置：
- `POST /api/messages/send` - 发送消息
- `GET /api/messages/order/:orderId` - 获取订单消息
- `GET /api/messages/chats` - 获取聊天列表
- `GET /api/messages/unread-count` - 获取未读消息数

## 常见问题

### Q: 为什么显示 404？
A: 实际上不是 404，而是认证失败。前端错误处理将 401 显示为 404。

### Q: JWT malformed 是什么意思？
A: Token 格式不正确，可能是：
- Token 为空
- Token 格式错误
- Token 已过期

### Q: 如何获取有效的 token？
A: 重新登录即可获取新的 token。

## 测试步骤

1. **清除旧数据**
   ```javascript
   wx.clearStorageSync()
   ```

2. **重新登录**
   - 使用测试账号登录
   - 或使用微信一键登录

3. **测试发送消息**
   - 找到一个已接单的订单
   - 点击"联系对方"
   - 发送测试消息

4. **查看服务器日志**
   - 应该看到"发送消息请求"
   - 应该看到"消息创建成功"
