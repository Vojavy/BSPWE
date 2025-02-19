FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC
# Обновляем PATH, чтобы глобально установленные npm-пакеты (например, next) были доступны
ENV PATH="/usr/local/bin:${PATH}"

# Настраиваем tzdata для отсутствия интерактивных вопросов
RUN echo "tzdata tzdata/Areas select Etc" | debconf-set-selections && \
    echo "tzdata tzdata/Zones/Etc select UTC" | debconf-set-selections

# Добавляем NodeSource для установки Node.js (например, версии 18)
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Устанавливаем системные зависимости и пакеты
RUN apt-get update && apt-get install -y \
    apache2 \
    bind9 \
    pure-ftpd \
    php \
    php-pgsql \
    libapache2-mod-php \
    nodejs \
    supervisor \
    nano \
    libcap2-bin \
    dnsutils iputils-ping \
    && apt-get clean

# Устанавливаем глобальные npm-пакеты (Next.js и его зависимости) в отдельном слое для кеширования
WORKDIR /tmp/node-global
RUN npm install -g next react react-dom && rm -rf /tmp/node-global

# -----------------------------------
# Конфигурация Apache, BIND9 и FTP
# -----------------------------------

## Apache: копируем конфиг виртуального хоста для обратного проксирования
## В файле hosting.conf обязательно укажи для динамических поддоменов:
##    VirtualDocumentRoot /var/www/front/%1
COPY apache/hosting.conf /etc/apache2/sites-available/hosting.conf
# Активируем сайт и необходимые модули (rewrite, proxy, proxy_http, vhost_alias)
RUN a2ensite hosting.conf && a2enmod rewrite proxy proxy_http vhost_alias

## BIND9: копируем конфигурацию зоны и основной конфиг
COPY bind/named.conf.local /etc/bind/named.conf.local
COPY bind/db.mojefirma /etc/bind/db.mojefirma

## FTP: копируем конфиг Pure-FTPD (например, для chroot)
COPY ftp/pure-ftpd.conf /etc/pure-ftpd/conf/ChrootEveryone
# Отключаем анонимный вход – файл, содержащий "yes"
RUN echo "yes" > /etc/pure-ftpd/conf/NoAnonymous
# Назначаем возможности для pure-ftpd, чтобы он мог прослушивать привилегированные порты (например, порт 21)
RUN setcap cap_net_bind_service+ep /usr/sbin/pure-ftpd

# -----------------------------------
# Установка кода приложения с кешированием зависимостей
# -----------------------------------

# Фронтенд (Next.js):
# Сначала копируем package.json для установки зависимостей – это позволит кешировать слой, если код изменяется, а зависимости нет.
WORKDIR /var/www/front
COPY front/package.json ./
RUN npm install

# Затем копируем весь исходный код фронтенда
COPY front/ .

# Собираем Next.js приложение для production
RUN npm run build

# Бэкенд:
COPY backend /var/www/backend

# -----------------------------------
# Копируем конфигурацию для Supervisor
# В файле supervisor/hosting.conf прописаны команды запуска для всех сервисов.
COPY supervisor/hosting.conf /etc/supervisor/conf.d/hosting.conf

# -----------------------------------
# Копируем скрипт и настраиваем ENTRYPOINT
# Этот скрипт создаст FTP-пользователя, если заданы переменные FTP_USER и FTP_PASS.
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Открываем необходимые порты:
# 80    – Apache (reverse proxy)
# 21    – FTP
# 53/udp– DNS
# 3000  – Next.js (фронтенд)
# 5000  – PHP‑бэкенд
EXPOSE 80 21 53/udp 3000 5000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-n"]
