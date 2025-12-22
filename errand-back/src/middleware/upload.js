const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
const avatarDir = path.join(uploadDir, 'avatars');
const orderDir = path.join(uploadDir, 'orders');

[uploadDir, avatarDir, orderDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据上传类型选择目录
    const uploadType = req.body.type || req.query.type || 'orders';
    const dir = uploadType === 'avatar' ? avatarDir : orderDir;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳-随机数.扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 只允许图片格式
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('只支持图片格式 (jpeg, jpg, png, gif, webp)'));
  }
};

// 创建 multer 实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制 5MB
  },
  fileFilter: fileFilter
});

module.exports = {
  uploadSingle: upload.single('image'),
  uploadMultiple: upload.array('images', 9), // 最多9张图片
  uploadAvatar: upload.single('avatar')
};
