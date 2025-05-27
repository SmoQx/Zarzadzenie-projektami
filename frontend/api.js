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

// Definicje kolumn dla różnych endpointów
const COLUMN_DEFINITIONS = {
    'loty': [
        { key: 'id', name: 'ID'},
        { key: 'airline', name: 'Linia lotnicza' },
        { key: 'data', name: 'Dane binarne' },
        { key: 'active', name: 'Aktywny' },
        { key: 'price', name: 'Cena (PLN)' },
        { key: 'discount', name: 'Rabat (%)' },
        { key: 'created', name: 'Data utworzenia'}
    ],
    'rezerwacja': [
        { key: 'id', name: 'ID' },
        { key: 'user', name: 'Użytkownik' },
        { key: 'flight', name: 'Lot' },
        { key: 'reservation_date', name: 'Data rezerwacji' },
        { key: 'status', name: 'Status'},
        { key: 'passengers', name: 'Liczba pasażerów' },
        { key: 'total_price', name: 'Cena całkowita' }
    ],
    'atrakcje': [
        { key: 'id', name: 'ID' },
        { key: 'name', name: 'Nazwa' },
        { key: 'description', name: 'Opis' },
        { key: 'location', name: 'Lokalizacja'},
        { key: 'price', name: 'Cena' },
        { key: 'rating', name: 'Ocena'},
        { key: 'created', name: 'Data dodania' }
    ],
    'pobyt': [
        { key: 'id', name: 'ID' },
        { key: 'hotel', name: 'Hotel' },
        { key: 'checkin', name: 'Zameldowanie' },
        { key: 'checkout', name: 'Wymeldowanie' },
        { key: 'guests', name: 'Liczba gości' },
        { key: 'price_per_night', name: 'Cena za noc' },
        { key: 'status', name: 'Status' }
    ],
    'powrot': [
        { key: 'id', name: 'ID' },
        { key: 'return_flight', name: 'Lot powrotny' },
        { key: 'date', name: 'Data' },
        { key: 'status', name: 'Status' },
        { key: 'gate', name: 'Bramka'},
        { key: 'delay', name: 'Opóźnienie' },
        { key: 'notes', name: 'Uwagi' }
    ]
};

function parseBackendData(dataString) {
    console.log('Raw data (parseBackendData):', dataString);

    let cleanData = dataString.replace(/<memory at 0x[^>]+>/g, 'null');

    cleanData = cleanData.replace(/datetime\.datetime\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)/g,
        (match, year, month, day, hour, minute, second, microsecondStr) => {
            const microsecond = microsecondStr ? parseInt(microsecondStr) : 0;
            const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), Math.floor(microsecond / 1000));
            return `"${date.toISOString()}"`;
        });

    cleanData = cleanData.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
    cleanData = cleanData.replace(/\bNone\b/g, 'null');

    const tuplePattern = /\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;
    const records = [];
    let match;
    let dataForTupleExtraction = cleanData;

    if (dataForTupleExtraction.startsWith('[') && dataForTupleExtraction.endsWith(']')) {
        dataForTupleExtraction = dataForTupleExtraction.slice(1, -1);
    }

    while ((match = tuplePattern.exec(dataForTupleExtraction)) !== null) {
        const tupleContent = match[1];
        const elements = parseTupleElements(tupleContent);
        records.push(elements);
    }
    console.log('Parsed records (parseBackendData):', records);
    return records;
}

