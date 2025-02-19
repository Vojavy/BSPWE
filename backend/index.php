<?php
// Настройки подключения к PostgreSQL
// В docker-compose имя сервиса для базы данных (database) используется как hostname
$host = "database";  // имя сервиса из docker-compose
$port = "5432";
$dbname = "hosting_db";
$user = "admin";
$password = "password";

// Формируем DSN для PostgreSQL
$dsn = "pgsql:host=$host;port=$port;dbname=$dbname";

try {
    // Создаем объект PDO для подключения
    $pdo = new PDO($dsn, $user, $password);
    // Включаем режим выброса исключений при ошибках
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Подключение к базе данных успешно установлено!<br><br>";
    
    // Выполняем запрос для получения всех аккаунтов
    $stmt = $pdo->query("SELECT * FROM hosting_accounts");
    $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($accounts) {
        echo "<h3>Список аккаунтов:</h3>";
        echo "<pre>" . print_r($accounts, true) . "</pre>";
    } else {
        echo "Таблица hosting_accounts пуста.";
    }
    
} catch (PDOException $e) {
    // В случае ошибки выводим сообщение об ошибке
    echo "Ошибка подключения: " . $e->getMessage();
}
?>
