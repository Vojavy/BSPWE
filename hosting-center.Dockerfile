FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC
ENV PATH="/usr/local/bin:${PATH}"

# Настраиваем tzdata для отсутствия интерактивных вопросов
RUN echo "tzdata tzdata/Areas select Etc" | debconf-set-selections && \
    echo "tzdata tzdata/Zones/Etc select UTC" | debconf-set-selections

# Добавляем NodeSource для установки Node.js (например, версии 18)
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Добавляем репозиторий для PHP 8.1
RUN apt-get update && apt-get install -y software-properties-common && \
    add-apt-repository ppa:ondrej/php -y

# Обновляем систему и устанавливаем необходимые пакеты, включая PHP 8.1
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
    nodejs \
    supervisor \
    nano \
    libcap2-bin \
    dnsutils iputils-ping \
    && apt-get clean


# Устанавливаем Composer (для работы с Symfony)
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Устанавливаем глобальные npm-пакеты (Next.js и его зависимости)
WORKDIR /tmp/node-global
RUN npm install -g next react react-dom && rm -rf /tmp/node-global

# -----------------------------------
# Конфигурация Apache, BIND9 и FTP
# -----------------------------------

# Apache: копируем конфиг виртуального хоста для обратного проксирования
COPY apache/hosting.conf /etc/apache2/sites-available/hosting.conf
# Активируем сайт и необходимые модули (rewrite, proxy, proxy_http, vhost_alias)
RUN a2ensite hosting.conf && a2enmod rewrite proxy proxy_http vhost_alias

# BIND9: копируем конфигурацию зоны и основной конфиг
COPY bind/named.conf.local /etc/bind/named.conf.local
COPY bind/db.mojefirma /etc/bind/db.mojefirma

# FTP: копируем конфиг Pure-FTPd (например, для chroot)
COPY ftp/pure-ftpd.conf /etc/pure-ftpd/conf/ChrootEveryone
# Отключаем анонимный вход – файл, содержащий "yes"
RUN echo "yes" > /etc/pure-ftpd/conf/NoAnonymous
# Назначаем возможности для pure-ftpd, чтобы он мог прослушивать привилегированные порты
RUN setcap cap_net_bind_service+ep /usr/sbin/pure-ftpd

# -----------------------------------
# Установка кода приложения с кешированием зависимостей
# -----------------------------------

# Фронтенд (Next.js):
WORKDIR /var/www/front
COPY front/package.json ./
RUN npm install
COPY front/ ./
RUN npm run build

# Бэкенд (Symfony):
WORKDIR /var/www/backend
COPY backend/ ./
RUN composer install --no-dev --optimize-autoloader
RUN php bin/console cache:clear --env=prod

# -----------------------------------
# Копируем конфигурацию для Supervisor
COPY supervisor/hosting.conf /etc/supervisor/conf.d/hosting.conf

# -----------------------------------
# Копируем скрипт ENTRYPOINT
COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh
RUN apt-get update && apt-get install -y dos2unix && dos2unix /usr/local/bin/entrypoint.sh
RUN ls -la /usr/local/bin/entrypoint.sh

# Открываем порты:
EXPOSE 80 21 53/udp 3000 5000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-n"]