function parseTupleElements(tupleContent) {
    const elements = [];
    let current = '';
    let inQuotes = false;
    let depth = 0;

    for (let i = 0; i < tupleContent.length; i++) {
        const char = tupleContent[i];
        if (char === "'" && (i === 0 || tupleContent[i - 1] !== '\\')) {
            inQuotes = !inQuotes;
            current += char;
        } else if (char === '(' && !inQuotes) {
            depth++;
            current += char;
        } else if (char === ')' && !inQuotes) {
            depth--;
            current += char;
        } else if (char === ',' && !inQuotes && depth === 0) {
            elements.push(parseElement(current.trim()));
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim() || (elements.length === 0 && tupleContent.trim() !== '')) {
         elements.push(parseElement(current.trim() || tupleContent.trim()));
    }
    return elements;
}

function parseElement(element) {
    element = element.trim();
    if (element.startsWith("'") && element.endsWith("'")) {
        return { type: 'string', value: element.slice(1, -1).replace(/\\'/g, "'"), display: element.slice(1, -1).replace(/\\'/g, "'") };
    }
    if (element.startsWith('"') && element.endsWith('"')) {
        const dateStr = element.slice(1, -1);
        try {
            const dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) throw new Error("Invalid date string");
            return { type: 'datetime', value: dateStr, display: dateObj.toLocaleString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
        } catch (e) { return { type: 'unknown', value: element, display: element }; }
    }
    if (/^-?\d+$/.test(element)) {
        return { type: 'number', value: parseInt(element, 10), display: parseInt(element, 10).toLocaleString('pl-PL') };
    }
    if (/^-?\d+\.\d+$/.test(element)) {
        return { type: 'float', value: parseFloat(element), display: parseFloat(element).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) };
    }
    if (element === 'true' || element === 'false') {
        return { type: 'boolean', value: element === 'true', display: element === 'true' ? '✅ Tak' : '❌ Nie' };
    }
    if (element === 'null') {
        return { type: 'null', value: null, display: '—' };
    }
    return { type: 'unknown', value: element, display: element };
}

function escapeHTML(str) {
    if (typeof str !== 'string') return str === null || str === undefined ? '' : String(str) ; // Ensure it's a string or empty
    return str.replace(/[&<>"']/g, function (match) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
    });
}

function getDefaultColumns(numColumns) {
    const defaultCols = [];
    for (let i = 0; i < numColumns; i++) {
        defaultCols.push({ key: `col${i}`, name: `Kolumna ${i + 1}` });
    }
    return defaultCols;
}

function createEmptyDataHTML(pageType) {
    return `
        <div class="data-container">
            <div class="data-header">
                <h3>📊 Dane z endpointu /${pageType}</h3>
                <span class="status-badge no-data">Brak danych</span>
            </div>
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>Brak danych do wyświetlenia</p>
            </div>
        </div>`;
}

function createErrorHTML(pageType, rawData, errorMessage) {
    const displayMessage = errorMessage || "Nie udało się sparsować danych z serwera lub dane są w nieoczekiwanym formacie.";
    return `
        <div class="data-container">
            <div class="data-header">
                <h3>📊 Dane z endpointu /${pageType}</h3>
                <span class="status-badge error">Błąd danych</span>
            </div>
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <p>${escapeHTML(displayMessage)}</p>
                <details class="raw-data">
                    <summary>Pokaż surowe dane</summary>
                    <pre>${escapeHTML(rawData)}</pre>
                </details>
            </div>
        </div>`;
}

function createTableView(records, columns) {
    let html = `
        <div class="table-container">
            <table class="data-table">
                <thead><tr>`;
    columns.forEach(col => { html += `<th>${escapeHTML(col.name)}</th>`; });
    html += `</tr></thead><tbody>`;
    records.forEach(record => {
        html += '<tr>';
        record.forEach((cell, index) => {
            const column = columns[index];
            const columnName = column ? column.name : `Kolumna ${index + 1}`;
            const displayValue = (cell && cell.display !== undefined && cell.display !== null) ? escapeHTML(cell.display) : 'N/A';
            html += `<td data-label="${escapeHTML(columnName)}">${displayValue}</td>`;
        });
        html += '</tr>';
    });
    html += `</tbody></table></div>`;
    return html;
}

function createCardView(records, columns) {
    let html = '<div class="cards-container">';
    records.forEach((record, recordIndex) => {
        html += `
            <div class="data-card">
                <div class="card-header"><h4>📋 Rekord ${recordIndex + 1}</h4></div>
                <div class="card-body">`;
        record.forEach((cell, cellIndex) => {
            const column = columns[cellIndex] || { name: `Pole ${cellIndex + 1}`, icon: '📄' };
            const cellType = (cell && cell.type) ? escapeHTML(cell.type) : 'unknown';
            const displayValue = (cell && cell.display !== undefined && cell.display !== null) ? escapeHTML(cell.display) : 'N/A';
            html += `
                <div class="field-row">
                    <div class="field-label">${column.icon || '📄'} ${escapeHTML(column.name)}</div>
                    <div class="field-value ${cellType}">${displayValue}</div>
                </div>`;
        });
        html += `</div></div>`;
    });
    html += '</div>';
    return html;
}

function createFormattedHTML(records, columns, pageType) {
    const recordCount = records.length;
    const recordSuffix = recordCount === 1 ? '' : (recordCount % 10 >= 2 && recordCount % 10 <= 4 && (recordCount % 100 < 10 || recordCount % 100 >= 20) ? 'y' : 'ów');
    let html = `
        <div class="data-container">
            <div class="data-header">
                <h3>📊 Dane z endpointu /${pageType}</h3>
                <span class="status-badge success">${recordCount} rekord${recordSuffix}</span>
            </div>`;
    const displayColumns = columns.length > 0 ? columns : getDefaultColumns(records[0] ? records[0].length : 0);
    if (recordCount > 1) { 
        html += createTableView(records, displayColumns);
    } else {
        html += createCardView(records, displayColumns);
    }
    html += '</div>';
    return html;
}


function formatDataForDisplay(data, pageType) {
    if (!data || typeof data.message !== 'string' || data.message.trim() === '') {
        console.log(`formatDataForDisplay: Brak danych wejściowych lub pusty 'data.message' dla pageType: ${pageType}`);
        return createEmptyDataHTML(pageType);
    }
    if (data.message.trim() === '[]') {
        console.log(`formatDataForDisplay: Otrzymano pustą listę '[]' dla pageType: ${pageType}`);
        return createEmptyDataHTML(pageType);
    }
    
    let parsedRecords;
    try {
        parsedRecords = parseBackendData(data.message);
    } catch (error) {
        console.error(`formatDataForDisplay: Błąd podczas parsowania danych dla pageType: ${pageType}`, error);
        console.error('Surowe dane powodujące błąd:', data.message);
        return createErrorHTML(pageType, data.message, `Błąd wewnętrzny parsera: ${error.message}`);
    }

    if (!parsedRecords || parsedRecords.length === 0) {
        console.log(`formatDataForDisplay: Nie udało się sparsować rekordów z 'data.message' dla pageType: ${pageType}. Surowe dane: ${data.message}`);
        return createErrorHTML(pageType, data.message);
    }

    const columns = COLUMN_DEFINITIONS[pageType] || getDefaultColumns(parsedRecords[0] ? parsedRecords[0].length : 0);
    return createFormattedHTML(parsedRecords, columns, pageType);
}


// ---------------------------------------------------------------------------------
// Pozostała część api.js (ładowanie danych, status połączenia itp.)
// ---------------------------------------------------------------------------------

async function loadPageData() {
    try {
        const response = await api.get('/'); //
        console.log('Backend connection established:', response);
        showConnectionStatus(true, response.message); //
        const currentPage = getCurrentPageName(); //
        await loadDataForPage(currentPage); //
    } catch (error) {
        console.error('Failed to connect to backend:', error);
        const apiDataElement = document.getElementById('api-data'); //
        if (apiDataElement) {
            apiDataElement.innerHTML = `
                <div style="background: #ffe8e8; padding: 15px; border-radius: 5px; border: 1px solid #e74c3c;">
                    <h3>❌ Błąd połączenia z backendem</h3>
                    <p><strong>Błąd:</strong> ${escapeHTML(error.message)}</p>
                    <p><small>Sprawdź czy backend działa na porcie 5000</small></p>
                </div>`;
        }
        showConnectionStatus(false, error.message); //
    }
}

function getCurrentPageName() {
    const path = window.location.pathname; //
    const filename = path.split('/').pop(); //
    return filename.replace('.html', '') || 'index'; //
}

async function loadDataForPage(pageName) { //

    const loaderFunctionName = `load${pageName.charAt(0).toUpperCase() + pageName.slice(1)}Data`;
    if (typeof window[loaderFunctionName] === 'function') {
        await window[loaderFunctionName]();
    } else {

        if (COLUMN_DEFINITIONS[pageName]) {
            console.log(`Loading data for generic page: ${pageName}...`);
            const apiDataElement = document.getElementById('api-data');
            try {
                const response = await api.get(`/${pageName}`);
                console.log(`${pageName} endpoint response:`, response);
                if (apiDataElement) {
                    apiDataElement.innerHTML = formatDataForDisplay(response, pageName);
                }
            } catch (error) {
                console.error(`Error loading ${pageName} data:`, error);
                if (apiDataElement) {
                    apiDataElement.innerHTML = `
                        <div style="background: #ffe8e8; padding: 15px; border-radius: 5px; border: 1px solid #e74c3c;">
                            <h3> Błąd ładowania danych dla ${pageName}</h3>
                            <p><strong>Błąd:</strong> ${escapeHTML(error.message)}</p>
                        </div>`;
                }
            }
        } else {
            console.log('No specific data loading or generic handler for page:', pageName);
            if (pageName === 'index') { 
                 await loadIndexData(); 
            }
        }
    }
}

async function loadIndexData() { 
    console.log('Loading index (homepage) data...');
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
            </div>`;
    }
}


async function loadLoginData(){ //
    console.log("Login page - no data loading needed");
}

async function loadRegisterData(){ //
    console.log("Register page - no data loading needed");
}


function showConnectionStatus(isConnected, message) { //
    let statusElement = document.getElementById('connection-status');
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'connection-status';
        statusElement.style.cssText = `
            position: fixed; top: 10px; right: 10px; padding: 10px;
            border-radius: 4px; color: white; font-size: 12px;
            z-index: 1000; max-width: 300px; opacity: 1; transition: opacity 0.5s ease-out;`;
        document.body.appendChild(statusElement);
    }
    statusElement.style.opacity = '1';
    if (isConnected) {
        statusElement.style.backgroundColor = '#27ae60';
        statusElement.innerHTML = ` Połączono z backendem<br><small>${escapeHTML(message)}</small>`;
    } else {
        statusElement.style.backgroundColor = '#e74c3c';
        statusElement.innerHTML = ` Błąd połączenia<br><small>${escapeHTML(message)}</small>`;
    }
    setTimeout(() => {
        if(statusElement) statusElement.style.opacity = '0';
    }, 5000);
     setTimeout(() => { 
        if(statusElement && statusElement.style.opacity === '0') {

             statusElement.style.display = 'none';
        }
    }, 5500);
}

document.addEventListener('DOMContentLoaded', loadPageData); //
