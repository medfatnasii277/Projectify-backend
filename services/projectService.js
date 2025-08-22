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

    // Summarize and extract project structure using Gemini API
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
    throw error;
  }
};

const saveProject = async (projectData) => {
  try {
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
