# Инструкция по деплою на сервер

## Подготовка сервера

### 1. Установите Docker и Docker Compose на сервере

```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER

# Установите Docker Compose
sudo apt install docker-compose -y

# Перезайдите в систему для применения изменений
```

### 2. Настройте файрвол

```bash
# Разрешите HTTP трафик
sudo ufw allow 80/tcp

# Разрешите SSH (если еще не разрешен)
sudo ufw allow 22/tcp

# Включите файрвол
sudo ufw enable
```

## Деплой приложения

### 1. Скопируйте проект на сервер

```bash
# На вашем компьютере
scp -r /path/to/TG_Bot user@your-server-ip:/home/user/

# Или используйте git
ssh user@your-server-ip
cd /home/user
git clone your-repository-url TG_Bot
cd TG_Bot
```

### 2. Настройте переменные окружения

```bash
# Скопируйте файл с переменными
cp .env.production .env

# Отредактируйте .env
nano .env
```

Обязательно измените:
- `POSTGRES_PASSWORD` - надежный пароль для PostgreSQL
- `JWT_SECRET` - случайная строка для JWT токенов
- `TELEGRAM_BOT_TOKEN` - ваш токен бота
- `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY` - данные ЮKassa

### 3. Запустите приложение

```bash
# Запустите все сервисы
docker-compose -f docker-compose.prod.yml --env-file .env up -d --build

# Проверьте статус
docker-compose -f docker-compose.prod.yml ps

# Посмотрите логи
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Проверьте работу

Откройте в браузере: `http://andreyshop.chickenkiller.com`

## Управление приложением

### Просмотр логов

```bash
# Все логи
docker-compose -f docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Перезапуск сервисов

```bash
# Перезапустить все
docker-compose -f docker-compose.prod.yml restart

# Перезапустить конкретный сервис
docker-compose -f docker-compose.prod.yml restart backend
```

### Обновление приложения

```bash
# Остановите сервисы
docker-compose -f docker-compose.prod.yml down

# Обновите код (если используете git)
git pull

# Пересоберите и запустите
docker-compose -f docker-compose.prod.yml up -d --build
```

### Остановка приложения

```bash
# Остановить все сервисы
docker-compose -f docker-compose.prod.yml down

# Остановить и удалить volumes (ВНИМАНИЕ: удалит базу данных!)
docker-compose -f docker-compose.prod.yml down -v
```

## Резервное копирование

### Бэкап базы данных

```bash
# Создать бэкап
docker exec telegram-shop-db pg_dump -U postgres telegram_shop > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановить из бэкапа
docker exec -i telegram-shop-db psql -U postgres telegram_shop < backup_20260325_120000.sql
```

### Бэкап загруженных файлов

```bash
# Создать архив uploads
docker run --rm -v telegram-shop_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Восстановить uploads
docker run --rm -v telegram-shop_uploads_data:/data -v $(pwd):/backup alpine tar xzf /backup/uploads_backup_20260325_120000.tar.gz -C /data
```

## Мониторинг

### Проверка использования ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Использование диска
docker system df
```

### Очистка неиспользуемых ресурсов

```bash
# Удалить неиспользуемые образы, контейнеры, сети
docker system prune -a

# Удалить неиспользуемые volumes (ОСТОРОЖНО!)
docker volume prune
```

## Troubleshooting

### Проблема: Контейнер не запускается

```bash
# Проверьте логи
docker-compose -f docker-compose.prod.yml logs backend

# Проверьте статус
docker-compose -f docker-compose.prod.yml ps
```

### Проблема: База данных недоступна

```bash
# Проверьте что PostgreSQL запущен
docker-compose -f docker-compose.prod.yml ps postgres

# Проверьте логи PostgreSQL
docker-compose -f docker-compose.prod.yml logs postgres

# Подключитесь к базе вручную
docker exec -it telegram-shop-db psql -U postgres telegram_shop
```

### Проблема: Сайт не открывается

```bash
# Проверьте nginx
docker-compose -f docker-compose.prod.yml logs nginx

# Проверьте что порт 80 открыт
sudo netstat -tulpn | grep :80

# Проверьте файрвол
sudo ufw status
```

### Проблема: Telegram бот не работает

```bash
# Проверьте логи backend
docker-compose -f docker-compose.prod.yml logs backend | grep -i telegram

# Проверьте что TELEGRAM_BOT_TOKEN правильный
docker-compose -f docker-compose.prod.yml exec backend env | grep TELEGRAM
```

## Безопасность

### Рекомендации:

1. **Измените все пароли** в `.env` файле
2. **Настройте файрвол** - разрешите только необходимые порты
3. **Регулярно обновляйте** систему и Docker образы
4. **Делайте бэкапы** базы данных и файлов
5. **Мониторьте логи** на предмет подозрительной активности
6. **Используйте SSH ключи** вместо паролей для доступа к серверу

### Настройка автоматических бэкапов

Создайте cron задачу:

```bash
# Откройте crontab
crontab -e

# Добавьте задачу (бэкап каждый день в 3:00)
0 3 * * * cd /home/user/TG_Bot && docker exec telegram-shop-db pg_dump -U postgres telegram_shop > /home/user/backups/backup_$(date +\%Y\%m\%d).sql
```

## Полезные команды

```bash
# Войти в контейнер
docker exec -it telegram-shop-backend sh

# Проверить переменные окружения
docker-compose -f docker-compose.prod.yml exec backend env

# Перезагрузить nginx конфигурацию
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

# Посмотреть IP адреса контейнеров
docker network inspect tg_bot_app-network
```

## Контакты

При возникновении проблем проверьте:
1. Логи контейнеров
2. Статус сервисов
3. Доступность портов
4. Правильность переменных окружения
