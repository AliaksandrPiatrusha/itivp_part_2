# itivp_part_2 — REST API интернет-магазина одежды

Лабораторная работа №21–23. Серверное приложение на Node.js + Express.js для управления
каталогом товаров, корзиной и заказами интернет-магазина одежды.

В лаб. №23 добавлены регистрация и вход пользователей (bcrypt + JWT), middleware проверки
токена и ролевая модель доступа (RBAC: `user`, `admin`). Корзина стала персональной,
заказы привязаны к пользователю.

Данные хранятся в PostgreSQL через ORM Sequelize (лаб. №22). Слой `src/models/*.model.js`
сохранил прежние сигнатуры функций из лаб. №1, но внутри вызывает Sequelize-модели из
`src/db/models/` вместо временных массивов в памяти.

В лаб. №24 добавлен клиент на React + Vite в папке [`client/`](client/README.md): корзина
с хранением в `localStorage`, фильтрацией, сортировкой и автосохранением (`useState`, `useEffect`).

В лаб. №25 клиент переведён с `localStorage` на этот REST API: вход по JWT, загрузка корзины
с сервера, CRUD с оптимистичным обновлением и откатом при ошибке, поиск по каталогу на сервере
с debounce, постраничная загрузка каталога с кнопкой «Показать ещё». На сервере добавлены CORS
(пакет `cors`), параметры `search`, `limit`, `offset` у `GET /api/products`, смена размера
в `PUT /api/cart/items/:itemId` и сид с дополнительными товарами. Подробнее — [`client/README.md`](client/README.md).

