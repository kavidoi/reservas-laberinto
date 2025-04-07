// functions/get-options.js
// Fetches records from specified Airtable tables to populate dropdowns.
// Last Updated: Monday, April 7, 2025 at 12:54:12 AM -04 (Vitacura, Santiago Metropolitan Region, Chile)

const Airtable = require('airtable');

// --- Configuration ---
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

// --- Table Configurations ---
// Mapping query parameter names to actual Airtable details
const TABLE_CONFIG = {
    'experiences': {
        tableId: 'tblaBc1QhlksnV5Qb', // Your Experiences Table ID
        displayField: 'Name',      // Field with text for dropdown
        filterField: 'Tipp',       // Field to filter by (e.g., "Grupal")
        defaultFilterValue: 'Grupal' // Default value to filter experiences by
    },
    'food': {
        tableId: 'tblz3fbgTFnqfCGi9', // Your Food Items Table ID
        displayField: 'Name',      // Field with text for dropdown
        // Add filterField/Value here if food items need filtering
    }
    // Add more configurations here if needed for other dropdowns
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
    // Use specific filter value from query, or default if applicable
    const filterValue = event.queryStringParameters?.filterValue;

    if (!tableType || !TABLE_CONFIG[tableType]) {
        return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `Bad Request: Invalid or missing 'tableType'. Valid types: ${Object.keys(TABLE_CONFIG).join(', ')}` }) };
    }

    const config = TABLE_CONFIG[tableType];
    const table = base(config.tableId);
    const fieldsToFetch = [config.displayField];
    if (config.filterField) {
        fieldsToFetch.push(config.filterField);
    }

    // Prepare Airtable select options
    const selectOptions = {
        fields: fieldsToFetch,
        sort: [{ field: config.displayField, direction: 'asc' }],
        // Max records just in case, adjust if you have many options
        maxRecords: 200
    };

    // Apply filter if configured and a value is provided or defaulted
    const effectiveFilterValue = filterValue || config.defaultFilterValue;
    if (config.filterField && effectiveFilterValue) {
        // Ensure filter value is properly escaped if necessary (simple string equality assumed here)
        selectOptions.filterByFormula = `{<span class="math-inline">\{config\.filterField\}\} \= '</span>{effectiveFilterValue}'`;
        console.log(`Workspaceing from ${config.tableId} with filter: ${selectOptions.filterByFormula}`);
    } else {
         console.log(`Workspaceing options from ${config.tableId} without specific filter.`);
    }


    try {
        const records = await table.select(selectOptions).all();

        // Map records to a simpler format { id: recordId, name: displayFieldValue }
        const options = records.map(record => ({
            id: record.id,
            name: record.get(config.displayField) || 'Unnamed Option' // Fallback name
        }));

        console.log(`Successfully fetched <span class="math-inline">\{options\.length\} options for type '</span>{tableType}'.`);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(options),
        };

    } catch (error) {
        console.error(`Error fetching data from Airtable table ${config.tableId}:`, error);
        // Consider using Sentry here as well if initialized globally

        return {
            statusCode: error.statusCode || 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Error fetching options for '${tableType}'.`,
                error: error.message || "Internal Server Error"
            }),
        };
    }
};