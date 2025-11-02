// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Project Status
const PROJECT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
};

// Task Status
const TASK_STATUS = {
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
};

// Priority Levels
const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

// Error Messages
const ERROR_MESSAGES = {
  // General
  INTERNAL_SERVER_ERROR: 'Internal server error occurred',
  VALIDATION_ERROR: 'Validation error',
  
  // Project
  PROJECT_NOT_FOUND: 'Project not found',
  PROJECT_CREATION_FAILED: 'Failed to create project',
  PROJECT_UPDATE_FAILED: 'Failed to update project',
  PROJECT_DELETE_FAILED: 'Failed to delete project',
  
  // Task
  TASK_NOT_FOUND: 'Task not found',
  INVALID_TASK_INDEX: 'Invalid task index',
  
  // Subtask
  SUBTASK_NOT_FOUND: 'Subtask not found',
  INVALID_SUBTASK_INDEX: 'Invalid subtask index',
  
  // Comment
  COMMENT_CREATION_FAILED: 'Failed to create comment',
  
  // File Upload
  NO_FILE_UPLOADED: 'No file was uploaded',
  INVALID_FILE_TYPE: 'Invalid file type. Only PDF files are allowed',
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  PDF_PARSING_FAILED: 'Failed to parse PDF file',
  PDF_NO_TEXT: 'The PDF appears to be image-based or contains no extractable text',
  
  // AI Service
  AI_SERVICE_ERROR: 'Error processing with AI service',
  AI_INVALID_RESPONSE: 'Invalid response from AI service',
};

// Success Messages
const SUCCESS_MESSAGES = {
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_UPDATED: 'Project updated successfully',
  PROJECT_DELETED: 'Project deleted successfully',
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  TASK_DELETED: 'Task deleted successfully',
  SUBTASK_CREATED: 'Subtask created successfully',
  SUBTASK_UPDATED: 'Subtask updated successfully',
  SUBTASK_DELETED: 'Subtask deleted successfully',
  COMMENT_CREATED: 'Comment created successfully',
};

module.exports = {
  HTTP_STATUS,
  PROJECT_STATUS,
  TASK_STATUS,
  PRIORITY,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