В лаб. №26 добавлена параллельная реализация каталога, корзины и заказов на MongoDB (ODM Mongoose)
под префиксом `/api/mongo`. Реляционный API на PostgreSQL продолжает работать без изменений.
Подробнее — раздел [MongoDB (лаб. №26)](#mongodb-лаб-26).

## Стек

- Node.js
- Express 4, cors
- PostgreSQL + Sequelize 6 (ORM), sequelize-cli (миграции и сиды)
- MongoDB (Atlas или локально) + Mongoose (ODM) — лаб. №26
- jsonwebtoken (JWT), bcrypt (хеширование паролей)
- nodemon (dev)
- Клиент: React 19 + Vite, axios

## Установка и запуск

```bash
git clone https://github.com/AliaksandrPiatrusha/itivp_part_2.git
cd itivp_part_2
git checkout lab26
npm install
```

Создайте файл `.env` на основе `.env.example`, укажите строку подключения к своей БД и секрет JWT:

```
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/clothing_store_lab2
PORT=3000
JWT_SECRET=<длинная случайная строка>
JWT_EXPIRES_IN=1h
# CORS_ORIGIN=http://localhost:5173
```

`CORS_ORIGIN` — необязательный список адресов React-клиента, которым разрешены запросы
из браузера. Если он не задан, разрешены `http://localhost` и `http://127.0.0.1` на любом порту:
Vite может запуститься на 5174 и далее, если порт 5173 занят. Без `JWT_SECRET` сервер не запустится. Сгенерировать секрет можно командой
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

Примените миграции и наполните базу тестовыми данными:

```bash
npm run db:migrate
npm run db:seed
```

Сид создаёт администратора `admin@shop.local` / `Admin123!` (переопределяется переменными
`ADMIN_EMAIL` и `ADMIN_PASSWORD`). Если товары уже засеяны, достаточно запустить только этот сид:
`npx sequelize-cli db:seed --seed 20260930100200-admin-user.js`.
Дополнительные 14 товаров для постраничного каталога (лаб. №25):
`npx sequelize-cli db:seed --seed 20261028120000-more-products.js`.

Запустите сервер:

```bash
npm run dev
```

Сервер стартует на `http://localhost:3000`. Порт можно переопределить переменной окружения `PORT`.

Запустите клиент (во втором терминале) и откройте `http://localhost:5173`:

```bash
cd client
npm install
copy .env.example .env   # Linux/macOS: cp .env.example .env
npm run dev
```

Скрипты:

| Команда | Назначение |
|---|---|
| `npm start` | Запуск в обычном режиме |
| `npm run dev` | Запуск через nodemon с автоперезагрузкой |
| `npm run db:migrate` | Применить миграции Sequelize |
| `npm run db:migrate:undo` | Откатить последнюю миграцию |
| `npm run db:seed` | Заполнить БД тестовыми данными |
| `npm run db:seed:undo` | Удалить тестовые данные |
| `npm run mongo:seed` | Заполнить MongoDB тестовыми товарами (лаб. №26) |

## Структура проекта

```
├── server.js                 точка входа, запуск HTTP-сервера
├── requests.http             набор запросов для REST Client
├── config/config.js          конфигурация подключения Sequelize (читает DATABASE_URL)
├── migrations/                миграции схемы БД
├── seeders/                   сиды с тестовыми данными
├── .sequelizerc               пути sequelize-cli к config/моделям/миграциям/сидам
└── src/
    ├── app.js                конфигурация Express, подключение middleware
    ├── routes/               объявление URL и HTTP-методов
    ├── controllers/          валидация входных данных, формирование ответа
    ├── models/               слой доступа к данным (обёртка над Sequelize-моделями)
    ├── db/models/            Sequelize-модели (User, Product, CartItem, Order, OrderItem) и bootstrap
    ├── middleware/           auth (проверка JWT), isAdmin (RBAC), обработка 404 и ошибок
    └── utils/                ApiError, валидаторы, asyncHandler для async-роутов
```

Разделение слоёв позволило заменить хранилище на базу данных, изменив только слой `models/`
(контроллеры и роуты почти не изменились — добавились только `async`/`await`).

## База данных

Схема состоит из пяти таблиц:

- **Users** — пользователи (`email` (unique), `passwordHash` (bcrypt, 10 раундов), `role`: `user` | `admin`).
- **Products** — каталог товаров (`title`, `category`, `sizes` (JSON), `color`, `price`, `stock`,
  `discountPercent` — поле, добавленное отдельной миграцией).
- **CartItems** — позиции корзины пользователя (`userId`), `belongsTo Product`, `belongsTo User`.
- **Orders** — заказы (`userId`, данные покупателя, `status`, `total`), `belongsTo User`.
- **OrderItems** — позиции заказа (снимок товара на момент оформления), `belongsTo Order` и `belongsTo Product`.

Связи один-ко-многим: `Product.hasMany(CartItem)`, `Product.hasMany(OrderItem)`,
`Order.hasMany(OrderItem, { as: 'items' })` с каскадным удалением позиций при удалении заказа.

## Аутентификация и авторизация

1. `POST /api/auth/register` принимает `email` и `password`, проверяет уникальность email,
   хеширует пароль `bcrypt.hash(password, 10)` и сохраняет пользователя с ролью `user`
   (поле `role` из тела запроса игнорируется).
2. `POST /api/auth/login` сверяет пароль через `bcrypt.compare` и возвращает JWT,
   подписанный `JWT_SECRET` (HS256), с полезной нагрузкой `{ id, email, role }` и сроком жизни `JWT_EXPIRES_IN` (по умолчанию `1h`).
3. Защищённые запросы передают токен в заголовке `Authorization: Bearer <token>`.
   Middleware `src/middleware/auth.js` проверяет подпись и срок действия и кладёт
   расшифрованную нагрузку в `req.user`. Без токена или с недействительным токеном возвращается 401.
4. Middleware `src/middleware/isAdmin.js` (ролевая модель, дополнительный механизм лаб. №23)
   пропускает только пользователей с `role: "admin"`, остальным возвращает 403.

Доступ к ресурсам:

| Ресурс | Гость | `user` | `admin` |
|---|---|---|---|
| Каталог (чтение) | ✔ | ✔ | ✔ |
| Каталог (создание, изменение, удаление) | — | — | ✔ |
| Корзина | — | своя | своя |
| Оформление заказа | — | ✔ | ✔ |
| Просмотр заказов | — | только свои | все |
| Изменение и удаление заказов | — | — | ✔ |
| Управление пользователями | — | — | ✔ |

## Эндпоинты

Базовый префикс — `/api`. Колонка «Доступ»: `—` — без токена, `auth` — нужен JWT, `admin` — JWT администратора.

### Аутентификация и пользователи

| Метод | Маршрут | Назначение | Доступ | Успех | Ошибки |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | Регистрация | — | 201 | 400, 409 |
| POST | `/api/auth/login` | Вход, выдача JWT | — | 200 | 400, 401 |
| GET | `/api/profile` | Данные текущего пользователя | auth | 200 | 401 |
| GET | `/api/users` | Список пользователей | admin | 200 | 401, 403 |
| PATCH | `/api/users/:id/role` | Назначить роль `user`/`admin` | admin | 200 | 400, 401, 403, 404 |
| DELETE | `/api/users/:id` | Удалить пользователя | admin | 204 | 400, 401, 403, 404 |

### Товары

| Метод | Маршрут | Назначение | Доступ | Успех | Ошибки |
|---|---|---|---|---|---|
| GET | `/api/products` | Каталог, фильтры `?category=&size=&maxPrice=&search=` (`search` — подстрока названия или цвета без учёта регистра), пагинация `?limit=&offset=` | — | 200 | 400 |
| GET | `/api/products/:id` | Товар по ID | — | 200 | 400, 404 |
| POST | `/api/products` | Добавить товар | admin | 201 | 400, 401, 403 |
| PUT | `/api/products/:id` | Полная замена товара | admin | 200 | 400, 401, 403, 404 |
| DELETE | `/api/products/:id` | Удалить товар | admin | 204 | 400, 401, 403, 404 |

Ответ `GET /api/products` содержит `meta`: `{ total, limit, offset, hasMore }`, где `total` — число
товаров, подходящих под фильтры. `limit` — от 1 до 100. Без `limit` возвращается весь список
(`limit: null`). Пример: `GET /api/products?limit=6&offset=6` — вторая страница по 6 товаров.

### Корзина

Все маршруты требуют токен; каждый пользователь работает только со своей корзиной.

| Метод | Маршрут | Назначение | Доступ | Успех | Ошибки |
|---|---|---|---|---|---|
| GET | `/api/cart` | Содержимое корзины и сумма | auth | 200 | 401 |
| POST | `/api/cart/items` | Добавить позицию | auth | 201 | 400, 401, 409 |
| PUT | `/api/cart/items/:itemId` | Изменить количество и/или размер (`{ quantity?, size? }`) | auth | 200 | 400, 401, 404, 409 |
| DELETE | `/api/cart/items/:itemId` | Удалить позицию | auth | 200 | 400, 401, 404 |
| DELETE | `/api/cart` | Очистить корзину | auth | 204 | 401 |

Ответы `GET`, `POST`, `PUT` и `DELETE` позиции содержат `{ items, total }`. `POST` и `PUT`
дополнительно возвращают `item` — добавленную/изменённую позицию с реальным `id`. Каждая позиция
включает сведения о товаре (`category`, `color`, `sizes`, `stock`) и `createdAt`.

Остаток проверяется по сумме всех размеров товара в корзине пользователя: `POST` и увеличение
количества в `PUT` возвращают 409 «В корзине уже N из M доступных», если сумма превысит `stock`
(уменьшать количество можно всегда). `PUT` также возвращает 409, если позиция с выбранным
размером уже есть в корзине. Остаток в `Products` уменьшается только при оформлении заказа.

### Заказы

| Метод | Маршрут | Назначение | Доступ | Успех | Ошибки |
|---|---|---|---|---|---|
| GET | `/api/orders` | Список заказов, `?status=&customer=` (для `user` — только свои) | auth | 200 | 401 |
| GET | `/api/orders/:id` | Заказ по ID (чужой заказ для `user` → 404) | auth | 200 | 400, 401, 404 |
| POST | `/api/orders` | Оформить заказ из своей корзины (`customer.email` по умолчанию берётся из токена) | auth | 201 | 400, 401 |
| PUT | `/api/orders/:id` | Полное обновление заказа | admin | 200 | 400, 401, 403, 404 |
| PATCH | `/api/orders/:id/status` | Смена статуса | admin | 200 | 400, 401, 403, 404 |
| DELETE | `/api/orders/:id` | Удалить заказ | admin | 204 | 400, 401, 403, 404 |

Допустимые статусы заказа: `new`, `paid`, `shipped`, `delivered`, `cancelled`.

## Формат ответов

Успешный ответ:

```json
{ "data": { "id": 1, "title": "Футболка Oversize", "price": 39.9 } }
```

Ответ с ошибкой:

```json
{
  "error": {
    "status": 400,
    "message": "Отсутствуют обязательные поля",
    "details": ["size", "quantity"]
  }
}
```

Поле `details` присутствует не всегда — только когда есть уточняющая информация.

## Примеры запросов

Регистрация и вход:

```bash
curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ivan@example.com","password":"secret12"}'

curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ivan@example.com","password":"secret12"}'
# {"data":{"token":"eyJhbGciOi...","tokenType":"Bearer","expiresIn":"1h","user":{...}}}
```

Профиль текущего пользователя:

```bash
curl -i http://localhost:3000/api/profile -H "Authorization: Bearer $TOKEN"
```

Добавление товара в корзину:

```bash
curl -i -X POST http://localhost:3000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"productId":2,"size":"L","quantity":2}'
```

Оформление заказа:

```bash
curl -i -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"customer":{"name":"Иван Петров","address":"г. Минск, ул. Независимости, 25"}}'
```

Смена статуса (только администратор):

```bash
curl -i -X PATCH http://localhost:3000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"paid"}'
```

Заголовок `Content-Type: application/json` обязателен, иначе `express.json()` не разберёт тело запроса.

## Тестирование

Файл `requests.http` содержит готовый набор запросов, включая негативные сценарии
(несуществующий ID, недоступный размер, запрос без токена → 401, действие покупателя
в админском маршруте → 403). Токены из запросов входа автоматически подставляются
в последующие запросы через переменные `{{userToken}}` и `{{adminToken}}`. Для запуска установите
расширение REST Client в VS Code и используйте ссылку `Send Request` над каждым блоком.

Альтернативно — Postman, Insomnia или curl.

## MongoDB (лаб. №26)

### Подключение

1. Создайте бесплатный кластер M0 в MongoDB Atlas, пользователя БД и разрешите доступ со своего IP
   (Network Access). Либо установите MongoDB Community Edition локально.
2. Добавьте строку подключения в `.env`:

   ```
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/clothing_store?retryWrites=true&w=majority
   # или локально: MONGO_URI=mongodb://127.0.0.1:27017/clothing_store
   ```

3. Заполните коллекции тестовыми товарами (коллекции `products`, `carts`, `orders` очищаются):

   ```bash
   npm run mongo:seed
   ```

4. Запустите сервер `npm run dev` — в консоли появится `MongoDB connected`. Подключение выполняется
   в `server.js` через `src/mongo/connection.js`. Если `MONGO_URI` не задана или кластер недоступен,
   PostgreSQL-часть работает, а маршруты `/api/mongo/*` отвечают `503`.

Аутентификация общая: JWT выдаётся `POST /api/auth/login` (пользователи хранятся в PostgreSQL),
поле `userId` в документах MongoDB — это `id` пользователя из токена.

### Документная модель

```
src/mongo/
├── connection.js            mongoose.connect, middleware requireMongo (503 без подключения)
├── models/
│   ├── Product.js           товар + массив tags + вложенные отзывы reviews[]
│   ├── Cart.js              одна корзина на пользователя, позиции items[] внутри документа
│   └── Order.js             заказ + вложенный customer + items[] + statusHistory[]
├── controllers/             CRUD на методах Mongoose
└── routes.js                маршруты /api/mongo/*
```

Пример документа заказа (вместо строк в двух таблицах `Orders` и `OrderItems` — один документ):

```json
{
  "_id": "6729f0c2a1b2c3d4e5f60789",
  "userId": 2,
  "customer": { "name": "Иван Петров", "email": "ivan@example.com", "phone": "", "address": "г. Минск" },
  "items": [
    { "_id": "6729f0c2a1b2c3d4e5f6078a", "product": "6729ef01a1b2c3d4e5f60001", "title": "Футболка Oversize", "size": "M", "price": 39.9, "quantity": 2 }
  ],
  "total": 79.8,
  "status": "paid",
  "statusHistory": [
    { "status": "new", "changedAt": "2026-11-04T10:00:00.000Z" },
    { "status": "paid", "changedAt": "2026-11-04T10:05:00.000Z" }
  ]
}
```

| PostgreSQL (Sequelize) | MongoDB (Mongoose) |
|---|---|
| Таблицы `CartItems` с внешними ключами `userId`, `productId` | Коллекция `carts`: один документ на пользователя с массивом `items` |
| `Orders` + `OrderItems`, `JOIN` через `include` | Один документ `orders` с вложенными `customer` и `items` |
| Отзывы потребовали бы таблицу `Reviews` | Массив поддокументов `reviews` в товаре |
| Колонка `sizes` типа JSON | Нативный массив `sizes: [String]`, поиск `{ sizes: "M" }` |
| Транзакции `sequelize.transaction` с блокировкой строк | Атомарные операции над одним документом (`$inc`, `$push`, `$pull`, позиционный `$`) |

### Эндпоинты `/api/mongo`

| Метод | Маршрут | Назначение (метод Mongoose) | Доступ |
|---|---|---|---|
| GET | `/api/mongo/products` | Каталог, `?category=&size=&tag=&maxPrice=&search=&limit=&offset=` (`find().sort().skip().limit()`) | — |
| GET | `/api/mongo/products/:id` | Товар по ObjectId (`findById`) | — |
| POST | `/api/mongo/products` | Создать товар (`create`) | admin |
| PUT | `/api/mongo/products/:id` | Обновить товар (`findByIdAndUpdate`, `runValidators`) | admin |
| DELETE | `/api/mongo/products/:id` | Удалить товар (`findByIdAndDelete`) и убрать его из всех корзин (`updateMany` + `$pull`); возвращает удалённый документ | admin |
| POST | `/api/mongo/products/:id/reviews` | Добавить отзыв `{ rating, comment }` (`$push` во вложенный массив) | auth |
| DELETE | `/api/mongo/products/:id/reviews/:reviewId` | Удалить свой отзыв (admin — любой) (`$pull`) | auth |
| GET | `/api/mongo/cart` | Корзина с `populate('items.product')` и суммой `total` (virtual) | auth |
| POST | `/api/mongo/cart/items` | Добавить `{ productId, size, quantity }`: если позиция уже есть — `$inc` по `items.$.quantity`, иначе `$push` (upsert корзины) | auth |
| PATCH | `/api/mongo/cart/items/:itemId` | Изменить `{ quantity }` через позиционный оператор `$set: { "items.$.quantity" }` | auth |
| DELETE | `/api/mongo/cart/items/:itemId` | Удалить позицию (`$pull`) | auth |
| DELETE | `/api/mongo/cart` | Очистить корзину | auth |
| GET | `/api/mongo/orders` | Заказы, `?status=&customer=` (поиск по вложенному полю `customer.name`); `user` — только свои | auth |
| GET | `/api/mongo/orders/stats` | Агрегация: заказы и выручка по статусам, топ-5 товаров (`$match`, `$unwind`, `$group`, `$sort`, `$limit`) | admin |
| GET | `/api/mongo/orders/:id` | Заказ с `populate('items.product')` | auth |
| POST | `/api/mongo/orders` | Оформить заказ из корзины `{ customer: { name, address, phone? } }`, атомарно списать остаток (`$inc` с условием `stock >= quantity`) | auth |
| PUT | `/api/mongo/orders/:id` | Полное обновление `{ customer, items, status }` (`findByIdAndUpdate`) | admin |
| PATCH | `/api/mongo/orders/:id/status` | Смена статуса + запись в `statusHistory` (`$set` + `$push`) | admin |
| DELETE | `/api/mongo/orders/:id` | Удалить заказ (`findByIdAndDelete`), в ответе — удалённый документ | admin |

Ошибки Mongoose обрабатываются в `src/middleware/errorHandler.js`: `ValidationError` и `CastError` → 400,
дубликат ключа (`E11000`) → 409. Некорректный ObjectId в URL → 400. Готовые запросы — в разделе
«MongoDB (лаб. №26)» файла `requests.http`.

## Дальнейшее развитие

Оформление заказа из React-клиента (`POST /api/orders`), валидация на уровне схем.