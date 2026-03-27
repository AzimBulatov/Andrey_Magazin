# 🔐 Руководство по бэкапам

## Автоматическая настройка (на сервере)

```bash
# 1. Загрузи файлы на сервер через FileZilla:
#    - backup-all.sh
#    - restore-backup.sh
#    - setup-auto-backup.sh

# 2. Запусти настройку
chmod +x setup-auto-backup.sh
./setup-auto-backup.sh
```

Готово! Бэкапы будут создаваться каждый день в 3:00 ночи.

---

## Ручные команды

### Создать бэкап вручную:
```bash
./backup-all.sh
```

### Восстановить из последнего бэкапа:
```bash
./restore-backup.sh
```

### Посмотреть список бэкапов:
```bash
ls -lh /root/backups
```

### Скачать бэкап на компьютер (через FileZilla):
1. Подключись к серверу
2. Перейди в `/root/backups`
3. Скачай нужные файлы

---

## Что бэкапится

### 1. База данных PostgreSQL
- Файл: `db_backup_YYYYMMDD_HHMMSS.sql`
- Содержит: все таблицы, данные, структуру
- Формат: SQL дамп

### 2. Загруженные файлы (картинки товаров)
- Файл: `uploads_backup_YYYYMMDD_HHMMSS.tar.gz`
- Содержит: все загруженные изображения товаров
- Формат: tar.gz архив

---

## Расписание автоматических бэкапов

- **Время**: Каждый день в 3:00 ночи
- **Хранение**: 7 дней (старые удаляются автоматически)
- **Логи**: `/root/backups/backup.log`

---

## Восстановление из бэкапа

### Автоматическое (последний бэкап):
```bash
./restore-backup.sh
```

### Ручное (конкретный бэкап):

**База данных:**
```bash
# Выбери файл бэкапа
BACKUP_FILE="/root/backups/db_backup_20260327_150000.sql"

# Восстанови
docker exec -i telegram-shop-db psql -U postgres -c "DROP DATABASE IF EXISTS telegram_shop;"
docker exec -i telegram-shop-db psql -U postgres -c "CREATE DATABASE telegram_shop;"
docker exec -i telegram-shop-db psql -U postgres telegram_shop < $BACKUP_FILE

# Перезапусти backend
docker-compose restart backend
```

**Файлы (картинки):**
```bash
# Выбери файл бэкапа
BACKUP_FILE="/root/backups/uploads_backup_20260327_150000.tar.gz"

# Восстанови
docker run --rm \
    -v andrey_magazin_uploads_data:/data \
    -v /root/backups:/backup \
    alpine sh -c "rm -rf /data/* && tar xzf /backup/$(basename $BACKUP_FILE) -C /data"
```

---

## Проверка бэкапов

### Проверить что cron работает:
```bash
# Посмотреть задачи
crontab -l

# Посмотреть логи
tail -f /root/backups/backup.log
```

### Проверить размер бэкапов:
```bash
du -sh /root/backups
```

### Проверить последний бэкап:
```bash
ls -lht /root/backups | head -5
```

---

## Скачивание бэкапов на компьютер

### Через FileZilla:
1. Подключись к серверу (sftp://157.22.175.187)
2. Перейди в `/root/backups`
3. Скачай нужные файлы на компьютер

### Через SCP (из командной строки):
```bash
# Скачать последний бэкап БД
scp root@157.22.175.187:/root/backups/db_backup_*.sql ./

# Скачать последний бэкап файлов
scp root@157.22.175.187:/root/backups/uploads_backup_*.tar.gz ./
```

---

## Важно!

✅ Бэкапы хранятся 7 дней  
✅ Автоматически удаляются старые  
✅ Можно скачать на компьютер для долгого хранения  
✅ Восстановление занимает 1-2 минуты  

⚠️ Не забывай периодически скачивать бэкапы на свой компьютер!
