function renderMatches(filterDate = null) {
    const container = document.getElementById('matchesList');
    const noMatches = document.getElementById('noMatches');
    let filtered = matches;
    if (filterDate) filtered = matches.filter(m => m.date === filterDate);
    container.innerHTML = '';
    if (filtered.length === 0) {
        noMatches.style.display = 'block';
        return;
    }
    noMatches.style.display = 'none';
    filtered.forEach(match => {
        const card = document.createElement('div');
        card.className = 'match-card';
        card.innerHTML = `
            <div class="match-teams">${match.name}</div>
            <div class="match-datetime">
                <span>📅 ${match.date}</span>
                <span>⏰ ${match.time}</span>
            </div>
            <div style="margin-top:8px; font-size:0.8rem;">Стол: ${match.tableDeposit} BYN · Стул: ${match.stoolDeposit} BYN</div>
            <button class="btn-delete-match" data-match-id="${match.id}">🗑️ Удалить</button>
        `;
        card.addEventListener('click', () => selectMatch(match.id));
        card.querySelector('.btn-delete-match').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteMatch(match.id);
        });
        container.appendChild(card);
    });
}

function selectMatch(matchId) {
    window.currentMatchId = matchId;
    document.getElementById('matchesView').style.display = 'none';
    document.getElementById('bookingView').style.display = '';
    document.getElementById('backButtonWrapper').style.display = '';
    document.querySelector('.tab-button[data-view="booking"]').disabled = false;
    document.querySelector('.tab-button[data-view="matches"]').classList.remove('active');
    document.querySelector('.tab-button[data-view="booking"]').classList.add('active');
    updateMatchHeader(matchId);
    renderFloorPlan(matchId);
    updateOccupancySummary(matchId);
}

function updateMatchHeader(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (match) {
        document.getElementById('matchInfoHeader').innerHTML = `
            <div class="match-header-main">
                <h3>🏟️ ${match.name}</h3>
                <div>${match.date} в ${match.time} · Стол: ${match.tableDeposit} BYN · Стул: ${match.stoolDeposit} BYN</div>
            </div>
            <div class="occupancy-summary" id="occupancySummary"></div>
        `;
    }
}

function updateOccupancySummary(matchId) {
    const summaryEl = document.getElementById('occupancySummary');
    if (!summaryEl) return;
    
    let tablesFree = 0, tablesBookedDep = 0, tablesBookedNoDep = 0;
    let stoolsFree = 0, stoolsBookedDep = 0, stoolsBookedNoDep = 0;
    
    for (const [itemId, item] of Object.entries(itemsData)) {
        const status = getItemStatus(matchId, itemId);
        if (item.type === 'table') {
            if (status === 'free') tablesFree++;
            else if (status === 'booked') tablesBookedDep++;
            else tablesBookedNoDep++;
        } else {
            if (status === 'free') stoolsFree++;
            else if (status === 'booked') stoolsBookedDep++;
            else stoolsBookedNoDep++;
        }
    }
    
    const tablesTotal = Object.values(itemsData).filter(i => i.type === 'table').length;
    const stoolsTotal = Object.values(itemsData).filter(i => i.type !== 'table').length;
    
    summaryEl.innerHTML = `
        <div class="occ-item">
            <span>🟢 Свободно</span>
            <span class="occ-detail">столы ${tablesFree}/${tablesTotal} · стулья ${stoolsFree}/${stoolsTotal}</span>
        </div>
        <div class="occ-item">
            <span>🔴 Занято</span>
            <span class="occ-detail">
                <span class="occ-dep">✅ ${tablesBookedDep + stoolsBookedDep}</span>
                <span class="occ-nodep">⚠️ ${tablesBookedNoDep + stoolsBookedNoDep}</span>
            </span>
        </div>
    `;
}

async function showCreateMatchModal() {
    const content = document.getElementById('matchModalContent');
    content.innerHTML = `
        <h3>Создать матч</h3>
        <div class="form-group"><label>Дата</label><input type="date" id="newMatchDate"></div>
        <div class="form-group"><label>Название</label><input type="text" id="newMatchName" placeholder="Команда 1 — Команда 2"></div>
        <div class="form-group"><label>Время</label><input type="time" id="newMatchTime"></div>
        <div class="form-group"><label>Депозит за стол (BYN)</label><input type="number" id="newTableDeposit" min="0" value="30"></div>
        <div class="form-group"><label>Депозит за стул (BYN)</label><input type="number" id="newStoolDeposit" min="0" value="20"></div>
        <button class="btn-primary" id="saveMatchBtn">Сохранить</button>
    `;
    document.getElementById('matchModal').classList.add('active');
    document.getElementById('saveMatchBtn').addEventListener('click', saveMatch);
}

async function saveMatch() {
    const date = document.getElementById('newMatchDate').value;
    const name = document.getElementById('newMatchName').value.trim();
    const time = document.getElementById('newMatchTime').value;
    const tableDeposit = parseFloat(document.getElementById('newTableDeposit').value);
    const stoolDeposit = parseFloat(document.getElementById('newStoolDeposit').value);
    if (!date || !name || !time || isNaN(tableDeposit) || isNaN(stoolDeposit)) {
        alert('Заполните все поля');
        return;
    }
    const newMatch = { id: 'm' + Date.now(), date, time, name, tableDeposit, stoolDeposit };
    await db.addMatch(newMatch);
    matches.push(newMatch);
    document.getElementById('matchModal').classList.remove('active');
    renderMatches(document.getElementById('datePicker').value || null);
}

async function deleteMatch(matchId) {
    if (!confirm('Удалить матч и все его брони?')) return;
    await db.deleteMatch(matchId);
    const related = bookingsData[matchId] || [];
    for (const b of related) await db.deleteBooking(b.id);
    matches = matches.filter(m => m.id !== matchId);
    delete bookingsData[matchId];
    if (window.currentMatchId === matchId) {
        document.getElementById('matchesView').style.display = '';
        document.getElementById('bookingView').style.display = 'none';
        document.getElementById('backButtonWrapper').style.display = 'none';
        document.querySelector('.tab-button[data-view="booking"]').disabled = true;
        document.querySelector('.tab-button[data-view="matches"]').classList.add('active');
        document.querySelector('.tab-button[data-view="booking"]').classList.remove('active');
        window.currentMatchId = null;
    }
    renderMatches(document.getElementById('datePicker').value || null);
}