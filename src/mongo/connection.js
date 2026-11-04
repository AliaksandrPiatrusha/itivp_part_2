const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);

const connectMongo = uri => mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

const isConnected = () => mongoose.connection.readyState === 1;

const requireMongo = (req, res, next) => {
  if (!isConnected()) {
    return next(new ApiError(503, 'MongoDB недоступна: проверьте переменную MONGO_URI и подключение к кластеру'));
  }
  next();
};

module.exports = { mongoose, connectMongo, isConnected, requireMongo };
