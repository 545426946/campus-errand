const Course = require('../models/Course');

exports.getAllCourses = async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;
    const filters = { category, difficulty, search };

    const courses = await Course.findAll(filters);

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
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, error: '课程不存在' });
    }

    // 获取已报名学生
    const enrolledStudents = await Course.getEnrolledStudents(req.params.id);
    course.enrolledStudents = enrolledStudents;

    res.json({ success: true, course });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    req.body.instructor_id = req.user.id;
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
    const course = await Course.update(req.params.id, req.body);

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
    await Course.enroll(req.params.id, req.user.id);

    res.json({ success: true, message: '报名成功' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: '已经报名该课程' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};
