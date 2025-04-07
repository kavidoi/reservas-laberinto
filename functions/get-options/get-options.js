// functions/get-options/get-options.js
// Fetches records from specified Airtable tables to populate dropdowns.
// Using corrected Spanish field names based on diagnosis.
// Last Updated: Monday, April 7, 2025 at 2:03:08 AM -04 (Vitacura, Santiago Metropolitan Region, Chile)

const Airtable = require('airtable');

// --- Configuration ---
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

// --- Table Configurations ---
// Mapping using corrected Spanish field names
const TABLE_CONFIG = {
    'experiences': {
        tableId: 'tblaBc1QhlksnV5Qb', // Experiences Table ID
        displayField: 'Nombre Experiencia', // CORRECTED Display Field
        filterField: 'Tipo de Experiencia', // CORRECTED Filter Field
        defaultFilterValue: 'Grupal' // Value for filtering group experiences
    },
    'food': {
        tableId: 'tblz3fbgTFnqfCGi9', // Food Items Table ID
        displayField: 'Nombre Opción', // CORRECTED Display Field
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
        return { statusCode: 405, headers: { 'Allow': 'GET' }, body: 'Method Not Allowed' };
    }

    // Get table type and optional filter from query parameters
    const tableType = event.queryStringParameters?.tableType;
    const filterValue = event.queryStringParameters?.filterValue;

    // Validate tableType parameter
    if (!tableType || !TABLE_CONFIG[tableType]) {
        return {
             statusCode: 400,
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ message: `Bad Request: Invalid or missing 'tableType'. Valid types: ${Object.keys(TABLE_CONFIG).join(', ')}` })
        };
    }

    const config = TABLE_CONFIG[tableType];
    const table = base(config.tableId);

    // Determine which fields to retrieve from Airtable
    // We only absolutely need the displayField. Airtable record ID comes automatically.
    const fieldsToFetch = [config.displayField];
    // Include filter field only if debugging the filter itself
    // if (config.filterField) { fieldsToFetch.push(config.filterField); }

    // Prepare Airtable select options
    const selectOptions = {
        fields: fieldsToFetch,
        sort: [{ field: config.displayField, direction: 'asc' }],
        maxRecords: 200,
    };

    // Apply filter if configured
    const effectiveFilterValue = filterValue || config.defaultFilterValue;
    if (config.filterField && effectiveFilterValue) {
        // Standard Airtable formula syntax: {Field Name with Spaces} = 'Value'
        // No extra quotes needed around the {field name} part.
        selectOptions.filterByFormula = `{${config.filterField}} = '${effectiveFilterValue}'`;
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
            // Use the displayField from config, provide fallback
            name: record.get(config.displayField) || `Unnamed (ID: ${record.id})`
        }));

        console.log(`Successfully fetched ${options.length} options for type '${tableType}'.`);

        // Return the options array as JSON
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(options),
        };

    } catch (error) {
        console.error(`Error fetching data from Airtable table ${config.tableId} for type '${tableType}':`, error);
        // TODO: Consider sending errors to Sentry if it's configured

        return {
            statusCode: error.statusCode || 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Error fetching options for '${tableType}'. Failed field was likely '${config.displayField}' or filter field '${config.filterField}'.`,
                // Avoid exposing detailed internal errors in production
                error: process.env.NODE_ENV !== 'production' ? (error.message || "Internal Server Error") : "An internal error occurred fetching options."
            }),
        };
    }
};