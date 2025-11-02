const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

/**
 * Validate request using express-validator
 * This middleware should be used after the validation rules
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    if (Array.isArray(validations)) {
      for (let validation of validations) {
        const result = await validation.run(req);
      }
    }

    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      }));
      
      return next(new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.VALIDATION_ERROR,
        true,
        JSON.stringify(errorMessages)
      ));
    }
    
    next();
  };
};

module.exports = validate;
