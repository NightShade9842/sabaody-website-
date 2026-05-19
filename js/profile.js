// Get user ID from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id') || 'demo_user';

// Fetch profile data
async function loadProfile() {
    try {
        const response = await fetch(`/.netlify/functions/api-profiles?id=${userId}`);
        const data = await response.json();
        
        document.getElementById('pirateName').textContent = data.pirate_name || 'Unknown Pirate';
        document.getElementById('level').textContent = data.level || 1;
        document.getElementById('beli').textContent = formatNumber(data.beli || 0);
        document.getElementById('gems').textContent = data.gems || 0;
        document.getElementById('goldCoins').textContent = data.gold_coins || 0;
        
        if (data.premium_until && new Date(data.premium_until) > new Date()) {
            document.getElementById('deck3Section').style.display = 'block';
        }
        
        loadCards();
        loadPokemon();
        loadGuild();
        loadInventory();
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

async function loadCards() {
    const response = await fetch(`/.netlify/functions/api-cards?userId=${userId}`);
    const cards = await response.json();
    
    const deck1 = cards.filter(c => c.deck_number === 1);
    const deck2 = cards.filter(c => c.deck_number === 2);
    const deck3 = cards.filter(c => c.deck_number === 3);
    const collection = cards.filter(c => !c.deck_number);
    
    renderCardGrid('deck1Grid', deck1);
    renderCardGrid('deck2Grid', deck2);
    renderCardGrid('deck3Grid', deck3);
    renderCardGrid('collectionGrid', collection);
}

function renderCardGrid(elementId, cards) {
    const grid = document.getElementById(elementId);
    grid.innerHTML = cards.map(card => `
        <div class="card-item" style="border-color: ${getRarityColor(card.rarity)}">
            <img src="${card.image_url}" alt="${card.card_name}" loading="lazy">
            <h4>${card.card_name}</h4>
            <span class="rarity-badge">${card.rarity}</span>
            <div class="card-stats">
                <span>ATK: ${card.attack}</span>
                <span>DEF: ${card.defense}</span>
            </div>
        </div>
    `).join('');
}

async function loadPokemon() {
    const response = await fetch(`/.netlify/functions/api-pokemon?userId=${userId}`);
    const pokemon = await response.json();
    
    const party = pokemon.filter(p => p.party_slot);
    const all = pokemon.filter(p => !p.party_slot);
    
    document.getElementById('pokemonParty').innerHTML = party
        .sort((a, b) => a.party_slot - b.party_slot)
        .map(p => `
            <div class="pokemon-card party-member">
                <img src="${p.image_url}" alt="${p.pokemon_name}">
                <h4>${p.pokemon_name}</h4>
                <p>Lv. ${p.level}</p>
                <div class="pokemon-stats">
                    <span>HP: ${p.hp}</span>
                    <span>ATK: ${p.attack}</span>
                    <span>DEF: ${p.defense}</span>
                    <span>SPD: ${p.speed}</span>
                </div>
            </div>
        `).join('');
    
    document.getElementById('allPokemon').innerHTML = all.map(p => `
        <div class="pokemon-card">
            <img src="${p.image_url}" alt="${p.pokemon_name}">
            <h4>${p.pokemon_name}</h4>
            <p>Lv. ${p.level}</p>
        </div>
    `).join('');
}

async function loadGuild() {
    const response = await fetch(`/.netlify/functions/api-guild?userId=${userId}`);
    const guild = await response.json();
    
    if (guild && guild.name) {
        document.getElementById('guildInfo').innerHTML = `
            <h2>${guild.type === 'marine' ? '⚓' : '🏴‍☠️'} ${guild.name}</h2>
            <p>${guild.description || 'No description'}</p>
            <p>Treasury: ${formatNumber(guild.treasury)}฿</p>
            <p>Members: ${guild.member_count}</p>
            <p>Leader: ${guild.leader_name}</p>
        `;
    }
}

async function loadInventory() {
    const response = await fetch(`/.netlify/functions/api-inventory?userId=${userId}`);
    const items = await response.json();
    
    document.getElementById('inventoryItems').innerHTML = items.map(item => `
        <div class="inventory-item">
            <span class="item-icon">${getItemIcon(item.item_type)}</span>
            <span class="item-name">${item.item_name}</span>
            <span class="item-count">x${item.quantity}</span>
        </div>
    `).join('');
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName + 'Tab').style.display = 'block';
    event.target.classList.add('active');
}

function getRarityColor(rarity) {
    const colors = {
        'Common': '#9e9e9e',
        'Uncommon': '#4caf50',
        'Rare': '#2196f3',
        'Epic': '#9c27b0',
        'Legendary': '#ff9800',
        'Mythic': '#f44336'
    };
    return colors[rarity] || '#9e9e9e';
}

function getItemIcon(type) {
    const icons = {
        'potion': '🧪',
        'rare_candy': '🍬',
        'fusion_stone': '💎',
        'evolution_stone': '🔄',
        'pack': '📦'
    };
    return icons[type] || '📦';
}

function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
}

// Load profile on page load
loadProfile();