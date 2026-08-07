// js/booking.js

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
}

// Маска для телефона: только цифры, автоматически добавляет +
function setupPhoneInput(inputElement) {
    inputElement.addEventListener('input', function(e) {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 12) value = value.slice(0, 12);
        if (value && !value.startsWith('+')) {
            this.value = '+' + value;
        } else {
            this.value = value;
        }
    });
    inputElement.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' || e.key === 'Delete') return;
        if (!/\d/.test(e.key)) {
            e.preventDefault();
        }
    });
}

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
                <span class="detail-value">${formatDate(match.date)} в ${match.time}</span>
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

// Новая логика: без ограничений по вместимости столов
function showBookingForm(preselectedItemId, matchId) {
    const preselectedItem = itemsData[preselectedItemId];
    const match = matches.find(m => m.id === matchId);
    const isTable = preselectedItem.type === 'table';

    const content = document.getElementById('bookingModalContent');
    content.innerHTML = `
        <h3>${isTable ? 'Забронировать стол(ы)' : 'Забронировать место'}</h3>
        <p class="booking-match-info">${match.name} · ${formatDate(match.date)} ${match.time} · Стол: ${match.tableDeposit ?? 30} BYN · Стул: ${match.stoolDeposit ?? 20} BYN</p>
        
        <div class="form-group">
            <label>Количество человек (за столами)</label>
            <input type="number" id="peopleCount" min="0" max="50" value="${isTable ? 1 : 0}" placeholder="Сколько гостей за столами?">
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
            <input type="text" id="bookingName" placeholder="Иванов Иван Иванович">
        </div>
        <div class="form-group">
            <label>Телефон</label>
            <input type="text" id="bookingPhone" class="phone-input" placeholder="+375291234567" maxlength="13">
        </div>
        
        <div class="toggle-wrapper" style="margin: 24px 0 16px;">
            <input type="checkbox" id="depositPaidCheckbox" class="ios-toggle">
            <label for="depositPaidCheckbox" class="toggle-label">Депозит внесён</label>
        </div>

        <div class="save-btn-container">
            <button class="btn-primary" id="saveBookingBtn">Забронировать</button>
        </div>
    `;

    document.getElementById('bookingModal').classList.add('active');
    setupPhoneInput(document.getElementById('bookingPhone'));

    const selectedItems = new Set([preselectedItemId]);
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

        const stoolCount = stools.length;
        const hasTables = tables.length > 0;

        // Если есть столы, поле ввода свободно (1..50), если нет – только стулья, блокируем
        if (hasTables) {
            peopleInput.disabled = false;
            let current = parseInt(peopleInput.value) || 0;
            if (current < 1) {
                peopleInput.value = 1;
            } else if (current > 50) {
                peopleInput.value = 50;
            }
            peopleInput.min = 1;
            peopleInput.max = 50;
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
        return { totalPeople, totalDep, hasTables, stoolCount };
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
        const freeItems = Object.keys(itemsData).filter(id => 
            getItemStatus(matchId, id) === 'free' && !selectedItems.has(id)
        );
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
        const { totalPeople, totalDep, hasTables, stoolCount } = updateDepositAndUI();
        const tablePeople = hasTables ? (parseInt(peopleInput.value) || 0) : 0;

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
        if (!/^\+\d+$/.test(phone)) { alert('Телефон должен содержать только цифры и начинаться с +'); return; }
        const depositPaid = document.getElementById('depositPaidCheckbox').checked;

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
    });
}

// Удаление
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
            <button class="btn-primary" id="confirmDeleteBtn" style="background: #e53935; border-color: #e53935;">Удалить</button>
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

// Просмотр брони
function showBookingDetailsModal(booking, matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const itemsStr = booking.items.map(id => itemsData[id].label).join(', ');
    const content = document.getElementById('infoModalContent');
    content.innerHTML = `
        <h3>📋 Бронь #${booking.id}</h3>
        <div class="booking-details">
            <div class="detail-row">
                <span class="detail-label">Матч</span>
                <span class="detail-value">${match.name}</span>
            </div>
            <hr class="detail-divider">
            <div class="detail-row">
                <span class="detail-label">Дата</span>
                <span class="detail-value">${formatDate(match.date)} в ${match.time}</span>
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
            <div class="deposit-status-row">
                <span id="depositStatusBadge"></span>
            </div>
        </div>
        <div class="save-btn-container" style="display: flex; gap: 12px; justify-content: space-between; align-items: center;">
            <button class="btn-delete-booking" id="deleteBookingBtn">🗑️ Удалить бронь</button>
            <button class="btn-primary" id="editBookingBtn">✏️ Редактировать</button>
        </div>
    `;

    const badge = document.getElementById('depositStatusBadge');
    badge.innerHTML = booking.depositPaid
        ? '<span class="badge badge-paid">✅ Депозит внесён</span>'
        : '<span class="badge badge-unpaid">⚠️ Депозит не внесён</span>';

    document.getElementById('infoModal').classList.add('active');

    document.getElementById('editBookingBtn').addEventListener('click', () => {
        showEditBookingForm(booking, matchId);
    });

    document.getElementById('deleteBookingBtn').addEventListener('click', () => {
        showDeleteConfirmation(booking, matchId);
    });
}

