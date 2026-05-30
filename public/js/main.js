const API_URL = 'http://localhost:8080/api';

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        return null;
    }
    return token;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '/login.html';
}

document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        const token = localStorage.getItem('token');
        if (token) {
            logoutBtn.style.display = 'block';
        } else {
            logoutBtn.style.display = 'none';
        }
        logoutBtn.addEventListener('click', logout);
    }
    
    const token = localStorage.getItem('token');
    if (token) {
        fetch(`${API_URL}/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                logout();
            }
        })
        .catch(() => logout());
    }
});