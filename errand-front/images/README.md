# 图片资源说明

## 微信登录图标

登录页面需要微信图标，请添加以下图片：

### wechat-icon.png
- **位置**：`/images/wechat-icon.png`
- **尺寸**：建议 128x128 像素
- **格式**：PNG（支持透明背景）
- **颜色**：白色图标（用于绿色按钮背景）

### 获取方式

1. **使用微信官方图标**
   - 访问 [微信设计资源](https://weixin.qq.com/)
   - 下载官方提供的图标素材

2. **自行设计**
   - 使用简单的微信 logo 图标
   - 确保符合微信品牌规范

3. **临时方案**
   如果暂时没有图标，可以：
   - 使用纯文字按钮（已在代码中实现）
   - 或使用 emoji：💬

### 示例代码（如果没有图标）

如果暂时没有图标文件，可以修改 `login.wxml`：

```xml
<!-- 不使用图标的版本 -->
<button class="wechat-login-btn" bindtap="onWechatLogin">
  <text class="wechat-btn-text">💬 微信一键登录</text>
</button>
```

或者完全移除图标：

```xml
<button class="wechat-login-btn" bindtap="onWechatLogin">
  <text class="wechat-btn-text">微信一键登录</text>
</button>
```

## 其他图标

### logo.png
- **位置**：`/images/logo.png`
- **用途**：应用 Logo
- **尺寸**：建议 512x512 像素

如果这些图标文件不存在，登录页面仍然可以正常工作，只是不会显示图标。