// Редактирование брони (аналогично без лимитов)
function showEditBookingForm(booking, matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const content = document.getElementById('infoModalContent');
    content.innerHTML = `
        <h3>Редактировать бронь #${booking.id}</h3>
        <div class="form-group">
            <label>ФИО</label>
            <input type="text" id="editBookingName" value="${booking.name}">
        </div>
        <div class="form-group">
            <label>Телефон</label>
            <input type="text" id="editBookingPhone" class="phone-input" value="${booking.phone}" maxlength="13">
        </div>
        <div class="form-group">
            <label>Количество человек (за столами)</label>
            <input type="number" id="editPeopleCount" min="1" max="50" value="${booking.people}">
        </div>
        <div class="form-group">
            <label>Выбранные места</label>
            <div id="editSelectedItemsContainer" class="items-selection"></div>
            <button id="editAddItemBtn" class="btn-secondary btn-add">+ Добавить ещё место</button>
        </div>
        <div id="editDepositInfo" class="capacity-info"></div>
        <div class="toggle-wrapper" style="margin: 24px 0 16px;">
            <input type="checkbox" id="editDepositPaidCheckbox" class="ios-toggle" ${booking.depositPaid ? 'checked' : ''}>
            <label for="editDepositPaidCheckbox" class="toggle-label">Депозит внесён</label>
        </div>
        <div style="display: flex; gap: 12px; justify-content: space-between;">
            <button class="btn-cancel" id="cancelEditBtn">Отмена</button>
            <button class="btn-primary" id="saveEditBtn">Сохранить изменения</button>
        </div>
    `;

    setupPhoneInput(document.getElementById('editBookingPhone'));

    const selectedItems = new Set(booking.items);
    const peopleInput = document.getElementById('editPeopleCount');
    const addBtn = document.getElementById('editAddItemBtn');
    const saveBtn = document.getElementById('saveEditBtn');
    const selectedContainer = document.getElementById('editSelectedItemsContainer');
    const depositInfo = document.getElementById('editDepositInfo');

    function updateDepositAndUI() {
        const tables = [];
        const stools = [];
        selectedItems.forEach(id => {
            const item = itemsData[id];
            if (item.type === 'table') tables.push(item);
            else stools.push(item);
        });

        const stoolCount = stools.length;
        const hasTables = tables.length > 0;

        if (hasTables) {
            peopleInput.disabled = false;
            let current = parseInt(peopleInput.value) || 0;
            if (current < 1) {
                peopleInput.value = 1;
            } else if (current > 50) {
                peopleInput.value = 50;
            }
            peopleInput.min = 1;
            peopleInput.max = 50;
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

        depositInfo.innerHTML = detailText;
        return { totalPeople, totalDep };
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
        const availableItems = Object.keys(itemsData).filter(id => {
            const status = getItemStatus(matchId, id);
            return status === 'free' || selectedItems.has(id);
        }).filter(id => !selectedItems.has(id));

        if (availableItems.length === 0) {
            showToast('Нет доступных мест');
            return;
        }

        const chooseDiv = document.createElement('div');
        chooseDiv.className = 'mini-choose';
        chooseDiv.innerHTML = '<div class="mini-choose-title">Выберите место</div>';
        const list = document.createElement('div');
        list.className = 'mini-choose-list';
        availableItems.forEach(id => {
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
        const { totalPeople, totalDep } = updateDepositAndUI();
        const name = document.getElementById('editBookingName').value.trim();
        const phone = document.getElementById('editBookingPhone').value.trim();
        if (!name || !phone) { alert('Заполните ФИО и телефон'); return; }
        if (!/^\+\d+$/.test(phone)) { alert('Телефон должен содержать только цифры и начинаться с +'); return; }

        booking.name = name;
        booking.phone = phone;
        booking.items = Array.from(selectedItems);
        booking.people = totalPeople;
        booking.depositRequired = totalDep;
        booking.depositPaid = document.getElementById('editDepositPaidCheckbox').checked;

        try {
            await db.updateBooking(booking);
            const matchBookings = bookingsData[matchId];
            if (matchBookings) {
                const idx = matchBookings.findIndex(b => b.id === booking.id);
                if (idx !== -1) matchBookings[idx] = booking;
            }
            renderFloorPlan(matchId);
            updateOccupancySummary(matchId);
            showBookingDetailsModal(booking, matchId);
        } catch (err) {
            console.error(err);
            showToast('Ошибка сохранения');
        }
    });

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        showBookingDetailsModal(booking, matchId);
    });
}