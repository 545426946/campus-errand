// 最终完整测试脚本
const BASE_URL = 'http://192.168.1.161:3000';

async function request(endpoint, method = 'GET', body = null) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo_token_123'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    console.log(`\n=== ${method} ${endpoint} ===`);
    console.log('状态码:', response.status);
    console.log('响应:', JSON.stringify(data, null, 2));
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error(`请求失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function completeWalletTest() {
  console.log('🚀 开始完整钱包功能测试...\n');
  
  // 1. 检查初始余额
  console.log('📍 步骤1: 检查初始余额');
  const initialResult = await request('/api/user/wallet');
  if (!initialResult.success) {
    console.log('❌ 获取初始余额失败，停止测试');
    return;
  }
  const initialBalance = parseFloat(initialResult.data.data.balance);
  console.log(`✅ 初始余额: ¥${initialBalance}\n`);
  
  // 2. 执行充值
  console.log('📍 步骤2: 执行充值');
  const rechargeAmount = 50;
  const rechargeResult = await request('/api/user/wallet/recharge', 'POST', {
    amount: rechargeAmount,
    paymentMethod: 'wechat'
  });
  
  if (!rechargeResult.success) {
    console.log('❌ 充值失败，停止测试');
    console.log('充值错误:', rechargeResult.data);
    return;
  }
  
  console.log(`✅ 充值请求成功: ¥${rechargeAmount}`);
  console.log(`返回的balance_after: ¥${rechargeResult.data.data.balance_after}\n`);
  
  // 3. 再次检查余额
  console.log('📍 步骤3: 再次检查余额');
  await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟确保数据更新
  
  const updatedResult = await request('/api/user/wallet');
  if (!updatedResult.success) {
    console.log('❌ 获取更新后余额失败');
    return;
  }
  
  const updatedBalance = parseFloat(updatedResult.data.data.balance);
  const expectedBalance = initialBalance + rechargeAmount;
  
  console.log(`✅ 更新后余额: ¥${updatedBalance}`);
  console.log(`✅ 期望余额: ¥${expectedBalance}`);
  console.log(`✅ 余额是否正确: ${updatedBalance === expectedBalance ? '✅ 是' : '❌ 否'}\n`);
  
  // 4. 检查交易记录
  console.log('📍 步骤4: 检查交易记录');
  const detailsResult = await request('/api/user/wallet/details');
  if (detailsResult.success) {
    const transactions = detailsResult.data.data.list;
    console.log(`✅ 总交易记录数: ${transactions.length}`);
    
    if (transactions.length > 0) {
      console.log('✅ 最新交易记录:');
      const latest = transactions[0];
      console.log(`  - 类型: ${latest.type}`);
      console.log(`  - 金额: ¥${latest.amount}`);
      console.log(`  - 余额变化: ¥${latest.balance_before} → ¥${latest.balance_after}`);
      console.log(`  - 描述: ${latest.description}`);
      console.log(`  - 时间: ${latest.created_at}`);
    }
  }
  
  console.log('\n🎉 钱包功能测试完成！');
  console.log('\n📱 小程序使用说明:');
  console.log('1. 打开微信开发者工具');
  console.log('2. 导入项目: C:\\Users\\Administrator\\Desktop\\campus-errand\\errand-front');
  console.log('3. 登录账号: test / 123456');
  console.log('4. 进入钱包页面');
  console.log('5. 点击充值，输入金额测试');
  console.log('6. 查看余额是否正确更新');
}

// 运行测试
completeWalletTest().catch(console.error);