const API_URL = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.style.display = 'block';
    
    loadRooms();
    
    const createBtn = document.getElementById('createBookingBtn');
    if (createBtn) {
        createBtn.addEventListener('click', createBooking);
    }
});

async function loadRooms() {
    try {
        const response = await fetch(`${API_URL}/rooms`);
        const data = await response.json();
        
        const roomSelect = document.getElementById('roomSelect');
        const roomsTable = document.getElementById('roomsTable');
        
        if (roomSelect && data.success) {
            data.data.forEach(room => {
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = `${room.name} (${room.type}) - ${room.price_per_hour} руб/час`;
                roomSelect.appendChild(option);
            });
        }
        
        if (roomsTable && data.success) {
            roomsTable.innerHTML = '';
            data.data.forEach(room => {
                const row = roomsTable.insertRow();
                row.insertCell(0).textContent = room.name;
                row.insertCell(1).textContent = room.type;
                row.insertCell(2).textContent = room.capacity;
                row.insertCell(3).textContent = `${room.price_per_hour} руб.`;
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки помещений:', error);
    }
}

async function createBooking() {
    const roomId = document.getElementById('roomSelect').value;
    const bookingDate = document.getElementById('bookingDate').value.trim();
    const startTime = document.getElementById('startTime').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const messageDiv = document.getElementById('bookingMessage');
    
    if (!roomId) {
        messageDiv.innerHTML = '<div class="error">Выберите помещение</div>';
        return;
    }
    
    if (!bookingDate) {
        messageDiv.innerHTML = '<div class="error">Введите дату</div>';
        return;
    }
    
    const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
    if (!dateRegex.test(bookingDate)) {
        messageDiv.innerHTML = '<div class="error">Неверный формат даты. Используйте ДД.ММ.ГГГГ</div>';
        return;
    }
    
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    
    try {
    const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, roomId, bookingDate, startTime, paymentMethod })
    });
    const data = await response.json();
    
    if (data.success) {
        messageDiv.innerHTML = '<div class="success">Заявка успешно создана!</div>';
        document.getElementById('bookingDate').value = '';
        setTimeout(() => {
            window.location.href = '/profile.html';
        }, 1500);
    } else {
        messageDiv.innerHTML = `<div class="error">${data.message}</div>`;
    }
} catch (error) {
    messageDiv.innerHTML = '<div class="error">Ошибка создания заявки</div>';
}
}