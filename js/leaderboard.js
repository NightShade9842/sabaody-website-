async function loadLeaderboard(type) {
    const response = await fetch(`/.netlify/functions/api-leaderboard?type=${type}`);
    const data = await response.json();
    
    switch(type) {
        case 'level':
            displayTop3('levelTop3', data.slice(0, 3), 'level');
            displayTable('levelTableBody', data, ['rank', 'pirate_name', 'level', 'xp', 'card_count']);
            break;
        case 'richest':
            displayTop3('richestTop3', data.slice(0, 3), 'beli');
            displayTable('richestTableBody', data, ['rank', 'pirate_name', 'beli', 'gems', 'total_value']);
            break;
        case 'legendary':
            displayTop3('legendaryTop3', data.slice(0, 3), 'legendary_count');
            displayTable('legendaryTableBody', data, ['rank', 'pirate_name', 'legendary_count', 'mythic_count', 'total_cards']);
            break;
        case 'guild':
            displayTable('guildTableBody', data, ['rank', 'name', 'member_count', 'treasury', 'type']);
            break;
        case 'casino':
            displayTable('casinoTableBody', data, ['rank', 'player_name', 'games_played', 'total_won', 'biggest_win']);
            break;
    }
}

function displayTop3(elementId, topPlayers, metric) {
    const container = document.getElementById(elementId);
    const positions = ['🥇', '🥈', '🥉'];
    
    container.innerHTML = topPlayers.map((player, index) => `
        <div class="top-player rank-${index + 1}">
            <span class="position">${positions[index]}</span>
            <img src="${player.avatar || 'default-avatar.png'}" alt="${player.pirate_name}" class="top-avatar">
            <div class="top-info">
                <h4>${player.pirate_name}</h4>
                <span class="metric">${formatMetric(metric, player[metric])}</span>
            </div>
        </div>
    `).join('');
}

function displayTable(tableBodyId, data, columns) {
    const tbody = document.getElementById(tableBodyId);
    
    tbody.innerHTML = data.map((row, index) => `
        <tr>
            ${columns.map(col => {
                if (col === 'rank') return `<td>#${index + 1}</td>`;
                if (col === 'pirate_name') return `<td><a href="profile.html?id=${row.user_id}">${row[col]}</a></td>`;
                return `<td>${formatValue(col, row[col])}</td>`;
            }).join('')}
        </tr>
    `).join('');
}

function formatMetric(metric, value) {
    if (metric === 'beli' || metric === 'total_value' || metric === 'total_won') {
        return formatNumber(value) + '฿';
    }
    return value;
}

function formatValue(col, value) {
    if (col === 'beli' || col === 'total_value' || col === 'treasury' || col === 'total_won' || col === 'biggest_win') {
        return formatNumber(value) + '฿';
    }
    return value || '0';
}

function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num?.toString() || '0';
}

function showLB(type) {
    document.querySelectorAll('.leaderboard-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(type + 'LB').style.display = 'block';
    event.target.classList.add('active');
    loadLeaderboard(type);
}

// Load initial leaderboard
loadLeaderboard('level');