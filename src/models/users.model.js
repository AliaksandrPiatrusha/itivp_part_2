const { User } = require('../db/models');

const ROLES = User.ROLES;

const toDTO = user => user && {
  id: user.id,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
};

const findAll = async () => {
  const users = await User.findAll({ order: [['id', 'ASC']] });
  return users.map(toDTO);
};

const findById = async id => toDTO(await User.findByPk(id));

// Возвращает Sequelize-экземпляр вместе с passwordHash — только для проверки пароля.
const findByEmailWithHash = email => User.findOne({ where: { email } });

const create = async ({ email, passwordHash }) =>
  toDTO(await User.create({ email, passwordHash, role: 'user' }));

const updateRole = async (id, role) => {
  const user = await User.findByPk(id);
  if (!user) return null;
  return toDTO(await user.update({ role }));
};

const remove = async id => {
  const user = await User.findByPk(id);
  if (!user) return null;
  await user.destroy();
  return user;
};

module.exports = { ROLES, toDTO, findAll, findById, findByEmailWithHash, create, updateRole, remove };
