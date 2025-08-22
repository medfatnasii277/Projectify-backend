require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');

const { processPDF, saveProject } = require('./services/projectService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Routes
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Process the PDF and extract project structure
    const projectStructure = await processPDF(req.file.path);

    // Save the project to MongoDB
    const project = await saveProject(projectStructure);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(200).json({ message: 'Project saved successfully', project });
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
