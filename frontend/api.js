class ApiClient {
    constructor() {
        this.baseUrl = 'http://127.0.0.1:5000'; // Bezpośrednio do backendu
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

// Funkcja do parsowania danych z backendu (które przychodzą jako string z tuple'ami)
function parseBackendData(dataString) {
    // Usuwamy niepotrzebne elementy jak <memory at 0x...>
    let cleanData = dataString.replace(/<memory at 0x[^>]+>/g, '[BINARY_DATA]');
    
    // Parsujemy datetime obiekty
    cleanData = cleanData.replace(/datetime\.datetime\([^)]+\)/g, '[DATETIME]');
    
    // Próbujemy wyciągnąć informacje z tupli
    const tupleMatches = cleanData.match(/\(([^)]+)\)/g);
    
    if (tupleMatches) {
        return tupleMatches.map((tuple, index) => {
            // Usuwamy nawiasy i dzielimy na elementy
            const elements = tuple.slice(1, -1).split(', ');
            return {
                id: index + 1,
                rawData: elements,
                formattedData: elements.map(el => el.replace(/'/g, ''))
            };
        });
    }
    
    return [{ rawData: dataString }];
}

// Funkcja formatująca dane do wyświetlenia w HTML
function formatDataForDisplay(data, pageType) {
    if (!data || !data.message) {
        return '<p>Brak danych do wyświetlenia</p>';
    }

    const parsedData = parseBackendData(data.message);
    
    let html = `<div class="data-container">
        <h3>📊 Dane z endpointu /${pageType}</h3>`;

    parsedData.forEach((item, index) => {
        html += `
        <div class="data-item" style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #3498db;">
            <h4>Element ${index + 1}</h4>
            <div class="data-details">`;
        
        if (item.formattedData && Array.isArray(item.formattedData)) {
            item.formattedData.forEach((element, i) => {
                html += `<p><strong>Pole ${i + 1}:</strong> ${element}</p>`;
            });
        } else {
            html += `<p><strong>Dane:</strong> ${JSON.stringify(item.rawData)}</p>`;
        }
        
        html += `</div></div>`;
    });

    html += '</div>';
    return html;
}

// Funkcja do ładowania danych przy starcie strony
async function loadPageData() {
    try {
        // Sprawdzamy połączenie z backendem
        const response = await api.get('/');
        console.log('Backend connection established:', response);
        
        // Wyświetlamy informację o połączeniu w UI
        showConnectionStatus(true, response.message);
        
        // Ładujemy dane specyficzne dla danej strony
        const currentPage = getCurrentPageName();
        await loadDataForPage(currentPage);
        
    } catch (error) {
        console.error('Failed to connect to backend:', error);
        
        // Wyświetlamy błąd w #api-data
        const apiDataElement = document.getElementById('api-data');
        if (apiDataElement) {
            apiDataElement.innerHTML = `
                <div style="background: #ffe8e8; padding: 15px; border-radius: 5px; border: 1px solid #e74c3c;">
                    <h3>❌ Błąd połączenia z backendem</h3>
                    <p><strong>Błąd:</strong> ${error.message}</p>
                    <p><small>Sprawdź czy backend działa na porcie 5000</small></p>
                </div>
            `;
        }
        
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
        case 'login':
            await loadLoginData();
            break;
        case 'register':
            await loadRegisterData();
            break;
        default:
            console.log('No specific data loading for page:', pageName);
    }
}

// Funkcje ładowania danych dla poszczególnych stron
async function loadLoginData(){
    console.log("Login page - no data loading needed");
}

async function loadRegisterData(){
    console.log("Register page - no data loading needed");
}

async function loadHomepageData() {
    console.log('Loading homepage data...');
    const apiDataElement = document.getElementById('api-data');
    if (apiDataElement) {
        apiDataElement.innerHTML = `
            <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; border: 1px solid #27ae60;">
                <h3>🏠 Strona główna</h3>
                <p>Wybierz jedną z zakładek, aby zobaczyć dane z odpowiedniego endpointu:</p>
                <ul>
                    <li><strong>Rezerwacja:</strong> /rezerwacja</li>
                    <li><strong>Loty:</strong> /loty</li>
                    <li><strong>Atrakcje:</strong> /atrakcje</li>
                    <li><strong>Pobyt:</strong> /pobyt</li>
                    <li><strong>Powrót:</strong> /powrot</li>
                </ul>
            </div>
        `;
    }
}

async function loadReservationData() {
    console.log('Loading reservation data...');
    const apiDataElement = document.getElementById('api-data');
    
    try {
        const response = await api.get('/rezerwacja');
        console.log('Rezerwacja endpoint response:', response);
        
        if (apiDataElement) {
            apiDataElement.innerHTML = formatDataForDisplay(response, 'rezerwacja');
        }
    } catch (error) {
        console.error('Error loading reservation data:', error);
        if (apiDataElement) {
            apiDataElement.innerHTML = `
                <div style="background: #ffe8e8; padding: 15px; border-radius: 5px; border: 1px solid #e74c3c;">
                    <h3>❌ Błąd ładowania danych rezerwacji</h3>
                    <p><strong>Błąd:</strong> ${error.message}</p>
                </div>
            `;
        }
    }
}

async function loadFlightData() {
    console.log('Loading flight data...');
    const apiDataElement = document.getElementById('api-data');
    
    try {
        const response = await api.get('/loty');
        console.log('Loty endpoint response:', response);
        
        if (apiDataElement) {
            apiDataElement.innerHTML = formatDataForDisplay(response, 'loty');
        }
    } catch (error) {
        console.error('Error loading flight data:', error);
        if (apiDataElement) {
            apiDataElement.innerHTML = `
                <div style="background: #ffe8e8; padding: 15px; border-radius: 5px; border: 1px solid #e74c3c;">
                    <h3>❌ Błąd ładowania danych lotów</h3>
                    <p><strong>Błąd:</strong> ${error.message}</p>
                </div>
            `;
        }
    }
}

async function loadAttractionsData() {
    console.log('Loading attractions data...');
    const apiDataElement = document.getElementById('api-data');
    
    try {
        const response = await api.get('/atrakcje');
        console.log('Atrakcje endpoint response:', response);
        
        if (apiDataElement) {
            apiDataElement.innerHTML = formatDataForDisplay(response, 'atrakcje');
        }
    } catch (error) {
        console.error('Error loading attractions data:', error);
        if (apiDataElement) {
            apiDataElement.innerHTML = `
                <div style="background: #ffe8e8; padding: 15px; border-radius: 5px; border: 1px solid #e74c3c;">
                    <h3>❌ Błąd ładowania danych atrakcji</h3>
                    <p><strong>Błąd:</strong> ${error.message}</p>
                </div>
            `;
        }
    }
}

async function loadStayData() {
    console.log('Loading stay data...');
    const apiDataElement = document.getElementById('api-data');
    
    try {
        const response = await api.get('/pobyt');
        console.log('Pobyt endpoint response:', response);
        
        if (apiDataElement) {
            apiDataElement.innerHTML = formatDataForDisplay(response, 'pobyt');
        }
    } catch (error) {
        console.error('Error loading stay data:', error);
        if (apiDataElement) {
            apiDataElement.innerHTML = `
                <div style="background: #ffe8e8; padding: 15px; border-radius: 5px; border: 1px solid #e74c3c;">
                    <h3>❌ Błąd ładowania danych pobytu</h3>
                    <p><strong>Błąd:</strong> ${error.message}</p>
                </div>
            `;
        }
    }
}

async function loadReturnData() {
    console.log('Loading return data...');
    const apiDataElement = document.getElementById('api-data');
    
    try {
        const response = await api.get('/powrot');
        console.log('Powrot endpoint response:', response);
        
        if (apiDataElement) {
            apiDataElement.innerHTML = formatDataForDisplay(response, 'powrot');
        }
    } catch (error) {
        console.error('Error loading return data:', error);
        if (apiDataElement) {
            apiDataElement.innerHTML = `
                <div style="background: #ffe8e8; padding: 15px; border-radius: 5px; border: 1px solid #e74c3c;">
                    <h3>❌ Błąd ładowania danych powrotu</h3>
                    <p><strong>Błąd:</strong> ${error.message}</p>
                </div>
            `;
        }
    }
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
        statusElement.innerHTML = `✅ Połączono z backendem<br><small>${message}</small>`;
    } else {
        statusElement.style.backgroundColor = '#e74c3c';
        statusElement.innerHTML = `❌ Błąd połączenia<br><small>${message}</small>`;
    }
    
    // Ukrywamy status po 5 sekundach
    setTimeout(() => {
        statusElement.style.opacity = '0.3';
    }, 5000);
}

// Inicjalizacja przy załadowaniu strony
document.addEventListener('DOMContentLoaded', loadPageData);