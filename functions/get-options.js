// functions/get-options.js
// Fetches records for dropdowns. Includes details for experience types.
// Last Updated: Monday, April 7, 2025 at 12:05:12 PM -04 Chile Time

const Airtable = require('airtable');

// --- Configuration ---
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

// --- Table Configurations ---
const TABLE_CONFIG = {
    // For the main dropdown showing scheduled events
    'scheduled_events': {
        tableId: 'tblJ604IExFMU3KvW',       // Eventos Table ID
        displayField: 'Evento',          // Evento Field
        filterField: 'Modalidad',        // Field for Grupal/Privada in Eventos table
        statusField: 'Estado Evento',    // Field for filtering by status in Eventos table
        defaultFilterValue: 'Grupal',    // Value for Modalidad filter
        statusFilterValue: 'futuro'      // Value for Estado Evento filter
    },
    // For the "Solicitar otra fecha" dropdown showing experience types
    'experience_types': {
        tableId: 'tblaBc1QhlksnV5Qb',      // Experiencias Table ID
        displayField: 'Experiencia',     // Verified Name Field
        filterField: 'Modalidad',        // ASSUMED Field for Grupal/Privada in Experiencias table (Please VERIFY)
        defaultFilterValue: 'Grupal',    // Value for filtering Grupal types
        detailFields: ['Descripción', 'Precio'] // Verified Fields for details
    },
    // For the food dropdown
    'food': {
        tableId: 'tblz3fbgTFnqfCGi9',       // Verified Food Items Table ID
        displayField: 'Name',            // Verified Display Field
    }
};

// Basic check for essential environment variables
if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) { /* ... error handling ... */ return; }

// Initialize Airtable client
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// --- Serverless Function Handler ---
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers: { 'Allow': 'GET', "Content-Type": "application/json" }, body: JSON.stringify({ message: 'Method Not Allowed. Please use GET.' }) };
    }

    const tableType = event.queryStringParameters?.tableType;
    const filterValue = event.queryStringParameters?.filterValue;

    if (!tableType || !TABLE_CONFIG[tableType]) {
        return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `Bad Request: Invalid or missing 'tableType'. Valid types: ${Object.keys(TABLE_CONFIG).join(', ')}` }) };
    }

    const config = TABLE_CONFIG[tableType];
    if (!config.tableId || !config.displayField) {
         console.error(`Configuration error: Missing tableId or displayField for tableType '${tableType}'`);
         return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Server configuration error." }) };
    }
    const table = base(config.tableId);

    // Determine fields to fetch
    const fieldsToFetch = [config.displayField];
    if (Array.isArray(config.detailFields)) {
        fieldsToFetch.push(...config.detailFields); // Add detail fields if specified
    }

    // Prepare Airtable select options
    const selectOptions = {
        fields: fieldsToFetch,
        sort: [{ field: config.displayField, direction: 'asc' }],
        maxRecords: 200,
    };

    // Apply filter(s) - Modified for clarity and different table needs
    let filterParts = [];
    const effectiveFilterValue = filterValue || config.defaultFilterValue;

    // Apply Modalidad filter if specified
    if (config.filterField && effectiveFilterValue) {
        filterParts.push(`{${config.filterField}} = '${effectiveFilterValue}'`);
    }
    // Apply Status filter only for scheduled_events
    if (tableType === 'scheduled_events' && config.statusField && config.statusFilterValue) {
        filterParts.push(`{${config.statusField}} = '${config.statusFilterValue}'`);
    }

    // Combine filters with AND() if multiple exist
    if (filterParts.length > 1) {
        selectOptions.filterByFormula = `AND(${filterParts.join(', ')})`;
    } else if (filterParts.length === 1) {
        selectOptions.filterByFormula = filterParts[0];
    }

    if (selectOptions.filterByFormula) {
        console.log(`Workspaceing from ${config.tableId} with filter: ${selectOptions.filterByFormula}`);
    } else {
         console.log(`Workspaceing options from ${config.tableId} without specific filter.`);
    }


    try {
        const records = await table.select(selectOptions).all();

        // Map records based on whether detailFields were requested
        const options = records.map(record => {
            const baseOption = {
                id: record.id,
                name: record.get(config.displayField) || `Unnamed (ID: ${record.id})`
            };
            // If detailFields are configured, fetch and add them
            if (Array.isArray(config.detailFields)) {
                baseOption.details = {};
                config.detailFields.forEach(field => {
                    baseOption.details[field] = record.get(field); // Will be null if field is empty/doesn't exist
                });
            }
            return baseOption;
        });

        console.log(`Successfully fetched ${options.length} options for type '${tableType}'.`);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(options),
        };

    } catch (error) {
        console.error(`Error fetching data from Airtable table ${config.tableId} for type '${tableType}':`, error);
        return {
            statusCode: error.statusCode || 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Error fetching options for '${tableType}'. Check config.`,
                error: process.env.NODE_ENV !== 'production' ? (error.message || "Internal Server Error") : "An internal error occurred fetching options."
            }),
        };
    }
};