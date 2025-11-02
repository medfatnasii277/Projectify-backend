# Backend - Enterprise Architecture

## 🏗️ Architecture Overview

This backend follows an enterprise-level architecture with clean separation of concerns:

```
src/
├── config/           # Configuration files
│   ├── database.js   # MongoDB connection
│   └── server.js     # Server configuration
├── controllers/      # Request handlers
│   └── project.controller.js
├── middlewares/      # Custom middleware
│   ├── errorHandler.js
│   ├── logger.js
│   └── validate.js
├── models/           # Mongoose models/schemas
│   └── Project.js
├── routes/           # API route definitions
│   └── project.routes.js
├── services/         # Business logic layer
│   ├── project.service.js
│   └── pdf.service.js
├── utils/            # Utility functions
│   ├── ApiError.js
│   ├── ApiResponse.js
│   ├── asyncHandler.js
│   ├── constants.js
│   └── logger.js
├── validators/       # Request validation
│   └── project.validator.js
└── server.js         # Application entry point
```

## 🎯 Key Features

### 1. **Layered Architecture**
- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Models**: Define data structure
- **Validators**: Validate incoming requests
- **Middlewares**: Process requests before reaching controllers

### 2. **Error Handling**
- Centralized error handling middleware
- Custom ApiError class for consistent error responses
- Async error catching with asyncHandler wrapper

### 3. **Logging**
- Winston logger for production-grade logging
- Separate log files for errors and combined logs
- HTTP request logging with Morgan

### 4. **Validation**
- Express-validator for request validation
- Separate validator files for each resource
- Consistent error messages

### 5. **Code Organization**
- Single Responsibility Principle
- Dependency Injection
- Clean, maintainable code structure

## 🚀 API Endpoints

### Projects
- `GET /api/projects` - Get all projects (with pagination)
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `POST /api/projects/upload` - Upload PDF and create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `POST /api/projects/:projectId/mainTasks` - Add task
- `PUT /api/projects/:projectId/mainTasks/:index` - Update task
- `DELETE /api/projects/:projectId/mainTasks/:index` - Delete task

### Subtasks
- `POST /api/projects/:projectId/mainTasks/:index/subtasks` - Add subtask
- `PUT /api/projects/:projectId/mainTasks/:taskIndex/subtasks/:subtaskIndex` - Update subtask
- `DELETE /api/projects/:projectId/mainTasks/:taskIndex/subtasks/:subtaskIndex` - Delete subtask

### Comments
- `POST /api/projects/:projectId/mainTasks/:index/comments` - Add comment to task
- `GET /api/projects/:projectId/mainTasks/:index/comments` - Get task comments
- `POST /api/projects/:projectId/mainTasks/:tasklaatste/subtasks/:subtaskIndex/comments` - Add comment to subtask
- `GET /api/projects/:projectId/mainTasks/:taskIndex/subtasks/:subtaskIndex/comments` - Get subtask comments

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## ⚙️ Environment Variables

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/projectify
GEMINI_API_KEY=your_api_key_here
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

## 🔧 Configuration

All configuration is centralized in `src/config/`:
- `database.js` - MongoDB connection settings
- `server.js` - Server, CORS, upload limits, etc.

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message"
}
```

## 🧪 Testing

```bash
# Run tests (to be implemented)
npm test
```

## 📊 Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

## 🔐 Security Best Practices

- Input validation on all routes
- Error messages don't expose sensitive info
- File upload restrictions (size, type)
- MongoDB injection prevention with mongoose
- CORS configuration

## 🚀 Scalability Features

- Pagination support
- Database indexing
- Connection pooling
- Graceful shutdown handling
- Process error handling

## 📈 Future Enhancements

- [ ] Authentication & Authorization (JWT)
- [ ] Rate limiting
- [ ] Caching layer (Redis)
- [ ] Unit & Integration tests
- [ ] API documentation (Swagger)
- [ ] Monitoring & metrics
- [ ] Docker containerization
- [ ] CI/CD pipeline
