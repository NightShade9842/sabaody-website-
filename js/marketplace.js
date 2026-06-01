// js/marketplace.js
async function loadMarket() {
    const listings = await fetch(`${API}/marketplace`).then(r => r.json());
    const grid = document.getElementById('marketListings');
    if (!listings.length) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text2);">No cards for sale.</p>';
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
                <button class="btn" style="margin-top:0.5rem;" onclick="buyCard(${l.id})">🛒 Buy</button>
            </div>
        </div>`;
    }).join('');
}

async function buyCard(listingId) {
    const userId = getSavedUserId();
    if (!userId) return alert('Please login first (Profile page)');
    try {
        const res = await fetch(`${API}/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, type: 'card', id: listingId })
        });
        const data = await res.json();
        alert(data.message || data.error);
        // Reload market to reflect changes
        loadMarket();
    } catch (e) {
        alert('Purchase failed');
    }
}

function getSavedUserId() {
    return localStorage.getItem('sabaody_user') || '';
}

loadMarket();