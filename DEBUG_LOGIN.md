# Отладка проблемы со входом

## Шаг 1: Проверьте базу данных

```bash
cd backend
node check-database.js
```

Этот скрипт покажет:
- Есть ли поле `password` в таблице users
- Список всех пользователей и есть ли у них пароли
- Список администраторов

## Шаг 2: Если поля password нет

Перезапустите backend, чтобы TypeORM создал поле:

```bash
cd backend
npm run start:dev
```

Подождите, пока backend запустится (увидите сообщение "🚀 Backend запущен на http://localhost:3000")

Затем снова запустите проверку:
```bash
node check-database.js
```

## Шаг 3: Если у пользователей нет паролей

Установите временный пароль для существующих пользователей:

```bash
cd backend
node update-users-password.js
```

Это установит пароль `password123` для всех пользователей.

## Шаг 4: Попробуйте войти

Используйте:
- **Email**: тот, который вы видите в базе данных
- **Пароль**: `password123` (если использовали скрипт) или тот, который вы указали при регистрации

## Шаг 5: Если всё равно не работает

### Проверьте консоль браузера (F12)

Посмотрите на ошибку в Network tab:
- Если 401 Unauthorized - неверный email или пароль
- Если 404 Not Found - backend не запущен или неверный URL
- Если CORS error - проблема с настройками CORS

### Проверьте backend логи

В терминале, где запущен backend, должны быть логи запросов.

### Создайте нового пользователя

Попробуйте зарегистрировать нового пользователя через форму регистрации.

## Быстрое решение

Если ничего не помогает, выполните все команды по порядку:

```bash
# 1. Остановите всё
docker-compose down

# 2. Запустите только базу данных
docker-compose up -d postgres

# 3. Подождите 5 секунд
sleep 5

# 4. Запустите backend
cd backend
npm run start:dev

# 5. В другом терминале проверьте базу
cd backend
node check-database.js

# 6. Если нужно, обновите пароли
node update-users-password.js

# 7. Запустите frontend
cd ../client-site
npm run dev
```

## Тестовые данные

После выполнения всех шагов у вас должны быть:

**Админ** (если создавали):
- Email: admin@example.com
- Пароль: admin123

**Пользователь** (если обновляли):
- Email: тот, что в базе
- Пароль: password123

## Проверка API напрямую

Можете проверить API через curl:

```bash
# Регистрация нового пользователя
curl -X POST http://localhost:3000/auth/user/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","firstName":"Test"}'

# Вход пользователя
curl -X POST http://localhost:3000/auth/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

Если эти команды работают, значит проблема на фронтенде.
