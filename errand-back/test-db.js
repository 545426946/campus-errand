console.log('开始导入 database');
const db = require('./src/config/database');
console.log('database 导入成功:', typeof db);
console.log('database.execute:', typeof db.execute);
