let userCurrency = { beli: 0, gems: 0, gold_coins: 0 };

async function loadStore() {
    const userId = new URLSearchParams(window.location.search).get('id') || 'demo_user';
    
    // Load user currency
    const profileRes = await fetch(`/.netlify/functions/api-profiles?id=${userId}`);
    const profile = await profileRes.json();
    userCurrency = { 
        beli: profile.beli || 0, 
        gems: profile.gems || 0, 
        gold_coins: profile.gold_coins || 0 
    };
    
    updateCurrencyDisplay();
    loadItems();
    loadPacks();
    loadCardShop();
    loadEventStore();
}

function updateCurrencyDisplay() {
    document.getElementById('userBeli').textContent = formatNumber(userCurrency.beli);
    document.getElementById('userGems').textContent = userCurrency.gems;
    document.getElementById('userCoins').textContent = userCurrency.gold_coins;
}

async function loadItems() {
    const response = await fetch('/.netlify/functions/api-store?type=items');
    const items = await response.json();
    
    document.getElementById('itemsGrid').innerHTML = items.map(item => `
        <div class="store-item">
            <div class="item-icon">${getItemIcon(item.item_type)}</div>
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <div class="price-tag">
                ${item.price_gems ? `💎 ${item.price_gems}` : `💰 ${formatNumber(item.price_beli)}฿`}
            </div>
            <button class="buy-btn" onclick="buyItem(${item.id}, '${item.price_type}')">
                Buy Now
            </button>
            ${item.stock > -1 ? `<span class="stock">Stock: ${item.stock}</span>` : ''}
        </div>
    `).join('');
}

async function loadPacks() {
    const response = await fetch('/.netlify/functions/api-store?type=packs');
    const packs = await response.json();
    
    document.getElementById('packsGrid').innerHTML = packs.map(pack => `
        <div class="store-item pack-item">
            <div class="pack-animation">📦</div>
            <h4>${pack.name}</h4>
            <p>Contains ${pack.card_count} cards</p>
            <div class="pack-rates">
                ${pack.rates ? Object.entries(pack.rates).map(([rarity, rate]) => 
                    `<span class="rate-badge">${rarity}: ${rate}%</span>`
                ).join('') : ''}
            </div>
            <div class="price-tag">💎 ${pack.price_gems}</div>
            <button class="buy-btn" onclick="buyPack(${pack.id})">Open Pack</button>
        </div>
    `).join('');
}

async function loadCardShop() {
    const response = await fetch('/.netlify/functions/api-cardshop');
    const listings = await response.json();
    
    document.getElementById('cardshopGrid').innerHTML = listings.map(listing => `
        <div class="card-listing">
            <img src="${listing.image_url}" alt="${listing.card_name}">
            <h4>${listing.card_name}</h4>
            <span class="rarity-badge" style="background: ${getRarityColor(listing.rarity)}">${listing.rarity}</span>
            <div class="seller-info">Seller: ${listing.seller_name}</div>
            <div class="price-tag">💰 ${formatNumber(listing.price)}฿</div>
            <button class="buy-btn" onclick="buyCard(${listing.id})">Purchase</button>
        </div>
    `).join('');
}

async function loadEventStore() {
    const response = await fetch('/.netlify/functions/api-store?type=events');
    const items = await response.json();
    
    document.getElementById('eventsGrid').innerHTML = items.map(item => `
        <div class="store-item event-item">
            <div class="event-badge">🎪</div>
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <div class="price-tag">🪙 ${item.price_coins} Coins</div>
            <button class="buy-btn event-btn" onclick="buyEventItem(${item.id})">
                Purchase
            </button>
        </div>
    `).join('');
}

async function buyItem(itemId, priceType) {
    const userId = new URLSearchParams(window.location.search).get('id');
    if (!userId) {
        alert('Please login first!');
        return;
    }
    
    try {
        const response = await fetch('/.netlify/functions/api-store', {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'buy_item', 
                userId, 
                itemId 
            })
        });
        
        const result = await response.json();
        if (result.success) {
            alert('Purchase successful!');
            loadStore(); // Refresh
        } else {
            alert('Purchase failed: ' + result.error);
        }
    } catch (error) {
        alert('Error making purchase');
    }
}

function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
}

function showStoreTab(tabName) {
    document.querySelectorAll('.store-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName + 'Tab').style.display = 'block';
    event.target.classList.add('active');
}

loadStore();