const API_URL = 'http://localhost:8080/api';
let allBookings = [];
let currentPage = 1;
let currentFilter = 'all';
let currentSearch = '';
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.style.display = 'block';
    
    const adminAuthBtn = document.getElementById('adminAuthBtn');
    if (adminAuthBtn) {
        adminAuthBtn.addEventListener('click', adminLogin);
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            currentFilter = this.value;
            currentPage = 1;
            renderAdminTable();
        });
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentSearch = this.value.toLowerCase();
            currentPage = 1;
            renderAdminTable();
        });
    }
    
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    if (prevPage) prevPage.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderAdminTable(); } });
    if (nextPage) nextPage.addEventListener('click', () => { if (currentPage < getTotalPages()) { currentPage++; renderAdminTable(); } });
});

async function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    const messageDiv = document.getElementById('adminAuthMessage');
    
    if (!password) {
        messageDiv.innerHTML = '<div class="error">Введите пароль</div>';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await response.json();
        
        if (data.success) {
            messageDiv.innerHTML = '<div class="success">Вход выполнен</div>';
            document.getElementById('adminPanel').style.display = 'block';
            loadAllBookings();
        } else {
            messageDiv.innerHTML = `<div class="error">${data.message}</div>`;
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="error">Ошибка соединения</div>';
    }
}

async function loadAllBookings() {
    try {
        const response = await fetch(`${API_URL}/admin/bookings`);
        const data = await response.json();
        
        if (data.success) {
            allBookings = data.data;
            renderAdminTable();
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
    }
}

function getFilteredBookings() {
    let filtered = [...allBookings];
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(b => b.status === currentFilter);
    }
    
    if (currentSearch) {
        filtered = filtered.filter(b => 
            b.user_login.toLowerCase().includes(currentSearch) ||
            b.user_fullname.toLowerCase().includes(currentSearch) ||
            b.room_name.toLowerCase().includes(currentSearch)
        );
    }
    
    return filtered;
}

function getTotalPages() {
    const filtered = getFilteredBookings();
    return Math.ceil(filtered.length / itemsPerPage);
}

function renderAdminTable() {
    const filtered = getFilteredBookings();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const pageData = filtered.slice(start, start + itemsPerPage);
    
    const tbody = document.getElementById('adminBookingsTable');
    const pageInfo = document.getElementById('pageInfo');
    
    if (pageInfo) {
        pageInfo.textContent = `Страница ${currentPage} из ${totalPages || 1}`;
    }
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center">Нет заявок</td></tr>';
        return;
    }
    
    pageData.forEach(booking => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = booking.id;
        row.insertCell(1).textContent = booking.user_login;
        row.insertCell(2).textContent = booking.room_name;
        row.insertCell(3).textContent = booking.room_type;
        row.insertCell(4).textContent = booking.booking_date;
        row.insertCell(5).textContent = booking.start_time;
        row.insertCell(6).textContent = booking.payment_method;
        
        const statusCell = row.insertCell(7);
        let statusClass = '';
        if (booking.status === 'Новая') statusClass = 'status-new';
        else if (booking.status === 'Мероприятие назначено') statusClass = 'status-scheduled';
        else if (booking.status === 'Мероприятие завершено') statusClass = 'status-completed';
        statusCell.innerHTML = `<span class="status-badge ${statusClass}">${booking.status}</span>`;
        
        row.insertCell(8).textContent = booking.review || '—';
        
        const actionsCell = row.insertCell(9);
        const btnNew = document.createElement('button');
        btnNew.textContent = 'Новая';
        btnNew.className = 'status-btn';
        btnNew.onclick = () => updateStatus(booking.id, 'Новая');
        const btnScheduled = document.createElement('button');
        btnScheduled.textContent = 'Назначено';
        btnScheduled.className = 'status-btn';
        btnScheduled.onclick = () => updateStatus(booking.id, 'Мероприятие назначено');
        const btnCompleted = document.createElement('button');
        btnCompleted.textContent = 'Завершено';
        btnCompleted.className = 'status-btn';
        btnCompleted.onclick = () => updateStatus(booking.id, 'Мероприятие завершено');
        
        actionsCell.appendChild(btnNew);
        actionsCell.appendChild(btnScheduled);
        actionsCell.appendChild(btnCompleted);
    });
}

async function updateStatus(bookingId, status) {
    try {
        const response = await fetch(`${API_URL}/admin/booking-status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, status })
        });
        const data = await response.json();
        
        if (data.success) {
            showNotification(`Статус изменен на "${status}"`);
            loadAllBookings();
        } else {
            alert('Ошибка обновления статуса');
        }
    } catch (error) {
        alert('Ошибка соединения');
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        animation: fadeOut 3s ease forwards;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; visibility: hidden; }
    }
`;
document.head.appendChild(style);