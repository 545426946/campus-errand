/**
 * 运行所有测试
 */

const testAuth = require('./test-auth');
const testOrder = require('./test-order');

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   校园跑腿平台 - 完整测试套件         ║');
  console.log('╚════════════════════════════════════════╝\n');

  const allResults = [];

  // 运行认证模块测试
  console.log('📋 模块 1/2: 认证模块');
  const authResults = await testAuth();
  allResults.push({ module: '认证模块', ...authResults });

  console.log('\n' + '='.repeat(50) + '\n');

  // 运行订单模块测试
  console.log('📋 模块 2/2: 订单模块');
  const orderResults = await testOrder();
  allResults.push({ module: '订单模块', ...orderResults });

  // 输出总体测试结果
  console.log('\n' + '='.repeat(50));
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         总体测试结果汇总               ║');
  console.log('╚════════════════════════════════════════╝\n');

  let totalPassed = 0;
  let totalTests = 0;

  allResults.forEach(result => {
    totalPassed += result.passed;
    totalTests += result.total;
    const rate = ((result.passed / result.total) * 100).toFixed(2);
    console.log(`${result.module}: ${result.passed}/${result.total} (${rate}%)`);
  });

  console.log('\n' + '-'.repeat(50));
  const overallRate = ((totalPassed / totalTests) * 100).toFixed(2);
  console.log(`总计: ${totalPassed}/${totalTests} (${overallRate}%)`);
  
  if (overallRate === '100.00') {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查日志');
  }
  
  console.log('\n');
}

runAllTests().catch(console.error);
