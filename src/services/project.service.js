const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');
const logger = require('../utils/logger');

class ProjectService {
  /**
   * Get all projects with pagination and filtering
   */
  async getAllProjects(userId, filters = {}, options = {}) {
    try {
      const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      
      const query = { createdBy: userId };
      if (status) {
        query.status = status;
      }
      
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
      
      const [projects, total] = await Promise.all([
        Project.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Project.countDocuments(query),
      ]);
      
      return {
        projects,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in getAllProjects:', error);
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId, userId) {
    try {
      const project = await Project.findOne({ _id: projectId, createdBy: userId }).lean();
      
      if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }
      
      return project;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error in getProjectById:', error);
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create a new project
   */
  async createProject(projectData, userId) {
    try {
      const project = new Project({
        ...projectData,
        createdBy: userId,
      });
      await project.save();
      
      logger.info(`Project created: ${project._id}`);
      return project.toObject();
    } catch (error) {
      logger.error('Error in createProject:', error);
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.PROJECT_CREATION_FAILED);
    }
  }

  /**
   * Update project
   */
  async updateProject(projectId, updateData, userId) {
    try {
      const project = await Project.findOne({ _id: projectId, createdBy: userId });
      
      if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }
      
      // Update fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          project[key] = updateData[key];
        }
      });
      
      await project.save();
      
