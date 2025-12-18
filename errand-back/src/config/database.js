const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.168.1.133',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'errand_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`MySQL 连接成功: ${process.env.DB_HOST}`);
    connection.release();
  } catch (error) {
    console.error(`数据库连接错误: ${error.message}`);
    process.exit(1);
  }
};

// 导出pool的execute方法
module.exports = pool;
module.exports.connectDB = connectDB;
