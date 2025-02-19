CREATE TABLE IF NOT EXISTS hosting_accounts (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,

    -- Доступ к базе данных
    username VARCHAR(100) NOT NULL,
    pass TEXT NOT NULL,
    host VARCHAR(255) NOT NULL DEFAULT 'localhost',

    -- Доступ к FTP
    ftp_user VARCHAR(100) NOT NULL,
    ftp_pass TEXT NOT NULL,
    ftp_home VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
