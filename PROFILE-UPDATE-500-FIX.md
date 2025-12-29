# 个人资料更新 500 错误修复

## 问题描述

用户在个人资料页面点击保存时，PUT 请求到 `/api/user/profile` 返回 500 错误。

### 错误日志
```
PUT http://localhost:3000/api/user/profile 500 (Internal Server Error)
```

## 问题原因

发现了两个数据库字段处理问题：

### 1. Gender 字段类型不匹配
- **数据库定义**: `ENUM('male','female','other')`
- **代码处理**: 将字符串 "other" 转换为数字 0
- **错误**: `Data truncated for column 'gender' at row 1`

### 2. Email 字段唯一索引冲突
- **数据库约束**: email 字段有唯一索引
- **问题**: 空字符串 `''` 被视为重复值
- **错误**: `Duplicate entry '' for key 'users.email'`

## 解决方案

修改 `errand-back/src/models/User.js` 中的 `updateProfile` 方法：

### 1. 修复 Gender 字段处理

```javascript
if (gender !== undefined) {
  // 处理 gender 字段：数据库使用 ENUM('male','female','other')
  let genderValue = gender;
  if (typeof gender === 'string') {
    // 确保值是有效的 ENUM 值
    const validGenders = ['male', 'female', 'other'];
    genderValue = validGenders.includes(gender.toLowerCase()) ? gender.toLowerCase() : 'other';
  } else if (typeof gender === 'number') {
    // 如果传入数字，转换为字符串
    const genderMap = { 1: 'male', 2: 'female', 0: 'other' };
    genderValue = genderMap[gender] || 'other';
  }
  fields.push('gender = ?');
  values.push(genderValue);
}
```

### 2. 修复空字符串字段处理

将所有可能为空字符串的字段转换为 NULL：

```javascript
if (email !== undefined) {
  fields.push('email = ?');
  values.push(email === '' ? null : email);
}

if (phone !== undefined) {
  fields.push('phone = ?');
  values.push(phone === '' ? null : phone);
}

// 同样处理其他字段: avatar, student_id, major, grade, nickname, school, bio
```

## 测试结果

### 测试数据
```javascript
{
  nickname: "微信用户01",
  phone: "",
  email: "",
  gender: "other",
  school: "",
  bio: ""
}
```

### 测试结果
```
✅ 更新成功！
响应状态码: 200
{
  "success": true,
  "code": 0,
  "data": {
    "id": 17,
    "username": "testuser",
    "email": null,
    "nickname": "微信用户01",
    "gender": "other",
    ...
  },
  "message": "更新资料成功"
}
```

## 影响范围

- 修复了个人资料更新接口的所有字段处理
- 确保空字符串正确转换为 NULL
- 确保 gender 字段值符合数据库 ENUM 类型
- 支持字符串和数字两种 gender 格式

## 相关文件

- `errand-back/src/models/User.js` - 修复 updateProfile 方法
- `errand-back/src/controllers/user.controller.js` - 调用 updateProfile
- `errand-back/src/routes/user.routes.js` - 路由配置
- `test-profile-update.js` - 测试脚本

## 日期

2025-12-29
