const mongoose = require('mongoose');

let Todo = mongoose.model('Todo', {
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 4
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 8
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  reminder: {
    type: Date,
    default: null
  }
});

module.exports = { Todo }