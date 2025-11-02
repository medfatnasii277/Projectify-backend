const { HTTP_STATUS } = require('./constants');

/**
 * Standard API response format
 */
class ApiResponse {
  constructor(statusCode, message, data = null) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
  }

  static success(res, message, data = null, statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data));
  }

  static created(res, message, data = null) {
    return res.status(HTTP_STATUS.CREATED).json(
      new ApiResponse(HTTP_STATUS.CREATED, message, data)
    );
  }

  static error(res, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message));
  }
}

module.exports = ApiResponse;
