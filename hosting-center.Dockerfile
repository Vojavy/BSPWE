# Базовый образ: Ubuntu 20.04
FROM ubuntu:20.04

# Устанавливаем переменные окружения:
# DEBIAN_FRONTEND=noninteractive – для автоматической установки без интерактивного ввода
# TZ=UTC – устанавливаем часовой пояс
# PATH – добавляем пути для глобально установленных пакетов (например, Bun)
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC
ENV PATH="/usr/local/bin:/root/.bun/bin:${PATH}"

# Настраиваем tzdata для отсутствия интерактивных вопросов при установке пакетов
RUN echo "tzdata tzdata/Areas select Etc" | debconf-set-selections && \
    echo "tzdata tzdata/Zones/Etc select UTC" | debconf-set-selections

# Устанавливаем базовые утилиты: curl, gnupg, unzip, git
RUN apt-get update && apt-get install -y curl gnupg unzip git

# Добавляем репозиторий для PHP 8.1
RUN apt-get update && apt-get install -y software-properties-common && \
    add-apt-repository ppa:ondrej/php -y

# Обновляем систему и устанавливаем необходимые пакеты:
# apache2 – веб-сервер
# bind9 – DNS-сервер
# pure-ftpd – FTP-сервер
# php8.1 и необходимые расширения для Symfony (pgsql, xml, zip)
# libapache2-mod-php8.1 – модуль для интеграции PHP с Apache
# supervisor – для управления несколькими процессами в контейнере
# nano – текстовый редактор (для отладки)
# libcap2-bin – для команды setcap
# dnsutils, iputils-ping – утилиты для работы с сетью
# postgresql-client – для подключения к базе PostgreSQL (если необходимо)
# openssl – для работы с сертификатами
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

# Создаем базовую директорию для веб-кода и даем права пользователю www-data
RUN mkdir -p /var/www && chown -R www-data:www-data /var/www

# -------------------------
# Установка Bun вместо Node.js
# -------------------------
# Bun используется для установки и запуска Next.js-приложения.
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.2.4"

# -------------------------
# Установка Composer для работы с Symfony
# -------------------------
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# -------------------------
# Устанавливаем глобальные пакеты для Next.js через Bun
# Это позволит установить next, react и react-dom глобально и использовать их для сборки приложения
WORKDIR /tmp/bun-global
RUN bun install -g next react react-dom && rm -rf /tmp/bun-global

# -------------------------
# Конфигурация Apache, BIND9 и Pure-FTPd
# -------------------------

# Apache:
# Копируем конфигурационный файл виртуального хоста для обратного проксирования.
# В этом файле (apache/hosting.conf) можно указать, как Apache будет обрабатывать запросы к основному домену
# (например, hosting.mojefirma.cz) и перенаправлять их на Next.js (порт 3000) и PHP-бэкенд (порт 5000).
COPY apache/hosting.conf /etc/apache2/sites-available/hosting.conf
# Активируем сайт и включаем необходимые модули: rewrite, proxy, proxy_http, vhost_alias
RUN a2ensite hosting.conf && a2enmod rewrite proxy proxy_http vhost_alias

# BIND9:
# Копируем файлы конфигурации для DNS-сервера:
# named.conf.local – основной конфиг для зон
# db.mojefirma – зонный файл для домена mojefirma.cz
COPY bind/named.conf.local /etc/bind/named.conf.local
COPY bind/db.mojefirma /etc/bind/db.mojefirma

# Pure-FTPd:
# Копируем конфигурационный файл для настройки chroot для пользователей
COPY ftp/pure-ftpd.conf /etc/pure-ftpd/conf/ChrootEveryone
# Отключаем анонимный вход, создавая файл, содержащий "yes"
RUN echo "yes" > /etc/pure-ftpd/conf/NoAnonymous
# Назначаем возможности для pure-ftpd, чтобы он мог прослушивать привилегированные порты (например, порт 21)
RUN setcap cap_net_bind_service+ep /usr/sbin/pure-ftpd

# -------------------------
# Установка кода приложения
# -------------------------

# Фронтенд (Next.js) с использованием Bun:
WORKDIR /var/www/front
# Копируем package.json для установки зависимостей (кеширование слоя, если зависимости не меняются)
COPY front/package.json ./
RUN bun install
# Копируем весь исходный код фронтенда
COPY front/ ./
# Собираем Next.js приложение для production
RUN bun run build

# Бэкенд (Symfony):
WORKDIR /var/www/backend
# Копируем весь код Symfony-проекта
COPY backend/ ./
# Устанавливаем зависимости через Composer (без dev-зависимостей, оптимизируем автозагрузчик)
RUN composer install --no-dev --optimize-autoloader
# Очищаем кеш для production-окружения
RUN php bin/console cache:clear --env=prod

# -------------------------
# Конфигурация Supervisor для управления процессами
# -------------------------
# Копируем конфигурационный файл для Supervisor, в котором прописаны команды запуска всех сервисов:
# Apache, BIND9, Pure-FTPd, Next.js и PHP-бэкенда (Symfony)
COPY supervisor/hosting.conf /etc/supervisor/conf.d/hosting.conf

# -------------------------
# Скрипт ENTRYPOINT
# -------------------------
# Копируем скрипт entrypoint.sh, который может выполнять дополнительные инициализационные действия (например, настройку FTP-пользователей)
COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh
# Преобразуем файл в Unix-формат с помощью dos2unix и устанавливаем права на выполнение
RUN apt-get update && apt-get install -y dos2unix && dos2unix /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
# Проверяем, что файл существует и имеет корректные права
RUN ls -la /usr/local/bin/entrypoint.sh

# -------------------------
# Открываем необходимые порты:
# 80    – Apache (reverse proxy)
# 21    – FTP
# 53/udp– DNS
# 3000  – Next.js (фронтенд)
# 5000  – PHP-бэкенд (Symfony)
# Дополнительно, диапазон портов 30000-30009 может использоваться, например, для пассивного режима FTP (если настроено)
EXPOSE 80 21 53/udp 3000 5000 30000-30009

# -------------------------
# Указываем ENTRYPOINT и CMD
# ENTRYPOINT запускает скрипт entrypoint.sh, который может выполнять предварительные настройки,
# а затем передает управление в Supervisor, который будет запускать все сервисы.
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-n"]
