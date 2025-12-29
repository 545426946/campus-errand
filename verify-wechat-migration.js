/**
 * 验证微信登录数据库迁移结果
 */

const path = require('path');
const fs = require('fs');

// 加载环境变量
const envPath = path.join(__dirname, 'errand-back', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
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

async function verify() {
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║   微信登录数据库迁移验证              ║', 'blue');
  log('╚════════════════════════════════════════╝\n', 'blue');

  try {
    // 1. 验证字段
    log('【验证 1】检查微信相关字段', 'yellow');
    const [columns] = await db.execute(
      "SHOW COLUMNS FROM users WHERE Field IN ('openid', 'unionid', 'session_key', 'nickname', 'gender', 'school', 'bio')"
    );

    const requiredFields = ['openid', 'unionid', 'session_key', 'nickname', 'gender', 'school', 'bio'];
    const existingFields = columns.map(col => col.Field);

    let allFieldsExist = true;
    requiredFields.forEach(field => {
      if (existingFields.includes(field)) {
        const col = columns.find(c => c.Field === field);
        log(`  ✓ ${field.padEnd(15)} ${col.Type.padEnd(25)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`, 'green');
      } else {
        log(`  ✗ ${field} - 不存在`, 'red');
        allFieldsExist = false;
      }
    });

    if (!allFieldsExist) {
      throw new Error('部分字段缺失');
    }

    log('');

    // 2. 验证索引
    log('【验证 2】检查索引', 'yellow');
    const [indexes] = await db.execute(
      "SHOW INDEX FROM users WHERE Key_name IN ('idx_openid', 'idx_unionid')"
    );

    const requiredIndexes = ['idx_openid', 'idx_unionid'];
    const existingIndexes = [...new Set(indexes.map(idx => idx.Key_name))];

    let allIndexesExist = true;
    requiredIndexes.forEach(idx => {
      if (existingIndexes.includes(idx)) {
        const indexInfo = indexes.find(i => i.Key_name === idx);
        log(`  ✓ ${idx.padEnd(15)} on ${indexInfo.Column_name}`, 'green');
      } else {
        log(`  ✗ ${idx} - 不存在`, 'red');
        allIndexesExist = false;
      }
    });

    if (!allIndexesExist) {
      throw new Error('部分索引缺失');
    }

    log('');

    // 3. 验证字段属性
    log('【验证 3】检查字段属性', 'yellow');
    const [passwordCol] = await db.execute("SHOW COLUMNS FROM users WHERE Field = 'password'");
    const [emailCol] = await db.execute("SHOW COLUMNS FROM users WHERE Field = 'email'");

    if (passwordCol.length > 0) {
      if (passwordCol[0].Null === 'YES') {
        log('  ✓ password 字段允许为空（微信用户可以没有密码）', 'green');
      } else {
        log('  ⚠ password 字段不允许为空', 'yellow');
      }
    }

    if (emailCol.length > 0) {
      if (emailCol[0].Null === 'YES') {
        log('  ✓ email 字段允许为空', 'green');
      } else {
        log('  ⚠ email 字段不允许为空', 'yellow');
      }
    }

    log('');

    // 4. 测试插入微信用户
    log('【验证 4】测试创建微信用户', 'yellow');
    const testOpenid = 'test_openid_' + Date.now();
    const testUsername = 'wx_test_' + Date.now();

    try {
      const [result] = await db.execute(
        'INSERT INTO users (openid, nickname, username, role, password) VALUES (?, ?, ?, ?, ?)',
        [testOpenid, '测试微信用户', testUsername, 'student', '']
      );

      log(`  ✓ 成功创建测试用户 (ID: ${result.insertId})`, 'green');

      // 查询刚创建的用户
      const [users] = await db.execute(
        'SELECT id, username, nickname, openid FROM users WHERE id = ?',
        [result.insertId]
      );

      if (users.length > 0) {
        log(`  ✓ 成功查询用户: ${users[0].nickname} (${users[0].username})`, 'green');
      }

      // 删除测试用户
      await db.execute('DELETE FROM users WHERE id = ?', [result.insertId]);
      log('  ✓ 清理测试数据完成', 'green');

    } catch (error) {
      log(`  ✗ 创建测试用户失败: ${error.message}`, 'red');
      throw error;
    }

    log('');

    // 5. 显示表结构
    log('【验证 5】完整表结构', 'yellow');
    const [allColumns] = await db.execute("SHOW COLUMNS FROM users");
    
    log('\n  字段名              类型                      允许NULL    默认值', 'blue');
    log('  ' + '-'.repeat(70), 'blue');
    allColumns.forEach(col => {
      const fieldName = col.Field.padEnd(18);
      const type = col.Type.padEnd(25);
      const nullable = col.Null.padEnd(11);
      const defaultVal = (col.Default || 'NULL').toString().padEnd(10);
      log(`  ${fieldName} ${type} ${nullable} ${defaultVal}`, 'reset');
    });

    log('\n╔════════════════════════════════════════╗', 'green');
    log('║   ✅ 所有验证通过！                   ║', 'green');
    log('╚════════════════════════════════════════╝\n', 'green');

    log('数据库迁移成功完成，微信登录功能已就绪！\n', 'green');

    log('📋 下一步操作:', 'blue');
    log('1. 在 errand-back/.env 文件中配置:', 'yellow');
    log('   WECHAT_APPID=你的小程序AppID', 'yellow');
    log('   WECHAT_SECRET=你的小程序AppSecret', 'yellow');
    log('2. 重启后端服务', 'yellow');
    log('3. 运行测试: node test-wechat-login.js', 'yellow');
    log('4. 在微信开发者工具中测试登录\n', 'yellow');

  } catch (error) {
    log('\n✗ 验证失败:', 'red');
    log(error.message, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

verify();
