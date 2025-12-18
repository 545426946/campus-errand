# 校园跑腿系统后端接口需求清单

本文档整理了前端 (`errand-front`) 所需的所有后端接口。开发后端时请确保实现以下接口。

## 1. 认证模块 (Auth) - `/api/auth`

| 方法 | 路径 | 描述 | 参数 |
| --- | --- | --- | --- |
| POST | `/login` | 微信登录 | `{ code }` |
| POST | `/send-code` | 发送验证码 | `{ phone, type }` |
| POST | `/verify-code` | 验证验证码 | `{ phone, code, type }` |
| POST | `/logout` | 退出登录 | - |

## 2. 用户模块 (User) - `/api/user`

| 方法 | 路径 | 描述 | 参数 |
| --- | --- | --- | --- |
| GET | `/profile` | 获取用户完整资料 | - |
| PUT | `/profile` | 更新用户资料 | `{ ...profileData }` |
| PUT | `/info` | 更新用户基础信息 | `{ ...userInfo }` |
| GET | `/avatar` | 获取头像 | - |
| PUT | `/avatar` | 更新头像 (上传) | `FormData` |
| POST | `/certify` | 实名认证提交 | `{ ...certData }` |
| GET | `/certification/status` | 获取认证状态 | - |
| GET | `/certification/info` | 获取认证信息 | - |
| POST | `/change-password` | 修改密码 | `{ oldPassword, newPassword }` |
| POST | `/reset-password` | 重置密码 | `{ phone, code, newPassword }` |
| POST | `/bind-phone` | 绑定手机 | `{ phone, code }` |
| GET | `/wallet` | 获取钱包信息 | - |
| GET | `/wallet/details` | 获取钱包明细 | `?page, pageSize, type` |
| POST | `/wallet/withdraw` | 提现 | `{ amount, ... }` |
| POST | `/wallet/recharge` | 充值 | `{ amount, ... }` |
| GET | `/stats` | 获取用户统计数据 | - |
| GET | `/favorites` | 获取收藏列表 | `?page, pageSize` |
| POST | `/favorites` | 添加收藏 | `{ orderId }` |
| DELETE | `/favorites/:id` | 取消收藏 | - |
| GET | `/history` | 获取浏览历史 | `?page, pageSize, type` |
| DELETE | `/history` | **清空历史记录** (前端有调用，后端需实现) | `{ type }` |
| DELETE | `/history/:id` | 删除单条历史 | - |
| GET | `/settings` | 获取用户设置 | - |
| PUT | `/settings` | 更新用户设置 | `{ ...settings }` |
| DELETE | `/account` | 注销账号 | `{ password }` |

## 3. 订单模块 (Order) - `/api/orders`

| 方法 | 路径 | 描述 | 参数 |
| --- | --- | --- | --- |
| GET | `/` | 获取订单列表 | `?page, pageSize, status, type, keyword` |
| POST | `/` | 创建订单 | `{ ...orderData }` |
| GET | `/:id` | 获取订单详情 | - |
| PUT | `/:id` | 更新订单 | `{ ...orderData }` |
| DELETE | `/:id` | 删除订单 | - |
| POST | `/:id/accept` | 接单 | - |
| POST | `/:id/cancel` | 取消订单 | `{ reason }` |
| POST | `/:id/complete` | 完成订单 | `{ ...data }` |
| POST | `/:id/confirm` | 确认收货 | `{ ...data }` |
| GET | `/my-publish` | 获取我发布的订单 | `?page, pageSize, status` |
| GET | `/my-accepted` | 获取我接受的订单 | `?page, pageSize, status` |
| GET | `/search` | 搜索订单 | `?keyword, ...` |
| GET | `/hot` | 获取热门订单 | `?limit` |
| GET | `/recommended` | 获取推荐订单 | `?limit, location` |

## 4. 通知模块 (Notification) - `/api/notifications`

| 方法 | 路径 | 描述 | 参数 |
| --- | --- | --- | --- |
| GET | `/` | 获取通知列表 | `?page, pageSize, unreadOnly` |
| GET | `/unread-count` | 获取未读数量 | - |
| PUT | `/:id/read` | 标记已读 | - |
| PUT | `/read-all` | 标记所有已读 | - |
| DELETE | `/:id` | 删除通知 | - |

## 5. 系统模块 (System) - `/api/system`

| 方法 | 路径 | 描述 | 参数 |
| --- | --- | --- | --- |
| GET | `/config` | 获取系统配置 | - |
| GET | `/service-types` | 获取服务类型 | - |
| GET | `/location` | 获取位置信息 | `?lat, lng` |
| GET | `/search-location` | 搜索地点 | `?keyword, city` |
| GET | `/weather` | 获取天气 | `?location` |
| POST | `/feedback` | 提交反馈 | `{ ...feedback }` |
| GET | `/help` | 获取帮助列表 | `?page, pageSize, category` |
| GET | `/help/:id` | **获取帮助详情** (前端有调用，后端需实现) | - |
| GET | `/about` | 关于我们 | - |
| GET | `/privacy` | 隐私政策 | - |
| GET | `/agreement` | 用户协议 | - |
| GET | `/version` | 版本信息 | - |
| POST | `/check-update` | 检查更新 | `{ currentVersion }` |
| POST | `/share-stats` | **发送分享统计** (前端有调用，后端需实现) | `{ ...stats }` |

## 6. 上传模块 (Upload) - `/api/upload`

| 方法 | 路径 | 描述 | 参数 |
| --- | --- | --- | --- |
| POST | `/image` | 上传图片 | `FormData (image)` |

## 缺失/需确认接口

以下接口在前端代码中被调用，但在后端路由中未明确看到或需确认实现：

1.  `DELETE /api/user/history` - 批量清空历史记录
2.  `GET /api/user/settings` - 用户设置
3.  `PUT /api/user/settings` - 更新用户设置
4.  `DELETE /api/user/account` - 注销账号
5.  `GET /api/system/help/:id` - 帮助详情
6.  `POST /api/system/share-stats` - 分享统计
