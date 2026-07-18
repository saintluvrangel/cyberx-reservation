// js/booking.js

function getTableNumber(tableId) {
    const match = tableId.match(/^table-(\d+)$/);
    return match ? parseInt(match[1]) : 999;
}

function findTableCombinations(matchId, requiredPeople) {
    const freeTables = [];
    for (let i = 1; i <= 8; i++) {
        const tid = `table-${i}`;
        if (getItemStatus(matchId, tid) === 'free') {
            freeTables.push({ id: tid, capacity: itemsData[tid].capacity, number: i });
        }
    }

    const result = [];

    function backtrack(start, currentCombo, currentCap) {
        if (currentCap >= requiredPeople) {
            result.push([...currentCombo]);
        }
        for (let i = start; i < freeTables.length; i++) {
            const table = freeTables[i];
            currentCombo.push(table);
            backtrack(i + 1, currentCombo, currentCap + table.capacity);
            currentCombo.pop();
        }
    }

    backtrack(0, [], 0);

    result.sort((a, b) => {
        if (a.length !== b.length) return a.length - b.length;
        const sumA = a.reduce((s, t) => s + t.number, 0);
        const sumB = b.reduce((s, t) => s + t.number, 0);
        return sumA - sumB;
    });

    return result;
}

function renderFloorPlan(matchId) {
    const floorPlan = document.getElementById('floorPlan');
    floorPlan.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'screen-box';
    screen.textContent = 'ЭКРАН';
    floorPlan.appendChild(screen);

    const mainArea = document.createElement('div');
    mainArea.className = 'main-area';

    const leftCounter = document.createElement('div');
    leftCounter.className = 'left-counter';
    const leftCounterRect = document.createElement('div');
    leftCounterRect.className = 'counter-rect';
    leftCounterRect.textContent = 'Стойка 1';
    leftCounter.appendChild(leftCounterRect);
    const leftStools = document.createElement('div');
    leftStools.className = 'stool-group';
    for (let i = 1; i <= 3; i++) {
        leftStools.appendChild(createItemElement(`left-${i}`, 'stool-circle', matchId));
    }
    leftCounter.appendChild(leftStools);
    mainArea.appendChild(leftCounter);

    const tablesCenter = document.createElement('div');
    tablesCenter.className = 'tables-center';
    const topRow = document.createElement('div');
    topRow.className = 'table-row';
    [5,6,7,8].forEach(num => {
        topRow.appendChild(createItemElement(`table-${num}`, 'table-rect', matchId));
    });
    const bottomRow = document.createElement('div');
    bottomRow.className = 'table-row';
    [1,2,3,4].forEach(num => {
        bottomRow.appendChild(createItemElement(`table-${num}`, 'table-rect', matchId));
    });
    tablesCenter.appendChild(topRow);
    tablesCenter.appendChild(bottomRow);
    mainArea.appendChild(tablesCenter);

    const rightCounter = document.createElement('div');
    rightCounter.className = 'right-counter';
    const rightCounterRect = document.createElement('div');
    rightCounterRect.className = 'counter-rect';
    rightCounterRect.textContent = 'Стойка 2';
    rightCounter.appendChild(rightCounterRect);
    const rightStools = document.createElement('div');
    rightStools.className = 'stool-group';
    for (let i = 1; i <= 3; i++) {
        rightStools.appendChild(createItemElement(`right-${i}`, 'stool-circle', matchId));
    }
    rightCounter.appendChild(rightStools);
    mainArea.appendChild(rightCounter);

    floorPlan.appendChild(mainArea);

    const barArea = document.createElement('div');
    barArea.className = 'bar-area';
    const barStoolsRow = document.createElement('div');
    barStoolsRow.className = 'bar-stools';
    for (let i = 1; i <= 6; i++) {
        barStoolsRow.appendChild(createItemElement(`bar-${i}`, 'stool-circle', matchId));
    }
    barArea.appendChild(barStoolsRow);
    const barRect = document.createElement('div');
    barRect.className = 'bar-rect';
    barRect.textContent = 'Бар';
    barArea.appendChild(barRect);
    floorPlan.appendChild(barArea);
}

