const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '请提供用户名'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, '请提供邮箱'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, '请提供有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '请提供密码'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  profile: {
    avatar: String,
    phone: String,
    studentId: String,
    major: String,
    grade: String
  },
  learningProgress: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    progress: {
      type: Number,
      default: 0
    },
    lastAccessed: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
