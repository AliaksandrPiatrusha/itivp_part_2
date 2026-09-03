const errorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: { status: 400, message: 'Некорректный JSON в теле запроса' }
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