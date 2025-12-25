// 启动支持钱包充值的demo服务器
const { spawn } = require('child_process');
const path = require('path');

console.log('=== 启动钱包充值测试服务器 ===\n');

const backendPath = path.join(__dirname, 'errand-back');
const serverScript = 'demo-server.js';

console.log(`服务器路径: ${backendPath}`);
console.log(`启动脚本: ${serverScript}`);

// 启动demo-server
const server = spawn('node', [serverScript], {
  cwd: backendPath,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: '3000'  // 确保使用3000端口
  }
});

server.on('error', (error) => {
  console.error('启动服务器失败:', error);
});

server.on('close', (code) => {
  console.log(`服务器进程退出，代码: ${code}`);
});

console.log('\n正在启动demo服务器...');
console.log('服务器地址: http://192.168.1.161:3000');
console.log('钱包API: http://192.168.1.161:3000/api/user/wallet');
console.log('充值API: http://192.168.1.161:3000/api/user/wallet/recharge');
console.log('健康检查: http://192.168.1.161:3000/health');
console.log('\n使用demo格式token: demo_token_15');
console.log('按 Ctrl+C 停止服务器\n');