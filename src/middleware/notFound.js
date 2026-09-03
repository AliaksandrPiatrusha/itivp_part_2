const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
  next(new ApiError(404, `Маршрут ${req.method} ${req.originalUrl} не найден`));
};

module.exports = notFound;