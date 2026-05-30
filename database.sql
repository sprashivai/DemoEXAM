CREATE DATABASE IF NOT EXISTS conference_db;
USE conference_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    price_per_hour INT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    booking_date VARCHAR(20) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Новая',
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

INSERT INTO rooms (name, type, capacity, price_per_hour) VALUES
('Аудитория 101', 'Аудитория', 50, 2000),
('Аудитория 202', 'Аудитория', 80, 3000),
('Коворкинг Центр', 'Коворкинг', 30, 1500),
('Коворкинг Лофт', 'Коворкинг', 45, 2500),
('Кинозал Империя', 'Кинозал', 120, 5000),
('Кинозал Премиум', 'Кинозал', 200, 8000);

INSERT INTO users (login, password, fullname, phone, email, role) VALUES
('Admin26', 'Demo20', 'Системный Администратор', '8(999)000-00-00', 'admin@conference.ru', 'admin');