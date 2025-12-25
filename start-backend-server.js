// 启动后端服务器的脚本
const { spawn } = require('child_process');
const path = require('path');

console.log('=== 启动校园跑腿后端服务器 ===\n');

const backendPath = path.join(__dirname, 'errand-back');
const serverScript = 'server.js';

console.log(`后端路径: ${backendPath}`);
console.log(`启动脚本: ${serverScript}`);

// 启动服务器
const server = spawn('node', [serverScript], {
  cwd: backendPath,
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('启动服务器失败:', error);
});

server.on('close', (code) => {
  console.log(`服务器进程退出，代码: ${code}`);
});

console.log('\n正在启动后端服务器...');
console.log('服务器地址: http://192.168.1.161:3000');
console.log('健康检查: http://192.168.1.161:3000/health');
console.log('按 Ctrl+C 停止服务器\n');