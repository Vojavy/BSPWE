#!/bin/bash
set -e

# Отключаем анонимный вход (на всякий случай)
echo "yes" > /etc/pure-ftpd/conf/NoAnonymous

# Создаем группу ftp, если её нет
if ! getent group ftp > /dev/null; then
  echo "Creating group ftp"
  groupadd ftp
fi

# Создаем пользователя ftp, если его нет
if ! id ftp > /dev/null 2>&1; then
  echo "Creating user ftp"
  useradd -g ftp -d /var/ftp -s /usr/sbin/nologin ftp
fi

# Если заданы переменные для FTP, создаём FTP-пользователя, если он отсутствует
if [ -n "$FTP_USER" ] && [ -n "$FTP_PASS" ]; then
    if pure-pw show "$FTP_USER" > /dev/null 2>&1; then
        echo "FTP user '$FTP_USER' already exists, skipping creation."
    else
        echo "Creating FTP user: $FTP_USER"
        HOME_DIR="/var/www/ftp/$FTP_USER"
        mkdir -p "$HOME_DIR"
        chown ftp:ftp "$HOME_DIR"
        # Добавляем FTP-пользователя через pure-pw
        echo -e "$FTP_PASS\n$FTP_PASS" | pure-pw useradd "$FTP_USER" -u ftp -d "$HOME_DIR"
        pure-pw mkdb
    fi
fi

# Ждем, пока база данных будет готова
echo "Waiting for database to be ready..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if pg_isready -h database -p 5432 -U admin -d hosting_db > /dev/null 2>&1; then
        echo "Database is ready!"
        break
    fi
    attempt=$((attempt+1))
    echo "Waiting for database... attempt $attempt of $max_attempts"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "Database connection timed out. Continuing anyway..."
else
    # Проверяем существование таблиц и запускаем миграции Doctrine
    echo "Running database migrations..."
    cd /var/www/backend
    
    # Проверяем, существуют ли таблицы в базе данных
    echo "Checking if database schema exists..."
    TABLES_COUNT=$(PGPASSWORD=password psql -h database -U admin -d hosting_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    
    if [ "$TABLES_COUNT" -eq "0" ]; then
        echo "Database schema is empty. Creating schema..."
        php bin/console doctrine:schema:create --no-interaction || echo "Schema creation failed, but continuing..."
    fi
    
    # Запускаем миграции
    php bin/console doctrine:migrations:migrate -n || echo "Migration failed, but continuing..."
fi

# Запускаем переданный процесс (например, supervisord)
exec "$@"
