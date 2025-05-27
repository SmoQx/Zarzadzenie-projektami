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

// Ulepszona funkcja do parsowania danych z backendu
function parseBackendData(dataString) {
    console.log('Raw data:', dataString);
    
    // Usuwamy niepotrzebne elementy jak <memory at 0x...>
    let cleanData = dataString.replace(/<memory at 0x[^>]+>/g, 'null');
    
    // Parsujemy datetime obiekty - wyciągamy datę i czas
    cleanData = cleanData.replace(/datetime\.datetime\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/g, 
        (match, year, month, day, hour, minute, second, microsecond) => {
            const date = new Date(year, month - 1, day, hour, minute, second, Math.floor(microsecond / 1000));
            return `"${date.toISOString()}"`;
        });
    
    // Zamieniamy True/False na boolean
    cleanData = cleanData.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
    
    // Zamieniamy None na null
    cleanData = cleanData.replace(/\bNone\b/g, 'null');
    
    // Próbujemy wyciągnąć informacje z tupli używając regex
    const tuplePattern = /\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;
    const tuples = [];
    let match;
    
    while ((match = tuplePattern.exec(cleanData)) !== null) {
        const tupleContent = match[1];
        
        // Dzielimy tuple na elementy, uwzględniając stringi w cudzysłowach
        const elements = [];
        let current = '';
        let inQuotes = false;
        let depth = 0;
        
        for (let i = 0; i < tupleContent.length; i++) {
            const char = tupleContent[i];
            
            if (char === "'" && tupleContent[i-1] !== '\\') {
                inQuotes = !inQuotes;
                current += char;
            } else if (char === '(' && !inQuotes) {
                depth++;
                current += char;
            } else if (char === ')' && !inQuotes) {
                depth--;
                current += char;
            } else if (char === ',' && !inQuotes && depth === 0) {
                elements.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        if (current.trim()) {
            elements.push(current.trim());
        }
        
        tuples.push(elements);
    }
    
    return tuples.map((tuple, index) => ({
        id: index + 1,
        rawElements: tuple,
        parsedElements: tuple.map(parseElement)
    }));
}

// Funkcja pomocnicza do parsowania pojedynczego elementu
function parseElement(element) {
    // Usuwamy białe znaki
    element = element.trim();
    
    // String w cudzysłowach
    if (element.startsWith("'") && element.endsWith("'")) {
        return {
            type: 'string',
            value: element.slice(1, -1)
        };
    }
    
    // String w cudzysłowach podwójnych (datetime)
    if (element.startsWith('"') && element.endsWith('"')) {
        return {
            type: 'datetime',
            value: element.slice(1, -1),
            formatted: new Date(element.slice(1, -1)).toLocaleString('pl-PL')
        };
    }
    
    // Number
    if (/^\d+$/.test(element)) {
        return {
            type: 'number',
            value: parseInt(element)
        };
    }
    
    // Float
    if (/^\d+\.\d+$/.test(element)) {
        return {
            type: 'float',
            value: parseFloat(element)
        };
    }
    
    // Boolean
    if (element === 'true' || element === 'false') {
        return {
            type: 'boolean',
            value: element === 'true'
        };
    }
    
    // Null
    if (element === 'null') {
        return {
            type: 'null',
            value: null
        };
    }
    
    // Default - nieznany typ
    return {
        type: 'unknown',
        value: element
    };
}

// Funkcja zwracająca nazwy kolumn w zależności od typu strony
function getColumnNames(pageType) {
    const columnMappings = {
        'loty': ['ID', 'Nazwa linii lotniczej', 'Dane binarne', 'Status', 'Cena', 'Rabat', 'Data utworzenia'],
        'rezerwacja': ['ID', 'Użytkownik', 'Lot', 'Data rezerwacji', 'Status', 'Liczba pasażerów', 'Cena całkowita'],
        'atrakcje': ['ID', 'Nazwa', 'Opis', 'Lokalizacja', 'Cena', 'Ocena', 'Data dodania'],
        'pobyt': ['ID', 'Hotel', 'Data zameldowania', 'Data wymeldowania', 'Liczba gości', 'Cena za noc', 'Status'],
        'powrot': ['ID', 'Lot powrotny', 'Data', 'Status', 'Gate', 'Opóźnienie', 'Uwagi']
    };
    
    return columnMappings[pageType] || [];
}

// Funkcja zwracająca ikonę w zależności od typu pola
function getFieldIcon(type) {
    const icons = {
        'string': '📝',
        'number': '🔢',
        'float': '💯',
        'boolean': '☑️',
        'datetime': '📅',
        'null': '⚫',
        'unknown': '❓'
    };
    
    return icons[type] || '📄';
}

// Ulepszona funkcja formatująca dane do wyświetlenia w HTML
function formatDataForDisplay(data, pageType) {
    if (!data || !data.message) {
        return '<p>Brak danych do wyświetlenia</p>';
    }

    const parsedData = parseBackendData(data.message);
    
    if (parsedData.length === 0) {
        return `<div class="data-container">
            <h3>📊 Dane z endpointu /${pageType}</h3>
            <p>Brak danych do wyświetlenia lub błąd parsowania</p>
            <details>
                <summary>Surowe dane z serwera</summary>
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${data.message}</pre>
            </details>
        </div>`;
    }

    let html = `<div class="data-container">
        <h3>📊 Dane z endpointu /${pageType}</h3>
        <p>Znaleziono <strong>${parsedData.length}</strong> rekordów</p>`;

    // Definiujemy nazwy kolumn w zależności od typu strony
    const columnNames = getColumnNames(pageType);

    parsedData.forEach((item, index) => {
        html += `
        <div class="data-item" style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #3498db;">
            <h4>📋 Rekord ${index + 1}</h4>
            <div class="data-details">`;
        
        item.parsedElements.forEach((element, i) => {
            const columnName = columnNames[i] || `Pole ${i + 1}`;
            const icon = getFieldIcon(element.type);
            
            html += `<div style="margin: 8px 0; padding: 8px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
                <strong>${icon} ${columnName}:</strong> 
                <span style="color: #666; font-size: 0.9em;">[${element.type}]</span>
                <div style="margin-top: 4px;">`;
            
            if (element.type === 'datetime') {
                html += `<span style="color: #2c3e50;">${element.formatted}</span>`;
            } else if (element.type === 'boolean') {
                html += `<span style="color: ${element.value ? '#27ae60' : '#e74c3c'};">${element.value ? '✅ Tak' : '❌ Nie'}</span>`;
            } else if (element.type === 'null') {
                html += `<span style="color: #95a5a6; font-style: italic;">Brak danych</span>`;
            } else if (element.type === 'number') {
                html += `<span style="color: #2c3e50; font-weight: 500;">${element.value}</span>`;
            } else {
                html += `<span style="color: #2c3e50;">${element.value}</span>`;
            }
            
            html += `</div></div>`;
        });
        
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