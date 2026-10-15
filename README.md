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

## Стек

- Node.js
- Express 4
- PostgreSQL + Sequelize 6 (ORM), sequelize-cli (миграции и сиды)
- jsonwebtoken (JWT), bcrypt (хеширование паролей)
- nodemon (dev)

## Установка и запуск

```bash
git clone https://github.com/AliaksandrPiatrusha/itivp_part_2.git
cd itivp_part_2
git checkout lab23
npm install
```

Создайте файл `.env` на основе `.env.example`, укажите строку подключения к своей БД и секрет JWT:

```
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/clothing_store_lab2
PORT=3000
JWT_SECRET=<длинная случайная строка>
JWT_EXPIRES_IN=1h
```

Без `JWT_SECRET` сервер не запустится. Сгенерировать секрет можно командой
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

Примените миграции и наполните базу тестовыми данными:

```bash
npm run db:migrate
npm run db:seed
```

Сид создаёт администратора `admin@shop.local` / `Admin123!` (переопределяется переменными
`ADMIN_EMAIL` и `ADMIN_PASSWORD`). Если товары уже засеяны, достаточно запустить только этот сид:
`npx sequelize-cli db:seed --seed 20260930100200-admin-user.js`.

Запустите сервер:

```bash
npm run dev
```

Сервер стартует на `http://localhost:3000`. Порт можно переопределить переменной окружения `PORT`.

Скрипты:

| Команда | Назначение |
|---|---|
| `npm start` | Запуск в обычном режиме |
| `npm run dev` | Запуск через nodemon с автоперезагрузкой |
| `npm run db:migrate` | Применить миграции Sequelize |
| `npm run db:migrate:undo` | Откатить последнюю миграцию |
| `npm run db:seed` | Заполнить БД тестовыми данными |
| `npm run db:seed:undo` | Удалить тестовые данные |

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
| GET | `/api/products` | Каталог, фильтры `?category=&size=&maxPrice=` | — | 200 | — |
| GET | `/api/products/:id` | Товар по ID | — | 200 | 400, 404 |
| POST | `/api/products` | Добавить товар | admin | 201 | 400, 401, 403 |
| PUT | `/api/products/:id` | Полная замена товара | admin | 200 | 400, 401, 403, 404 |
| DELETE | `/api/products/:id` | Удалить товар | admin | 204 | 400, 401, 403, 404 |

### Корзина

Все маршруты требуют токен; каждый пользователь работает только со своей корзиной.

| Метод | Маршрут | Назначение | Доступ | Успех | Ошибки |
|---|---|---|---|---|---|
| GET | `/api/cart` | Содержимое корзины и сумма | auth | 200 | 401 |
| POST | `/api/cart/items` | Добавить позицию | auth | 201 | 400, 401, 409 |
| PUT | `/api/cart/items/:itemId` | Изменить количество | auth | 200 | 400, 401, 404 |
| DELETE | `/api/cart/items/:itemId` | Удалить позицию | auth | 200 | 400, 401, 404 |
| DELETE | `/api/cart` | Очистить корзину | auth | 204 | 401 |

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

## Дальнейшее развитие

Подключение React-клиента из `client/` к этому API с авторизацией запросов через JWT
(лаб. №25), валидация на уровне схем.