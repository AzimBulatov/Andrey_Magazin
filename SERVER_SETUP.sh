#!/bin/bash
# Полная настройка сервера Ubuntu 24.04 для TG_Bot

echo "=== Шаг 1: Обновление системы ==="
apt update
apt upgrade -y

echo "=== Шаг 2: Установка необходимых пакетов ==="
apt install -y curl wget git nano ufw

echo "=== Шаг 3: Установка Docker ==="
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

echo "=== Шаг 4: Установка Docker Compose ==="
apt install -y docker-compose

echo "=== Шаг 5: Настройка файрвола ==="
ufw allow 22/tcp
ufw allow 80/tcp
ufw --force enable

echo "=== Шаг 6: Проверка установки ==="
docker --version
docker-compose --version

echo "=== Готово! Теперь загрузите проект ==="
