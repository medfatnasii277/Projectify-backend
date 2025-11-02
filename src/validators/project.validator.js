const { body, param, query } = require('express-validator');
const { PROJECT_STATUS, TASK_STATUS, PRIORITY } = require('../utils/constants');

// Project validators
const createProjectValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Project title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  
  body('status')
    .optional()
    .isIn(Object.values(PROJECT_STATUS))
    .withMessage('Invalid project status'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
];

const updateProjectValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid project ID'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  
  body('status')
    .optional()
    .isIn(Object.values(PROJECT_STATUS))
    .withMessage('Invalid project status'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
];

const projectIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid project ID'),
];

// Task validators
const createTaskValidator = [
  param('projectId')
    .isMongoId()
    .withMessage('Invalid project ID'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Task name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Task name must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('status')
    .optional()
    .isIn(Object.values(TASK_STATUS))
    .withMessage('Invalid task status'),
  
  body('priority')
    .optional()
    .isIn(Object.values(PRIORITY))
    .withMessage('Invalid priority level'),
];

const updateTaskValidator = [
  param('projectId')
    .isMongoId()
    .withMessage('Invalid project ID'),
  
  param('mainTaskIndex')
    .isInt({ min: 0 })
    .withMessage('Invalid task index'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Task name must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('status')
    .optional()
    .isIn(Object.values(TASK_STATUS))
    .withMessage('Invalid task status'),
  
  body('priority')
    .optional()
    .isIn(Object.values(PRIORITY))
    .withMessage('Invalid priority level'),
];

const taskIndexValidator = [
  param('projectId')
    .isMongoId()
    .withMessage('Invalid project ID'),
  
  param('mainTaskIndex')
    .isInt({ min: 0 })
    .withMessage('Invalid task index'),
];

// Subtask validators
const createSubtaskValidator = [
  param('projectId')
    .isMongoId()
    .withMessage('Invalid project ID'),
  
  param('mainTaskIndex')
    .isInt({ min: 0 })
    .withMessage('Invalid task index'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Subtask name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Subtask name must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('status')
    .optional()
    .isIn(Object.values(TASK_STATUS))
    .withMessage('Invalid subtask status'),
  
  body('priority')
    .optional()
    .isIn(Object.values(PRIORITY))
    .withMessage('Invalid priority level'),
];

const updateSubtaskValidator = [
  param('projectId')
    .isMongoId()
    .withMessage('Invalid project ID'),
  
  param('mainTaskIndex')
    .isInt({ min: 0 })
    .withMessage('Invalid task index'),
  
  param('subtaskIndex')
    .isInt({ min: 0 })
    .withMessage('Invalid subtask index'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Subtask name must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('status')
    .optional()
    .isIn(Object.values(TASK_STATUS))
    .withMessage('Invalid subtask status'),
  
  body('priority')
    .optional()
    .isIn(Object.values(PRIORITY))
    .withMessage('Invalid priority level'),
];

const subtaskIndexValidator = [
  param('projectId')
    .isMongoId()
    .withMessage('Invalid project ID'),
  
  param('mainTaskIndex')
    .isInt({ min: 0 })
    .withMessage('Invalid task index'),
  
  param('subtaskIndex')
    .isInt({ min: 0 })
    .withMessage('Invalid subtask index'),
];

// Comment validators
const createCommentValidator = [
  body('author')
    .trim()
    .notEmpty()
    .withMessage('Author name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
];

// Pagination validators
const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

module.exports = {
  createProjectValidator,
  updateProjectValidator,
  projectIdValidator,
  createTaskValidator,
  updateTaskValidator,
  taskIndexValidator,
  createSubtaskValidator,
  updateSubtaskValidator,
  subtaskIndexValidator,
  createCommentValidator,
  paginationValidator,
};
