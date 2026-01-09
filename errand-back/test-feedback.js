// 测试反馈功能
require('dotenv').config();
const Feedback = require('./src/models/Feedback');

async function testFeedback() {
  try {
    console.log('开始测试反馈功能...\n');

    // 测试获取所有反馈
    console.log('1. 测试获取所有反馈列表...');
    const result = await Feedback.getAll(1, 20, {});
    console.log('✅ 成功获取反馈列表');
    console.log('总数:', result.total);
    console.log('列表长度:', result.list.length);
    
    if (result.list.length > 0) {
      console.log('\n第一条反馈:');
      console.log(JSON.stringify(result.list[0], null, 2));
    } else {
      console.log('暂无反馈数据');
    }

    // 测试创建反馈
    console.log('\n2. 测试创建反馈...');
    const feedbackId = await Feedback.create({
      user_id: 1,
      type: 'bug',
      title: '测试反馈标题',
      content: '这是一条测试反馈内容',
      contact: '13800138000',
      images: ['/uploads/feedbacks/test.jpg']
    });
    console.log('✅ 成功创建反馈，ID:', feedbackId);

    // 测试获取反馈详情
    console.log('\n3. 测试获取反馈详情...');
    const feedback = await Feedback.findById(feedbackId);
    console.log('✅ 成功获取反馈详情');
    console.log(JSON.stringify(feedback, null, 2));

    // 测试获取统计
    console.log('\n4. 测试获取统计信息...');
    const stats = await Feedback.getStats();
    console.log('✅ 成功获取统计信息');
    console.log(JSON.stringify(stats, null, 2));

    console.log('\n✅ 所有测试通过！');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

testFeedback();
