let currentPage = 1;
const cardsPerPage = 24;
let allCards = [];

async function loadCards() {
    try {
        const response = await fetch('/.netlify/functions/api-cards?all=true');
        allCards = await response.json();
        filterCards();
    } catch (error) {
        console.error('Failed to load cards:', error);
    }
}

function filterCards() {
    const rarity = document.getElementById('rarityFilter').value;
    const source = document.getElementById('sourceFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
    const sortBy = document.getElementById('sortBy').value;
    
    let filtered = [...allCards];
    
    if (rarity) filtered = filtered.filter(c => c.rarity === rarity);
    if (source) filtered = filtered.filter(c => c.source === source);
    if (search) filtered = filtered.filter(c => c.card_name.toLowerCase().includes(search));
    
    switch(sortBy) {
        case 'name':
            filtered.sort((a, b) => a.card_name.localeCompare(b.card_name));
            break;
        case 'rarity':
            const rarityOrder = ['Mythic', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
            filtered.sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));
            break;
        case 'attack':
            filtered.sort((a, b) => b.attack - a.attack);
            break;
        case 'defense':
            filtered.sort((a, b) => b.defense - a.defense);
            break;
    }
    
    displayCards(filtered);
}

function displayCards(cards) {
    const container = document.getElementById('cardsContainer');
    const start = (currentPage - 1) * cardsPerPage;
    const paginatedCards = cards.slice(start, start + cardsPerPage);
    
    container.innerHTML = paginatedCards.map(card => `
        <div class="card-detail" style="border-color: ${getRarityColor(card.rarity)}">
            <div class="card-image-container">
                <img src="${card.image_url}" alt="${card.card_name}" loading="lazy">
                <span class="card-source">${card.source.toUpperCase()}</span>
            </div>
            <div class="card-info">
                <h3>${card.card_name}</h3>
                <span class="rarity-badge" style="background: ${getRarityColor(card.rarity)}">${card.rarity}</span>
                <div class="stats-row">
                    <div class="stat">
                        <span class="stat-label">ATK</span>
                        <span class="stat-value">${card.attack}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">DEF</span>
                        <span class="stat-value">${card.defense}</span>
                    </div>
                </div>
                <div class="card-owner">
                    Owned by: ${card.owner_name || 'Unknown'}
                </div>
            </div>
        </div>
    `).join('');
    
    // Pagination
    const totalPages = Math.ceil(cards.length / cardsPerPage);
    document.getElementById('pagination').innerHTML = `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
        <span>Page ${currentPage} of ${totalPages}</span>
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
    `;
}

function changePage(page) {
    currentPage = page;
    filterCards();
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

loadCards();