// functions/get-options/get-options.js
// Fetches records from specified Airtable tables to populate dropdowns.
// Filters experiences by Modalidad='Grupal' AND Estado Evento='futuro'.
// Last Updated: Monday, April 7, 2025 at 2:48:10 AM -04 (Vitacura, Santiago Metropolitan Region, Chile)

const Airtable = require('airtable');

// --- Configuration ---
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

// --- Table Configurations ---
const TABLE_CONFIG = {
    'experiences': {
        tableId: 'tblJ604IExFMU3KvW',       // Verified Experiences Table ID
        displayField: 'Evento',          // Verified Display Field
        filterField: 'Modalidad',        // Verified Filter Field for Grupal/Privada
        statusField: 'Estado Evento',    // Field for filtering by status
        defaultFilterValue: 'Grupal',    // Value for Modalidad filter
        statusFilterValue: 'futuro'      // Value for Estado Evento filter
    },
    'food': {
        tableId: 'tblz3fbgTFnqfCGi9',       // Verified Food Items Table ID
        displayField: 'Name',            // Verified Display Field
    }
};

// Basic check for essential environment variables
if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error("FATAL: Missing required Airtable environment variables (API Key or Base ID).");
    module.exports.handler = async () => ({ statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Server configuration error." }) });
    return;
}

// Initialize Airtable client
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// --- Serverless Function Handler ---
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers: { 'Allow': 'GET', "Content-Type": "application/json" }, body: JSON.stringify({ message: 'Method Not Allowed. Please use GET.' }) };
    }

    const tableType = event.queryStringParameters?.tableType;
    // Allow overriding Modalidad filter via query param if needed in future
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
    const fieldsToFetch = [config.displayField];

    // Prepare Airtable select options
    const selectOptions = {
        fields: fieldsToFetch,
        sort: [{ field: config.displayField, direction: 'asc' }],
        maxRecords: 200,
    };

    // Apply filter(s)
    if (tableType === 'experiences') {
        const modalidadFilter = filterValue || config.defaultFilterValue;
        const statusFilter = config.statusFilterValue;
        // Ensure both field names and values are defined before creating formula
        if (config.filterField && modalidadFilter && config.statusField && statusFilter) {
            // Construct AND formula
            // Assumes both Modalidad and Estado Evento are text/select fields
            selectOptions.filterByFormula = `AND({${config.filterField}} = '${modalidadFilter}', {${config.statusField}} = '${statusFilter}')`;
            console.log(`Workspaceing from ${config.tableId} with filter: ${selectOptions.filterByFormula}`);
        } else {
            console.warn(`Skipping experience filter: Missing config (filterField: ${config.filterField}, statusField: ${config.statusField}) or values.`);
            // Decide if you want NO filter or maybe just the Modalidad filter if status is missing
            // Example: Just Modalidad filter if status info is missing
            // if (config.filterField && modalidadFilter) {
            //     selectOptions.filterByFormula = `{${config.filterField}} = '${modalidadFilter}'`;
            //     console.log(`Workspaceing from ${config.tableId} with filter: ${selectOptions.filterByFormula}`);
            // } else {
            //     console.log(`Workspaceing options from ${config.tableId} without specific filter.`);
            // }
            console.log(`Workspaceing ALL options from ${config.tableId} because filter config is incomplete.`); // Current behaviour if config missing
        }
    } else {
         // Apply other filters for other table types if needed here
         console.log(`Workspaceing options from ${config.tableId} without specific filter.`);
    }


    try {
        const records = await table.select(selectOptions).all();
        const options = records.map(record => ({
            id: record.id,
            name: record.get(config.displayField) || `Unnamed (ID: ${record.id})`
        }));
        console.log(`Successfully fetched ${options.length} options for type '${tableType}'.`);
        return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(options) };

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