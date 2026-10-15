const ApiError = require('../utils/ApiError');

const isAdmin = (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Требуется авторизация'));
  if (req.user.role !== 'admin') return next(ApiError.forbidden('Доступ разрешён только администраторам'));
  next();
};

module.exports = isAdmin;



