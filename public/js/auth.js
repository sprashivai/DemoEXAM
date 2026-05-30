const API_URL = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (token) {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.style.display = 'block';
    }
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegister);
    }
});

async function handleLogin() {
    const login = document.getElementById('loginInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const loginError = document.getElementById('loginError');
    const passwordError = document.getElementById('passwordError');
    const messageDiv = document.getElementById('loginMessage');
    
    loginError.textContent = '';
    passwordError.textContent = '';
    messageDiv.innerHTML = '';
    
    if (!login) {
        loginError.textContent = 'Введите логин';
        return;
    }
    if (!password) {
        passwordError.textContent = 'Введите пароль';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password })
        });
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userName', data.fullname);
            messageDiv.innerHTML = '<div class="success">Вход выполнен! Перенаправление...</div>';
            setTimeout(() => {
                window.location.href = '/profile.html';
            }, 1000);
        } else {
            messageDiv.innerHTML = `<div class="error">${data.message}</div>`;
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="error">Ошибка соединения с сервером</div>';
    }
}

async function handleRegister() {
    const login = document.getElementById('regLogin').value.trim();
    const password = document.getElementById('regPassword').value;
    const fullname = document.getElementById('regFullname').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    
    const loginHint = document.getElementById('loginHint');
    const passwordHint = document.getElementById('passwordHint');
    const fullnameHint = document.getElementById('fullnameHint');
    const phoneHint = document.getElementById('phoneHint');
    const emailHint = document.getElementById('emailHint');
    const messageDiv = document.getElementById('registerMessage');
    
    loginHint.textContent = '';
    passwordHint.textContent = '';
    fullnameHint.textContent = '';
    phoneHint.textContent = '';
    emailHint.textContent = '';
    messageDiv.innerHTML = '';
    
    let isValid = true;
    
    if (!login || login.length < 6 || !/^[a-zA-Z0-9]+$/.test(login)) {
        loginHint.textContent = 'Логин: минимум 6 символов, только латиница и цифры';
        isValid = false;
    }
    
    if (!password || password.length < 8) {
        passwordHint.textContent = 'Пароль: минимум 8 символов';
        isValid = false;
    }
    
    if (!fullname || !/^[а-яА-ЯёЁ\s]+$/.test(fullname)) {
        fullnameHint.textContent = 'ФИО: только буквы кириллицы';
        isValid = false;
    }
    
    if (!phone || !/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(phone)) {
        phoneHint.textContent = 'Телефон: формат 8(XXX)XXX-XX-XX';
        isValid = false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        emailHint.textContent = 'Введите корректный email';
        isValid = false;
    }
    
    if (!isValid) return;
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password, fullname, phone, email })
        });
        const data = await response.json();
        
        if (data.success) {
            messageDiv.innerHTML = '<div class="success">Регистрация успешна! Перенаправление на вход...</div>';
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);
        } else {
            messageDiv.innerHTML = `<div class="error">${data.message}</div>`;
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="error">Ошибка соединения с сервером</div>';
    }
}