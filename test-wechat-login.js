/**
 * 微信登录功能测试脚本
 * 用于测试微信登录相关接口
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试配置
const TEST_CONFIG = {
  // 模拟微信登录 code（实际使用时需要从微信获取）
  mockCode: 'test_wx_code_' + Date.now(),
  mockUserInfo: {
    nickname: '测试微信用户',
    avatar: 'https://thirdwx.qlogo.cn/mmopen/test.png'
  }
};

// 颜色输出
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

// 测试微信登录接口
async function testWechatLogin() {
  log('\n========================================', 'blue');
  log('测试 1: 微信登录接口', 'blue');
  log('========================================', 'blue');

  try {
    const response = await axios.post(`${BASE_URL}/auth/wechat/login`, {
      code: TEST_CONFIG.mockCode,
      nickname: TEST_CONFIG.mockUserInfo.nickname,
      avatar: TEST_CONFIG.mockUserInfo.avatar
    });

    if (response.data.success) {
      log('✓ 微信登录成功', 'green');
      log(`Token: ${response.data.token.substring(0, 20)}...`, 'green');
      log(`用户ID: ${response.data.user.id}`, 'green');
      log(`用户名: ${response.data.user.username}`, 'green');
      log(`昵称: ${response.data.user.nickname}`, 'green');
      return response.data;
    } else {
      log('✗ 微信登录失败: ' + response.data.message, 'red');
      return null;
    }
  } catch (error) {
    if (error.response) {
      log('✗ 微信登录失败: ' + error.response.data.message, 'red');
      log('提示: 请确保已配置 WECHAT_APPID 和 WECHAT_SECRET', 'yellow');
    } else {
      log('✗ 请求失败: ' + error.message, 'red');
      log('提示: 请确保后端服务已启动', 'yellow');
    }
    return null;
  }
}

// 测试获取用户信息
async function testGetUserInfo(token) {
  log('\n========================================', 'blue');
  log('测试 2: 获取用户信息', 'blue');
  log('========================================', 'blue');

  try {
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      log('✓ 获取用户信息成功', 'green');
      log(`用户ID: ${response.data.data.id}`, 'green');
      log(`用户名: ${response.data.data.username}`, 'green');
      log(`昵称: ${response.data.data.nickname || '未设置'}`, 'green');
      log(`手机号: ${response.data.data.phone || '未绑定'}`, 'green');
      log(`OpenID: ${response.data.data.openid || '无'}`, 'green');
      return true;
    } else {
      log('✗ 获取用户信息失败: ' + response.data.message, 'red');
      return false;
    }
  } catch (error) {
    if (error.response) {
      log('✗ 获取用户信息失败: ' + error.response.data.message, 'red');
    } else {
      log('✗ 请求失败: ' + error.message, 'red');
    }
    return false;
  }
}

// 测试账号密码登录（确保不影响原有功能）
async function testAccountLogin() {
  log('\n========================================', 'blue');
  log('测试 3: 账号密码登录（兼容性测试）', 'blue');
  log('========================================', 'blue');

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'student1',
      password: 'admin123'
    });

    if (response.data.success) {
      log('✓ 账号密码登录成功', 'green');
      log('✓ 原有登录功能正常', 'green');
      return true;
    } else {
      log('✗ 账号密码登录失败: ' + response.data.message, 'red');
      return false;
    }
  } catch (error) {
    if (error.response) {
      log('✗ 账号密码登录失败: ' + error.response.data.message, 'red');
      log('提示: 请确保测试账号 student1 存在', 'yellow');
    } else {
      log('✗ 请求失败: ' + error.message, 'red');
    }
    return false;
  }
}

// 测试数据库字段
async function testDatabaseFields() {
  log('\n========================================', 'blue');
  log('测试 4: 数据库字段检查', 'blue');
  log('========================================', 'blue');

  try {
    const db = require('./errand-back/src/config/database');
    
    // 检查表结构
    const [columns] = await db.execute(
      "SHOW COLUMNS FROM users WHERE Field IN ('openid', 'unionid', 'session_key', 'nickname')"
    );

    const requiredFields = ['openid', 'unionid', 'session_key', 'nickname'];
    const existingFields = columns.map(col => col.Field);

    let allFieldsExist = true;
    for (const field of requiredFields) {
      if (existingFields.includes(field)) {
        log(`✓ 字段 ${field} 存在`, 'green');
      } else {
        log(`✗ 字段 ${field} 不存在`, 'red');
        allFieldsExist = false;
      }
    }

    if (allFieldsExist) {
      log('\n✓ 数据库字段检查通过', 'green');
      return true;
    } else {
      log('\n✗ 数据库字段不完整，请执行迁移脚本', 'red');
      log('执行命令: mysql -u errand_user -p -D errand_platform < errand-back/database/migrations/add_wechat_fields.sql', 'yellow');
      return false;
    }
  } catch (error) {
    log('✗ 数据库检查失败: ' + error.message, 'red');
    return false;
  }
}

// 主测试函数
async function runTests() {
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║     微信登录功能测试                  ║', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');

  const results = {
    database: false,
    wechatLogin: false,
    getUserInfo: false,
    accountLogin: false
  };

  // 测试 1: 数据库字段
  results.database = await testDatabaseFields();

  if (!results.database) {
    log('\n⚠ 数据库字段不完整，跳过接口测试', 'yellow');
    printSummary(results);
    return;
  }

  // 测试 2: 微信登录
  const loginResult = await testWechatLogin();
  results.wechatLogin = loginResult !== null;

  if (loginResult && loginResult.token) {
    // 测试 3: 获取用户信息
    results.getUserInfo = await testGetUserInfo(loginResult.token);
  }

  // 测试 4: 账号密码登录
  results.accountLogin = await testAccountLogin();

  // 打印测试总结
  printSummary(results);
}

// 打印测试总结
function printSummary(results) {
  log('\n========================================', 'blue');
  log('测试总结', 'blue');
  log('========================================', 'blue');

  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r).length;

  log(`\n数据库字段检查: ${results.database ? '✓ 通过' : '✗ 失败'}`, results.database ? 'green' : 'red');
  log(`微信登录接口: ${results.wechatLogin ? '✓ 通过' : '✗ 失败'}`, results.wechatLogin ? 'green' : 'red');
  log(`获取用户信息: ${results.getUserInfo ? '✓ 通过' : '✗ 失败'}`, results.getUserInfo ? 'green' : 'red');
  log(`账号密码登录: ${results.accountLogin ? '✓ 通过' : '✗ 失败'}`, results.accountLogin ? 'green' : 'red');

  log(`\n总计: ${passed}/${total} 测试通过`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('\n🎉 所有测试通过！微信登录功能已就绪', 'green');
  } else {
    log('\n⚠ 部分测试失败，请检查配置', 'yellow');
    log('\n配置检查清单:', 'yellow');
    log('1. 数据库迁移是否已执行？', 'yellow');
    log('2. .env 文件中是否配置了 WECHAT_APPID 和 WECHAT_SECRET？', 'yellow');
    log('3. 后端服务是否正常运行？', 'yellow');
    log('4. 测试账号 student1 是否存在？', 'yellow');
  }

  log('\n详细文档: 微信登录功能实现文档.md\n', 'blue');
}

// 运行测试
runTests().catch(error => {
  log('\n✗ 测试执行失败: ' + error.message, 'red');
  process.exit(1);
});
