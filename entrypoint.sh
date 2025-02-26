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

# Запускаем переданный процесс (например, supervisord)
exec "$@"
