const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple user data
const mockUsers = [
  {
    id: 15,
    username: 'user15',
    balance: 30.00,
    frozen: 0.00,
    total: 30.00
  }
];

let walletTransactions = [];

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.query.token || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null);
  
  if (token && token.startsWith('demo_token_')) {
    const userId = parseInt(token.split('_')[2]) || 15;
    req.user = { id: userId, username: `user${userId}` };
    req.token = token;
  } else {
    req.user = { id: 15, username: 'user15' };
    req.token = 'demo_token_15';
  }
  
  next();
};

// Wallet info
app.get('/api/user/wallet', authMiddleware, (req, res) => {
  const user = mockUsers.find(u => u.id === req.user.id) || mockUsers[0];
  const total = (user.balance || 0) + (user.frozen || 0);
  
  res.json({
    success: true,
    data: {
      balance: parseFloat(user.balance || 0),
      frozen: parseFloat(user.frozen || 0),
      total: parseFloat(total)
    }
  });
});

// Wallet recharge
app.post('/api/user/wallet/recharge', authMiddleware, (req, res) => {
  const { amount, paymentMethod } = req.body;
  const rechargeAmount = parseFloat(amount);
  
  if (!rechargeAmount || rechargeAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid amount'
    });
  }
  
  const userIndex = mockUsers.findIndex(u => u.id === req.user.id);
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const user = mockUsers[userIndex];
  const oldBalance = parseFloat(user.balance || 0);
  const newBalance = oldBalance + rechargeAmount;
  
  // Update user balance
  mockUsers[userIndex].balance = newBalance;
  mockUsers[userIndex].total = parseFloat(mockUsers[userIndex].total || 0) + rechargeAmount;
  
  // Create transaction record
  const transaction = {
    id: Date.now(),
    user_id: req.user.id,
    type: 'recharge',
    amount: rechargeAmount,
    balance_before: oldBalance,
    balance_after: newBalance,
    description: 'WeChat recharge',
    order_id: 'R' + Date.now(),
    status: 'success',
    created_at: new Date().toISOString()
  };
  
  walletTransactions.unshift(transaction);
  
  console.log('Recharge completed:', {
    userId: req.user.id,
    oldBalance,
    rechargeAmount,
    newBalance
  });
  
  res.json({
    success: true,
    data: {
      transaction_id: transaction.id,
      order_id: transaction.order_id,
      amount: rechargeAmount,
      balance_before: oldBalance,
      balance_after: newBalance,
      paymentMethod: paymentMethod || 'wechat',
      status: 'success',
      message: 'Recharge successful'
    }
  });
});

// Wallet details
app.get('/api/user/wallet/details', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  
  const userTransactions = walletTransactions.filter(t => t.user_id === req.user.id);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedTransactions = userTransactions.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      list: paginatedTransactions,
      total: userTransactions.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server started successfully!');
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://192.168.1.161:${PORT}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
});

module.exports = app;