function createItemElement(itemId, cssClass, matchId) {
    const item = itemsData[itemId];
    const status = getItemStatus(matchId, itemId);
    const el = document.createElement('div');
    el.className = `${cssClass} ${status}`;
    el.setAttribute('data-item-id', itemId);

    if (item.type === 'table') {
        el.innerHTML = `<span>${item.label}</span><span style="font-size:0.7rem;">(${item.capacity} мест)</span>`;
    } else {
        el.textContent = item.label;
    }

    el.addEventListener('click', (e) => {
        e.stopPropagation();
        handleItemClick(itemId, matchId);
    });

    return el;
}

function getItemStatus(matchId, itemId) {
    const booking = getBookingForItem(matchId, itemId);
    if (!booking) return 'free';
    return booking.depositPaid ? 'booked' : 'no-deposit';
}

function handleItemClick(itemId, matchId) {
    const status = getItemStatus(matchId, itemId);
    if (status === 'free') {
        showInfoModal(itemId, matchId);
    } else {
        const booking = getBookingForItem(matchId, itemId);
        if (booking) showBookingDetailsModal(booking, matchId);
    }
}

function showInfoModal(itemId, matchId) {
    const item = itemsData[itemId];
    const match = matches.find(m => m.id === matchId);
    const typeLabel = item.type === 'table' ? `Стол (до ${item.capacity} мест)` : 'Место за стойкой';
    const content = document.getElementById('infoModalContent');
    content.innerHTML = `
        <h3>${item.label}</h3>
        <div class="booking-details">
            <div class="detail-row">
                <span class="detail-label">Тип</span>
                <span class="detail-value">${typeLabel}</span>
            </div>
            <hr class="detail-divider">
            <div class="detail-row">
                <span class="detail-label">Матч</span>
                <span class="detail-value">${match.name}</span>
            </div>
            <hr class="detail-divider">
            <div class="detail-row">
                <span class="detail-label">Дата</span>
                <span class="detail-value">${match.date} в ${match.time}</span>
            </div>
            <hr class="detail-divider">
            <div class="detail-row">
                <span class="detail-label">Статус</span>
                <span class="detail-value" style="color: var(--green);">Свободно</span>
            </div>
        </div>
        <button class="btn-primary info-modal-btn" id="goToBookingBtn">Забронировать</button>
    `;
    document.getElementById('infoModal').classList.add('active');
    document.getElementById('goToBookingBtn').addEventListener('click', () => {
        document.getElementById('infoModal').classList.remove('active');
        showBookingForm(itemId, matchId);
    });
}

// Функция для форматирования телефона
function formatPhone(value) {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('375')) {
        const code = digits.slice(3, 5);
        const part1 = digits.slice(5, 8);
        const part2 = digits.slice(8, 10);
        const part3 = digits.slice(10, 12);
        let res = '+375';
        if (code) res += ` (${code}`;
        if (part1) res += `) ${part1}`;
        if (part2) res += `-${part2}`;
        if (part3) res += `-${part3}`;
        return res;
    } else {
        return `+375 (${digits.slice(0, 2)}${digits.slice(2, 5) ? ') ' + digits.slice(2, 5) : ''}${digits.slice(5, 8) ? '-' + digits.slice(5, 8) : ''}${digits.slice(8, 10) ? '-' + digits.slice(8, 10) : ''}`;
    }
}

// Привязываем маску к полю
function bindPhoneMask(input) {
    input.addEventListener('input', (e) => {
        const cursor = input.selectionStart;
        const prev = input.value;
        const next = formatPhone(prev);
        input.value = next;
        const diff = next.length - prev.length;
        input.setSelectionRange(cursor + diff, cursor + diff);
    });
}

