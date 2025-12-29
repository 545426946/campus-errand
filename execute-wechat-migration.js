/**
 * 执行微信登录数据库迁移脚本
 */

// 加载环境变量
const path = require('path');
const envPath = path.join(__dirname, 'errand-back', '.env');

// 手动读取 .env 文件
const fs = require('fs');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
}

const db = require('./errand-back/src/config/database');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function executeMigration() {
  log('\n========================================', 'blue');
  log('微信登录数据库迁移', 'blue');
  log('========================================\n', 'blue');

  try {
    // 1. 检查数据库连接
    log('步骤 1/6: 检查数据库连接...', 'yellow');
    await db.execute('SELECT 1');
    log('✓ 数据库连接成功\n', 'green');

    // 2. 检查 users 表是否存在
    log('步骤 2/6: 检查 users 表...', 'yellow');
    const [tables] = await db.execute("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      throw new Error('users 表不存在，请先创建基础表结构');
    }
    log('✓ users 表存在\n', 'green');

    // 3. 检查字段是否已存在
    log('步骤 3/6: 检查现有字段...', 'yellow');
    const [columns] = await db.execute("SHOW COLUMNS FROM users");
    const existingFields = columns.map(col => col.Field);
    
    const fieldsToAdd = ['openid', 'unionid', 'session_key', 'nickname', 'gender', 'school', 'bio'];
    const missingFields = fieldsToAdd.filter(field => !existingFields.includes(field));
    
    if (missingFields.length === 0) {
      log('✓ 所有微信字段已存在，无需迁移\n', 'green');
      log('字段列表:', 'green');
      fieldsToAdd.forEach(field => log(`  - ${field}`, 'green'));
      return;
    }
    
    log(`需要添加 ${missingFields.length} 个字段: ${missingFields.join(', ')}\n`, 'yellow');

    // 4. 添加字段
    log('步骤 4/6: 添加微信相关字段...', 'yellow');
    
    // 添加 openid
    if (missingFields.includes('openid')) {
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN openid VARCHAR(100) UNIQUE COMMENT '微信 openid'
      `);
      log('  ✓ 添加 openid 字段', 'green');
    }

    // 添加 unionid
    if (missingFields.includes('unionid')) {
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN unionid VARCHAR(100) UNIQUE COMMENT '微信 unionid'
      `);
      log('  ✓ 添加 unionid 字段', 'green');
    }

    // 添加 session_key
    if (missingFields.includes('session_key')) {
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN session_key VARCHAR(100) COMMENT '微信 session_key'
      `);
      log('  ✓ 添加 session_key 字段', 'green');
    }

    // 添加 nickname
    if (missingFields.includes('nickname')) {
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN nickname VARCHAR(100) COMMENT '用户昵称'
      `);
      log('  ✓ 添加 nickname 字段', 'green');
    }

    // 添加 gender
    if (missingFields.includes('gender')) {
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN gender TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女'
      `);
      log('  ✓ 添加 gender 字段', 'green');
    }

    // 添加 school
    if (missingFields.includes('school')) {
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN school VARCHAR(100) COMMENT '学校'
      `);
      log('  ✓ 添加 school 字段', 'green');
    }

    // 添加 bio
    if (missingFields.includes('bio')) {
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN bio TEXT COMMENT '个人简介'
      `);
      log('  ✓ 添加 bio 字段', 'green');
    }

    log('');

    // 5. 创建索引
    log('步骤 5/6: 创建索引...', 'yellow');
    
    // 检查索引是否存在
    const [indexes] = await db.execute("SHOW INDEX FROM users WHERE Key_name IN ('idx_openid', 'idx_unionid')");
    const existingIndexes = indexes.map(idx => idx.Key_name);

    if (!existingIndexes.includes('idx_openid')) {
      await db.execute('CREATE INDEX idx_openid ON users(openid)');
      log('  ✓ 创建 idx_openid 索引', 'green');
    } else {
      log('  - idx_openid 索引已存在', 'yellow');
    }

    if (!existingIndexes.includes('idx_unionid')) {
      await db.execute('CREATE INDEX idx_unionid ON users(unionid)');
      log('  ✓ 创建 idx_unionid 索引', 'green');
    } else {
      log('  - idx_unionid 索引已存在', 'yellow');
    }

    log('');

    // 6. 修改字段允许为空
    log('步骤 6/6: 修改字段属性...', 'yellow');
    
    // 检查 password 字段是否允许为空
    const [passwordCol] = await db.execute("SHOW COLUMNS FROM users WHERE Field = 'password'");
    if (passwordCol.length > 0 && passwordCol[0].Null === 'NO') {
      await db.execute(`
        ALTER TABLE users 
        MODIFY COLUMN password VARCHAR(255) NULL COMMENT '密码（微信登录用户可为空）'
      `);
      log('  ✓ 修改 password 字段允许为空', 'green');
    } else {
      log('  - password 字段已允许为空', 'yellow');
    }

    // 检查 email 字段是否允许为空
    const [emailCol] = await db.execute("SHOW COLUMNS FROM users WHERE Field = 'email'");
    if (emailCol.length > 0 && emailCol[0].Null === 'NO') {
      await db.execute(`
        ALTER TABLE users 
        MODIFY COLUMN email VARCHAR(100) NULL COMMENT '邮箱（可选）'
      `);
      log('  ✓ 修改 email 字段允许为空', 'green');
    } else {
      log('  - email 字段已允许为空', 'yellow');
    }

    log('');

    // 验证迁移结果
    log('========================================', 'blue');
    log('验证迁移结果', 'blue');
    log('========================================\n', 'blue');

    const [finalColumns] = await db.execute(
      "SHOW COLUMNS FROM users WHERE Field IN ('openid', 'unionid', 'session_key', 'nickname', 'gender', 'school', 'bio')"
    );

    log('已添加的字段:', 'green');
    finalColumns.forEach(col => {
      log(`  ✓ ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`, 'green');
    });

    log('');

    const [finalIndexes] = await db.execute(
      "SHOW INDEX FROM users WHERE Key_name IN ('idx_openid', 'idx_unionid')"
    );

    log('已创建的索引:', 'green');
    const uniqueIndexes = [...new Set(finalIndexes.map(idx => idx.Key_name))];
    uniqueIndexes.forEach(idx => {
      log(`  ✓ ${idx}`, 'green');
    });

    log('\n========================================', 'blue');
    log('🎉 数据库迁移完成！', 'green');
    log('========================================\n', 'blue');

    log('微信登录功能已就绪，可以开始使用了！', 'green');
    log('\n下一步操作:', 'yellow');
    log('1. 在 errand-back/.env 文件中配置 WECHAT_APPID 和 WECHAT_SECRET', 'yellow');
    log('2. 重启后端服务', 'yellow');
    log('3. 在微信开发者工具中测试登录功能\n', 'yellow');

  } catch (error) {
    log('\n✗ 数据库迁移失败:', 'red');
    log(error.message, 'red');
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      log('\n提示: 字段已存在，这可能是正常的', 'yellow');
    } else if (error.code === 'ECONNREFUSED') {
      log('\n提示: 无法连接到数据库，请检查:', 'yellow');
      log('1. MySQL 服务是否正在运行', 'yellow');
      log('2. 数据库配置是否正确 (errand-back/.env)', 'yellow');
    } else {
      log('\n详细错误信息:', 'yellow');
      console.error(error);
    }
    
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await db.end();
  }
}

// 执行迁移
executeMigration();
