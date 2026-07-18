// js/modal.js

// Закрытие модальных окон
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        document.getElementById(modalId).classList.remove('active');
    });
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });
});

// Toast-уведомления
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// Кастомное модальное окно подтверждения удаления
function showConfirmModal(title, message, onConfirm) {
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal-overlay active';
    confirmModal.innerHTML = `
        <div class="modal" style="max-width: 400px; text-align: center;">
            <button class="modal-close" id="cancelConfirm">✕</button>
            <h3 style="margin-bottom: 16px;">${title}</h3>
            <p style="margin-bottom: 24px; color: var(--text-secondary);">${message}</p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button class="btn-secondary" id="cancelConfirmBtn">Отмена</button>
                <button class="btn-primary" id="confirmDeleteBtn" style="background: var(--red);">Удалить</button>
            </div>
        </div>
    `;
    document.body.appendChild(confirmModal);

    const closeModal = () => {
        confirmModal.remove();
    };

    confirmModal.querySelector('#cancelConfirm').addEventListener('click', closeModal);
    confirmModal.querySelector('#cancelConfirmBtn').addEventListener('click', closeModal);
    confirmModal.querySelector('#confirmDeleteBtn').addEventListener('click', () => {
        closeModal();
        onConfirm();
    });
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) closeModal();
    });
}