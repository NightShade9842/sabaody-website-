async function loadLB(type) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    const data = await fetch(`${API}/leaderboard?type=${type}`).then(r => r.json());
    const content = document.getElementById('lbContent');
    if (!data.length) return content.innerHTML = '<p style="text-align:center;color:var(--text2);">No data.</p>';
    let html = '<table><thead><tr>';
    if (type === 'level') html += '<th>Rank</th><th>Pirate</th><th>Level</th><th>XP</th>';
    if (type === 'richest') html += '<th>Rank</th><th>Pirate</th><th>Wallet</th><th>Bank</th><th>Total</th>';
    if (type === 'legendary') html += '<th>Rank</th><th>Pirate</th><th>Legendary Cards</th>';
    if (type === 'guild') html += '<th>Rank</th><th>Guild</th><th>Treasury</th><th>Members</th>';
    html += '</tr></thead><tbody>';
    data.forEach((r, i) => {
        const cls = i < 3 ? `rank-${i+1}` : '';
        html += `<tr class="${cls}"><td>#${i+1}</td>`;
        if (type === 'level') html += `<td><a href="/profile.html?${r.user_id}" style="color:var(--text);">${r.pirate_name}</a></td><td>${r.level}</td><td>${formatNumber(r.xp)}</td>`;
        if (type === 'richest') html += `<td><a href="/profile.html?${r.user_id}" style="color:var(--text);">${r.pirate_name}</a></td><td>${formatNumber(r.beli)}฿</td><td>${formatNumber(r.bank)}฿</td><td>${formatNumber(r.total)}฿</td>`;
        if (type === 'legendary') html += `<td><a href="/profile.html?${r.user_id}" style="color:var(--text);">${r.pirate_name}</a></td><td>${r.count}</td>`;
        if (type === 'guild') html += `<td>${r.name}</td><td>${formatNumber(r.treasury)}฿</td><td>${r.members}</td>`;
        html += '</tr>';
    });
    content.innerHTML = html + '</tbody></table>';
}
loadLB('level');