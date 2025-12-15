const Task = require('../models/Task');

exports.getAllTasks = async (req, res) => {
  try {
    const { type, status, priority } = req.query;
    const filters = { type, status, priority };

    if (req.user.role === 'student') {
      filters.userId = req.user.id;
      filters.userRole = 'student';
    }

    const tasks = await Task.findAll(filters);

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }

    res.json({ success: true, task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    req.body.creator_id = req.user.id;
    const task = await Task.create(req.body);

    res.status(201).json({
      success: true,
      task
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.submitTask = async (req, res) => {
  try {
    const submission = await Task.submit(req.params.id, req.user.id, req.body);

    res.json({ success: true, message: '提交成功', submission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
