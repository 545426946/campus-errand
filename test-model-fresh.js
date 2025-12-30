// 清除缓存
delete require.cache[require.resolve('./errand-back/src/models/CancelRequest')];
delete require.cache[require.resolve('./errand-back/src/config/database')];

const CancelRequest = require('./errand-back/src/models/CancelRequest');

console.log('CancelRequest:', CancelRequest);
console.log('CancelRequest.create:', typeof CancelRequest.create);
console.log('CancelRequest.findByOrderId:', typeof CancelRequest.findByOrderId);
console.log('所有方法:', Object.getOwnPropertyNames(CancelRequest));
