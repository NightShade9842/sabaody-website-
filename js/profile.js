// js/profile.js
const API = '/api';

// ── Utility ───────────────────────────────
function formatNumber(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n?.toLocaleString() || '0';
}

function getUserId(raw) {
    let id = raw.trim();
    if (!id) return null;
    if (!id.includes('@')) id += '@s.whatsapp.net';
    return id;
}

function saveUserId(userId) {
    localStorage.setItem('sabaody_user', userId);
}

function getSavedUserId() {
    return localStorage.getItem('sabaody_user') || '';
}

// ── Redirect to login if not authenticated ─
if (!getSavedUserId()) {
    window.location.href = '/index.html';
}

// ── Auto-load profile on page load ─────────
window.addEventListener('DOMContentLoaded', () => {
    const savedId = getSavedUserId();
    if (savedId) {
        // Show plain number in input field
        const input = document.getElementById('userIdInput');
        if (input) input.value = savedId.replace('@s.whatsapp.net', '');
        loadProfile();
    }
});

// ── Main profile loader ────────────────────
async function loadProfile() {
    const raw = document.getElementById('userIdInput').value;
    const userId = getUserId(raw);
    if (!userId) return alert('Enter a valid WhatsApp number');
    saveUserId(userId);

    const content = document.getElementById('profileContent');
    content.innerHTML = '<div style="text-align:center;padding:2rem;">Loading...</div>';

    try {
        // 1. Fetch profile
        const res = await fetch(`${API}/profile?id=${encodeURIComponent(userId)}`);
        const profile = await res.json();

        // If user not found, show registration form
        if (res.status === 404 || profile.error) {
            content.innerHTML = '';
            document.getElementById('registerSection').innerHTML = `
                <div class="register-form">
                    <h3>⚓ Register New Pirate</h3>
                    <p style="color:var(--text2);">This number is not registered yet. Choose a pirate name below.</p>
                    <input type="text" id="pirateNameInput" placeholder="Enter pirate name (e.g., Gol D. Shade)">
                    <button class="btn" onclick="registerUser()">🏴‍☠️ Register</button>
                    <p id="registerMsg" style="margin-top:0.5rem;"></p>
                </div>
            `;
            return;
        }

        // 2. User exists – clear registration section and load full data
        document.getElementById('registerSection').innerHTML = '';

        const [cardsRes, pokemonRes, inventoryRes, guildRes] = await Promise.all([
            fetch(`${API}/cards?owner=${encodeURIComponent(userId)}`),
            fetch(`${API}/pokemon?owner=${encodeURIComponent(userId)}`),
            fetch(`${API}/inventory?owner=${encodeURIComponent(userId)}`),
            fetch(`${API}/guild?user=${encodeURIComponent(userId)}`)
        ]);

        const cards   = await cardsRes.json();
        const pokemon = await pokemonRes.json();
        const inventory = await inventoryRes.json();
        const guild   = await guildRes.json();

        // Ensure arrays
        const safeCards    = Array.isArray(cards)    ? cards    : [];
        const safePokemon  = Array.isArray(pokemon)  ? pokemon  : [];
        const safeInventory = Array.isArray(inventory) ? inventory : [];

        // Build deck/collection structure
        const decks = { 1: [], 2: [], 3: [], collection: [] };
        safeCards.forEach(c => {
            if (c.deck_number) decks[c.deck_number]?.push(c);
            else decks.collection.push(c);
        });

        // ── Render profile UI ─────────────────
        content.innerHTML = `
            <div class="profile-header">
                <img src="${profile.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.pirate_name || 'Pirate')}&size=200&background=141b22&color=f0b90b`}" 
                     class="avatar" 
                     onerror="this.src='https://ui-avatars.com/api/?name=Pirate&size=200&background=141b22&color=f0b90b'">
                <div>
                    <h1>${profile.pirate_name || 'Unknown Pirate'}</h1>
                    <div class="stats-row">
                        <div class="stat-box"><div class="stat-value">${profile.level || 1}</div><div class="stat-label">Level</div></div>
                        <div class="stat-box"><div class="stat-value">${formatNumber(profile.beli)}</div><div class="stat-label">Beli</div></div>
                        <div class="stat-box"><div class="stat-value">${profile.gems || 0}</div><div class="stat-label">Gems</div></div>
                        <div class="stat-box"><div class="stat-value">${profile.dust || 0}</div><div class="stat-label">Dust</div></div>
                        <div class="stat-box"><div class="stat-value">${safeCards.length}</div><div class="stat-label">Cards</div></div>
                        <div class="stat-box"><div class="stat-value">${safePokemon.length}</div><div class="stat-label">Pokémon</div></div>
                    </div>
                </div>
            </div>

            ${guild && guild.name ? `
                <div class="stats-row" style="margin-bottom:2rem;">
                    <div class="stat-box"><div class="stat-value">${guild.name}</div><div class="stat-label">Guild</div></div>
                    <div class="stat-box"><div class="stat-value">${guild.guild_role || 'Member'}</div><div class="stat-label">Role</div></div>
                    <div class="stat-box"><div class="stat-value">${formatNumber(guild.treasury)}</div><div class="stat-label">Treasury</div></div>
                </div>
            ` : ''}

            <div class="tabs">
                <button class="tab-btn active" onclick="showTab('deck1')">🃏 Deck 1 (${decks[1].length})</button>
                <button class="tab-btn" onclick="showTab('deck2')">🃏 Deck 2 (${decks[2].length})</button>
                <button class="tab-btn" onclick="showTab('deck3')">⭐ Deck 3 (${decks[3].length})</button>
                <button class="tab-btn" onclick="showTab('collection')">📦 Collection (${decks.collection.length})</button>
                <button class="tab-btn" onclick="showTab('pokemon')">🐾 Pokémon (${safePokemon.length})</button>
                <button class="tab-btn" onclick="showTab('inventory')">🎒 Inventory (${safeInventory.length})</button>
            </div>

            <div id="deck1" class="tab-content"><div class="card-grid">${decks[1].map(renderCard).join('') || '<p>No cards</p>'}</div></div>
            <div id="deck2" class="tab-content" style="display:none;"><div class="card-grid">${decks[2].map(renderCard).join('') || '<p>No cards</p>'}</div></div>
            <div id="deck3" class="tab-content" style="display:none;"><div class="card-grid">${decks[3].map(renderCard).join('') || '<p>No cards</p>'}</div></div>
            <div id="collection" class="tab-content" style="display:none;"><div class="card-grid">${decks.collection.map(renderCard).join('') || '<p>Collection empty</p>'}</div></div>
            <div id="pokemon" class="tab-content" style="display:none;"><div class="card-grid">${safePokemon.map(renderPoke).join('') || '<p>No Pokémon</p>'}</div></div>
            <div id="inventory" class="tab-content" style="display:none;">
                ${safeInventory.length ? safeInventory.map(i => `<div style="background:var(--surface);padding:1rem;border-radius:8px;margin-bottom:0.5rem;">${i.item_name} x${i.quantity}</div>`).join('') : '<p>Empty</p>'}
            </div>
        `;
    } catch (e) {
        content.innerHTML = `<p style="color:var(--danger); text-align:center;">Error: ${e.message}</p>`;
    }
}

// ── Registration handler ──────────────────
async function registerUser() {
    const raw = document.getElementById('userIdInput').value;
    const userId = getUserId(raw);
    const pirateName = document.getElementById('pirateNameInput').value.trim();
    const msg = document.getElementById('registerMsg');

    if (!userId || !pirateName) {
        msg.innerHTML = '<span style="color:var(--danger);">Please fill in both fields.</span>';
        return;
    }

    try {
        const res = await fetch(`${API}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, pirateName })
        });
        const data = await res.json();
        if (data.success) {
            msg.innerHTML = '<span style="color:var(--gold);">✅ Registration successful! Loading profile...</span>';
            setTimeout(loadProfile, 1500);
        } else {
            msg.innerHTML = `<span style="color:var(--danger);">${data.message || data.error}</span>`;
        }
    } catch (e) {
        msg.innerHTML = '<span style="color:var(--danger);">Registration failed. Try again.</span>';
    }
}

