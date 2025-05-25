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

// Specjalna funkcja do parsowania danych lotów
function parseFlightData(dataString) {
    const flights = [];
    
    // Szukamy tupli w formacie (id, nazwa, memory, status, miejsca, zajęte, data)
    const tuplePattern = /\((\d+),\s*'([^']+)',\s*<memory[^>]*>,\s*(True|False),\s*(\d+),\s*(\d+),\s*datetime\.datetime\([^)]+\)\)/g;
    
    let match;
    while ((match = tuplePattern.exec(dataString)) !== null) {
        flights.push({
            id: parseInt(match[1]),
            airline: match[2],
            available: match[3] === 'True',
            totalSeats: parseInt(match[4]),
            occupiedSeats: parseInt(match[5]),
            availableSeats: parseInt(match[4]) - parseInt(match[5])
        });
    }
    
    return flights;
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
        
        if (apiDataElement && response && response.message) {
            const flights = parseFlightData(response.message);
            
            if (flights.length > 0) {
                let html = `
                <div class="flight-data-container">
                    <h3>✈️ Dostępne loty</h3>
                    <table class="flights-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Linia lotnicza</th>
                                <th>Status</th>
                                <th>Miejsca całkowite</th>
                                <th>Miejsca zajęte</th>
                                <th>Miejsca dostępne</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                flights.forEach(flight => {
                    const statusClass = flight.available ? 'status-available' : 'status-unavailable';
                    const statusText = flight.available ? 'Dostępny' : 'Niedostępny';
                    const availabilityClass = flight.availableSeats > 0 ? 'seats-available' : 'seats-full';
                    
                    html += `
                        <tr>
                            <td>${flight.id}</td>
                            <td class="airline-name">${flight.airline}</td>
                            <td><span class="status ${statusClass}">${statusText}</span></td>
                            <td>${flight.totalSeats}</td>
                            <td>${flight.occupiedSeats}</td>
                            <td class="${availabilityClass}">${flight.availableSeats}</td>
                            <td>
                                ${flight.available && flight.availableSeats > 0 
                                    ? '<button class="reserve-btn" onclick="reserveFlight(' + flight.id + ')">Rezerwuj</button>'
                                    : '<button class="reserve-btn disabled" disabled>Brak miejsc</button>'
                                }
                            </td>
                        </tr>
                    `;
                });
                
                html += `
                        </tbody>
                    </table>
                </div>
                
                <style>
                .flight-data-container {
                    margin: 20px 0;
                }
                
                .flights-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .flights-table th,
                .flights-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #e0e0e0;
                }
                
                .flights-table th {
                    background-color: #3498db;
                    color: white;
                    font-weight: 600;
                }
                
                .flights-table tr:hover {
                    background-color: #f8f9fa;
                }
                
                .airline-name {
                    font-weight: 500;
                    color: #2c3e50;
                }
                
                .status {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                    text-transform: uppercase;
                }
                
                .status-available {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .status-unavailable {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                .seats-available {
                    color: #27ae60;
                    font-weight: 600;
                }
                
                .seats-full {
                    color: #e74c3c;
                    font-weight: 600;
                }
                
                .reserve-btn {
                    background-color: #3498db;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }
                
                .reserve-btn:hover:not(.disabled) {
                    background-color: #2980b9;
                }
                
                .reserve-btn.disabled {
                    background-color: #bdc3c7;
                    cursor: not-allowed;
                }
                </style>
                `;
                
                apiDataElement.innerHTML = html;
            } else {
                apiDataElement.innerHTML = `
                    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7;">
                        <h3>⚠️ Brak danych lotów</h3>
                        <p>Nie udało się sparsować danych z endpointu /loty</p>
                        <details>
                            <summary>Dane surowe z API:</summary>
                            <pre style="background: #f8f9fa; padding: 10px; margin-top: 10px; border-radius: 4px; overflow-x: auto;">${response.message}</pre>
                        </details>
                    </div>
                `;
            }
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

// Funkcja do rezerwacji lotu
function reserveFlight(flightId) {
    alert(`Rezerwacja lotu ID: ${flightId}\n\nTa funkcjonalność zostanie wkrótce zaimplementowana!`);
    // Tutaj można dodać rzeczywistą logikę rezerwacji
}

// Inicjalizacja przy załadowaniu strony
document.addEventListener('DOMContentLoaded', loadPageData);