// server/src/utils/ApiError.js
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
  static badRequest(message) {
    return new ApiError(400, message);
  }

  static notFound(message) {
    return new ApiError(404, message);
  }

  static unauthorized(message) {
    return new ApiError(401, message);
  }

  static serverError(message) {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
