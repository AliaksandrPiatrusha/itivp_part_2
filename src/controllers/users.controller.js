const users = require('../models/users.model');
const ApiError = require('../utils/ApiError');
const { parseId, requireFields } = require('../utils/validators');

const list = async (req, res) => {
  res.json({ data: await users.findAll() });
};

const changeRole = async (req, res) => {
  const id = parseId(req.params.id);
  requireFields(req.body, ['role']);
  if (!users.ROLES.includes(req.body.role)) {
    throw ApiError.badRequest(`Недопустимая роль: ${req.body.role}`, users.ROLES);
  }
  if (id === req.user.id) throw ApiError.badRequest('Нельзя изменить собственную роль');

  const updated = await users.updateRole(id, req.body.role);
  if (!updated) throw ApiError.notFound(`Пользователь с id=${id} не найден`);
  res.json({ data: updated });
};

const remove = async (req, res) => {
  const id = parseId(req.params.id);
  if (id === req.user.id) throw ApiError.badRequest('Нельзя удалить собственную учётную запись');

  const deleted = await users.remove(id);
  if (!deleted) throw ApiError.notFound(`Пользователь с id=${id} не найден`);
  res.status(204).end();
};

module.exports = { list, changeRole, remove };
