const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const error = {
    message: err.message || '服务器错误',
    statusCode: err.statusCode || 500
  };

  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(e => e.message).join(', ');
    error.statusCode = 400;
  }

  if (err.code === 11000) {
    error.message = '该数据已存在';
    error.statusCode = 400;
  }

  if (err.name === 'JsonWebTokenError') {
    error.message = 'Token无效';
    error.statusCode = 401;
  }

  res.status(error.statusCode).json({
    success: false,
    error: error.message
  });
};

module.exports = errorHandler;
