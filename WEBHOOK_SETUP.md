# Настройка Webhook для Telegram бота

## Проблема

Telegram API блокируется провайдером через DPI (Deep Packet Inspection).
Polling не работает из-за таймаутов при подключении к api.telegram.org.

## Решение - Webhook

Вместо того чтобы бот постоянно опрашивал Telegram (polling),
Telegram сам будет отправлять обновления на ваш сервер (webhook).

## Что изменено

1. **bot.module.ts** - добавлена конфигурация webhook
2. **nginx/conf.d/default.conf** - добавлен роут `/telegram-webhook`
3. **.env.production** - добавлена переменная `WEBHOOK_DOMAIN`
4. **docker-compose.yml** - пробрасывается `WEBHOOK_DOMAIN`

## Установка на сервере

```bash
# 1. Обновите .env на сервере
nano .env
# Добавьте строку:
# WEBHOOK_DOMAIN=http://andreyshop.chickenkiller.com

# 2. Пересоберите и перезапустите
docker-compose down
docker-compose up -d --build

# 3. Проверьте что webhook установлен
curl "https://api.telegram.org/bot8548014458:AAHxiyZ8136trjrUDfAOvBPg1_z5CX3nTBc/getWebhookInfo"

# Должно показать:
# "url": "http://andreyshop.chickenkiller.com/telegram-webhook"
```

## Проверка работы

```bash
# 1. Проверьте логи
docker logs -f telegram-shop-backend

# 2. Напишите боту в Telegram
# /start

# 3. В логах должны появиться сообщения о получении обновлений
```

## Если не работает

### Вручную установить webhook:

```bash
curl -X POST "https://api.telegram.org/bot8548014458:AAHxiyZ8136trjrUDfAOvBPg1_z5CX3nTBc/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://andreyshop.chickenkiller.com/telegram-webhook"}'
```

### Удалить webhook (вернуться к polling):

```bash
curl "https://api.telegram.org/bot8548014458:AAHxiyZ8136trjrUDfAOvBPg1_z5CX3nTBc/deleteWebhook"
```

### Проверить статус webhook:

```bash
curl "https://api.telegram.org/bot8548014458:AAHxiyZ8136trjrUDfAOvBPg1_z5CX3nTBc/getWebhookInfo"
```

## Важно

- Webhook работает только с HTTP/HTTPS
- Telegram будет отправлять POST запросы на ваш сервер
- Nginx проксирует запросы на backend
- Если домен изменится - нужно обновить webhook

## Альтернатива - VPN/Proxy

Если webhook не подходит, можно настроить VPN на сервере:
- WireGuard
- OpenVPN
- Shadowsocks

Но webhook - более простое и надежное решение.