function showBookingForm(preselectedItemId, matchId, editBooking = null) {
    const preselectedItem = itemsData[preselectedItemId];
    const match = matches.find(m => m.id === matchId);
    const isTable = preselectedItem.type === 'table';

    const content = document.getElementById('bookingModalContent');
    content.innerHTML = `
        <h3>${editBooking ? 'Редактировать бронь' : (isTable ? 'Забронировать стол(ы)' : 'Забронировать место')}</h3>
        <p class="booking-match-info">${match.name} · ${match.date} ${match.time} · Стол: ${match.tableDeposit ?? 30} BYN · Стул: ${match.stoolDeposit ?? 20} BYN</p>
        
        <div class="form-group">
            <label>Количество человек (за столами)</label>
            <input type="number" id="peopleCount" min="0" max="20" value="${editBooking ? editBooking.people : (isTable ? preselectedItem.capacity : 0)}" placeholder="Сколько гостей за столами?">
        </div>

        <div class="form-group">
            <label>Выбранные места</label>
            <div id="selectedItemsContainer" class="items-selection"></div>
            <button id="addItemBtn" class="btn-secondary btn-add">+ Добавить ещё место</button>
        </div>

        <div id="capacityInfo" class="capacity-info">
            <span id="depositDetails"></span>
        </div>

        <div class="form-group">
            <label>ФИО</label>
            <input type="text" id="bookingName" placeholder="Иванов Иван Иванович" value="${editBooking ? editBooking.name : ''}">
        </div>
        <div class="form-group">
            <label>Телефон</label>
            <input type="tel" id="bookingPhone" placeholder="+375 (29) 123-45-67" value="${editBooking ? editBooking.phone : ''}">
        </div>
        
        <div class="toggle-wrapper" style="margin: 24px 0 16px;">
            <input type="checkbox" id="depositPaidCheckbox" class="ios-toggle" ${editBooking ? (editBooking.depositPaid ? 'checked' : '') : ''}>
            <label for="depositPaidCheckbox" class="toggle-label">Депозит внесён</label>
        </div>

        <div class="save-btn-container">
            <button class="btn-primary" id="saveBookingBtn">${editBooking ? 'Сохранить изменения' : 'Забронировать'}</button>
        </div>
    `;

    document.getElementById('bookingModal').classList.add('active');

    const phoneInput = document.getElementById('bookingPhone');
    bindPhoneMask(phoneInput);

    const selectedItems = new Set(editBooking ? editBooking.items : [preselectedItemId]);
    const peopleInput = document.getElementById('peopleCount');
    const addBtn = document.getElementById('addItemBtn');
    const saveBtn = document.getElementById('saveBookingBtn');
    const selectedContainer = document.getElementById('selectedItemsContainer');
    const depositDetails = document.getElementById('depositDetails');

    function updateDepositAndUI() {
        const tables = [];
        const stools = [];
        selectedItems.forEach(id => {
            const item = itemsData[id];
            if (item.type === 'table') tables.push(item);
            else stools.push(item);
        });

        const totalTableCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
        const stoolCount = stools.length;
        const hasTables = tables.length > 0;

        if (hasTables) {
            peopleInput.disabled = false;
            peopleInput.max = Math.max(1, Math.min(20, totalTableCapacity));
            let currentPeople = parseInt(peopleInput.value) || 0;
            if (currentPeople > totalTableCapacity) {
                peopleInput.value = totalTableCapacity;
            } else if (currentPeople <= 0 && totalTableCapacity > 0) {
                peopleInput.value = Math.min(1, totalTableCapacity);
            }
        } else {
            peopleInput.disabled = true;
            peopleInput.value = stoolCount;
        }

        const tablePeople = hasTables ? (parseInt(peopleInput.value) || 0) : 0;
        const totalPeople = tablePeople + stoolCount;

        const tableDeposit = match.tableDeposit ?? 30;
        const stoolDeposit = match.stoolDeposit ?? 20;
        const totalDep = tablePeople * tableDeposit + stoolCount * stoolDeposit;

        let detailText = '';
        if (hasTables) {
            const tableNames = tables.map(t => t.label).join(', ');
            detailText += `Столы: ${tablePeople} чел. (${tableNames})`;
        }
        if (stoolCount > 0) {
            const stoolNames = stools.map(s => s.label).join(', ');
            detailText += (detailText ? ' · ' : '') + `Стулья: ${stoolNames} (${stoolCount} шт. × ${stoolDeposit} BYN)`;
        }
        detailText += `<br><strong>Итого: ${totalDep} BYN (гостей: ${totalPeople})</strong>`;

        depositDetails.innerHTML = detailText;
        return { totalPeople, totalDep, hasTables, stoolCount, totalTableCapacity };
    }

    function renderSelectedItems() {
        selectedContainer.innerHTML = '';
        selectedItems.forEach(id => {
            const item = itemsData[id];
            const mini = document.createElement('div');
            mini.className = 'mini-item free';
            mini.innerHTML = `
                <span class="mini-item-label">${item.label}</span>
                <span class="mini-item-capacity">${item.type === 'table' ? item.capacity + ' мест' : '1 место'}</span>
                <span class="mini-item-remove" data-id="${id}">✕</span>
            `;
            mini.querySelector('.mini-item-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                if (selectedItems.size > 1) {
                    selectedItems.delete(id);
                    renderSelectedItems();
                    updateDepositAndUI();
                } else {
                    showToast('Должно быть выбрано хотя бы одно место');
                }
            });
            selectedContainer.appendChild(mini);
        });
    }

    renderSelectedItems();
    updateDepositAndUI();

    peopleInput.addEventListener('input', updateDepositAndUI);

    addBtn.addEventListener('click', () => {
        const freeItems = Object.keys(itemsData).filter(id => {
            const status = getItemStatus(matchId, id);
            return status === 'free' || selectedItems.has(id);
        }).filter(id => !selectedItems.has(id));
        if (freeItems.length === 0) {
            showToast('Нет доступных мест');
            return;
        }

        const chooseDiv = document.createElement('div');
        chooseDiv.className = 'mini-choose';
        chooseDiv.innerHTML = '<div class="mini-choose-title">Выберите место</div>';
        const list = document.createElement('div');
        list.className = 'mini-choose-list';
        freeItems.forEach(id => {
            const item = itemsData[id];
            const opt = document.createElement('div');
            opt.className = 'mini-choose-item';
            opt.innerHTML = `${item.label} (${item.type === 'table' ? item.capacity + ' мест' : '1 место'})`;
            opt.addEventListener('click', () => {
                selectedItems.add(id);
                chooseDiv.remove();
                renderSelectedItems();
                updateDepositAndUI();
            });
            list.appendChild(opt);
        });
        chooseDiv.appendChild(list);
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-cancel';
        cancelBtn.textContent = 'Отмена';
        cancelBtn.addEventListener('click', () => chooseDiv.remove());
        chooseDiv.appendChild(cancelBtn);
        addBtn.parentNode.insertBefore(chooseDiv, addBtn.nextSibling);
    });

    saveBtn.addEventListener('click', async () => {
        const { totalPeople, totalDep, hasTables, stoolCount, totalTableCapacity } = updateDepositAndUI();
        const tablePeople = hasTables ? (parseInt(peopleInput.value) || 0) : 0;

        if (hasTables && tablePeople > totalTableCapacity) {
            alert(`Столы вмещают не более ${totalTableCapacity} человек.`);
            return;
        }
        if (!hasTables && stoolCount === 0) {
            alert('Выберите хотя бы одно место.');
            return;
        }
        if (hasTables && tablePeople <= 0) {
            alert('Количество гостей за столами должно быть больше 0.');
            return;
        }

        const name = document.getElementById('bookingName').value.trim();
        const phone = document.getElementById('bookingPhone').value.trim();
        if (!name || !phone) { alert('Заполните ФИО и телефон'); return; }
        const depositPaid = document.getElementById('depositPaidCheckbox').checked;

        if (editBooking) {
            // Обновление существующей брони
            editBooking.name = name;
            editBooking.phone = phone;
            editBooking.items = Array.from(selectedItems);
            editBooking.people = totalPeople;
            editBooking.depositRequired = totalDep;
            editBooking.depositPaid = depositPaid;

            try {
                await db.updateBooking(editBooking);
                const matchBookings = bookingsData[matchId];
                if (matchBookings) {
                    const idx = matchBookings.findIndex(b => b.id === editBooking.id);
                    if (idx !== -1) matchBookings[idx] = editBooking;
                }
                document.getElementById('bookingModal').classList.remove('active');
                renderFloorPlan(matchId);
                updateOccupancySummary(matchId);
                showToast('Бронь обновлена');
            } catch (err) {
                console.error(err);
                showToast('Ошибка сохранения');
            }
        } else {
            // Новая бронь
            const newBooking = {
                id: 'b' + Date.now(),
                matchId: matchId,
                items: Array.from(selectedItems),
                people: totalPeople,
                name,
                phone,
                depositRequired: totalDep,
                depositPaid
            };
            try {
                await db.addBooking(newBooking);
                if (!bookingsData[matchId]) bookingsData[matchId] = [];
                bookingsData[matchId].push(newBooking);
                document.getElementById('bookingModal').classList.remove('active');
                renderFloorPlan(matchId);
                updateOccupancySummary(matchId);
                showToast('Бронирование создано');
            } catch (err) {
                console.error(err);
                showToast('Ошибка сохранения');
            }
        }
    });
}

