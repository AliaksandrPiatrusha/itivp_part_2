const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const users = require('../models/users.model');
const ApiError = require('../utils/ApiError');
const { requireFields } = require('../utils/validators');

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DUMMY_HASH = bcrypt.hashSync('dummy-password', SALT_ROUNDS);

const normalizeEmail = email => String(email).trim().toLowerCase();

const validateCredentials = body => {
  requireFields(body, ['email', 'password']);
  const email = normalizeEmail(body.email);
  if (!EMAIL_RE.test(email)) throw ApiError.badRequest('Некорректный email');
  if (typeof body.password !== 'string') throw ApiError.badRequest('Поле password должно быть строкой');
  return { email, password: body.password };
};

const signToken = user =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

const register = async (req, res) => {
  const { email, password } = validateCredentials(req.body);
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw ApiError.badRequest(`Пароль должен содержать не менее ${MIN_PASSWORD_LENGTH} символов`);
  }
  if (await users.findByEmailWithHash(email)) {
    throw ApiError.conflict('Пользователь с таким email уже зарегистрирован');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await users.create({ email, passwordHash });
  res.status(201).json({ data: user });
};

const login = async (req, res) => {
  const { email, password } = validateCredentials(req.body);
  const user = await users.findByEmailWithHash(email);
  const valid = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !valid) throw ApiError.unauthorized('Неверный email или пароль');

  res.json({
    data: {
      token: signToken(user),
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      user: users.toDTO(user)
    }
  });
};

const profile = async (req, res) => {
  const user = await users.findById(req.user.id);
  if (!user) throw ApiError.unauthorized('Пользователь из токена больше не существует');
  res.json({ data: user });
};

module.exports = { register, login, profile };
