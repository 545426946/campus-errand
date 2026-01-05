# 校园跑腿管理后台

## 快速开始

### 1. 初始化管理员系统

在后端目录运行初始化脚本：

```bash
cd errand-back
setup-admin.bat
```

或手动运行：

```bash
cd errand-back
node create-admin-table.js
```

### 2. 启动后端服务

```bash
cd errand-back
npm start
```

### 3. 访问管理后台

直接在浏览器中打开 `index.html` 文件，或使用静态服务器：

```bash
# 使用 Python
python -m http.server 8080

# 使用 Node.js
npx http-server -p 8080
```

然后访问：`http://localhost:8080`

### 4. 登录

默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

**重要：首次登录后请立即修改密码！**

## 功能说明

### 数据统计
- 实时查看用户、订单、认证等统计数据

### 用户管理
- 查看、搜索、编辑、删除用户
- 查看用户详细信息和订单统计

### 订单管理
- 查看、搜索、编辑、删除订单
- 查看订单详细信息

### 认证审核
- 查看所有认证申请
- 审核通过或拒绝认证
- 查看证件照片

## 配置

如果后端服务不在默认地址，请修改 `admin.js` 中的 `API_BASE_URL`：

```javascript
const API_BASE_URL = 'http://your-backend-url:port/api';
```

## 技术栈

- 原生 HTML/CSS/JavaScript
- Fetch API
- LocalStorage

## 浏览器支持

- Chrome (推荐)
- Firefox
- Edge
- Safari

## 注意事项

1. 管理后台应该只在内网或通过 VPN 访问
2. 定期更换管理员密码
3. 重要操作前先备份数据库
4. 不要将管理后台暴露在公网

## 更多文档

详细使用说明请查看：`../管理员系统使用说明.md`
