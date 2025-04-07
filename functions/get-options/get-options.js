// functions/get-options/get-options.js
// Fetches records from specified Airtable tables to populate dropdowns.
// Using verified Table IDs and Field Names.
// Last Updated: Monday, April 7, 2025 at 2:30:23 AM -04 (Vitacura, Santiago Metropolitan Region, Chile)

const Airtable = require('airtable');

// --- Configuration ---
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

// --- Table Configurations ---
// Mapping using user-verified Table IDs and Field Names
const TABLE_CONFIG = {
    'experiences': {
        tableId: 'tblJ604IExFMU3KvW',       // Verified Experiences Table ID
        displayField: 'Evento',          // Verified Display Field
        filterField: 'Grupal/Privada',   // Verified Filter Field
        defaultFilterValue: 'Grupal'     // Value for filtering group experiences
    },
    'food': {
        tableId: 'tblz3fbgTFnqfCGi9',       // Verified Food Items Table ID
        displayField: 'Name',            // Verified Display Field
    }
};

// Basic check for essential environment variables
if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error("FATAL: Missing required Airtable environment variables (API Key or Base ID).");
    module.exports.handler = async () => ({
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Server configuration error." })
    });
    return; // Stop initialization
}

// Initialize Airtable client
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// --- Serverless Function Handler ---
exports.handler = async (event, context) => {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers: { 'Allow': 'GET', "Content-Type": "application/json" }, body: JSON.stringify({ message: 'Method Not Allowed. Please use GET.' }) };
    }

    // Get table type and optional filter from query parameters
    const tableType = event.queryStringParameters?.tableType;
    const filterValue = event.queryStringParameters?.filterValue;

    // Validate tableType parameter
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

    // Apply filter if configured
    const effectiveFilterValue = filterValue || config.defaultFilterValue;
    if (config.filterField && effectiveFilterValue) {
        selectOptions.filterByFormula = `{<span class="math-inline">\{config\.filterField\}\} \= '</span>{effectiveFilterValue}'`;
        console.log(`Workspaceing from ${config.tableId} with filter: ${selectOptions.filterByFormula}`);
    } else {
         console.log(`Workspaceing options from ${config.tableId} without specific filter.`);
    }

    try {
        // Fetch all records matching the select options
        const records = await table.select(selectOptions).all();

        // Map records to the format needed by the frontend: { id: recordId, name: displayFieldValue }
        const options = records.map(record => ({
            id: record.id,
            name: record.get(config.displayField) || `Unnamed (ID: ${record.id})`
        }));

        console.log(`Successfully fetched <span class="math-inline">\{options\.length\} options for type '</span>{tableType}'.`);

        // Return the options array as JSON
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(options),
        };

    } catch (error) {
        console.error(`Error fetching data from Airtable table <span class="math-inline">\{config\.tableId\} for type '</span>{tableType}':`, error);
        // TODO: Consider sending errors to Sentry if it's configured

        return {
            statusCode: error.statusCode || 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Error fetching options for '<span class="math-inline">\{tableType\}'\. Check field names \('</span>{config.displayField}', filter: '<span class="math-inline">\{config\.filterField\}'\) and table ID \('</span>{config.tableId}').`,
                error: process.env.NODE_ENV !== 'production' ? (error.message || "Internal Server Error") : "An internal error occurred fetching options."
            }),
        };
    }
};