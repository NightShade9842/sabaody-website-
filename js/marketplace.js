async function loadStore() {
    const items = await fetch(`${API}/store`).then(r => r.json());
    const grid = document.getElementById('storeItems');
    if (!items.length) {
        grid.innerHTML = '<p style="color:var(--text2);">Store empty.</p>';
        return;
    }

    const icons = { potion: '🧪', rare_candy: '🍬', fusion_stone: '💎', evolution_stone: '🔄', pack: '📦', beli_pack: '💰' };
    grid.innerHTML = items.map(i => {
        const price = i.price_gems ? `${i.price_gems}💎` : `${i.price_beli?.toLocaleString()}฿`;
        return `
        <div class="card" style="text-align:center; padding:1.5rem;">
            <div style="font-size:3rem; margin-bottom:0.5rem;">${icons[i.item_type] || '📦'}</div>
            <div class="card-title">${i.name}</div>
            <p style="font-size:0.85rem;color:var(--text2);">${i.description}</p>
            <div style="font-weight:bold;color:var(--gold);margin:0.5rem 0;">${price}</div>
            <button class="btn" onclick="buyItem(${i.id})">🛒 Buy</button>
        </div>`;
    }).join('');
}

async function buyItem(itemId) {
    const userId = getSavedUserId();
    if (!userId) return alert('Please login first');
    const res = await fetch(`${API}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'item', id: itemId })
    });
    const data = await res.json();
    alert(data.message || data.error);
}

loadStore();