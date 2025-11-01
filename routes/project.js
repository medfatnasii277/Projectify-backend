const express = require('express');
 const router = express.Router();
const Project = require('../entities/Project');
const { processPDF, saveProject } = require('../services/projectService');
const multer = require('multer');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });

// Add a comment to a main task
router.post('/:projectId/mainTasks/:mainTaskIndex/comments', async (req, res) => {
  try {
    const { projectId, mainTaskIndex } = req.params;
    const { author, content } = req.body;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const idx = parseInt(mainTaskIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= project.mainTasks.length) {
      return res.status(400).json({ message: 'Invalid mainTaskIndex' });
    }
    const newComment = { author, content };
    project.mainTasks[idx].comments.push(newComment);
    await project.save();
    res.status(201).json(project.mainTasks[idx].comments);
  } catch (error) {
    console.error('Error adding comment to main task:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Add a comment to a subtask
router.post('/:projectId/mainTasks/:mainTaskIndex/subtasks/:subtaskIndex/comments', async (req, res) => {
  try {
    const { projectId, mainTaskIndex, subtaskIndex } = req.params;
    const { author, content } = req.body;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const mIdx = parseInt(mainTaskIndex, 10);
    const sIdx = parseInt(subtaskIndex, 10);
    if (
      isNaN(mIdx) || mIdx < 0 || mIdx >= project.mainTasks.length ||
      isNaN(sIdx) || sIdx < 0 || sIdx >= project.mainTasks[mIdx].subtasks.length
    ) {
      return res.status(400).json({ message: 'Invalid mainTaskIndex or subtaskIndex' });
    }
    const newComment = { author, content };
    project.mainTasks[mIdx].subtasks[sIdx].comments.push(newComment);
    await project.save();
    res.status(201).json(project.mainTasks[mIdx].subtasks[sIdx].comments);
  } catch (error) {
    console.error('Error adding comment to subtask:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Get comments for a main task
router.get('/:projectId/mainTasks/:mainTaskIndex/comments', async (req, res) => {
  try {
    const { projectId, mainTaskIndex } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const idx = parseInt(mainTaskIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= project.mainTasks.length) {
      return res.status(400).json({ message: 'Invalid mainTaskIndex' });
    }
    res.status(200).json(project.mainTasks[idx].comments);
  } catch (error) {
    console.error('Error getting comments for main task:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Get comments for a subtask
router.get('/:projectId/mainTasks/:mainTaskIndex/subtasks/:subtaskIndex/comments', async (req, res) => {
  try {
    const { projectId, mainTaskIndex, subtaskIndex } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const mIdx = parseInt(mainTaskIndex, 10);
    const sIdx = parseInt(subtaskIndex, 10);
    if (
      isNaN(mIdx) || mIdx < 0 || mIdx >= project.mainTasks.length ||
      isNaN(sIdx) || sIdx < 0 || sIdx >= project.mainTasks[mIdx].subtasks.length
    ) {
      return res.status(400).json({ message: 'Invalid mainTaskIndex or subtaskIndex' });
    }
    res.status(200).json(project.mainTasks[mIdx].subtasks[sIdx].comments);
  } catch (error) {
    console.error('Error getting comments for subtask:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});
// Add a subtask to a main task
router.post('/:projectId/mainTasks/:mainTaskIndex/subtasks', async (req, res) => {
  try {
    const { projectId, mainTaskIndex } = req.params;
    const { name, description, status, priority } = req.body;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const idx = parseInt(mainTaskIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= project.mainTasks.length) {
      return res.status(400).json({ message: 'Invalid mainTaskIndex' });
    }
    const newSubtask = {
      name,
      description: description || '',
      status: status || 'not-started',
      priority: priority || 'medium',
    };
    project.mainTasks[idx].subtasks.push(newSubtask);
    await project.save();
    res.status(201).json(project.mainTasks[idx].subtasks);
  } catch (error) {
    console.error('Error adding subtask:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Remove a subtask from a main task
router.delete('/:projectId/mainTasks/:mainTaskIndex/subtasks/:subtaskIndex', async (req, res) => {
  try {
    const { projectId, mainTaskIndex, subtaskIndex } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const mIdx = parseInt(mainTaskIndex, 10);
    const sIdx = parseInt(subtaskIndex, 10);
    if (
      isNaN(mIdx) || mIdx < 0 || mIdx >= project.mainTasks.length ||
      isNaN(sIdx) || sIdx < 0 || sIdx >= project.mainTasks[mIdx].subtasks.length
    ) {
      return res.status(400).json({ message: 'Invalid mainTaskIndex or subtaskIndex' });
    }
    project.mainTasks[mIdx].subtasks.splice(sIdx, 1);
    await project.save();
    res.status(200).json(project.mainTasks[mIdx].subtasks);
  } catch (error) {
    console.error('Error removing subtask:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Create project from PDF
router.put('/:projectId/mainTasks/:mainTaskIndex', async (req, res) => {
  try {
    const { projectId, mainTaskIndex } = req.params;
    const { name, description, status, priority } = req.body;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const idx = parseInt(mainTaskIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= project.mainTasks.length) {
      return res.status(400).json({ message: 'Invalid mainTaskIndex' });
    }
    if (name !== undefined) project.mainTasks[idx].name = name;
    if (description !== undefined) project.mainTasks[idx].description = description;
    if (status !== undefined) project.mainTasks[idx].status = status;
    if (priority !== undefined) project.mainTasks[idx].priority = priority;
    await project.save();
    res.status(200).json(project.mainTasks[idx]);
  } catch (error) {
    console.error('Error updating main task:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Update a subtask by index
router.put('/:projectId/mainTasks/:mainTaskIndex/subtasks/:subtaskIndex', async (req, res) => {
  try {
    const { projectId, mainTaskIndex, subtaskIndex } = req.params;
    const { name, description, status, priority } = req.body;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const mIdx = parseInt(mainTaskIndex, 10);
    const sIdx = parseInt(subtaskIndex, 10);
    if (
      isNaN(mIdx) || mIdx < 0 || mIdx >= project.mainTasks.length ||
      isNaN(sIdx) || sIdx < 0 || sIdx >= project.mainTasks[mIdx].subtasks.length
    ) {
      return res.status(400).json({ message: 'Invalid mainTaskIndex or subtaskIndex' });
    }
    if (name !== undefined) project.mainTasks[mIdx].subtasks[sIdx].name = name;
    if (description !== undefined) project.mainTasks[mIdx].subtasks[sIdx].description = description;
    if (status !== undefined) project.mainTasks[mIdx].subtasks[sIdx].status = status;
    if (priority !== undefined) project.mainTasks[mIdx].subtasks[sIdx].priority = priority;
    await project.save();
    res.status(200).json(project.mainTasks[mIdx].subtasks[sIdx]);
  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Delete a main task by index
router.delete('/:projectId/mainTasks/:mainTaskIndex', async (req, res) => {
  try {
    const { projectId, mainTaskIndex } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const idx = parseInt(mainTaskIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= project.mainTasks.length) {
      return res.status(400).json({ message: 'Invalid mainTaskIndex' });
    }
    project.mainTasks.splice(idx, 1);
    await project.save();
    res.status(200).json({ message: 'Main task deleted successfully' });
  } catch (error) {
    console.error('Error deleting main task:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const projectStructure = await processPDF(req.file.path);
    const project = await saveProject(projectStructure);
    fs.unlinkSync(req.file.path);
    res.status(200).json({ message: 'Project saved successfully', project });
  } catch (error) {
    console.error('Error processing upload:', error);
    
    // Handle specific PDF parsing errors
    if (error.message.includes('Invalid PDF structure') || 
        error.message.includes('Unknown compression method') ||
        error.message.includes('not a valid PDF') ||
        error.message.includes('unsupported format')) {
      return res.status(400).json({ message: error.message });
    }
    
    // Handle Gemini API errors
    if (error.message.includes('Gemini API')) {
      return res.status(500).json({ message: 'Error processing with AI service. Please try again.' });
    }
    
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Delete project by ID
router.delete('/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Update project (description, status)
router.put('/:id', async (req, res) => {
  try {
    const { description, status } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: { description, status } },
      { new: true }
    );
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

module.exports = router;
