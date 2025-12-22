# 图片上传功能使用指南

## 功能已完成 ✅

图片上传功能已经完全实现并集成到系统中。

## 文件清单

### 核心文件
- ✅ `src/middleware/upload.js` - Multer 上传中间件配置
- ✅ `src/controllers/upload.controller.js` - 上传控制器
- ✅ `src/routes/upload.routes.js` - 上传路由
- ✅ `src/app.js` - 已添加静态文件服务和上传路由

### 测试和文档
- ✅ `test-upload.js` - 上传功能测试脚本
- ✅ `../docs/图片上传功能说明.md` - 详细技术文档
- ✅ `../图片上传功能快速指南.md` - 快速开始指南
- ✅ `API-DOCUMENTATION.md` - 已更新API文档

## 快速测试

### 1. 启动服务
```bash
npm run dev
```

### 2. 测试上传（需要先登录）
```bash
node test-upload.js
```

## API 端点

### 上传单张图片
```
POST /api/upload/single
Content-Type: multipart/form-data
Authorization: Bearer <token>

参数：
- image: 图片文件
- type: avatar 或 orders
```

### 上传多张图片
```
POST /api/upload/multiple
Content-Type: multipart/form-data
Authorization: Bearer <token>

参数：
- images: 图片文件数组（最多9张）
- type: orders
```

### 删除图片
```
DELETE /api/upload/delete
Authorization: Bearer <token>

Body:
{
  "filename": "xxx.jpg",
  "type": "avatar"
}
```

### 访问图片
```
GET /uploads/avatars/xxx.jpg
GET /uploads/orders/xxx.jpg
```

## 目录结构

上传的文件会自动保存到：
```
errand-back/
└── uploads/
    ├── avatars/    # 用户头像
    └── orders/     # 订单图片
```

## 数据库字段

### users 表
- `avatar` (VARCHAR 255): 存储头像URL

### orders 表
- `images` (TEXT): 存储图片URL数组（JSON格式）

## 前端集成

### 微信小程序示例

```javascript
// 上传头像
wx.chooseImage({
  count: 1,
  success: (res) => {
    wx.uploadFile({
      url: 'http://localhost:3000/api/upload/single',
      filePath: res.tempFilePaths[0],
      name: 'image',
      formData: { type: 'avatar' },
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (uploadRes) => {
        const data = JSON.parse(uploadRes.data);
        console.log('上传成功:', data.data.url);
      }
    });
  }
});
```

## 配置说明

### 修改文件大小限制
在 `src/middleware/upload.js` 中：
```javascript
limits: {
  fileSize: 5 * 1024 * 1024 // 5MB
}
```

### 修改图片数量限制
在 `src/middleware/upload.js` 中：
```javascript
uploadMultiple: upload.array('images', 9) // 最多9张
```

### 修改支持的格式
在 `src/middleware/upload.js` 中：
```javascript
const allowedTypes = /jpeg|jpg|png|gif|webp/;
```

## 注意事项

1. **权限**: 所有上传接口都需要登录认证
2. **文件格式**: 只支持图片格式（jpeg, jpg, png, gif, webp）
3. **文件大小**: 单个文件最大 5MB
4. **数量限制**: 订单图片最多 9 张
5. **存储位置**: 本地文件系统（生产环境建议使用云存储）
6. **URL格式**: 数据库存储相对路径，如 `/uploads/avatars/xxx.jpg`

## 生产环境建议

### 使用云存储服务
- **阿里云 OSS**: 稳定可靠，CDN加速
- **腾讯云 COS**: 与微信小程序集成良好
- **七牛云**: 免费额度较大

### 本地存储优化
- 使用 Nginx 提供静态文件服务
- 配置图片压缩和缓存
- 定期清理无用图片
- 设置备份策略

## 相关文档

- 详细文档: `../docs/图片上传功能说明.md`
- 快速指南: `../图片上传功能快速指南.md`
- API文档: `API-DOCUMENTATION.md`

## 下一步

1. ✅ 后端上传功能已完成
2. ⏭️ 在前端页面集成上传功能
3. ⏭️ 测试完整的上传和显示流程
4. ⏭️ 根据需要调整配置
5. ⏭️ 考虑迁移到云存储服务
