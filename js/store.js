async function loadStore() {
    const items = await fetch(`${API}/store`).then(r => r.json());
    const grid = document.getElementById('storeItems');
    if (!items.length) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text2);">Store is empty.</p>';
        return;
    }
    grid.innerHTML = items.map(i => {
        const icon = {potion:'🧪',rare_candy:'🍬',fusion_stone:'💎',evolution_stone:'🔄',pack:'📦',beli_pack:'💰'}[i.item_type] || '📦';
        const price = i.price_gems ? `${i.price_gems}💎` : `${i.price_beli.toLocaleString()}฿`;
        return `
        <div class="card" style="text-align:center; padding:1.5rem;">
            <div style="font-size:3rem; margin-bottom:0.5rem;">${icon}</div>
            <div class="card-title">${i.name}</div>
            <p style="font-size:0.85rem;color:var(--text2);">${i.description}</p>
            <div style="font-weight:bold;color:var(--gold);margin:0.5rem 0;">${price}</div>
            <div class="btn" style="font-size:0.8rem; padding:0.5rem 1rem;">Buy in Bot</div>
        </div>`;
    }).join('');
}
loadStore();