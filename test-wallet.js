// 钱包功能测试脚本
const BASE_URL = 'http://localhost:3000';

// 模拟token
const TEST_TOKEN = 'demo_token_123';

// 测试请求函数
async function testRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_TOKEN}`
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    console.log(`\n=== ${method} ${endpoint} ===`);
    console.log('状态:', response.status);
    console.log('响应:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`请求失败 ${endpoint}:`, error);
    return null;
  }
}

// 测试钱包完整功能
async function testWalletFeatures() {
  console.log('🚀 开始测试钱包功能...');
  
  // 1. 获取初始余额
  console.log('\n📍 1. 获取初始余额');
  const initialWallet = await testRequest('/api/user/wallet');
  if (!initialWallet?.success) {
    console.log('❌ 获取余额失败，停止测试');
    return;
  }
  
  const initialBalance = initialWallet.data.balance;
  console.log(`✅ 初始余额: ¥${initialBalance}`);
  
  // 2. 执行充值
  console.log('\n📍 2. 执行充值');
  const rechargeAmount = 30;
  const rechargeResult = await testRequest('/api/user/wallet/recharge', 'POST', {
    amount: rechargeAmount,
    paymentMethod: 'wechat'
  });
  
  if (!rechargeResult?.success) {
    console.log('❌ 充值失败，停止测试');
    return;
  }
  
  console.log(`✅ 充值成功: ¥${rechargeAmount}`);
  console.log(`充值后余额: ¥${rechargeResult.data.balance_after}`);
  
  // 3. 获取更新后余额
  console.log('\n📍 3. 获取更新后余额');
  const updatedWallet = await testRequest('/api/user/wallet');
  if (updatedWallet?.success) {
    console.log(`✅ 更新后余额: ¥${updatedWallet.data.balance}`);
    console.log(`✅ 余额是否正确: ${updatedWallet.data.balance === initialBalance + rechargeAmount ? '是' : '否'}`);
  }
  
  // 4. 获取交易明细
  console.log('\n📍 4. 获取交易明细');
  const details = await testRequest('/api/user/wallet/details');
  if (details?.success) {
    console.log(`✅ 交易记录数: ${details.data.total}`);
    console.log('最近3条交易:');
    details.data.list.slice(0, 3).forEach((transaction, index) => {
      console.log(`  ${index + 1}. ${transaction.description} - ¥${transaction.amount} (${transaction.created_at})`);
    });
  }
  
  console.log('\n🎉 钱包功能测试完成！');
}

// 运行测试
testWalletFeatures().catch(console.error);