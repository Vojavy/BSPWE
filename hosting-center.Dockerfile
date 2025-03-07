# Базовый образ: Ubuntu 20.04
FROM ubuntu:20.04

# Устанавливаем переменные окружения:
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC
ENV PATH="/usr/local/bin:/root/.bun/bin:${PATH}"

# Настраиваем tzdata для отсутствия интерактивных вопросов
RUN echo "tzdata tzdata/Areas select Etc" | debconf-set-selections && \
    echo "tzdata tzdata/Zones/Etc select UTC" | debconf-set-selections

# Устанавливаем базовые утилиты
RUN apt-get update && apt-get install -y curl gnupg unzip git

# Добавляем репозиторий для PHP 8.1
RUN apt-get update && apt-get install -y software-properties-common && \
    add-apt-repository ppa:ondrej/php -y

# Обновляем систему и устанавливаем необходимые пакеты
RUN apt-get update && apt-get install -y \
    apache2 \
    bind9 \
    proftpd-basic \
    php8.1 \
    php8.1-pgsql \
    php8.1-xml \
    php8.1-zip \
    unzip \
    git \
    libapache2-mod-php8.1 \
    supervisor \
    nano \
    libcap2-bin \
    dnsutils iputils-ping \
    postgresql-client \
    openssl \
    && apt-get clean

# Добавляем глобальный ServerName для Apache
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf
# Создаем директории для логов Apache
RUN mkdir -p /var/log/apache2 && \
    chown -R www-data:www-data /var/log/apache2 && \
    chmod -R 755 /var/log/apache2

# Создаем базовую директорию для веб-кода и даем права пользователю www-data
RUN mkdir -p /var/www && chown -R www-data:www-data /var/www

# Создаем группу FTP и базовые директории
RUN groupadd -g 2000 ftp && \
    mkdir -p /var/www/users && \
    mkdir -p /var/ftp && \
    chown root:ftp /var/www/users && \
    chmod 775 /var/www/users

# -------------------------
# Установка Bun вместо Node.js
# -------------------------
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.2.4"

# -------------------------
# Установка Composer для работы с Symfony
# -------------------------
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# -------------------------
# Устанавливаем глобальные пакеты для Next.js через Bun
# -------------------------
WORKDIR /tmp/bun-global
RUN bun install -g next react react-dom && rm -rf /tmp/bun-global

# -------------------------
# Конфигурация Apache, BIND9 и ProFTPD
# -------------------------

# Apache:
COPY apache/hosting.conf /etc/apache2/sites-available/hosting.conf
RUN a2ensite hosting.conf && a2enmod rewrite proxy proxy_http vhost_alias

# BIND9:
COPY bind/named.conf.local /etc/bind/named.conf.local
COPY bind/db.mojefirma /etc/bind/db.mojefirma

# ProFTPD:
RUN mkdir -p /etc/ssl/private && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/proftpd.pem \
    -out /etc/ssl/private/proftpd.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" && \
    chmod 600 /etc/ssl/private/proftpd.pem

# Создаем директории для логов ProFTPD
RUN mkdir -p /var/log/proftpd && \
    touch /var/log/proftpd/proftpd.log && \
    touch /var/log/proftpd/xferlog && \
    touch /var/log/proftpd/tls.log && \
    chmod -R 755 /var/log/proftpd

# Создаем тестового FTP пользователя
RUN useradd -u 2000 -g ftp -d /var/ftp/ftp_5ce448a6 -s /bin/false ftp_5ce448a6 && \
    echo "ftp_5ce448a6:FKnQ5ZyygBDB7U6K" | chpasswd && \
    mkdir -p /var/ftp/ftp_5ce448a6 && \
    chown -R ftp_5ce448a6:ftp /var/ftp/ftp_5ce448a6 && \
    chmod 755 /var/ftp/ftp_5ce448a6

# Копируем конфигурацию ProFTPD
COPY ftp-config/proftpd.conf /etc/proftpd/proftpd.conf
RUN chmod 644 /etc/proftpd/proftpd.conf && \
    chown root:root /etc/proftpd/proftpd.conf

# -------------------------
# Установка кода приложения
# -------------------------

# Фронтенд (Next.js) с использованием Bun:
WORKDIR /var/www/front
COPY front/package.json ./
RUN bun install
COPY front/ ./
RUN bun run build

# Бэкенд (Symfony):
WORKDIR /var/www/backend
COPY backend/ ./
RUN composer require symfony/process:^6.4 --no-update
RUN composer install --no-dev --optimize-autoloader
RUN php bin/console cache:clear --env=prod

# -------------------------
# Конфигурация Supervisor для управления процессами
# -------------------------
COPY supervisor/hosting.conf /etc/supervisor/conf.d/hosting.conf

# -------------------------
# Скрипт ENTRYPOINT
# -------------------------
COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh
RUN apt-get update && apt-get install -y dos2unix && dos2unix /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
RUN ls -la /usr/local/bin/entrypoint.sh

# -------------------------
# Открываем необходимые порты
# -------------------------
EXPOSE 80 21 53/udp 3000 5000 30000-30009

# -------------------------
# Указываем ENTRYPOINT и CMD
# -------------------------
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-n"]
