# 用户资料更新功能修复

## 问题描述
在小程序中更新用户资料时，出现 500 错误：
```
Data truncated for column 'gender' at row 1
```

## 根本原因

数据库中 `gender` 字段类型不一致：
- 某些迁移文件定义为 `TINYINT`
- 某些迁移文件定义为 `ENUM('male', 'female', 'other')`
- 前端发送的是字符串 `'other'`
- 如果数据库是 `TINYINT` 类型，会导致数据截断错误

## 修复方案

### 1. 统一数据库字段类型 ✅

**文件**: `errand-back/database/migrations/fix-gender-column.sql`

将 `gender` 字段统一为 `TINYINT` 类型：
- 0 = 未知/其他
- 1 = 男
- 2 = 女

执行修复：
```bash
fix-gender-field.bat
```

或手动执行 SQL：
```sql
ALTER TABLE users MODIFY COLUMN gender TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女';
```

### 2. 后端添加类型转换 ✅

**文件**: `errand-back/src/models/User.js` - `updateProfile` 方法

添加 gender 字段的类型转换逻辑：

```javascript
if (gender !== undefined) {
  // 处理 gender 字段：支持字符串和数字两种格式
  let genderValue = gender;
  if (typeof gender === 'string') {
    // 将字符串转换为数字
    const genderMap = { 
      'male': 1, 
      'female': 2, 
      'other': 0, 
      'unknown': 0 
    };
    genderValue = genderMap[gender.toLowerCase()] !== undefined 
      ? genderMap[gender.toLowerCase()] 
      : 0;
  }
  fields.push('gender = ?');
  values.push(genderValue);
}
```

### 3. 前端保持不变

前端继续发送字符串格式的 gender 值，后端会自动转换。

## 测试验证

运行测试脚本：
```bash
node test-update-profile-fix.js
```

预期输出：
```
✅ 测试通过！用户资料更新成功。
```

## 字段映射关系

| 前端值 | 后端存储 | 说明 |
|--------|----------|------|
| 'male' | 1 | 男 |
| 'female' | 2 | 女 |
| 'other' | 0 | 其他/未知 |
| 'unknown' | 0 | 未知 |

## 相关文件

- `errand-back/src/models/User.js` - 添加类型转换
- `errand-back/database/migrations/fix-gender-column.sql` - 修复数据库字段
- `fix-gender-field.bat` - 执行修复脚本
- `test-update-profile-fix.js` - 测试脚本

## 注意事项

1. 执行数据库修复前建议备份数据
2. 如果已有用户数据使用 ENUM 类型，需要先转换数据
3. 后端代码兼容字符串和数字两种格式
4. 前端无需修改，继续使用字符串格式

---
修复日期：2025-12-29
