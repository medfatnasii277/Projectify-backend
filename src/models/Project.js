const mongoose = require('mongoose');
const { PROJECT_STATUS, TASK_STATUS, PRIORITY } = require('../utils/constants');

const CommentSchema = new mongoose.Schema({
  author: { 
    type: String, 
    required: [true, 'Comment author is required'],
    trim: true,
  },
  content: { 
    type: String, 
    required: [true, 'Comment content is required'],
    trim: true,
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
  },
}, { _id: true });

const SubtaskSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Subtask name is required'],
    trim: true,
  },
  description: { 
    type: String, 
    default: '',
    trim: true,
  },
  status: { 
    type: String, 
    enum: Object.values(TASK_STATUS), 
    default: TASK_STATUS.NOT_STARTED,
  },
  priority: { 
    type: String, 
    enum: Object.values(PRIORITY), 
    default: PRIORITY.MEDIUM,
  },
  comments: [CommentSchema],
}, { _id: true, timestamps: true });

const MainTaskSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Task name is required'],
    trim: true,
  },
  description: { 
    type: String, 
    default: '',
    trim: true,
  },
  status: { 
    type: String, 
    enum: Object.values(TASK_STATUS), 
    default: TASK_STATUS.NOT_STARTED,
  },
  priority: { 
    type: String, 
    enum: Object.values(PRIORITY), 
    default: PRIORITY.MEDIUM,
  },
  comments: [CommentSchema],
  subtasks: [SubtaskSchema],
}, { _id: true, timestamps: true });

const ProjectSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Project title is required'],
    trim: true,
    index: true,
  },
  description: { 
    type: String, 
    default: '',
    trim: true,
  },
  status: { 
    type: String, 
    enum: Object.values(PROJECT_STATUS), 
    default: PROJECT_STATUS.IN_PROGRESS,
    index: true,
  },
  dueDate: { 
    type: Date,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project creator is required'],
    index: true,
  },
  mainTasks: [MainTaskSchema],
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ title: 'text', description: 'text' });

// Virtual for task completion percentage
ProjectSchema.virtual('completionPercentage').get(function() {
  if (!this.mainTasks || this.mainTasks.length === 0) return 0;
  
  const completedTasks = this.mainTasks.filter(
    task => task.status === TASK_STATUS.COMPLETED
  ).length;
  
  return Math.round((completedTasks / this.mainTasks.length) * 100);
});

// Pre-save middleware to auto-update status based on completion
ProjectSchema.pre('save', function(next) {
  if (this.mainTasks && this.mainTasks.length > 0) {
    const allCompleted = this.mainTasks.every(
      task => task.status === TASK_STATUS.COMPLETED
    );
    
    if (allCompleted && this.status !== PROJECT_STATUS.COMPLETED) {
      this.status = PROJECT_STATUS.COMPLETED;
    }
  }
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
