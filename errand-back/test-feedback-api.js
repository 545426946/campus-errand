// 测试反馈API
require('dotenv').config();
const Feedback = require('./src/models/Feedback');

async function testFeedbackAPI() {
  try {
    console.log('开始测试反馈API...\n');

    // 测试1: 创建测试反馈
    console.log('1. 创建测试反馈...');
    const feedbackId = await Feedback.create({
      user_id: 1,
      type: 'bug',
      title: '测试反馈标题',
      content: '这是一条测试反馈内容，用于测试历史记录功能',
      contact: '13800138000',
      images: []
    });
    console.log('✅ 反馈创建成功，ID:', feedbackId);

    // 测试2: 获取用户反馈历史
    console.log('\n2. 获取用户反馈历史...');
    const history = await Feedback.getByUserId(1, 1, 20);
    console.log('✅ 获取成功');
    console.log('总数:', history.total);
    console.log('列表数量:', history.list.length);
    if (history.list.length > 0) {
      console.log('第一条反馈:', {
        id: history.list[0].id,
        title: history.list[0].title,
        type: history.list[0].type,
        status: history.list[0].status,
        created_at: history.list[0].created_at
      });
    }

    console.log('\n✅ 所有测试通过！');
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
  
  process.exit(0);
}

testFeedbackAPI();
