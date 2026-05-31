const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');
const { protect } = require('../middleware/auth');

// Apply protection to all todo routes
router.use(protect);

// @desc    Get all todos for the current user
// @route   GET /api/todos
// @access  Private
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user._id }).sort({ dueDate: 1 });
    res.json({
      success: true,
      count: todos.length,
      data: todos
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
});

// @desc    Create a new todo
// @route   POST /api/todos
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { title, dueDate } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both a title and a due date'
      });
    }

    const todo = await Todo.create({
      user: req.user._id,
      title,
      dueDate,
      completed: false,
      reminderTriggered: false
    });

    res.status(201).json({
      success: true,
      data: todo
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
});

// @desc    Update a todo
// @route   PUT /api/todos/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { title, completed, dueDate } = req.body;

    let todo = await Todo.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    if (title !== undefined) todo.title = title;
    if (completed !== undefined) {
      todo.completed = completed;
      // If marked as uncompleted, reset reminderTriggered
      if (!completed) todo.reminderTriggered = false;
    }
    if (dueDate !== undefined) {
      todo.dueDate = dueDate;
      // Reset reminderTriggered for updated due dates
      todo.reminderTriggered = false;
    }

    await todo.save();

    res.json({
      success: true,
      data: todo
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
});

// @desc    Delete a todo
// @route   DELETE /api/todos/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
});

module.exports = router;
