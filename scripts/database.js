class AppDatabase {
    constructor() {
        this.dbName = 'RestaurantBookingDB';
        this.version = 1;
        this.db = null;
    }

    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('matches')) {
                    const matchStore = db.createObjectStore('matches', { keyPath: 'id' });
                    matchStore.createIndex('date', 'date', { unique: false });
                }
                if (!db.objectStoreNames.contains('bookings')) {
                    const bookingStore = db.createObjectStore('bookings', { keyPath: 'id' });
                    bookingStore.createIndex('matchId', 'matchId', { unique: false });
                }
            };
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async addMatch(match) {
        return this._performTransaction('matches', 'readwrite', store => store.add(match));
    }
    async getAllMatches() {
        return this._performTransaction('matches', 'readonly', store => store.getAll());
    }
    async deleteMatch(matchId) {
        return this._performTransaction('matches', 'readwrite', store => store.delete(matchId));
    }
    async updateMatch(match) {
        return this._performTransaction('matches', 'readwrite', store => store.put(match));
    }

    async addBooking(booking) {
        return this._performTransaction('bookings', 'readwrite', store => store.add(booking));
    }
    async getBookingsByMatchId(matchId) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('bookings', 'readonly');
            const store = tx.objectStore('bookings');
            const index = store.index('matchId');
            const request = index.getAll(matchId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async getAllBookings() {
        return this._performTransaction('bookings', 'readonly', store => store.getAll());
    }
    async deleteBooking(bookingId) {
        return this._performTransaction('bookings', 'readwrite', store => store.delete(bookingId));
    }
    async updateBooking(booking) {
        return this._performTransaction('bookings', 'readwrite', store => store.put(booking));
    }

    async clearAll() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['matches', 'bookings'], 'readwrite');
            tx.objectStore('matches').clear();
            tx.objectStore('bookings').clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async addMatches(matchesArray) {
        const tx = this.db.transaction('matches', 'readwrite');
        const store = tx.objectStore('matches');
        for (const m of matchesArray) store.add(m);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async addBookings(bookingsArray) {
        const tx = this.db.transaction('bookings', 'readwrite');
        const store = tx.objectStore('bookings');
        for (const b of bookingsArray) store.add(b);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    _performTransaction(storeName, mode, operation) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, mode);
            const store = tx.objectStore(storeName);
            const request = operation(store);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}