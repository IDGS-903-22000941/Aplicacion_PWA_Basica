// Clase para manejar la Agenda de Contactos
class ContactsApp {
    constructor() {
        this.contacts = JSON.parse(localStorage.getItem('contacts')) || [];
        this.currentEditId = null;
        this.initializeElements();
        this.bindEvents();
        this.renderContacts();
        this.registerServiceWorker();
    }

    initializeElements() {
        this.addBtn = document.getElementById('addBtn');
        this.searchInput = document.getElementById('searchInput');
        this.contactsTable = document.getElementById('contactsTable');
        this.modal = document.getElementById('contactModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.contactForm = document.getElementById('contactForm');
        this.nameInput = document.getElementById('nameInput');
        this.phoneInput = document.getElementById('phoneInput');
        this.emailInput = document.getElementById('emailInput');
        this.saveBtn = document.getElementById('saveBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.closeBtn = document.querySelector('.close');
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.openModal());
        this.searchInput.addEventListener('input', (e) => this.searchContacts(e.target.value));
        this.contactForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        
        // Cerrar modal al hacer click fuera de él
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Manejar tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    openModal(contact = null) {
        this.modal.style.display = 'block';
        
        if (contact) {
            // Modo edición
            this.modalTitle.textContent = 'Editar Contacto';
            this.nameInput.value = contact.name;
            this.phoneInput.value = contact.phone;
            this.emailInput.value = contact.email;
            this.currentEditId = contact.id;
        } else {
            // Modo agregar
            this.modalTitle.textContent = 'Agregar Contacto';
            this.contactForm.reset();
            this.currentEditId = null;
        }
        
        this.nameInput.focus();
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.contactForm.reset();
        this.currentEditId = null;
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const name = this.nameInput.value.trim();
        const phone = this.phoneInput.value.trim();
        const email = this.emailInput.value.trim();

        if (!name || !phone || !email) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        if (!this.isValidEmail(email)) {
            alert('Por favor, introduce un correo electrónico válido.');
            return;
        }

        if (!this.isValidPhone(phone)) {
            alert('Por favor, introduce un número de teléfono válido.');
            return;
        }

        if (this.currentEditId) {
            this.updateContact(this.currentEditId, { name, phone, email });
        } else {
            this.addContact({ name, phone, email });
        }

        this.closeModal();
    }

    addContact(contactData) {
        const contact = {
            id: Date.now(),
            ...contactData,
            createdAt: new Date().toISOString()
        };

        this.contacts.push(contact);
        this.saveContacts();
        this.renderContacts();
        this.showNotification('Contacto agregado exitosamente', 'success');
    }

    updateContact(id, contactData) {
        const index = this.contacts.findIndex(contact => contact.id === id);
        if (index !== -1) {
            this.contacts[index] = { ...this.contacts[index], ...contactData };
            this.saveContacts();
            this.renderContacts();
            this.showNotification('Contacto actualizado exitosamente', 'success');
        }
    }

    deleteContact(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
            this.contacts = this.contacts.filter(contact => contact.id !== id);
            this.saveContacts();
            this.renderContacts();
            this.showNotification('Contacto eliminado exitosamente', 'success');
        }
    }

    searchContacts(query) {
        const filteredContacts = this.contacts.filter(contact =>
            contact.name.toLowerCase().includes(query.toLowerCase()) ||
            contact.phone.includes(query) ||
            contact.email.toLowerCase().includes(query.toLowerCase())
        );
        this.renderContacts(filteredContacts);
    }

    renderContacts(contactsToRender = this.contacts) {
        this.contactsTable.innerHTML = '';

        if (contactsToRender.length === 0) {
            this.contactsTable.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <h3>No hay contactos</h3>
                        <p>Haz click en "Añadir" para agregar tu primer contacto</p>
                    </td>
                </tr>
            `;
            return;
        }

        contactsToRender.forEach(contact => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.escapeHtml(contact.name)}</td>
                <td>${this.escapeHtml(contact.phone)}</td>
                <td>${this.escapeHtml(contact.email)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="app.editContact(${contact.id})">
                        Editar
                    </button>
                    <button class="action-btn delete-btn" onclick="app.deleteContact(${contact.id})">
                        Eliminar
                    </button>
                </td>
            `;
            this.contactsTable.appendChild(row);
        });
    }

    editContact(id) {
        const contact = this.contacts.find(c => c.id === id);
        if (contact) {
            this.openModal(contact);
        }
    }

    saveContacts() {
        localStorage.setItem('contacts', JSON.stringify(this.contacts));
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Estilos inline para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background-color: ${type === 'success' ? '#000000ff' : '#f44336'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registrado exitosamente:', registration);
                
                // Verificar actualizaciones
                registration.addEventListener('updatefound', () => {
                    console.log('Nueva versión disponible');
                });
                
            } catch (error) {
                console.log('Error al registrar Service Worker:', error);
            }
        }
    }
}

// CSS adicional para las animaciones de notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ContactsApp();
});

// Manejar la instalación de PWA
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir que Chrome 67 y anteriores muestren automáticamente el prompt
    e.preventDefault();
    // Almacenar el evento para poder triggerearlo después
    deferredPrompt = e;
    
    // Opcional: mostrar botón de instalación personalizado
    console.log('PWA instalable detectada');
});

window.addEventListener('appinstalled', (evt) => {
    console.log('PWA instalada exitosamente');
});