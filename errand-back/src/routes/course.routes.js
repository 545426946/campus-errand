const express = require('express');
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  enrollCourse
} = require('../controllers/course.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllCourses);
router.get('/:id', getCourse);

router.use(protect);

router.post('/', authorize('teacher', 'admin'), createCourse);
router.put('/:id', authorize('teacher', 'admin'), updateCourse);
router.post('/:id/enroll', enrollCourse);

module.exports = router;
