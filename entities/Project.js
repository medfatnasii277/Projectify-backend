const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'in-progress', 'finished'], default: 'pending' },
  mainTasks: [
    {
      name: { type: String, required: true },
      subtasks: [{ type: String }],
    },
  ],
});

module.exports = mongoose.model('Project', ProjectSchema);
