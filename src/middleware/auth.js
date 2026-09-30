const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const auth = (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Требуется авторизация: передайте заголовок Authorization: Bearer <token>'));
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Срок действия токена истёк' : 'Недействительный токен';
    next(ApiError.unauthorized(message));
  }
};

module.exports = auth;
