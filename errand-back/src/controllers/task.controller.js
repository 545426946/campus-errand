const Task = require('../models/Task');

exports.getAllTasks = async (req, res) => {
  try {
    const { type, status, priority } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (req.user.role === 'student') {
      filter.assignedTo = req.user.id;
    }

    const tasks = await Task.find(filter)
      .populate('creator', 'username email')
      .populate('courseId', 'title')
      .sort('-createdAt');

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
    const task = await Task.findById(req.params.id)
      .populate('creator', 'username email')
      .populate('assignedTo', 'username email')
      .populate('courseId', 'title');

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
    req.body.creator = req.user.id;
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
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }

    const submission = {
      userId: req.user.id,
      content: req.body.content,
      files: req.body.files || [],
      submittedAt: Date.now()
    };

    task.submissions.push(submission);
    await task.save();

    res.json({ success: true, message: '提交成功', task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
