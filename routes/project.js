const express = require('express');
const router = express.Router();
const Project = require('../entities/Project');
const { processPDF, saveProject } = require('../services/projectService');
const multer = require('multer');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

// Create project from PDF
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
    res.status(500).json({ message: 'Internal server error', error });
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
