# itivp_part_2 — REST API интернет-магазина одежды

Лабораторная работа №21. Серверное приложение на Node.js + Express.js для управления
каталогом товаров, корзиной и заказами интернет-магазина одежды.

Данные хранятся в памяти сервера (массивы в слое моделей) и сбрасываются при перезапуске.

## Стек

- Node.js
- Express 4
- nodemon (dev)

## Установка и запуск

```bash
git clone https://github.com/AliaksandrPiatrusha/itivp_part_2.git
cd itivp_part_2
git checkout lab21
npm install
npm run dev
```

Сервер стартует на `http://localhost:3000`. Порт можно переопределить переменной окружения `PORT`.

Скрипты:

| Команда | Назначение |
|---|---|
| `npm start` | Запуск в обычном режиме |
| `npm run dev` | Запуск через nodemon с автоперезагрузкой |

## Структура проекта

```
├── server.js                 точка входа, запуск HTTP-сервера
├── requests.http             набор запросов для REST Client
└── src/
    ├── app.js                конфигурация Express, подключение middleware
    ├── routes/               объявление URL и HTTP-методов
    ├── controllers/          валидация входных данных, формирование ответа
    ├── models/               работа с данными (сейчас массивы в памяти)
    ├── middleware/           обработка 404 и глобальный обработчик ошибок
    └── utils/                класс ApiError и функции валидации
```

Разделение слоёв позволяет заменить хранилище на базу данных, изменив только слой `models/`.

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

Подключение базы данных, валидация на уровне схем, аутентификация через JWT,
интеграция с React-фронтендом из первой части курса.
