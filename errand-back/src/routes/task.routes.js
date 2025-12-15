const express = require('express');
const {
  getAllTasks,
  getTask,
  createTask,
  submitTask
} = require('../controllers/task.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAllTasks);
router.get('/:id', getTask);
router.post('/', authorize('teacher', 'admin'), createTask);
router.post('/:id/submit', submitTask);

module.exports = router;
