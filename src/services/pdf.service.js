const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

class PDFService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }

  /**
   * Process PDF file and extract text
   */
  async processPDF(pdfPath) {
    try {
      // Read and parse the PDF
      const dataBuffer = fs.readFileSync(path.resolve(pdfPath));
      const pdfData = await pdfParse(dataBuffer);

      // Check if we got any text
      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          ERROR_MESSAGES.PDF_NO_TEXT
        );
      }

      logger.info(`PDF parsed successfully. Text length: ${pdfData.text.length}`);
      return pdfData.text;
    } catch (error) {
      logger.error('Error parsing PDF:', error);
      
      if (error instanceof ApiError) throw error;
      
      // Handle specific PDF parsing errors
      if (error.message.includes('Invalid PDF structure') || 
          error.message.includes('Unknown compression method')) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'The uploaded file is not a valid PDF or uses an unsupported format'
        );
      }
      
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PDF_PARSING_FAILED
      );
    }
  }

  /**
   * Extract project structure from text using Gemini AI
   */
  async extractProjectStructure(text) {
    try {
      const prompt = `You are an AI assistant. Given the following text, extract a project structure in the exact JSON format below:
      {
        "title": "Project Title",
        "description": "Brief project description",
        "mainTasks": [
          {
            "name": "Main Task Name",
            "description": "Task description",
            "subtasks": [
              {
                "name": "Subtask 1"
              }
            ]
          }
        ]
      }
      Ensure all fields are included. Extract meaningful task and subtask names from the content.
      
      Text: ${text}`;

      const response = await axios.post(
        this.geminiApiUrl,
        {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': this.geminiApiKey,
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      logger.info('Gemini API response received');

      // Extract the project structure from the response
      const candidate = response.data.candidates?.[0];
      if (!candidate?.content?.parts?.[0]?.text) {
        throw new ApiError(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_MESSAGES.AI_INVALID_RESPONSE
        );
      }

      // Extract and parse the JSON
      const rawText = candidate.content.parts[0].text;
      const jsonText = rawText.replace(/```json|```/g, '').trim();
      const projectStructure = JSON.parse(jsonText);

      // Validate required fields
      if (!projectStructure.title || !projectStructure.mainTasks) {
        throw new ApiError(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          'The parsed project structure is missing required fields'
        );
      }

      logger.info(`Project structure extracted: ${projectStructure.title}`);
      return projectStructure;
    } catch (error) {
      logger.error('Error extracting project structure:', error);
      
      if (error instanceof ApiError) throw error;
      
      // Handle Gemini API errors
      if (error.response) {
        logger.error('Gemini API error response:', error.response.data);
      }
      
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.AI_SERVICE_ERROR
      );
    }
  }

  /**
   * Normalize project data before saving
   */
  normalizeProjectData(projectData) {
    // Ensure mainTasks and subtasks have all required fields
    if (Array.isArray(projectData.mainTasks)) {
      projectData.mainTasks = projectData.mainTasks.map((task) => ({
        name: task.name,
        description: task.description || '',
        status: task.status || 'not-started',
        priority: task.priority || 'medium',
        subtasks: Array.isArray(task.subtasks)
          ? task.subtasks.map((sub) =>
              typeof sub === 'string'
                ? {
                    name: sub,
                    description: '',
                    status: 'not-started',
                    priority: 'medium',
                  }
                : {
                    name: sub.name,
                    description: sub.description || '',
                    status: sub.status || 'not-started',
                    priority: sub.priority || 'medium',
                  }
            )
          : [],
        comments: task.comments || [],
      }));
    }

    return projectData;
  }

  /**
   * Process PDF and extract project structure
   */
  async processAndExtract(pdfPath) {
    try {
      // Extract text from PDF
      const text = await this.processPDF(pdfPath);
      
      // Extract project structure using AI
      const projectStructure = await this.extractProjectStructure(text);
      
      // Normalize the data
      const normalizedData = this.normalizeProjectData(projectStructure);
      
      return normalizedData;
    } catch (error) {
      logger.error('Error in processAndExtract:', error);
      throw error;
    }
  }

  /**
   * Clean up uploaded file
   */
  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      logger.error(`Error cleaning up file ${filePath}:`, error);
    }
  }
}

module.exports = new PDFService();
