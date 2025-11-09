const express = require('express');
const multer = require('multer');
const projectController = require('../controllers/project.controller');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
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
} = require('../validators/project.validator');
const serverConfig = require('../config/server');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: serverConfig.upload.uploadDir,
  limits: {
    fileSize: serverConfig.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (serverConfig.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
    }
  },
});

// Upload route - MUST be before protect middleware
router.post(
  '/upload',
  protect,
  upload.single('pdf'),
  projectController.uploadProject
);

// Protect all other routes
router.use(protect);

// Project routes - GET all projects
router.get(
  '/',
  paginationValidator,
  validate,
  projectController.getAllProjects
);

// Create new project manually
router.post(
  '/',
  createProjectValidator,
  validate,
  projectController.createProject
);

// Get project by ID - MUST be after /upload to avoid matching it
router.get(
  '/:id',
  projectIdValidator,
  validate,
  projectController.getProjectById
);

router.put(
  '/:id',
  updateProjectValidator,
  validate,
  projectController.updateProject
);

router.delete(
  '/:id',
  projectIdValidator,
  validate,
  projectController.deleteProject
);

// Main task routes
router.post(
  '/:projectId/mainTasks',
  createTaskValidator,
  validate,
  projectController.addMainTask
);

router.put(
  '/:projectId/mainTasks/:mainTaskIndex',
  updateTaskValidator,
  validate,
  projectController.updateMainTask
);

router.delete(
  '/:projectId/mainTasks/:mainTaskIndex',
  taskIndexValidator,
  validate,
  projectController.deleteMainTask
);

// Subtask routes
router.post(
  '/:projectId/mainTasks/:mainTaskIndex/subtasks',
  createSubtaskValidator,
  validate,
  projectController.addSubtask
);

router.put(
  '/:projectId/mainTasks/:mainTaskIndex/subtasks/:subtaskIndex',
  updateSubtaskValidator,
  validate,
  projectController.updateSubtask
);

router.delete(
  '/:projectId/mainTasks/:mainTaskIndex/subtasks/:subtaskIndex',
  subtaskIndexValidator,
  validate,
  projectController.deleteSubtask
);

// Comment routes for main tasks
router.post(
  '/:projectId/mainTasks/:mainTaskIndex/comments',
  taskIndexValidator,
  createCommentValidator,
  validate,
  projectController.addCommentToTask
);

router.get(
  '/:projectId/mainTasks/:mainTaskIndex/comments',
  taskIndexValidator,
  validate,
  projectController.getTaskComments
);

// Comment routes for subtasks
router.post(
  '/:projectId/mainTasks/:mainTaskIndex/subtasks/:subtaskIndex/comments',
  subtaskIndexValidator,
  createCommentValidator,
  validate,
  projectController.addCommentToSubtask
);

router.get(
  '/:projectId/mainTasks/:mainTaskIndex/subtasks/:subtaskIndex/comments',
  subtaskIndexValidator,
  validate,
  projectController.getSubtaskComments
);

module.exports = router;
