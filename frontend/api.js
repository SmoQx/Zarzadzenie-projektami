class ApiClient {
    constructor() {
        this.baseUrl = '/api'; // Wykorzystujemy proxy z nginx
    }

    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    }

    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    }

    async put(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API PUT Error:', error);
            throw error;
        }
    }

    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }
}

// Globalna instancja API klienta
const api = new ApiClient();

// Funkcja do ładowania danych przy starcie strony
async function loadPageData() {
    try {
        // Sprawdzamy połączenie z backendem
        const response = await api.get('/');
        console.log('Backend connection established:', response);
        
        // Wyświetlamy informację o połączeniu w UI
        showConnectionStatus(true, response.message);
        
        // Można dodać specyficzne wywołania API dla każdej strony
        const currentPage = getCurrentPageName();
        await loadDataForPage(currentPage);
        
    } catch (error) {
        console.error('Failed to connect to backend:', error);
        showConnectionStatus(false, error.message);
    }
}

// Pobiera nazwę aktualnej strony
function getCurrentPageName() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    return filename.replace('.html', '') || 'index';
}

// Ładuje dane specyficzne dla danej strony
async function loadDataForPage(pageName) {
    switch(pageName) {
        case 'index':
            await loadHomepageData();
            break;
        case 'rezerwacja':
            await loadReservationData();
            break;
        case 'loty':
            await loadFlightData();
            break;
        case 'atrakcje':
            await loadAttractionsData();
            break;
        case 'pobyt':
            await loadStayData();
            break;
        case 'powrot':
            await loadReturnData();
            break;
        default:
            console.log('No specific data loading for page:', pageName);
    }
}

// Funkcje ładowania danych dla poszczególnych stron
async function loadHomepageData() {
    console.log('Loading homepage data...');
    // Można dodać wywołania API specyficzne dla strony głównej
}

async function loadReservationData() {
    console.log('Loading reservation data...');
    // Można dodać wywołania API dla rezerwacji
}

async function loadFlightData() {
    console.log('Loading flight data...');
    // Można dodać wywołania API dla lotów
}

async function loadAttractionsData() {
    console.log('Loading attractions data...');
    // Można dodać wywołania API dla atrakcji
}

async function loadStayData() {
    console.log('Loading stay data...');
    // Można dodać wywołania API dla pobytu
}

async function loadReturnData() {
    console.log('Loading return data...');
    // Można dodać wywołania API dla powrotu
}

// Wyświetla status połączenia z backendem
function showConnectionStatus(isConnected, message) {
    // Sprawdzamy czy już istnieje element statusu
    let statusElement = document.getElementById('connection-status');
    
    if (!statusElement) {
        // Tworzymy element statusu
        statusElement = document.createElement('div');
        statusElement.id = 'connection-status';
        statusElement.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 10px;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            z-index: 1000;
            max-width: 300px;
        `;
        document.body.appendChild(statusElement);
    }
    
    if (isConnected) {
        statusElement.style.backgroundColor = '#27ae60';
        statusElement.innerHTML = `Połączono z backendem<br><small>${message}</small>`;
    } else {
        statusElement.style.backgroundColor = '#e74c3c';
        statusElement.innerHTML = `Błąd połączenia<br><small>${message}</small>`;
    }
    
    // Ukrywamy status po 5 sekundach
    setTimeout(() => {
        statusElement.style.opacity = '0.3';
    }, 5000);
}

// Inicjalizacja przy załadowaniu strony
document.addEventListener('DOMContentLoaded', loadPageData);