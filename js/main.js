const API = '/api';
function formatNumber(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n?.toLocaleString() || '0';
}
function getUserIdFromInput(raw) {
    let id = raw.trim();
    if (!id) return null;
    if (!id.includes('@')) id += '@s.whatsapp.net';
    return id;
}
function saveUserIdToStorage(userId) {
    localStorage.setItem('sabaody_user_id', userId);
}
function getSavedUserId() {
    return localStorage.getItem('sabaody_user_id') || '';
}