// ── Card renderer ─────────────────────────
function renderCard(c) {
    return `<div class="card">
        <img src="${c.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.card_name)}&size=256&background=141b22&color=f0b90b`}" 
             onerror="this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${c.card_name}') + '&size=256&background=141b22&color=f0b90b'">
        <div class="card-body">
            <div class="card-title">${c.card_name}</div>
            <span class="card-rarity rarity-t${c.rarity?.replace('t','')}">${c.rarity?.toUpperCase()}</span>
            <div style="font-size:0.8rem;color:var(--text2);">⚔️ ${c.attack} 🛡️ ${c.defense}</div>
        </div>
    </div>`;
}

// ── Pokémon renderer ──────────────────────
function renderPoke(p) {
    const dex = { Pikachu:25, Charmander:4, Squirtle:7, Bulbasaur:1, Eevee:133, Gyarados:130, Mewtwo:150, Mew:151 };
    const id = dex[p.pokemon_name] || 1;
    return `<div class="pokemon-card">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png" 
             onerror="this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${p.pokemon_name}') + '&size=120&background=141b22&color=f0b90b'">
        <div class="pokemon-name">${p.pokemon_name}</div>
        <div style="color:var(--gold);">Lv. ${p.level} | ❤️ ${p.hp}/${p.max_hp}</div>
    </div>`;
}

// ── Tab switcher ──────────────────────────
function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const tab = document.getElementById(id);
    if (tab) tab.style.display = 'block';
    event.target.classList.add('active');
}