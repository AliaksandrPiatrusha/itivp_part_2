const {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError
} = require('sequelize');

const errorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: { status: 400, message: 'Некорректный JSON в теле запроса' }
    });
  }

  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      error: {
        status: 409,
        message: 'Запись с такими данными уже существует',
        details: err.errors.map(e => e.path)
      }
    });
  }

  const pgCode = err.original && err.original.code;
  if (err instanceof ForeignKeyConstraintError || pgCode === '23503' || pgCode === '23001') {
    return res.status(409).json({
      error: { status: 409, message: 'Операция нарушает связь с другой таблицей (внешний ключ)' }
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Ошибка валидации данных',
        details: err.errors.map(e => e.message)
      }
    });
  }

  const status = err.status || 500;
  if (status === 500) console.error(err);

  res.status(status).json({
    error: {
      status,
      message: status === 500 ? 'Внутренняя ошибка сервера' : err.message,
      ...(err.details !== undefined && { details: err.details })
    }
  });
};

module.exports = errorHandler;