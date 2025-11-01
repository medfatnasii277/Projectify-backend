const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const Project = require('../entities/Project');

const processPDF = async (pdfPath) => {
  try {
    // Read and parse the PDF
    const dataBuffer = fs.readFileSync(path.resolve(pdfPath));
    const pdfData = await pdfParse(dataBuffer);

    // Check if we got any text
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error('The PDF appears to be image-based or contains no extractable text. Please upload a text-based PDF.');
    }

    // Define the hidden prompt
    const prompt = `You are an AI assistant. Given the following text, extract a project structure in the exact JSON format below:
    {
      "title": "Project Title",
      "mainTasks": [
        {
          "name": "Main Task Name",
          "subtasks": ["Subtask 1", "Subtask 2"]
        }
      ]
    }
    Ensure all fields are included, even if they are empty. Text: ${pdfData.text}`;

    // Summarize and extract project structure using Gemini API with timeout
    const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY,
      },
      timeout: 30000, // 30 seconds timeout
    });

    console.log('Gemini API Response:', response.data);
    console.log('Gemini API Full Response:', JSON.stringify(response.data, null, 2));

    // Extract the project structure from the response
    const candidate = response.data.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0].text) {
      throw new Error('The response from Gemini API does not include a valid project structure.');
    }

    // Extract and parse the JSON
    const rawText = candidate.content.parts[0].text;
    const jsonText = rawText.replace(/```json|```/g, '').trim();
    const projectStructure = JSON.parse(jsonText);

    if (!projectStructure.title || !projectStructure.mainTasks) {
      throw new Error('The parsed project structure is missing required fields.');
    }

    return projectStructure; // Extracted project structure
  } catch (error) {
    console.error('Error processing PDF:', error);
    
    // Handle specific PDF parsing errors
    if (error.message.includes('Invalid PDF structure') || error.message.includes('Unknown compression method')) {
      throw new Error('The uploaded file is not a valid PDF or uses an unsupported format. Please try a different PDF file.');
    }
    
    // Handle empty text
    if (error.message.includes('image-based') || error.message.includes('no extractable text')) {
      throw error;
    }
    
    // Re-throw other errors
    throw error;
  }
};


const saveProject = async (projectData) => {
  try {
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
      }));
    }
    const project = new Project(projectData);
    await project.save();
    return project;
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};

module.exports = {
  processPDF,
  saveProject,
};
