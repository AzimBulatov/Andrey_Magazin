# Быстрый деплой на andreyshop.chickenkiller.com

## На сервере (один раз):

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

# 4. Перезайдите в систему
exit
```

## Деплой приложения:

```bash
# 1. Скопируйте проект на сервер
scp -r /path/to/TG_Bot user@server-ip:/home/user/

# 2. Подключитесь к серверу
ssh user@server-ip
cd /home/user/TG_Bot

# 3. Настройте переменные окружения
cp .env.production .env
nano .env  # Измените пароли и токены!

# 4. Запустите
docker-compose -f docker-compose.prod.yml --env-file .env up -d --build

# 5. Проверьте
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

## Готово!

Откройте: `http://andreyshop.chickenkiller.com`

## Полезные команды:

```bash
# Логи
docker-compose -f docker-compose.prod.yml logs -f

# Перезапуск
docker-compose -f docker-compose.prod.yml restart

# Остановка
docker-compose -f docker-compose.prod.yml down

# Обновление
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```