// --- Удаление брони ---
async function deleteBooking(booking, matchId) {
    try {
        await db.deleteBooking(booking.id);
        const matchBookings = bookingsData[matchId];
        if (matchBookings) {
            const idx = matchBookings.findIndex(b => b.id === booking.id);
            if (idx !== -1) matchBookings.splice(idx, 1);
        }
        renderFloorPlan(matchId);
        updateOccupancySummary(matchId);
        showToast('Бронь удалена');
    } catch (err) {
        console.error(err);
        showToast('Ошибка удаления');
    }
}

function showDeleteConfirmation(booking, matchId) {
    const content = document.getElementById('infoModalContent');
    content.innerHTML = `
        <h3>Удалить бронь?</h3>
        <p style="margin-bottom: 24px;">Вы действительно хотите удалить бронь #${booking.id} (${booking.name})?</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn-cancel" id="cancelDeleteBtn">Отмена</button>
            <button class="btn-delete-booking" id="confirmDeleteBtn">Удалить</button>
        </div>
    `;
    document.getElementById('infoModal').classList.add('active');
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        document.getElementById('infoModal').classList.remove('active');
    });
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        document.getElementById('infoModal').classList.remove('active');
        await deleteBooking(booking, matchId);
    });
}

// --- Просмотр деталей брони ---
function showBookingDetailsModal(booking, matchId) {
    const match = matches.find(m => m.id === matchId);
    const itemsStr = booking.items.map(id => itemsData[id].label).join(', ');
    const content = document.getElementById('infoModalContent');
    const depositStatusHTML = booking.depositPaid
        ? '<span class="badge badge-paid">✅ Депозит внесён</span>'
        : '<span class="badge badge-unpaid">⚠️ Депозит не внесён</span>';
    
    content.innerHTML = `
        <h3>📋 Бронь #${booking.id}</h3>
        <div class="booking-details">
            <div class="detail-row">
                <span class="detail-label">Матч</span>
                <span class="detail-value">${match ? match.name : ''}</span>
            </div>
            <hr class="detail-divider">
            <div class="detail-row">
                <span class="detail-label">ФИО</span>
                <span class="detail-value">${booking.name}</span>
            </div>
            <hr class="detail-divider">
            <div class="detail-row">
                <span class="detail-label">Телефон</span>
                <span class="detail-value">${booking.phone}</span>
            </div>
            <hr class="detail-divider">
            <div class="detail-row">
                <span class="detail-label">Гостей</span>
                <span class="detail-value">${booking.people}</span>
            </div>
            <hr class="detail-divider">
            <div class="detail-row">
                <span class="detail-label">Места</span>
                <span class="detail-value">${itemsStr}</span>
            </div>
            <hr class="detail-divider">
            <div class="detail-row">
                <span class="detail-label">Депозит</span>
                <span class="detail-value">${booking.depositRequired} BYN</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Статус</span>
                <span class="detail-value">${depositStatusHTML}</span>
            </div>
        </div>
        <div style="display: flex; gap: 12px; justify-content: space-between; align-items: center; margin-top: 20px;">
            <button class="btn-delete-booking" id="deleteBookingBtn">🗑️ Удалить</button>
            <button class="btn-primary" id="editBookingBtn">✏️ Редактировать</button>
        </div>
    `;

    document.getElementById('infoModal').classList.add('active');

    document.getElementById('deleteBookingBtn').addEventListener('click', () => {
        showDeleteConfirmation(booking, matchId);
    });

    document.getElementById('editBookingBtn').addEventListener('click', () => {
        document.getElementById('infoModal').classList.remove('active');
        showBookingForm(booking.items[0], matchId, booking);
    });
}