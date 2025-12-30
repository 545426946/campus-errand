const CancelRequest = require('./src/models/CancelRequest');

console.log('CancelRequest:', CancelRequest);
console.log('CancelRequest.create:', typeof CancelRequest.create);
console.log('CancelRequest.findByOrderId:', typeof CancelRequest.findByOrderId);
console.log('所有方法:', Object.getOwnPropertyNames(CancelRequest));
