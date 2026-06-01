// js/profile.js
redirectToLogin();

document.addEventListener('DOMContentLoaded', () => {
    const savedId = getSavedUserId();
    if (savedId) {
        document.getElementById('userIdInput').value = savedId.replace('@s.whatsapp.net', '');
        loadProfile();
    }
});

async function loadProfile() {
    const raw = document.getElementById('userIdInput').value;
    const userId = getUserId(raw);
    if (!userId) return alert('Enter a valid WhatsApp number');
    saveUserId(userId);

    const content = document.getElementById('profileContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';

    try {
        const res = await fetch(`${API}/profile?id=${encodeURIComponent(userId)}`);
        const profile = await res.json();

        if (res.status === 404 || profile.error) {
            content.innerHTML = '';
            document.getElementById('registerSection').innerHTML = `
                <div class="register-form">
                    <h3>⚓ Register New Pirate</h3>
                    <p style="color:var(--text2);">This number is not registered yet. Choose a pirate name below.</p>
                    <input type="text" id="pirateNameInput" placeholder="Enter pirate name">
                    <button class="btn" onclick="registerUser()">🏴‍☠️ Register</button>
                    <p id="registerMsg" style="margin-top:0.5rem;"></p>
                </div>
            `;
            return;
        }

        document.getElementById('registerSection').innerHTML = '';

        const [cardsRes, pokemonRes, inventoryRes, guildRes] = await Promise.all([
            fetch(`${API}/cards?owner=${encodeURIComponent(userId)}`),
            fetch(`${API}/pokemon?owner=${encodeURIComponent(userId)}`),
            fetch(`${API}/inventory?owner=${encodeURIComponent(userId)}`),
            fetch(`${API}/guild?user=${encodeURIComponent(userId)}`)
        ]);

        const cards = await cardsRes.json();
        const pokemon = await pokemonRes.json();
        const inventory = await inventoryRes.json();
        const guild = await guildRes.json();

        const safeCards = Array.isArray(cards) ? cards : [];
        const safePokemon = Array.isArray(pokemon) ? pokemon : [];
        const safeInventory = Array.isArray(inventory) ? inventory : [];

        const decks = { 1: [], 2: [], 3: [], collection: [] };
        safeCards.forEach(c => {
            if (c.deck_number) decks[c.deck_number]?.push(c);
            else decks.collection.push(c);
        });

        content.innerHTML = `
            <div class="profile-header">
                <img src="${profile.profile_pic || getAvatarUrl(profile.pirate_name || 'Pirate', 200)}" 
                     class="avatar" 
                     onerror="this.src='${getAvatarUrl(profile.pirate_name || 'Pirate', 200)}'">
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
        content.innerHTML = `<p style="color:var(--danger);">Error: ${e.message}</p>`;
    }
}

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

function renderCard(c) {
    return `<div class="card">
        <img src="${c.image_url || getAvatarUrl(c.card_name, 256)}" 
             onerror="this.src='${getAvatarUrl(c.card_name, 256)}'">
        <div class="card-body">
            <div class="card-title">${c.card_name}</div>
            <span class="card-rarity rarity-t${c.rarity?.replace('t','')}">${c.rarity?.toUpperCase()}</span>
            <div style="font-size:0.8rem;color:var(--text2);">⚔️ ${c.attack} 🛡️ ${c.defense}</div>
        </div>
    </div>`;
}

function renderPoke(p) {
    const dex = { Pikachu:25, Charmander:4, Squirtle:7, Bulbasaur:1, Eevee:133, Gyarados:130, Mewtwo:150, Mew:151 };
    const id = dex[p.pokemon_name] || 1;
    return `<div class="pokemon-card">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png" 
             onerror="this.src='${getAvatarUrl(p.pokemon_name, 120)}'">
        <div class="pokemon-name">${p.pokemon_name}</div>
        <div style="color:var(--gold);">Lv. ${p.level} | ❤️ ${p.hp}/${p.max_hp}</div>
    </div>`;
}

function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const tab = document.getElementById(id);
    if (tab) tab.style.display = 'block';
    event.target.classList.add('active');
}