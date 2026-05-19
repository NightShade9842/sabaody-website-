// ============================================
// SABAODY BOT Website - Main JavaScript
// ============================================

// API Base URL (Netlify Functions)
const API_BASE = '/.netlify/functions';

// ============================================
// USER SESSION MANAGEMENT
// ============================================

class SessionManager {
    constructor() {
        this.userId = null;
        this.userData = null;
        this.init();
    }

    init() {
        // Get user ID from URL or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        this.userId = urlParams.get('id') || localStorage.getItem('sabaody_user_id');

        if (this.userId) {
            this.loadUserData();
            this.updateUI();
        }
    }

    async login(userId) {
        this.userId = userId;
        localStorage.setItem('sabaody_user_id', userId);
        await this.loadUserData();
        this.updateUI();
    }

    logout() {
        this.userId = null;
        this.userData = null;
        localStorage.removeItem('sabaody_user_id');
        this.updateUI();
    }

    async loadUserData() {
        try {
            const response = await fetch(`${API_BASE}/api-profiles?id=${this.userId}`);
            if (response.ok) {
                this.userData = await response.json();
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        const userBeli = document.getElementById('navBeli');

        if (this.userId && this.userData) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            if (userName) userName.textContent = this.userData.pirate_name || 'Unknown Pirate';
            if (userBeli) userBeli.textContent = formatNumber(this.userData.beli || 0) + '฿';
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    isLoggedIn() {
        return !!this.userId;
    }

    getUserId() {
        return this.userId;
    }
}

// Global session instance
const session = new SessionManager();

// ============================================
// NUMBER FORMATTING
// ============================================

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    
    const abs = Math.abs(num);
    if (abs >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (abs >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
}

// ============================================
// DATE FORMATTING
// ============================================

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    // Less than 1 hour
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    // Less than 1 day
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    // Less than 7 days
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// ============================================
// RARITY & COLOR UTILITIES
// ============================================

function getRarityColor(rarity) {
    const colors = {
        'Common': '#9e9e9e',
        'Uncommon': '#4caf50',
        'Rare': '#2196f3',
        'Epic': '#9c27b0',
        'Legendary': '#ff9800',
        'Mythic': '#f44336',
        'Ultimate': '#e91e63'
    };
    return colors[rarity] || '#9e9e9e';
}

function getRarityEmoji(rarity) {
    const emojis = {
        'Common': '⚪',
        'Uncommon': '🟢',
        'Rare': '🔵',
        'Epic': '🟣',
        'Legendary': '🟠',
        'Mythic': '🔴',
        'Ultimate': '👑'
    };
    return emojis[rarity] || '⚪';
}

function getRarityStars(rarity) {
    const stars = {
        'Common': '★☆☆☆☆',
        'Uncommon': '★★☆☆☆',
        'Rare': '★★★☆☆',
        'Epic': '★★★★☆',
        'Legendary': '★★★★★',
        'Mythic': '⭐★★★★',
        'Ultimate': '👑★★★★'
    };
    return stars[rarity] || '★☆☆☆☆';
}

// ============================================
// ITEM ICONS
// ============================================

function getItemIcon(itemType) {
    const icons = {
        'potion': '🧪',
        'super_potion': '⚗️',
        'rare_candy': '🍬',
        'fusion_stone': '💎',
        'evolution_stone': '🔄',
        'pack': '📦',
        'standard_pack': '📦',
        'premium_pack': '✨',
        'event_card': '🎪',
        'event_item': '🎁'
    };
    return icons[itemType] || '📦';
}

// ============================================
// API HELPER FUNCTIONS
// ============================================

async function apiGet(endpoint, params = {}) {
    try {
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_BASE}/${endpoint}${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API GET ${endpoint} failed:`, error);
        throw error;
    }
}

async function apiPost(endpoint, data = {}) {
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API POST ${endpoint} failed:`, error);
        throw error;
    }
}

// ============================================
// UI COMPONENTS
// ============================================

class Toast {
    static show(message, type = 'info', duration = 3000) {
        // Create toast container if not exists
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease;
            min-width: 250px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <span>${icons[type]}</span>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;margin-left:auto;">✕</button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

class Modal {
    static show(title, content, onConfirm = null, onCancel = null) {
        // Remove existing modal
        const existing = document.getElementById('sabaody-modal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'sabaody-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;">${title}</h3>
                    <button onclick="document.getElementById('sabaody-modal').remove()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                    ">✕</button>
                </div>
                <div style="margin-bottom: 20px;">${content}</div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    ${onCancel ? `<button class="btn-secondary" onclick="document.getElementById('sabaody-modal').remove(); ${onCancel ? 'onCancel()' : ''}">Cancel</button>` : ''}
                    ${onConfirm ? `<button class="btn-primary" onclick="onConfirm(); document.getElementById('sabaody-modal').remove();">Confirm</button>` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                if (onCancel) onCancel();
            }
        });
    }

    static hide() {
        const modal = document.getElementById('sabaody-modal');
        if (modal) modal.remove();
    }
}

// ============================================
// LOADING SPINNER
// ============================================

class LoadingSpinner {
    static show(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; padding: 40px;">
                <div class="spinner"></div>
            </div>
        `;
    }

    static hide(elementId, content) {
        const element = document.getElementById(elementId);
        if (!element) return;
        element.innerHTML = content || '';
    }
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return false;
    }
    
    if (Notification.permission === 'granted') return true;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

function sendNotification(title, body, icon = '/favicon.ico') {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: icon,
            badge: icon
        });
    }
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(`sabaody_${key}`, JSON.stringify(value));
        } catch (e) {
            console.error('Storage set failed:', e);
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`sabaody_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get failed:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        localStorage.removeItem(`sabaody_${key}`);
    },
    
    clear() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('sabaody_'));
        keys.forEach(k => localStorage.removeItem(k));
    }
};

// ============================================
// DEBOUNCE FUNCTION
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// COPY TO CLIPBOARD
// ============================================

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        Toast.show('Copied to clipboard!', 'success');
    } catch (err) {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        Toast.show('Copied to clipboard!', 'success');
    }
}

