async function loadMarket() {
    const listings = await fetch(`${API}/marketplace`).then(r => r.json());
    const grid = document.getElementById('marketListings');
    if (!listings.length) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text2);">No cards for sale right now.</p>';
        return;
    }
    grid.innerHTML = listings.map(l => {
        const tier = l.rarity || 't1';
        const timeLeft = l.expires_at ? Math.max(0, Math.ceil((new Date(l.expires_at) - Date.now()) / 3600000)) + 'h' : '?';
        return `
        <div class="card">
            <img src="${l.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(l.card_name)}&size=256&background=141b22&color=f0b90b`}" 
                 onerror="this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${l.card_name}') + '&size=256&background=141b22&color=f0b90b'">
            <div class="card-body">
                <div class="card-title">${l.card_name}</div>
                <span class="card-rarity rarity-${tier}">${tier.toUpperCase()}</span>
                <div class="card-stats"><span>💰 ${formatNumber(l.price)}฿</span><span>⏳ ${timeLeft}</span></div>
                <div style="font-size:0.75rem;color:var(--text2);">Seller: ${l.seller_name}</div>
                <div style="font-size:0.75rem;color:var(--gold);">Listing #${l.id}</div>
            </div>
        </div>`;
    }).join('');
}
loadMarket();