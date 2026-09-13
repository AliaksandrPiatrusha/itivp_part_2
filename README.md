# itivp_part_2 — REST API интернет-магазина одежды

Лабораторная работа №21–22. Серверное приложение на Node.js + Express.js для управления
каталогом товаров, корзиной и заказами интернет-магазина одежды.

Данные хранятся в PostgreSQL через ORM Sequelize (лаб. №22). Слой `src/models/*.model.js`
сохранил прежние сигнатуры функций из лаб. №1, но внутри вызывает Sequelize-модели из
`src/db/models/` вместо временных массивов в памяти.

## Стек

- Node.js
- Express 4
- PostgreSQL + Sequelize 6 (ORM), sequelize-cli (миграции и сиды)
- nodemon (dev)

## Установка и запуск

```bash
git clone https://github.com/AliaksandrPiatrusha/itivp_part_2.git
cd itivp_part_2
git checkout lab21
npm install
```

Создайте файл `.env` на основе `.env.example` и укажите строку подключения к своей БД:

```
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/clothing_store_lab2
PORT=3000
```

Примените миграции и наполните базу тестовыми данными:

```bash
npm run db:migrate
npm run db:seed
```

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
    ├── db/models/            Sequelize-модели (Product, CartItem, Order, OrderItem) и bootstrap
    ├── middleware/           обработка 404 и глобальный обработчик ошибок
    └── utils/                ApiError, валидаторы, asyncHandler для async-роутов
```

Разделение слоёв позволило заменить хранилище на базу данных, изменив только слой `models/`
(контроллеры и роуты почти не изменились — добавились только `async`/`await`).

## База данных

Схема состоит из четырёх таблиц:

- **Products** — каталог товаров (`title`, `category`, `sizes` (JSON), `color`, `price`, `stock`,
  `discountPercent` — поле, добавленное отдельной миграцией).
- **CartItems** — позиции единственной корзины, `belongsTo Product`.
- **Orders** — заказы (данные покупателя, `status`, `total`).
- **OrderItems** — позиции заказа (снимок товара на момент оформления), `belongsTo Order` и `belongsTo Product`.

Связи один-ко-многим: `Product.hasMany(CartItem)`, `Product.hasMany(OrderItem)`,
`Order.hasMany(OrderItem, { as: 'items' })` с каскадным удалением позиций при удалении заказа.

## Эндпоинты

Базовый префикс — `/api`.

### Товары

| Метод | Маршрут | Назначение | Успех | Ошибки |
|---|---|---|---|---|
| GET | `/api/products` | Каталог, фильтры `?category=&size=&maxPrice=` | 200 | — |
| GET | `/api/products/:id` | Товар по ID | 200 | 400, 404 |
| POST | `/api/products` | Добавить товар | 201 | 400 |
| PUT | `/api/products/:id` | Полная замена товара | 200 | 400, 404 |
| DELETE | `/api/products/:id` | Удалить товар | 204 | 400, 404 |

### Корзина

| Метод | Маршрут | Назначение | Успех | Ошибки |
|---|---|---|---|---|
| GET | `/api/cart` | Содержимое корзины и сумма | 200 | — |
| POST | `/api/cart/items` | Добавить позицию | 201 | 400, 409 |
| PUT | `/api/cart/items/:itemId` | Изменить количество | 200 | 400, 404 |
| DELETE | `/api/cart/items/:itemId` | Удалить позицию | 200 | 400, 404 |
| DELETE | `/api/cart` | Очистить корзину | 204 | — |

### Заказы

| Метод | Маршрут | Назначение | Успех | Ошибки |
|---|---|---|---|---|
| GET | `/api/orders` | Список заказов, `?status=&customer=` | 200 | — |
| GET | `/api/orders/:id` | Заказ по ID | 200 | 400, 404 |
| POST | `/api/orders` | Оформить заказ из корзины | 201 | 400 |
| PUT | `/api/orders/:id` | Полное обновление заказа | 200 | 400, 404 |
| PATCH | `/api/orders/:id/status` | Смена статуса | 200 | 400, 404 |
| DELETE | `/api/orders/:id` | Удалить заказ | 204 | 400, 404 |

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

Добавление товара в корзину:

```bash
curl -i -X POST http://localhost:3000/api/cart/items \
  -H "Content-Type: application/json" \
  -d '{"productId":2,"size":"L","quantity":2}'
```

Оформление заказа:

```bash
curl -i -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customer":{"name":"Иван Петров","email":"ivan@example.com","address":"г. Минск, ул. Независимости, 25"}}'
```

Смена статуса:

```bash
curl -i -X PATCH http://localhost:3000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"paid"}'
```

Заголовок `Content-Type: application/json` обязателен, иначе `express.json()` не разберёт тело запроса.

## Тестирование

Файл `requests.http` содержит готовый набор запросов, включая негативные сценарии
(несуществующий ID, недоступный размер, пустая корзина). Для запуска установите
расширение REST Client в VS Code и используйте ссылку `Send Request` над каждым блоком.

Альтернативно — Postman, Insomnia или curl.

## Дальнейшее развитие

Аутентификация через JWT (лаб. №23), валидация на уровне схем,
интеграция с React-фронтендом из первой части курса.