      logger.info(`Project updated: ${project._id}`);
      return project.toObject();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error in updateProject:', error);
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.PROJECT_UPDATE_FAILED);
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId, userId) {
    try {
      const project = await Project.findOneAndDelete({ _id: projectId, createdBy: userId });
      
      if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }
      
      logger.info(`Project deleted: ${projectId}`);
      return { message: SUCCESS_MESSAGES.PROJECT_DELETED };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error in deleteProject:', error);
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.PROJECT_DELETE_FAILED);
    }
  }

  /**
   * Add main task to project
   */
  async addMainTask(projectId, taskData, userId) {
    try {
      const project = await Project.findOne({ _id: projectId, createdBy: userId });
      
      if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }
      
      project.mainTasks.push(taskData);
      await project.save();
      
      logger.info(`Task added to project: ${projectId}`);
      return project.mainTasks[project.mainTasks.length - 1].toObject();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error in addMainTask:', error);
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Failed to add task');
    }
  }

  /**
   * Update main task
   */
  async updateMainTask(projectId, mainTaskIndex, updateData, userId) {
    try {
      const project = await Project.findOne({ _id: projectId, createdBy: userId });
      
      if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }
      
      if (mainTaskIndex < 0 || mainTaskIndex >= project.mainTasks.length) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_TASK_INDEX);
      }
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          project.mainTasks[mainTaskIndex][key] = updateData[key];
        }
      });
      
      await project.save();
      
      logger.info(`Task updated in project: ${projectId}`);
      return project.mainTasks[mainTaskIndex].toObject();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error in updateMainTask:', error);
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Failed to update task');
    }
  }

  /**
   * Delete main task
   */
  async deleteMainTask(projectId, mainTaskIndex, userId) {
    try {
      const project = await Project.findOne({ _id: projectId, createdBy: userId });
      
      if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }
      
      if (mainTaskIndex < 0 || mainTaskIndex >= project.mainTasks.length) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_TASK_INDEX);
      }
      
      project.mainTasks.splice(mainTaskIndex, 1);
      await project.save();
      
      logger.info(`Task deleted from project: ${projectId}`);
      return { message: SUCCESS_MESSAGES.TASK_DELETED };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error in deleteMainTask:', error);
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to delete task');
    }
  }

  /**
   * Add subtask to main task
   */
  async addSubtask(projectId, mainTaskIndex, subtaskData, userId) {
    try {
      const project = await Project.findOne({ _id: projectId, createdBy: userId });
      
      if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }
      
      if (mainTaskIndex < 0 || mainTaskIndex >= project.mainTasks.length) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_TASK_INDEX);
      }
      
      project.mainTasks[mainTaskIndex].subtasks.push(subtaskData);
      await project.save();
      
      logger.info(`Subtask added to project: ${projectId}`);
      return project.mainTasks[mainTaskIndex].subtasks;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error in addSubtask:', error);
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Failed to add subtask');
    }
  }

  /**
   * Update subtask
   */
  async updateSubtask(projectId, mainTaskIndex, subtaskIndex, updateData, userId) {
    try {
      const project = await Project.findOne({ _id: projectId, createdBy: userId });
      
      if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }
      
      if (mainTaskIndex < 0 || mainTaskIndex >= project.mainTasks.length) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_TASK_INDEX);
      }
      
      const subtasks = project.mainTasks[mainTaskIndex].subtasks;
      if (subtaskIndex < 0 || subtaskIndex >= subtasks.length) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_SUBTASK_INDEX);
      }
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          subtasks[subtaskIndex][key] = updateData[key];
        }
      });
      
      await project.save();
      
      logger.info(`Subtask updated in project: ${projectId}`);
      return subtasks[subtaskIndex].toObject();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error in updateSubtask:', error);
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Failed to update subtask');
    }
  }

  /**
   * Delete subtask
   */
  async deleteSubtask(projectId, mainTaskIndex, subtaskIndex, userId) {
    try {
      const project = await Project.findOne({ _id: projectId, createdBy: userId });
      
      if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }
      
      if (mainTaskIndex < 0 || mainTaskIndex >= project.mainTasks.length) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_TASK_INDEX);
      }
      
      const subtasks = project.mainTasks[mainTaskIndex].subtasks;
      if (subtaskIndex < 0 || subtaskIndex >= subtasks.length) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_SUBTASK_INDEX);
      }
      
      subtasks.splice(subtaskIndex, 1);
      await project.save();
      
      logger.info(`Subtask deleted from project: ${projectId}`);
      return subtasks;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error in deleteSubtask:', error);
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to delete subtask');
    }
  }

  /**
   * Add comment to main task
   */
  async addCommentToTask(projectId, mainTaskIndex, commentData, userId) {
    try {
      const project = await Project.findOne({ _id: projectId, createdBy: userId });
      
      if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }
      
      if (mainTaskIndex < 0 || mainTaskIndex >= project.mainTasks.length) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_TASK_INDEX);
      }
      
      project.mainTasks[mainTaskIndex].comments.push(commentData);
      await project.save();
      
      logger.info(`Comment added to task in project: ${projectId}`);
      return project.mainTasks[mainTaskIndex].comments;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error in addCommentToTask:', error);
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.COMMENT_CREATION_FAILED);
    }
  }

  /**
   * Add comment to subtask
   */
  async addCommentToSubtask(projectId, mainTaskIndex, subtaskIndex, commentData, userId) {
    try {
      const project = await Project.findOne({ _id: projectId, createdBy: userId });
      
      if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }
      
      if (mainTaskIndex < 0 || mainTaskIndex >= project.mainTasks.length) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_TASK_INDEX);
      }
      
      const subtasks = project.mainTasks[mainTaskIndex].subtasks;
      if (subtaskIndex < 0 || subtaskIndex >= subtasks.length) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_SUBTASK_INDEX);
      }
      
      subtasks[subtaskIndex].comments.push(commentData);
      await project.save();
      
      logger.info(`Comment added to subtask in project: ${projectId}`);
      return subtasks[subtaskIndex].comments;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error in addCommentToSubtask:', error);
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.COMMENT_CREATION_FAILED);
    }
  }

  /**
   * Get comments for main task
   */
  async getTaskComments(projectId, mainTaskIndex, userId) {
    try {
      const project = await Project.findOne({ _id: projectId, createdBy: userId });
      
      if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }
      
      if (mainTaskIndex < 0 || mainTaskIndex >= project.mainTasks.length) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_TASK_INDEX);
      }
      
      return project.mainTasks[mainTaskIndex].comments;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error in getTaskComments:', error);
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to get comments');
    }
  }

  /**
   * Get comments for subtask
   */
  async getSubtaskComments(projectId, mainTaskIndex, subtaskIndex, userId) {
    try {
      const project = await Project.findOne({ _id: projectId, createdBy: userId });
      
      if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }
      
      if (mainTaskIndex < 0 || mainTaskIndex >= project.mainTasks.length) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_TASK_INDEX);
      }
      
      const subtasks = project.mainTasks[mainTaskIndex].subtasks;
      if (subtaskIndex < 0 || subtaskIndex >= subtasks.length) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_SUBTASK_INDEX);
      }
      
      return subtasks[subtaskIndex].comments;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error in getSubtaskComments:', error);
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to get comments');
    }
  }
}

module.exports = new ProjectService();
