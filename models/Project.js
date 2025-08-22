const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  mainTasks: [
    {
      name: { type: String, required: true },
      subtasks: [{ type: String }],
    },
  ],
});

module.exports = mongoose.model('Project', ProjectSchema);
