-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,  -- Храним хеш пароля
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица хостинг-аккаунтов
CREATE TABLE hosting_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,  -- ID владельца аккаунта
    domain VARCHAR(255) NOT NULL UNIQUE,
    
    -- Доступ к базе данных
    user_db VARCHAR(100) NOT NULL,
    pass_db TEXT NOT NULL,
    name_db VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL DEFAULT 'localhost',

    -- Доступ к FTP
    ftp_user VARCHAR(100) NOT NULL,
    ftp_pass TEXT NOT NULL,
    ftp_home VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Связь с таблицей users
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);