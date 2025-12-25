const { spawn } = require('child_process');
const path = require('path');

console.log('启动后端服务器...');

const serverPath = path.join(__dirname, 'errand-back', 'demo-server.js');

const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  shell: false,
  detached: false
});

server.on('error', (error) => {
  console.error('启动服务器失败:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`服务器进程退出，代码: ${code}`);
  process.exit(code || 0);
});

console.log(`服务器正在启动... 路径: ${serverPath}`);
console.log('按 Ctrl+C 停止服务器');

// 处理程序退出
process.on('SIGINT', () => {
  console.log('\n正在停止服务器...');
  server.kill('SIGINT');
});