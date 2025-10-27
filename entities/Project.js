const mongoose = require('mongoose');


const CommentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'in-progress', 'finished'], default: 'pending' },
  mainTasks: [
    {
      name: { type: String, required: true },
      description: { type: String, default: '' },
      status: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started' },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      comments: [CommentSchema],
      subtasks: [
        {
          name: { type: String, required: true },
          description: { type: String, default: '' },
          status: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started' },
          priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
          comments: [CommentSchema],
        }
      ],
    },
  ],
});

module.exports = mongoose.model('Project', ProjectSchema);
