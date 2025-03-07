#!/bin/bash
set -e

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
    echo "Creating FTP user: $FTP_USER"
    HOME_DIR="/var/ftp/$FTP_USER"
    mkdir -p "$HOME_DIR"
    
    # Создаем пользователя с указанным паролем
    useradd -m -d "$HOME_DIR" -s /bin/false "$FTP_USER" || true
    echo "$FTP_USER:$FTP_PASS" | chpasswd
    
    # Настраиваем права доступа
    chown -R "$FTP_USER:$FTP_USER" "$HOME_DIR"
    chmod 755 "$HOME_DIR"
fi

# Make sure Apache port is available
echo "Checking if port 80 is in use..."
if lsof -i:80 > /dev/null 2>&1; then
  echo "Port 80 is already in use. Killing process..."
  fuser -k 80/tcp || true
  sleep 2
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
