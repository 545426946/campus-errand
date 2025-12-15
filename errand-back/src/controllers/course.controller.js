const Course = require('../models/Course');

exports.getAllCourses = async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const courses = await Course.find(filter)
      .populate('instructor', 'username email')
      .sort('-createdAt');

    res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'username email profile')
      .populate('enrolledStudents', 'username email');

    if (!course) {
      return res.status(404).json({ success: false, error: '课程不存在' });
    }

    res.json({ success: true, course });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    req.body.instructor = req.user.id;
    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, error: '课程不存在' });
    }

    res.json({ success: true, course });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, error: '课程不存在' });
    }

    if (course.enrolledStudents.includes(req.user.id)) {
      return res.status(400).json({ success: false, error: '已经报名该课程' });
    }

    course.enrolledStudents.push(req.user.id);
    await course.save();

    res.json({ success: true, message: '报名成功', course });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
