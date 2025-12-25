// 测试钱包API功能
const axios = require('axios');

const BASE_URL = 'http://192.168.1.161:3000';

// 模拟用户token（需要先登录获取）
const TEST_TOKEN = 'your_test_token_here';

async function testWalletAPI() {
  const headers = {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log('=== 测试钱包API ===\n');

    // 1. 测试获取钱包信息
    console.log('1. 测试获取钱包信息...');
    try {
      const walletResponse = await axios.get(`${BASE_URL}/api/user/wallet`, { headers });
      console.log('✅ 钱包信息:', JSON.stringify(walletResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 获取钱包信息失败:', error.response?.data || error.message);
    }

    console.log('\n');

    // 2. 测试获取钱包明细
    console.log('2. 测试获取钱包明细...');
    try {
      const detailsResponse = await axios.get(`${BASE_URL}/api/user/wallet/details?page=1&pageSize=5`, { headers });
      console.log('✅ 钱包明细:', JSON.stringify(detailsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 获取钱包明细失败:', error.response?.data || error.message);
    }

    console.log('\n');

    // 3. 测试充值
    console.log('3. 测试充值...');
    try {
      const rechargeResponse = await axios.post(`${BASE_URL}/api/user/wallet/recharge`, {
        amount: 50,
        paymentMethod: 'wechat'
      }, { headers });
      console.log('✅ 充值结果:', JSON.stringify(rechargeResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 充值失败:', error.response?.data || error.message);
    }

    console.log('\n');

    // 4. 测试提现
    console.log('4. 测试提现...');
    try {
      const withdrawResponse = await axios.post(`${BASE_URL}/api/user/wallet/withdraw`, {
        amount: 20,
        account: '微信'
      }, { headers });
      console.log('✅ 提现结果:', JSON.stringify(withdrawResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 提现失败:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
}

// 测试不需要认证的接口
async function testPublicAPI() {
  try {
    console.log('=== 测试公共API ===\n');

    // 测试服务器是否运行
    const healthResponse = await axios.get(`${BASE_URL}/api/system/health`);
    console.log('✅ 服务器状态:', JSON.stringify(healthResponse.data, null, 2));

  } catch (error) {
    console.log('❌ 服务器连接失败:', error.message);
  }
}

// 先测试公共API，再测试钱包API
testPublicAPI().then(() => {
  console.log('\n如果需要测试钱包API，请先登录获取token并替换TEST_TOKEN变量\n');
  // testWalletAPI();
});