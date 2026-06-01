const profileUserId = getSavedUserId();
if (profileUserId) {
    document.getElementById('userIdInput').value = profileUserId.replace('@s.whatsapp.net', '');
    loadProfile();
}

async function loadProfile() {
    const raw = document.getElementById('userIdInput').value;
    const userId = getUserIdFromInput(raw);
    if (!userId) return alert('Enter a valid WhatsApp number');
    saveUserIdToStorage(userId);

    const content = document.getElementById('profileContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading profile...</div>';

    try {
        const [profile, cards, pokemon, inventory, guild] = await Promise.all([
            fetch(`${API}/profile?id=${encodeURIComponent(userId)}`).then(r => r.json()),
            fetch(`${API}/cards?owner=${encodeURIComponent(userId)}`).then(r => r.json()),
            fetch(`${API}/pokemon?owner=${encodeURIComponent(userId)}`).then(r => r.json()),
            fetch(`${API}/inventory?owner=${encodeURIComponent(userId)}`).then(r => r.json()),
            fetch(`${API}/guild?user=${encodeURIComponent(userId)}`).then(r => r.json())
        ]);

        if (profile.error) {
            return content.innerHTML = `<p style="color:var(--danger);">${profile.error}. Register in the bot first!</p>`;
        }

        const decks = {1:[],2:[],3:[],collection:[]};
        cards.forEach(c => {
            if (c.deck_number) decks[c.deck_number]?.push(c);
            else decks.collection.push(c);
        });

        content.innerHTML = `
            <div class="profile-header">
                <img src="${profile.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.pirate_name||'Pirate')}&size=200&background=141b22&color=f0b90b`}" 
                     class="avatar" 
                     onerror="this.src='https://ui-avatars.com/api/?name=Pirate&size=200&background=141b22&color=f0b90b'">
                <div>
                    <h1>${profile.pirate_name || 'Unknown Pirate'}</h1>
                    <div class="stats-row">
                        <div class="stat-box"><div class="stat-value">${profile.level||1}</div><div class="stat-label">Level</div></div>
                        <div class="stat-box"><div class="stat-value">${formatNumber(profile.beli)}</div><div class="stat-label">Beli</div></div>
                        <div class="stat-box"><div class="stat-value">${profile.gems||0}</div><div class="stat-label">Gems</div></div>
                        <div class="stat-box"><div class="stat-value">${profile.dust||0}</div><div class="stat-label">Dust</div></div>
                        <div class="stat-box"><div class="stat-value">${cards.length}</div><div class="stat-label">Cards</div></div>
                        <div class="stat-box"><div class="stat-value">${pokemon.length}</div><div class="stat-label">Pokémon</div></div>
                    </div>
                </div>
            </div>
            ${guild?.name ? `
                <div class="stats-row" style="margin-bottom:2rem;">
                    <div class="stat-box"><div class="stat-value">${guild.name}</div><div class="stat-label">Guild</div></div>
                    <div class="stat-box"><div class="stat-value">${guild.guild_role||'Member'}</div><div class="stat-label">Role</div></div>
                    <div class="stat-box"><div class="stat-value">${formatNumber(guild.treasury)}</div><div class="stat-label">Treasury</div></div>
                </div>
            `:''}
            <div class="tabs">
                <button class="tab-btn active" onclick="showTab('deck1')">🃏 Deck 1 (${decks[1].length})</button>
                <button class="tab-btn" onclick="showTab('deck2')">🃏 Deck 2 (${decks[2].length})</button>
                <button class="tab-btn" onclick="showTab('deck3')">⭐ Deck 3 (${decks[3].length})</button>
                <button class="tab-btn" onclick="showTab('collection')">📦 Collection (${decks.collection.length})</button>
                <button class="tab-btn" onclick="showTab('pokemon')">🐾 Pokémon (${pokemon.length})</button>
                <button class="tab-btn" onclick="showTab('inventory')">🎒 Inventory (${inventory.length})</button>
            </div>
            <div id="deck1" class="tab-content"><div class="card-grid">${decks[1].map(renderCard).join('')||'<p>No cards</p>'}</div></div>
            <div id="deck2" class="tab-content" style="display:none;"><div class="card-grid">${decks[2].map(renderCard).join('')||'<p>No cards</p>'}</div></div>
            <div id="deck3" class="tab-content" style="display:none;"><div class="card-grid">${decks[3].map(renderCard).join('')||'<p>No cards</p>'}</div></div>
            <div id="collection" class="tab-content" style="display:none;"><div class="card-grid">${decks.collection.map(renderCard).join('')||'<p>Collection empty</p>'}</div></div>
            <div id="pokemon" class="tab-content" style="display:none;"><div class="card-grid">${pokemon.map(renderPoke).join('')||'<p>No Pokémon</p>'}</div></div>
            <div id="inventory" class="tab-content" style="display:none;">
                ${inventory.length ? inventory.map(i => `<div style="background:var(--surface);padding:1rem;border-radius:8px;margin-bottom:0.5rem;">${i.item_name} x${i.quantity}</div>`).join('') : '<p>Empty</p>'}
            </div>
        `;
    } catch (e) {
        content.innerHTML = `<p style="color:var(--danger);">Error: ${e.message}</p>`;
    }
}

function renderCard(c) {
    return `<div class="card">
        <img src="${c.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.card_name)}&size=256&background=141b22&color=f0b90b`}" 
             onerror="this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${c.card_name}') + '&size=256&background=141b22&color=f0b90b'">
        <div class="card-body">
            <div class="card-title">${c.card_name}</div>
            <span class="card-rarity rarity-t${c.rarity?.replace('t','')}">${c.rarity?.toUpperCase()}</span>
            <div class="card-stats"><span>⚔️ ${c.attack}</span><span>🛡️ ${c.defense}</span></div>
        </div>
    </div>`;
}

function renderPoke(p) {
    return `<div class="pokemon-card">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${getPokeId(p.pokemon_name)}.png" 
             onerror="this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${p.pokemon_name}') + '&size=120&background=141b22&color=f0b90b'">
        <div class="pokemon-name">${p.pokemon_name}</div>
        <div class="pokemon-level">Lv. ${p.level} | ❤️ ${p.hp}/${p.max_hp}</div>
    </div>`;
}

function getPokeId(name) {
    const dex = {Pikachu:25,Charmander:4,Squirtle:7,Bulbasaur:1,Eevee:133,Gyarados:130,Mewtwo:150,Mew:151};
    return dex[name] || 1;
}

function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).style.display = 'block';
    event.target.classList.add('active');
}