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
    pure-ftpd \
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

# Создаем базовую директорию для веб-кода и даем права пользователю www-data
RUN mkdir -p /var/www && chown -R www-data:www-data /var/www

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
# Конфигурация Apache, BIND9 и Pure-FTPd
# -------------------------

# Apache:
COPY apache/hosting.conf /etc/apache2/sites-available/hosting.conf
RUN a2ensite hosting.conf && a2enmod rewrite proxy proxy_http vhost_alias

# BIND9:
COPY bind/named.conf.local /etc/bind/named.conf.local
COPY bind/db.mojefirma /etc/bind/db.mojefirma

# Pure-FTPd:
# Копируем внешние файлы конфигурации (переименовывая их при копировании)
COPY ftp-config/pure-ftpd.conf /etc/pure-ftpd/
# Назначаем возможности для pure-ftpd
RUN setcap cap_net_bind_service+ep /usr/sbin/pure-ftpd

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
