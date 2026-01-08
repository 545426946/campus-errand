const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { username, email, password, role = 'student' } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );
    
    return { id: result.insertId, username, email, role };
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, username, email, role, nickname, avatar, phone, student_id, major, grade, balance, frozen_balance, total_income, total_expense, certification_status, real_name, id_card, is_certified, certification_type, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findByUsername(username) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows[0];
  }

  static async findByOpenid(openid) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE openid = ?',
      [openid]
    );
    return rows[0];
  }

  static async findByUnionid(unionid) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE unionid = ?',
      [unionid]
    );
    return rows[0];
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async updateProfile(id, profileData) {
    const { 
      avatar, 
      phone, 
      student_id, 
      major, 
      grade,
      nickname,
      email,
      gender,
      school,
      bio
    } = profileData;
    
    // 构建动态更新语句
    const fields = [];
    const values = [];
    
    if (avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(avatar === '' ? null : avatar);
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      values.push(phone === '' ? null : phone);
    }
    if (student_id !== undefined) {
      fields.push('student_id = ?');
      values.push(student_id === '' ? null : student_id);
    }
    if (major !== undefined) {
      fields.push('major = ?');
      values.push(major === '' ? null : major);
    }
    if (grade !== undefined) {
      fields.push('grade = ?');
      values.push(grade === '' ? null : grade);
    }
    if (nickname !== undefined) {
      fields.push('nickname = ?');
      values.push(nickname === '' ? null : nickname);
    }
    if (email !== undefined) {
      fields.push('email = ?');
      // 空字符串转换为 NULL，避免唯一索引冲突
      values.push(email === '' ? null : email);
    }
    if (gender !== undefined) {
      // 处理 gender 字段：数据库使用 ENUM('male','female','other')
      let genderValue = gender;
      if (typeof gender === 'string') {
        // 确保值是有效的 ENUM 值
        const validGenders = ['male', 'female', 'other'];
        genderValue = validGenders.includes(gender.toLowerCase()) ? gender.toLowerCase() : 'other';
      } else if (typeof gender === 'number') {
        // 如果传入数字，转换为字符串
        const genderMap = { 1: 'male', 2: 'female', 0: 'other' };
        genderValue = genderMap[gender] || 'other';
      }
      fields.push('gender = ?');
      values.push(genderValue);
    }
    if (school !== undefined) {
      fields.push('school = ?');
      values.push(school === '' ? null : school);
    }
    if (bio !== undefined) {
      fields.push('bio = ?');
      values.push(bio === '' ? null : bio);
    }
    
    if (fields.length > 0) {
      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id);
      await db.execute(query, values);
    }
    
    return await this.findById(id);
  }

  static async getLearningProgress(userId) {
    const [rows] = await db.execute(
      `SELECT ce.course_id, c.title, ce.progress, ce.last_accessed 
       FROM course_enrollments ce 
       JOIN courses c ON ce.course_id = c.id 
       WHERE ce.student_id = ?`,
      [userId]
    );
    return rows;
  }

  static async createWechatUser(userData) {
    const { openid, unionid, session_key, nickname, avatar, phone } = userData;
    const timestamp = Date.now();
    const username = `wx_${timestamp}`;
    const finalNickname = nickname || '微信用户';
    
    const [result] = await db.execute(
      'INSERT INTO users (openid, unionid, session_key, nickname, avatar, phone, role, username, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [openid, unionid || null, session_key || null, finalNickname, avatar || '', phone || null, 'student', username, '']
    );
    
    return {
      id: result.insertId,
      openid,
      unionid,
      nickname: finalNickname,
      avatar,
      phone,
      username
    };
  }

  static async updateWechatInfo(id, wechatData) {
    const { session_key, nickname, avatar, phone } = wechatData;
    const fields = [];
    const values = [];

    if (session_key !== undefined) {
      fields.push('session_key = ?');
      values.push(session_key);
    }
    if (nickname !== undefined) {
      fields.push('nickname = ?');
      values.push(nickname);
    }
    if (avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(avatar);
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      values.push(phone);
    }

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    await db.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  static async updateUserInfo(id, userData) {
    const fields = [];
    const values = [];

    // 支持更多字段
    const allowedFields = ['nickname', 'avatar', 'phone', 'real_name', 'id_card', 'certification_status', 'balance', 'frozen_balance'];
    
    allowedFields.forEach(field => {
      if (userData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(userData[field]);
      }
    });

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    await db.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  // 添加钱包交易记录
  static async addWalletTransaction(userId, transactionData) {
    const { type, amount, title, description, relatedType, relatedId } = transactionData;
    
    // 开始事务
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 获取用户当前余额
      const [userRows] = await connection.execute(
        'SELECT balance, frozen_balance, total_income, total_expense FROM users WHERE id = ? FOR UPDATE',
        [userId]
      );

      if (userRows.length === 0) {
        throw new Error('用户不存在');
      }

      const user = userRows[0];
      let currentBalance = parseFloat(user.balance) || 0;
      let newBalance = currentBalance;
      let newTotalIncome = parseFloat(user.total_income) || 0;
      let newTotalExpense = parseFloat(user.total_expense) || 0;
      const amountNum = parseFloat(amount);

      // 根据交易类型更新余额
      if (type === 'income') {
        newBalance += amountNum;
        newTotalIncome += amountNum;
      } else if (type === 'expense') {
        if (newBalance < amountNum) {
          throw new Error('余额不足');
        }
        newBalance -= amountNum;
        newTotalExpense += amountNum;
      }

      // 更新用户余额
      await connection.execute(
        'UPDATE users SET balance = ?, total_income = ?, total_expense = ? WHERE id = ?',
        [newBalance, newTotalIncome, newTotalExpense, userId]
      );

      // 插入交易记录 - 使用正确的字段名 order_id
      const orderId = relatedType === 'order' ? relatedId : null;
      await connection.execute(
        `INSERT INTO wallet_transactions 
        (user_id, type, amount, balance_before, balance_after, title, description, order_id, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
        [userId, type, amountNum, currentBalance, newBalance, title, description || '', orderId]
      );

      await connection.commit();
      return { success: true, newBalance };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 冻结余额（发布订单时使用）
  static async freezeBalance(userId, amount, orderId, title, description) {
    console.log('=== freezeBalance 开始 ===');
    console.log('参数:', { userId, amount, orderId, title });
    
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 获取用户当前余额
      const [userRows] = await connection.execute(
        'SELECT balance, frozen_balance FROM users WHERE id = ? FOR UPDATE',
        [userId]
      );

      console.log('用户查询结果:', userRows);

      if (userRows.length === 0) {
        throw new Error('用户不存在');
      }

      const user = userRows[0];
      const currentBalance = parseFloat(user.balance) || 0;
      const currentFrozen = parseFloat(user.frozen_balance) || 0;
      const amountNum = parseFloat(amount);

      console.log('当前余额:', currentBalance);
      console.log('当前冻结:', currentFrozen);
      console.log('冻结金额:', amountNum);

      // 检查余额是否足够
      if (currentBalance < amountNum) {
        throw new Error('余额不足');
      }

      const newBalance = currentBalance - amountNum;
      const newFrozen = currentFrozen + amountNum;

      console.log('新余额:', newBalance);
      console.log('新冻结:', newFrozen);

      // 更新用户余额和冻结余额
      const [updateResult] = await connection.execute(
        'UPDATE users SET balance = ?, frozen_balance = ? WHERE id = ?',
        [newBalance, newFrozen, userId]
      );
      console.log('更新用户结果:', updateResult);

      // 插入冻结交易记录
      const [insertResult] = await connection.execute(
        `INSERT INTO wallet_transactions 
        (user_id, type, amount, balance_before, balance_after, title, description, order_id, status, created_at) 
        VALUES (?, 'freeze', ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
        [userId, amountNum, currentBalance, newBalance, title, description || '', orderId]
      );
      console.log('插入交易记录结果:', insertResult);

      await connection.commit();
      console.log('=== freezeBalance 成功 ===');
      return { success: true, newBalance, newFrozen };
    } catch (error) {
      console.error('freezeBalance 错误:', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 解冻余额并转账给骑手（确认完成订单时使用）
  static async unfreezeAndTransfer(publisherId, riderId, amount, orderId, orderTitle) {
    console.log('=== unfreezeAndTransfer 开始 ===');
    console.log('参数:', { publisherId, riderId, amount, orderId, orderTitle });
    
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const amountNum = parseFloat(amount);
      console.log('转账金额:', amountNum);

      // 获取发布者信息
      const [publisherRows] = await connection.execute(
        'SELECT balance, frozen_balance, total_expense FROM users WHERE id = ? FOR UPDATE',
        [publisherId]
      );

      console.log('发布者查询结果:', publisherRows);

      if (publisherRows.length === 0) {
        throw new Error('发布者不存在');
      }

      const publisher = publisherRows[0];
      const publisherFrozen = parseFloat(publisher.frozen_balance) || 0;
      const publisherExpense = parseFloat(publisher.total_expense) || 0;

      console.log('发布者冻结余额:', publisherFrozen);

      if (publisherFrozen < amountNum) {
        throw new Error(`冻结余额不足: 当前冻结=${publisherFrozen}, 需要=${amountNum}`);
      }

      // 获取骑手信息
      const [riderRows] = await connection.execute(
        'SELECT balance, total_income FROM users WHERE id = ? FOR UPDATE',
        [riderId]
      );

      console.log('骑手查询结果:', riderRows);

      if (riderRows.length === 0) {
        throw new Error('骑手不存在');
      }

      const rider = riderRows[0];
      const riderBalance = parseFloat(rider.balance) || 0;
      const riderIncome = parseFloat(rider.total_income) || 0;

      console.log('骑手当前余额:', riderBalance);

      // 更新发布者：减少冻结余额，增加总支出
      const newPublisherFrozen = publisherFrozen - amountNum;
      const newPublisherExpense = publisherExpense + amountNum;
      
      console.log('更新发布者: frozen_balance', publisherFrozen, '->', newPublisherFrozen);
      
      await connection.execute(
        'UPDATE users SET frozen_balance = ?, total_expense = ? WHERE id = ?',
        [newPublisherFrozen, newPublisherExpense, publisherId]
      );

      // 更新骑手：增加余额和总收入
      const newRiderBalance = riderBalance + amountNum;
      const newRiderIncome = riderIncome + amountNum;
      
      console.log('更新骑手: balance', riderBalance, '->', newRiderBalance);
      
      await connection.execute(
        'UPDATE users SET balance = ?, total_income = ? WHERE id = ?',
        [newRiderBalance, newRiderIncome, riderId]
      );

      // 插入发布者的支出记录
      await connection.execute(
        `INSERT INTO wallet_transactions 
        (user_id, type, amount, balance_before, balance_after, title, description, order_id, status, created_at) 
        VALUES (?, 'expense', ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
        [publisherId, amountNum, publisherFrozen, newPublisherFrozen, '订单支付', `支付订单"${orderTitle}"的费用`, orderId]
      );

      // 插入骑手的收入记录
      await connection.execute(
        `INSERT INTO wallet_transactions 
        (user_id, type, amount, balance_before, balance_after, title, description, order_id, status, created_at) 
        VALUES (?, 'income', ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
        [riderId, amountNum, riderBalance, newRiderBalance, '订单收入', `完成订单"${orderTitle}"获得收入`, orderId]
      );

      await connection.commit();
      console.log('=== unfreezeAndTransfer 成功 ===');
      return { success: true, riderNewBalance: newRiderBalance };
    } catch (error) {
      console.error('unfreezeAndTransfer 错误:', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 解冻余额退还（取消订单时使用）
  static async unfreezeBalance(userId, amount, orderId, title, description) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 获取用户当前余额
      const [userRows] = await connection.execute(
        'SELECT balance, frozen_balance FROM users WHERE id = ? FOR UPDATE',
        [userId]
      );

      if (userRows.length === 0) {
        throw new Error('用户不存在');
      }

      const user = userRows[0];
      const currentBalance = parseFloat(user.balance) || 0;
      const currentFrozen = parseFloat(user.frozen_balance) || 0;
      const amountNum = parseFloat(amount);

      if (currentFrozen < amountNum) {
        throw new Error('冻结余额不足');
      }

      const newBalance = currentBalance + amountNum;
      const newFrozen = currentFrozen - amountNum;

      // 更新用户余额和冻结余额
      await connection.execute(
        'UPDATE users SET balance = ?, frozen_balance = ? WHERE id = ?',
        [newBalance, newFrozen, userId]
      );

      // 插入解冻交易记录
      await connection.execute(
        `INSERT INTO wallet_transactions 
        (user_id, type, amount, balance_before, balance_after, title, description, order_id, status, created_at) 
        VALUES (?, 'unfreeze', ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
        [userId, amountNum, currentBalance, newBalance, title, description || '', orderId]
      );

      await connection.commit();
      return { success: true, newBalance, newFrozen };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 检查用户余额是否足够
  static async checkBalance(userId, amount) {
    const [rows] = await db.execute(
      'SELECT balance FROM users WHERE id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return { sufficient: false, balance: 0, message: '用户不存在' };
    }
    
    const balance = parseFloat(rows[0].balance) || 0;
    const amountNum = parseFloat(amount);
    
    return {
      sufficient: balance >= amountNum,
      balance,
      required: amountNum,
      shortage: amountNum > balance ? amountNum - balance : 0
    };
  }
}

module.exports = User;
