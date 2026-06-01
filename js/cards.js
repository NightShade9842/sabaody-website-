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
    if (sort === 'attack') filtered.sort((a,b) => b.attack - a.attack);
    else if (sort === 'defense') filtered.sort((a,b) => b.defense - a.defense);
    else filtered.sort((a,b) => a.card_name.localeCompare(b.card_name));
    const grid = document.getElementById('cardsContainer');
    grid.innerHTML = filtered.length ? filtered.map(c => `
        <div class="card">
            <img src="${c.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.card_name)}&size=256&background=141b22&color=f0b90b`}" 
                 onerror="this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${c.card_name}') + '&size=256&background=141b22&color=f0b90b'">
            <div class="card-body">
                <div class="card-title">${c.card_name}</div>
                <span class="card-rarity rarity-t${c.rarity?.replace('t','')}">${c.rarity?.toUpperCase()}</span>
                <div class="card-stats"><span>⚔️ ${c.attack}</span><span>🛡️ ${c.defense}</span></div>
                <div style="font-size:0.75rem;color:var(--text2);margin-top:0.3rem;">${c.source||''}</div>
            </div>
        </div>
    `).join('') : '<p style="text-align:center;color:var(--text2);">No cards found.</p>';
}
loadCards();