const itemsData = {
    'table-1': { id: 'table-1', type: 'table', label: 'Стол 1', capacity: 3 },
    'table-2': { id: 'table-2', type: 'table', label: 'Стол 2', capacity: 3 },
    'table-3': { id: 'table-3', type: 'table', label: 'Стол 3', capacity: 3 },
    'table-4': { id: 'table-4', type: 'table', label: 'Стол 4', capacity: 3 },
    'table-5': { id: 'table-5', type: 'table', label: 'Стол 5', capacity: 2 },
    'table-6': { id: 'table-6', type: 'table', label: 'Стол 6', capacity: 3 },
    'table-7': { id: 'table-7', type: 'table', label: 'Стол 7', capacity: 2 },
    'table-8': { id: 'table-8', type: 'table', label: 'Стол 8', capacity: 2 },
    'bar-1': { id: 'bar-1', type: 'bar-stool', label: 'Б1' },
    'bar-2': { id: 'bar-2', type: 'bar-stool', label: 'Б2' },
    'bar-3': { id: 'bar-3', type: 'bar-stool', label: 'Б3' },
    'bar-4': { id: 'bar-4', type: 'bar-stool', label: 'Б4' },
    'bar-5': { id: 'bar-5', type: 'bar-stool', label: 'Б5' },
    'bar-6': { id: 'bar-6', type: 'bar-stool', label: 'Б6' },
    'left-1': { id: 'left-1', type: 'stool', label: 'С1-1' },
    'left-2': { id: 'left-2', type: 'stool', label: 'С1-2' },
    'left-3': { id: 'left-3', type: 'stool', label: 'С1-3' },
    'right-1': { id: 'right-1', type: 'stool', label: 'С2-1' },
    'right-2': { id: 'right-2', type: 'stool', label: 'С2-2' },
    'right-3': { id: 'right-3', type: 'stool', label: 'С2-3' },
};

function getBookingForItem(matchId, itemId) {
    const bookings = bookingsData[matchId] || [];
    return bookings.find(b => b.items.includes(itemId));
}