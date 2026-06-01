// js/main.js
const API = '/api';

function formatNumber(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n?.toLocaleString() || '0';
}

function getUserId(raw) {
    let id = raw.trim();
    if (!id) return null;
    // If user typed a plain number, convert to @s.whatsapp.net
    if (!id.includes('@')) id += '@s.whatsapp.net';
    return id;
}

function saveUserId(userId) {
    // userId is the actual JID from the database (e.g., 167345498677459@lid)
    localStorage.setItem('sabaody_user', userId);
}

function getSavedUserId() {
    return localStorage.getItem('sabaody_user') || '';
}

function getAvatarUrl(name, size) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=141b22&color=f0b90b`;
}