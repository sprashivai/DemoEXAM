const API_URL = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.getElementById('userName').textContent = userName;
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.style.display = 'block';
    
    loadBookings();
    
    const submitReviewBtn = document.getElementById('submitReviewBtn');
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', submitReview);
    }
});

async function loadBookings() {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/bookings/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const tbody = document.getElementById('bookingsTable');
        const select = document.getElementById('reviewBookingSelect');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        if (select) select.innerHTML = '<option value="">-- Выберите мероприятие --</option>';
        
        if (data.success && data.data.length > 0) {
            data.data.forEach(booking => {
                const row = tbody.insertRow();
                row.insertCell(0).textContent = booking.room_name;
                row.insertCell(1).textContent = booking.room_type;
                row.insertCell(2).textContent = booking.booking_date;
                row.insertCell(3).textContent = booking.start_time;
                row.insertCell(4).textContent = booking.payment_method;
                
                const statusCell = row.insertCell(5);
                let statusClass = '';
                if (booking.status === 'Новая') statusClass = 'status-new';
                else if (booking.status === 'Мероприятие назначено') statusClass = 'status-scheduled';
                else if (booking.status === 'Мероприятие завершено') statusClass = 'status-completed';
                statusCell.innerHTML = `<span class="status-badge ${statusClass}">${booking.status}</span>`;
                
                row.insertCell(6).textContent = booking.review || '—';
                
                if (select && booking.status === 'Мероприятие завершено' && !booking.review) {
                    const option = document.createElement('option');
                    option.value = booking.id;
                    option.textContent = `${booking.room_name} - ${booking.booking_date}`;
                    select.appendChild(option);
                }
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Нет заявок</td></tr>';
        }
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
    }
}

async function submitReview() {
    const select = document.getElementById('reviewBookingSelect');
    const bookingId = select.value;
    const reviewText = document.getElementById('reviewText').value.trim();
    const messageDiv = document.getElementById('reviewMessage');
    
    if (!bookingId) {
        messageDiv.innerHTML = '<div class="error">Выберите мероприятие</div>';
        return;
    }
    
    if (!reviewText) {
        messageDiv.innerHTML = '<div class="error">Введите текст отзыва</div>';
        return;
    }
    
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ userId, bookingId, review: reviewText })
        });
        const data = await response.json();
        
        if (data.success) {
            messageDiv.innerHTML = '<div class="success">Отзыв успешно добавлен</div>';
            document.getElementById('reviewText').value = '';
            loadBookings();
        } else {
            messageDiv.innerHTML = `<div class="error">${data.message}</div>`;
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="error">Ошибка отправки отзыва</div>';
    }
}