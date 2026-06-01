let allCards = [];

async function loadCards() {
    allCards = await fetch(`${API}/cards?limit=500`).then(r => r.json());
    filterCards();
}

function filterCards() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const rarity = document.getElementById('rarityFilter').value;
    const sort = document.getElementById('sortBy').value;

    let filtered = allCards.filter(c =>
        c.card_name.toLowerCase().includes(search) && (!rarity || c.rarity === rarity)
    );

    if (sort === 'attack') filtered.sort((a, b) => b.attack - a.attack);
    else if (sort === 'defense') filtered.sort((a, b) => b.defense - a.defense);
    else filtered.sort((a, b) => a.card_name.localeCompare(b.card_name));

    const grid = document.getElementById('cardsContainer');
    grid.innerHTML = filtered.length ? filtered.map(c => `
        <div class="card">
            <img src="${c.image_url || getAvatarUrl(c.card_name, 256)}" 
                 onerror="this.src='${getAvatarUrl(c.card_name, 256)}'">
            <div class="card-body">
                <div class="card-title">${c.card_name}</div>
                <span class="card-rarity rarity-t${c.rarity?.replace('t','')}">${c.rarity?.toUpperCase()}</span>
                <div style="font-size:0.8rem;color:var(--text2);">⚔️ ${c.attack} 🛡️ ${c.defense}</div>
            </div>
        </div>
    `).join('') : '<p style="color:var(--text2);">No cards found.</p>';
}

loadCards();