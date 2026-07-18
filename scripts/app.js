const db = new AppDatabase();
let matches = [];
let bookingsData = {};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await db.open();

        let loadedMatches = await db.getAllMatches();
        if (loadedMatches.length === 0) {
            matches = [
                { id: 'm1', date: '2026-07-15', time: '19:00', name: 'ЦСКА — Спартак', deposit: 50 },
                { id: 'm2', date: '2026-07-15', time: '21:30', name: 'Зенит — Локомотив', deposit: 80 },
                { id: 'm3', date: '2026-07-16', time: '18:00', name: 'Динамо — Краснодар', deposit: 40 },
            ];
            for (const m of matches) await db.addMatch(m);
        } else {
            matches = loadedMatches;
        }

        const allBookings = await db.getAllBookings();
        bookingsData = {};
        for (const b of allBookings) {
            if (!bookingsData[b.matchId]) bookingsData[b.matchId] = [];
            bookingsData[b.matchId].push(b);
        }

        initUI();
        renderMatches(null);
    } catch (err) {
        console.error('Ошибка базы данных', err);
    }
});

function initUI() {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.view === 'matches') {
                document.getElementById('matchesView').style.display = '';
                document.getElementById('bookingView').style.display = 'none';
                document.getElementById('backButtonWrapper').style.display = 'none';
                document.querySelector('.tab-button[data-view="booking"]').disabled = true;
                btn.classList.add('active');
                document.querySelector('.tab-button[data-view="booking"]').classList.remove('active');
            }
        });
    });

    document.getElementById('backToMatches').addEventListener('click', () => {
        document.getElementById('matchesView').style.display = '';
        document.getElementById('bookingView').style.display = 'none';
        document.getElementById('backButtonWrapper').style.display = 'none';
        document.querySelector('.tab-button[data-view="booking"]').disabled = true;
        document.querySelector('.tab-button[data-view="matches"]').classList.add('active');
        document.querySelector('.tab-button[data-view="booking"]').classList.remove('active');
    });

    const datePicker = document.getElementById('datePicker');
    datePicker.addEventListener('change', () => renderMatches(datePicker.value));
    document.getElementById('resetDateFilter').addEventListener('click', () => {
        datePicker.value = '';
        renderMatches(null);
    });

    document.getElementById('createMatchBtn').addEventListener('click', showCreateMatchModal);

    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);
}

async function exportData() {
    try {
        const allMatches = await db.getAllMatches();
        const allBookings = await db.getAllBookings();
        const data = { matches: allMatches, bookings: allBookings };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `booking_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Данные экспортированы');
    } catch (err) {
        console.error(err);
        showToast('Ошибка экспорта');
    }
}

async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.matches || !data.bookings) throw new Error('Неверный формат');
        
        if (!confirm(`Загрузить ${data.matches.length} матчей и ${data.bookings.length} броней? Текущие данные будут заменены.`)) return;
        
        await db.clearAll();
        await db.addMatches(data.matches);
        await db.addBookings(data.bookings);
        
        matches.length = 0;
        matches.push(...data.matches);
        bookingsData = {};
        for (const b of data.bookings) {
            if (!bookingsData[b.matchId]) bookingsData[b.matchId] = [];
            bookingsData[b.matchId].push(b);
        }
        
        renderMatches(document.getElementById('datePicker').value || null);
        if (window.currentMatchId) {
            updateMatchHeader(window.currentMatchId);
            renderFloorPlan(window.currentMatchId);
            updateOccupancySummary(window.currentMatchId);
        }
        showToast('Данные импортированы');
    } catch (err) {
        console.error(err);
        showToast('Ошибка импорта: неверный файл');
    }
    event.target.value = '';
}