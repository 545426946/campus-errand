// 钱包充值问题修复脚本
const axios = require('axios');

const BASE_URL = 'http://192.168.1.161:3000';
const TEST_TOKEN = 'demo_token_15'; // 使用demo server的token格式

console.log('=== 钱包充值功能测试和修复 ===\n');

async function testWalletRecharge() {
  try {
    console.log('1. 测试获取钱包信息...');
    const walletResponse = await axios.get(`${BASE_URL}/api/user/wallet?token=${TEST_TOKEN}`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    console.log('初始钱包信息:', JSON.stringify(walletResponse.data, null, 2));
    
    const initialBalance = walletResponse.data.data.balance;
    console.log(`初始余额: ¥${initialBalance}`);
    
    console.log('\n2. 执行充值操作...');
    const rechargeAmount = 50.00;
    const rechargeResponse = await axios.post(`${BASE_URL}/api/user/wallet/recharge?token=${TEST_TOKEN}`, {
      amount: rechargeAmount,
      paymentMethod: 'wechat'
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('充值响应:', JSON.stringify(rechargeResponse.data, null, 2));
    
    console.log('\n3. 再次获取钱包信息验证...');
    const updatedWalletResponse = await axios.get(`${BASE_URL}/api/user/wallet?token=${TEST_TOKEN}`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    console.log('更新后钱包信息:', JSON.stringify(updatedWalletResponse.data, null, 2));
    
    const updatedBalance = updatedWalletResponse.data.data.balance;
    const expectedBalance = initialBalance + rechargeAmount;
    
    console.log('\n=== 验证结果 ===');
    console.log(`充值前余额: ¥${initialBalance}`);
    console.log(`充值金额: ¥${rechargeAmount}`);
    console.log(`预期余额: ¥${expectedBalance}`);
    console.log(`实际余额: ¥${updatedBalance}`);
    
    if (Math.abs(updatedBalance - expectedBalance) < 0.01) {
      console.log('✅ 充值功能正常！余额已正确更新');
    } else {
      console.log('❌ 充值功能有问题！余额未正确更新');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 运行测试
testWalletRecharge();