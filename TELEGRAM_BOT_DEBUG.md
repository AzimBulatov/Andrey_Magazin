# Отладка Telegram бота на сервере

## Быстрая диагностика

```bash
# 1. Скопируйте скрипты на сервер
scp diagnose-bot.sh fix-bot.sh user@your-server:/home/user/TG_Bot/

# 2. Подключитесь к серверу
ssh user@your-server
cd TG_Bot

# 3. Сделайте скрипты исполняемыми
chmod +x diagnose-bot.sh fix-bot.sh

# 4. Запустите диагностику
./diagnose-bot.sh
```

## Частые проблемы и решения

### 1. Webhook установлен (бот не отвечает)

**Проблема:** Telegram отправляет обновления на webhook вместо polling

**Решение:**
```bash
# Получите токен из .env
source .env

# Удалите webhook
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook?drop_pending_updates=true"

# Перезапустите backend
docker-compose restart backend
```

### 2. Неверный токен

**Проблема:** Токен в .env неправильный или устарел

**Решение:**
```bash
# Проверьте токен
curl "https://api.telegram.org/bot<ВАШ_ТОКЕН>/getMe"

# Если ошибка - получите новый токен от @BotFather
# Обновите .env
nano .env
# Измените TELEGRAM_BOT_TOKEN

# Перезапустите
docker-compose restart backend
```

### 3. Backend не запускается

**Проблема:** Контейнер падает или не стартует

**Решение:**
```bash
# Смотрим логи
docker logs telegram-shop-backend --tail 100

# Проверяем что база данных работает
docker ps | grep postgres

# Перезапускаем все
docker-compose down
docker-compose up -d
```

### 4. Токен не передается в контейнер

**Проблема:** Переменная окружения не попадает в Docker

**Решение:**
```bash
# Проверьте что .env в корне проекта
ls -la .env

# Проверьте docker-compose.yml
cat docker-compose.yml | grep TELEGRAM_BOT_TOKEN

# Пересоберите с новыми переменными
docker-compose down
docker-compose up -d --build
```

### 5. Бот запущен, но не отвечает

**Проблема:** Код бота не инициализируется

**Решение:**
```bash
# Проверьте что BotModule загружается
docker logs telegram-shop-backend 2>&1 | grep -i "bot\|telegraf"

# Проверьте что токен не пустой в коде
docker exec telegram-shop-backend sh -c 'echo $TELEGRAM_BOT_TOKEN'

# Если пустой - проверьте .env и перезапустите
docker-compose restart backend
```

## Автоматическое исправление

```bash
./fix-bot.sh
```

Этот скрипт:
1. Удалит webhook
2. Проверит токен
3. Перезапустит backend
4. Покажет логи

## Проверка что бот работает

```bash
# 1. Проверьте что контейнер запущен
docker ps | grep backend

# 2. Проверьте логи на ошибки
docker logs telegram-shop-backend --tail 50

# 3. Проверьте токен через API
curl "https://api.telegram.org/bot<TOKEN>/getMe"

# 4. Напишите боту в Telegram
# /start
```

## Если ничего не помогло

1. Соберите диагностику:
```bash
./diagnose-bot.sh > bot-diagnostic.txt
```

2. Проверьте файлы:
```bash
# Проверьте что модуль бота подключен
cat backend/src/app.module.ts | grep BotModule

# Проверьте конфигурацию бота
cat backend/src/modules/bot/bot.module.ts
```

3. Полная переустановка:
```bash
docker-compose down -v
docker-compose up -d --build
```

## Полезные команды

```bash
# Логи в реальном времени
docker logs -f telegram-shop-backend

# Войти в контейнер
docker exec -it telegram-shop-backend sh

# Проверить переменные внутри контейнера
docker exec telegram-shop-backend env | grep TELEGRAM

# Перезапустить только backend
docker-compose restart backend

# Пересобрать backend
docker-compose up -d --build backend
```

## Контакты для отладки

Если нужна помощь, предоставьте:
1. Вывод `./diagnose-bot.sh`
2. Логи: `docker logs telegram-shop-backend --tail 100`
3. Результат: `curl "https://api.telegram.org/bot<TOKEN>/getMe"`
