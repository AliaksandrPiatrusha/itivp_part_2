const ApiError = require('./ApiError');

const parseId = value => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest(`Некорректный идентификатор: ${value}`);
  }
  return id;
};

const requireFields = (source, fields) => {
  if (!source || typeof source !== 'object') {
    throw ApiError.badRequest('Тело запроса должно быть JSON-объектом');
  }
  const missing = fields.filter(f => source[f] === undefined || source[f] === null || source[f] === '');
  if (missing.length > 0) {
    throw ApiError.badRequest('Отсутствуют обязательные поля', missing);
  }
};

const requirePositiveInt = (value, field) => {
  if (!Number.isInteger(value) || value < 1) {
    throw ApiError.badRequest(`Поле ${field} должно быть целым числом больше нуля`);
  }
};

module.exports = { parseId, requireFields, requirePositiveInt };