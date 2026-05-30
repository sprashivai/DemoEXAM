require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

const promiseDb = db.promise();

app.post('/api/register', async (req, res) => {
    const { login, password, fullname, phone, email } = req.body;
    
    if (!login || login.length < 6 || !/^[a-zA-Z0-9]+$/.test(login)) {
        return res.json({ success: false, message: 'Логин должен быть не менее 6 символов (только латиница и цифры)' });
    }
    if (!password || password.length < 8) {
        return res.json({ success: false, message: 'Пароль должен быть не менее 8 символов' });
    }
    if (!fullname || !/^[а-яА-ЯёЁ\s]+$/.test(fullname)) {
        return res.json({ success: false, message: 'ФИО должно содержать только буквы кириллицы' });
    }
    if (!phone || !/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(phone)) {
        return res.json({ success: false, message: 'Телефон должен быть в формате 8(XXX)XXX-XX-XX' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.json({ success: false, message: 'Введите корректный email адрес' });
    }
    
    try {
        const [existing] = await promiseDb.query('SELECT id FROM users WHERE login = ?', [login]);
        if (existing.length > 0) {
            return res.json({ success: false, message: 'Пользователь с таким логином уже существует' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await promiseDb.query(
            'INSERT INTO users (login, password, fullname, phone, email, role) VALUES (?, ?, ?, ?, ?, ?)',
            [login, hashedPassword, fullname, phone, email, 'user']
        );
        res.json({ success: true, message: 'Регистрация прошла успешно' });
    } catch (err) {
        res.json({ success: false, message: 'Ошибка при регистрации' });
    }
});

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    
    try {
        const [users] = await promiseDb.query('SELECT id, password, role, fullname FROM users WHERE login = ?', [login]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'Неверный логин или пароль' });
        }
        const isValid = await bcrypt.compare(password, users[0].password);
        if (!isValid) {
            return res.json({ success: false, message: 'Неверный логин или пароль' });
        }
        const token = Buffer.from(`${users[0].id}:${Date.now()}`).toString('base64');
        res.json({ 
            success: true, 
            userId: users[0].id, 
            role: users[0].role, 
            fullname: users[0].fullname,
            token 
        });
    } catch (err) {
        res.json({ success: false, message: 'Ошибка при входе' });
    }
});

app.get('/api/rooms', async (req, res) => {
    try {
        const [rooms] = await promiseDb.query('SELECT * FROM rooms ORDER BY type, name');
        res.json({ success: true, data: rooms });
    } catch (err) {
        res.json({ success: false, data: [] });
    }
});

app.get('/api/bookings/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [bookings] = await promiseDb.query(
            `SELECT b.*, r.name as room_name, r.type as room_type 
             FROM bookings b 
             JOIN rooms r ON b.room_id = r.id 
             WHERE b.user_id = ? 
             ORDER BY b.created_at DESC`,
            [userId]
        );
        res.json({ success: true, data: bookings });
    } catch (err) {
        res.json({ success: false, data: [] });
    }
});

app.post('/api/bookings', async (req, res) => {
    const { userId, roomId, bookingDate, startTime, paymentMethod } = req.body;
    
    const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
    if (!dateRegex.test(bookingDate)) {
        return res.json({ success: false, message: 'Неверный формат даты. Используйте ДД.ММ.ГГГГ' });
    }
    
    try {
        await promiseDb.query(
            'INSERT INTO bookings (user_id, room_id, booking_date, start_time, payment_method, status) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, roomId, bookingDate, startTime, paymentMethod, 'Новая']
        );
        res.json({ success: true, message: 'Заявка успешно создана' });
    } catch (err) {
        res.json({ success: false, message: 'Ошибка при создании заявки' });
    }
});

app.post('/api/review', async (req, res) => {
    const { userId, bookingId, review } = req.body;
    
    try {
        const [booking] = await promiseDb.query(
            'SELECT status FROM bookings WHERE id = ? AND user_id = ?',
            [bookingId, userId]
        );
        if (booking.length === 0) {
            return res.json({ success: false, message: 'Заявка не найдена' });
        }
        if (booking[0].status !== 'Мероприятие завершено') {
            return res.json({ success: false, message: 'Отзыв можно оставить только после завершения мероприятия' });
        }
        await promiseDb.query('UPDATE bookings SET review = ? WHERE id = ?', [review, bookingId]);
        res.json({ success: true, message: 'Отзыв успешно добавлен' });
    } catch (err) {
        res.json({ success: false, message: 'Ошибка при добавлении отзыва' });
    }
});

app.post('/api/admin/login', async (req, res) => {
    const { password } = req.body;
    if (password === 'Demo20') {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Неверный пароль администратора' });
    }
});

app.get('/api/admin/bookings', async (req, res) => {
    try {
        const [bookings] = await promiseDb.query(
            `SELECT b.*, u.login as user_login, u.fullname as user_fullname, u.phone, u.email, r.name as room_name, r.type as room_type 
             FROM bookings b 
             JOIN users u ON b.user_id = u.id 
             JOIN rooms r ON b.room_id = r.id 
             ORDER BY b.created_at DESC`
        );
        res.json({ success: true, data: bookings });
    } catch (err) {
        res.json({ success: false, data: [] });
    }
});

app.put('/api/admin/booking-status', async (req, res) => {
    const { bookingId, status } = req.body;
    try {
        await promiseDb.query('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);
        res.json({ success: true, message: 'Статус обновлен' });
    } catch (err) {
        res.json({ success: false, message: 'Ошибка при обновлении статуса' });
    }
});

app.post('/api/verify', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json({ success: false });
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        const [userId] = decoded.split(':');
        const [users] = await promiseDb.query('SELECT id, role FROM users WHERE id = ?', [userId]);
        if (users.length > 0) {
            res.json({ success: true, userId: users[0].id, role: users[0].role });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        res.json({ success: false });
    }
});

app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(process.env.PORT, () => {
    console.log(`Сервер запущен на http://localhost:${process.env.PORT}`);
    console.log('Администратор: Admin26 / Demo20');
});