// ============================================
// IMAGE LAZY LOADING
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('loading' in HTMLImageElement.prototype) {
        // Browser supports lazy loading natively
        return;
    }
    
    // Fallback for browsers that don't support lazy loading
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
});

// ============================================
// RESPONSIVE NAVIGATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    // Create mobile menu toggle
    const toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.innerHTML = '☰';
    toggle.style.cssText = `
        display: none;
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
    `;
    
    const navList = nav.querySelector('ul');
    nav.insertBefore(toggle, navList);
    
    // Responsive handling
    function handleResize() {
        if (window.innerWidth <= 768) {
            toggle.style.display = 'block';
            navList.style.display = 'none';
            navList.style.flexDirection = 'column';
            navList.style.position = 'absolute';
            navList.style.top = '100%';
            navList.style.left = '0';
            navList.style.right = '0';
            navList.style.background = 'var(--ocean-blue)';
            navList.style.padding = '1rem';
            navList.style.gap = '1rem';
        } else {
            toggle.style.display = 'none';
            navList.style.display = 'flex';
            navList.style.flexDirection = 'row';
            navList.style.position = 'static';
        }
    }
    
    toggle.addEventListener('click', () => {
        if (navList.style.display === 'none' || !navList.style.display) {
            navList.style.display = 'flex';
        } else {
            navList.style.display = 'none';
        }
    });
    
    window.addEventListener('resize', handleResize);
    handleResize();
});

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

class SearchManager {
    constructor(inputId, containerId, searchFunction) {
        this.input = document.getElementById(inputId);
        this.container = document.getElementById(containerId);
        this.searchFunction = searchFunction;
        this.init();
    }
    
    init() {
        if (!this.input) return;
        
        this.input.addEventListener('input', debounce(async (e) => {
            const query = e.target.value.trim();
            if (query.length < 2 && query.length > 0) return;
            
            try {
                const results = await this.searchFunction(query);
                this.renderResults(results);
            } catch (error) {
                console.error('Search failed:', error);
            }
        }, 300));
    }
    
    renderResults(results) {
        // Override in child classes
    }
}

// ============================================
// PAGINATION COMPONENT
// ============================================

class Pagination {
    constructor(containerId, totalItems, itemsPerPage = 24, onPageChange) {
        this.container = document.getElementById(containerId);
        this.totalItems = totalItems;
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.onPageChange = onPageChange;
        this.totalPages = Math.ceil(totalItems / itemsPerPage);
    }
    
    render() {
        if (this.totalPages <= 1) {
            this.container.innerHTML = '';
            return;
        }
        
        let html = '<div class="pagination-controls">';
        
        // Previous button
        html += `
            <button onclick="pagination.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                ← Previous
            </button>
        `;
        
        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        if (startPage > 1) {
            html += `<button onclick="pagination.goToPage(1)">1</button>`;
            if (startPage > 2) html += '<span>...</span>';
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button onclick="pagination.goToPage(${i})" 
                        class="${i === this.currentPage ? 'active' : ''}">
          