// functions/get-options.js
// Fetches records for dropdowns. Includes ALL specified details.
// Last Updated: Monday, April 7, 2025 at 4:01:42 PM -04 Chile Time

const Airtable = require('airtable');

const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

// --- Table Configurations with ALL fields needed by Select2 templates ---
const TABLE_CONFIG = {
    'scheduled_events': { // For main dropdown (#widget-oY8v)
        tableId: 'tblJ604IExFMU3KvW',
        displayField: 'Evento',           // Primary text
        filterField: 'Modalidad',         // Field for 'Grupal' filter
        statusField: 'Estado Evento',     // Field for 'futuro' filter
        defaultFilterValue: 'Grupal',
        statusFilterValue: 'futuro',
        // Fields needed for display template
        detailFields: ['Fecha', 'Hora Inicio', 'Hora Término', 'Descripción', 'Precio']
    },
    'experience_types': { // For "Solicitar" dropdown (#request-experience-type)
        tableId: 'tblaBc1QhlksnV5Qb',
        displayField: 'Experiencia',      // Primary text
        filterField: 'Modalidad',         // Field for 'Grupal' filter (Ensure exists in this table)
        defaultFilterValue: 'Grupal',
        // Fields needed for display template AND end time calculation
        detailFields: ['Descripción', 'Precio', 'Duración'] // Assumes 'Duración' is the field name
    },
    'food': { // For food dropdown (#widget-3vTL)
        tableId: 'tblz3fbgTFnqfCGi9',
        displayField: 'Name',
        // detailFields: [] // No extra details requested for food
    }
};

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) { /* ... error handling ... */ }
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') { /* ... return 405 ... */ }

    const tableType = event.queryStringParameters?.tableType;
    const filterValue = event.queryStringParameters?.filterValue;

    if (!tableType || !TABLE_CONFIG[tableType]) { /* ... return 400 ... */ }
    const config = TABLE_CONFIG[tableType];
    if (!config.tableId || !config.displayField) { /* ... return 500 ... */ }

    const table = base(config.tableId);
    // --- Determine fields to fetch ---
    const fieldsToFetch = [config.displayField];
    if (Array.isArray(config.detailFields)) {
        fieldsToFetch.push(...config.detailFields); // Add ALL detail fields
    }
    // Add filter fields only if they aren't already included
    if (config.filterField && !fieldsToFetch.includes(config.filterField)) {
        fieldsToFetch.push(config.filterField);
    }
     if (config.statusField && !fieldsToFetch.includes(config.statusField)) {
        fieldsToFetch.push(config.statusField);
    }

    // --- Prepare Airtable select options ---
    const selectOptions = {
        fields: fieldsToFetch, // Fetch display + detail + filter fields
        sort: [{ field: config.displayField, direction: 'asc' }],
        maxRecords: 200,
    };

    // --- Apply filter(s) ---
    let filterParts = [];
    const effectiveFilterValue = filterValue || config.defaultFilterValue;
    if (config.filterField && effectiveFilterValue) {
        filterParts.push(`{${config.filterField}} = '${effectiveFilterValue}'`);
    }
    if (tableType === 'scheduled_events' && config.statusField && config.statusFilterValue) {
        filterParts.push(`{${config.statusField}} = '${config.statusFilterValue}'`);
    }
    if (filterParts.length > 1) { selectOptions.filterByFormula = `AND(${filterParts.join(', ')})`; }
    else if (filterParts.length === 1) { selectOptions.filterByFormula = filterParts[0]; }

    if (selectOptions.filterByFormula) { console.log(`Workspaceing from ${config.tableId} with filter: ${selectOptions.filterByFormula}`); }
    else { console.log(`Workspaceing options from ${config.tableId} without specific filter.`); }


    try {
        const records = await table.select(selectOptions).all();

        // --- Map records including details ---
        const options = records.map(record => {
            const optionData = {
                id: record.id, // Used as the value
                text: record.get(config.displayField) || `Unnamed (ID: ${record.id})`, // Primary text for Select2
                // Add all other fetched fields to be accessible in templates
            };
            fieldsToFetch.forEach(field => {
                // Add field value if it's not the primary display field already included as 'text'
                if(field !== config.displayField) {
                    optionData[field] = record.get(field); // Store under original field name
                }
            });
            return optionData;
        });

        console.log(`Successfully fetched ${options.length} options for type '${tableType}'.`);
        return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ results: options }) }; // Wrap in 'results' for Select2 AJAX

    } catch (error) { /* ... error handling ... */
         console.error(`Error fetching data from Airtable table ${config.tableId} for type '${tableType}':`, error);
        return { statusCode: error.statusCode || 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ /* ... */ }) };
    }
};