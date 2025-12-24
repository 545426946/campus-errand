// 生成新的Token给用户15
const jwt = require('jsonwebtoken');

const userId = 15;
const username = '1234567';
const role = 'student';

const token = jwt.sign(
  { id: userId, username, role },
  'your_jwt_secret_key_here',
  { expiresIn: '24h' }
);

console.log('\n=== 用户15的新Token ===');
console.log('用户ID:', userId);
console.log('用户名:', username);
console.log('角色:', role);
console.log('\nToken:');
console.log(token);
console.log('\n请在微信开发者工具控制台执行：');
console.log(`wx.setStorageSync('token', '${token}');`);
console.log('\n然后刷新订单页面。');
