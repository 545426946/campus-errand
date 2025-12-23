// 测试充值API返回数据结构
const BASE_URL = 'http://localhost:3000';

async function testRechargeResponse() {
  console.log('🧪 测试充值API返回数据结构...');
  
  // 1. 获取初始余额
  const walletResponse = await fetch(`${BASE_URL}/api/user/wallet?token=demo_token_123`, {
    headers: { 'Authorization': 'Bearer demo_token_123' }
  });
  const walletData = await walletResponse.json();
  console.log('📊 钱包信息:', JSON.stringify(walletData, null, 2));
  
  // 2. 执行充值
  const rechargeResponse = await fetch(`${BASE_URL}/api/user/wallet/recharge?token=demo_token_123`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo_token_123'
    },
    body: JSON.stringify({
      amount: 15,
      paymentMethod: 'wechat'
    })
  });
  
  const rechargeData = await rechargeResponse.json();
  console.log('\n💰 充值响应:', JSON.stringify(rechargeData, null, 2));
  
  // 3. 检查关键字段
  if (rechargeData.success && rechargeData.data) {
    console.log('\n✅ 关键数据字段:');
    console.log('- balance_after:', rechargeData.data.balance_after, typeof rechargeData.data.balance_after);
    console.log('- balance_before:', rechargeData.data.balance_before, typeof rechargeData.data.balance_before);
    console.log('- amount:', rechargeData.data.amount, typeof rechargeData.data.amount);
    
    // 测试toFixed调用
    try {
      console.log('\n🔧 测试toFixed:');
      console.log('balance_after.toFixed(2):', rechargeData.data.balance_after.toFixed(2));
      console.log('amount.toFixed(2):', rechargeData.data.amount.toFixed(2));
    } catch (error) {
      console.error('❌ toFixed错误:', error.message);
    }
  }
}

testRechargeResponse().catch(console.error);