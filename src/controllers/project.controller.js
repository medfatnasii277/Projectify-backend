const projectService = require('../services/project.service');
const pdfService = require('../services/pdf.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { SUCCESS_MESSAGES } = require('../utils/constants');

class ProjectController {
  /**
   * @desc    Get all projects
   * @route   GET /api/projects
   * @access  Private
   */
  getAllProjects = asyncHandler(async (req, res) => {
    const { page, limit, status, sortBy, sortOrder } = req.query;
    
    const result = await projectService.getAllProjects(
      req.user.id,
      {},
      { page, limit, status, sortBy, sortOrder }
    );
    
    return ApiResponse.success(res, 'Projects retrieved successfully', result);
  });

  /**
   * @desc    Get project by ID
   * @route   GET /api/projects/:id
   * @access  Private
   */
  getProjectById = asyncHandler(async (req, res) => {
    const project = await projectService.getProjectById(req.params.id, req.user.id);
    return ApiResponse.success(res, 'Project retrieved successfully', project);
  });

  /**
   * @desc    Create new project from PDF
   * @route   POST /api/projects/upload
   * @access  Private
   */
  uploadProject = asyncHandler(async (req, res) => {
    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400);
    }

    try {
      // Process PDF and extract structure
      const projectData = await pdfService.processAndExtract(req.file.path);
      
      // Create project
      const project = await projectService.createProject(projectData, req.user.id);
      
      // Clean up uploaded file
      pdfService.cleanupFile(req.file.path);
      
      return ApiResponse.created(res, SUCCESS_MESSAGES.PROJECT_CREATED, project);
    } catch (error) {
      // Clean up file on error
      if (req.file) {
        pdfService.cleanupFile(req.file.path);
      }
      throw error;
    }
  });

  /**
   * @desc    Create new project manually
   * @route   POST /api/projects
   * @access  Private
   */
  createProject = asyncHandler(async (req, res) => {
    const project = await projectService.createProject(req.body, req.user.id);
    return ApiResponse.created(res, SUCCESS_MESSAGES.PROJECT_CREATED, project);
  });

  /**
   * @desc    Update project
   * @route   PUT /api/projects/:id
   * @access  Private
   */
  updateProject = asyncHandler(async (req, res) => {
    const project = await projectService.updateProject(req.params.id, req.body, req.user.id);
    return ApiResponse.success(res, SUCCESS_MESSAGES.PROJECT_UPDATED, project);
  });

  /**
   * @desc    Delete project
   * @route   DELETE /api/projects/:id
   * @access  Private
   */
  deleteProject = asyncHandler(async (req, res) => {
    const result = await projectService.deleteProject(req.params.id, req.user.id);
    return ApiResponse.success(res, result.message);
  });

  /**
   * @desc    Add main task to project
   * @route   POST /api/projects/:projectId/mainTasks
   * @access  Private
   */
  addMainTask = asyncHandler(async (req, res) => {
    const task = await projectService.addMainTask(req.params.projectId, req.body, req.user.id);
    return ApiResponse.created(res, SUCCESS_MESSAGES.TASK_CREATED, task);
  });

  /**
   * @desc    Update main task
   * @route   PUT /api/projects/:projectId/mainTasks/:mainTaskIndex
   * @access  Private
   */
  updateMainTask = asyncHandler(async (req, res) => {
    const { projectId, mainTaskIndex } = req.params;
    const task = await projectService.updateMainTask(
      projectId,
      parseInt(mainTaskIndex),
      req.body,
      req.user.id
    );
    return ApiResponse.success(res, SUCCESS_MESSAGES.TASK_UPDATED, task);
  });

  /**
   * @desc    Delete main task
   * @route   DELETE /api/projects/:projectId/mainTasks/:mainTaskIndex
   * @access  Private
   */
  deleteMainTask = asyncHandler(async (req, res) => {
    const { projectId, mainTaskIndex } = req.params;
    const result = await projectService.deleteMainTask(
      projectId,
      parseInt(mainTaskIndex),
      req.user.id
    );
    return ApiResponse.success(res, result.message);
  });

  /**
   * @desc    Add subtask to main task
   * @route   POST /api/projects/:projectId/mainTasks/:mainTaskIndex/subtasks
   * @access  Private
   */
  addSubtask = asyncHandler(async (req, res) => {
    const { projectId, mainTaskIndex } = req.params;
    const subtasks = await projectService.addSubtask(
      projectId,
      parseInt(mainTaskIndex),
      req.body,
      req.user.id
    );
    return ApiResponse.created(res, SUCCESS_MESSAGES.SUBTASK_CREATED, subtasks);
  });

  /**
   * @desc    Update subtask
   * @route   PUT /api/projects/:projectId/mainTasks/:mainTaskIndex/subtasks/:subtaskIndex
   * @access  Private
   */
  updateSubtask = asyncHandler(async (req, res) => {
    const { projectId, mainTaskIndex, subtaskIndex } = req.params;
    const subtask = await projectService.updateSubtask(
      projectId,
      parseInt(mainTaskIndex),
      parseInt(subtaskIndex),
      req.body,
      req.user.id
    );
    return ApiResponse.success(res, SUCCESS_MESSAGES.SUBTASK_UPDATED, subtask);
  });

  /**
   * @desc    Delete subtask
   * @route   DELETE /api/projects/:projectId/mainTasks/:mainTaskIndex/subtasks/:subtaskIndex
   * @access  Private
   */
  deleteSubtask = asyncHandler(async (req, res) => {
    const { projectId, mainTaskIndex, subtaskIndex } = req.params;
    const subtasks = await projectService.deleteSubtask(
      projectId,
      parseInt(mainTaskIndex),
      parseInt(subtaskIndex),
      req.user.id
    );
    return ApiResponse.success(res, SUCCESS_MESSAGES.SUBTASK_DELETED, subtasks);
  });

  /**
   * @desc    Add comment to main task
   * @route   POST /api/projects/:projectId/mainTasks/:mainTaskIndex/comments
   * @access  Private
   */
  addCommentToTask = asyncHandler(async (req, res) => {
    const { projectId, mainTaskIndex } = req.params;
    const comments = await projectService.addCommentToTask(
      projectId,
      parseInt(mainTaskIndex),
      req.body,
      req.user.id
    );
    return ApiResponse.created(res, SUCCESS_MESSAGES.COMMENT_CREATED, comments);
  });

  /**
   * @desc    Get comments for main task
   * @route   GET /api/projects/:projectId/mainTasks/:mainTaskIndex/comments
   * @access  Private
   */
  getTaskComments = asyncHandler(async (req, res) => {
    const { projectId, mainTaskIndex } = req.params;
    const comments = await projectService.getTaskComments(
      projectId,
      parseInt(mainTaskIndex),
      req.user.id
    );
    return ApiResponse.success(res, 'Comments retrieved successfully', comments);
  });

  /**
   * @desc    Add comment to subtask
   * @route   POST /api/projects/:projectId/mainTasks/:mainTaskIndex/subtasks/:subtaskIndex/comments
   * @access  Private
   */
  addCommentToSubtask = asyncHandler(async (req, res) => {
    const { projectId, mainTaskIndex, subtaskIndex } = req.params;
    const comments = await projectService.addCommentToSubtask(
      projectId,
      parseInt(mainTaskIndex),
      parseInt(subtaskIndex),
      req.body,
      req.user.id
    );
    return ApiResponse.created(res, SUCCESS_MESSAGES.COMMENT_CREATED, comments);
  });

  /**
   * @desc    Get comments for subtask
   * @route   GET /api/projects/:projectId/mainTasks/:mainTaskIndex/subtasks/:subtaskIndex/comments
   * @access  Private
   */
  getSubtaskComments = asyncHandler(async (req, res) => {
    const { projectId, mainTaskIndex, subtaskIndex } = req.params;
    const comments = await projectService.getSubtaskComments(
      projectId,
      parseInt(mainTaskIndex),
      parseInt(subtaskIndex),
      req.user.id
    );
    return ApiResponse.success(res, 'Comments retrieved successfully', comments);
  });
}

module.exports = new ProjectController();
