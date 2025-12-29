# 微信登录功能 - 快速开始

## 🚀 快速配置（3步完成）

### 步骤 1: 执行数据库迁移

```bash
# Windows
cd errand-back
mysql -u errand_user -p -D errand_platform < database/migrations/add_wechat_fields.sql

# 或者运行配置脚本
setup-wechat-login.bat
```

### 步骤 2: 配置微信小程序信息

编辑 `errand-back/.env` 文件，添加：

```env
WECHAT_APPID=你的小程序AppID
WECHAT_SECRET=你的小程序AppSecret
```

**获取方式：**
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 开发 → 开发管理 → 开发设置
3. 复制 AppID 和 AppSecret

### 步骤 3: 重启后端服务

```bash
cd errand-back
npm start
```

## ✅ 测试功能

运行测试脚本验证配置：

```bash
node test-wechat-login.js
```

## 📱 前端使用

### 1. 微信一键登录

用户点击"微信一键登录"按钮即可完成登录，无需输入账号密码。

### 2. 获取手机号（可选）

```xml
<button open-type="getPhoneNumber" bindgetphonenumber="onGetPhoneNumber">
  绑定手机号
</button>
```

## 🔑 登录方式

项目现在支持两种登录方式：

1. **账号密码登录** - 传统方式，输入用户名和密码
2. **微信一键登录** - 新增方式，使用微信授权快速登录

两种方式互不影响，用户可自由选择。

## 📖 详细文档

查看完整文档：[微信登录功能实现文档.md](./微信登录功能实现文档.md)

## 🔧 API 接口

### 微信登录
```
POST /api/auth/wechat/login
Body: { code, nickname, avatar }
```

### 绑定手机号
```
POST /api/auth/wechat/bind-phone
Headers: Authorization: Bearer {token}
Body: { encryptedData, iv }
```

## ⚠️ 注意事项

1. **生产环境必须使用 HTTPS**
2. **不要将 .env 文件提交到 Git**
3. **在微信公众平台配置服务器域名**
4. **session_key 不要返回给前端**

## 🐛 常见问题

### Q: 提示"微信接口错误"？
A: 检查 WECHAT_APPID 和 WECHAT_SECRET 是否正确配置。

### Q: code 已被使用？
A: 每个 code 只能使用一次，5分钟有效，不要重复使用。

### Q: 获取不到 unionid？
A: unionid 需要小程序绑定到微信开放平台，或用户关注了同主体公众号。

## 📞 技术支持

如有问题，请查看：
- [微信登录功能实现文档.md](./微信登录功能实现文档.md)
- [微信官方文档](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html)
