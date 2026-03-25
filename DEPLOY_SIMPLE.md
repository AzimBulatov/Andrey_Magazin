# Деплой на andreyshop.chickenkiller.com

## На сервере (первый раз):

```bash
# 1. Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 2. Установите Docker Compose
sudo apt install docker-compose -y

# 3. Откройте порт 80
sudo ufw allow 80/tcp
sudo ufw enable

# 4. Перезайдите
exit
```

## Деплой:

```bash
# 1. Скопируйте проект на сервер
scp -r /path/to/TG_Bot user@server-ip:/home/user/

# 2. Подключитесь к серверу
ssh user@server-ip
cd /home/user/TG_Bot

# 3. Создайте .env файл
cp .env.production .env

# 4. Отредактируйте .env (ОБЯЗАТЕЛЬНО!)
nano .env
# Измените:
# - POSTGRES_PASSWORD (придумайте надежный пароль)
# - JWT_SECRET (случайная строка)

# 5. Запустите
docker-compose up -d --build

# 6. Проверьте
docker-compose ps
docker-compose logs -f
```

## Готово!

Сайт: http://andreyshop.chickenkiller.com

## Управление:

```bash
# Логи
docker-compose logs -f

# Перезапуск
docker-compose restart

# Остановка
docker-compose down

# Обновление
git pull
docker-compose up -d --build

# Бэкап БД
docker exec telegram-shop-db pg_dump -U postgres telegram_shop > backup.sql
```

## Важно:

1. Измените `POSTGRES_PASSWORD` и `JWT_SECRET` в `.env`
2. Не коммитьте `.env` в git
3. Делайте регулярные бэкапы базы данных
