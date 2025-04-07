// functions/create-event.js
// Handles requests to create a new event record in Airtable (date request).
// Uses user-provided field names.
// Last Updated: Monday, April 7, 2025 at 4:13:00 AM -04 (Vitacura, Santiago Metropolitan Region, Chile)

const Airtable = require('airtable');

// --- Configuration ---
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
// Use the verified Table ID for "eventos"
const EVENTOS_TABLE_ID = 'tblJ604IExFMU3KvW';

// Basic check for essential environment variables
if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !EVENTOS_TABLE_ID) {
    console.error("FATAL: Missing required Airtable environment variables (API Key, Base ID, or Eventos Table ID).");
    // Return a function that immediately errors out if vars are missing
    module.exports.handler = async () => ({
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Server configuration error." })
    });
    return; // Stop initialization
}

// Initialize Airtable client
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
const table = base(EVENTOS_TABLE_ID);

// --- Serverless Function Handler ---
exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: { 'Allow': 'POST', "Content-Type": "application/json" }, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    try {
        if (!event.body) {
            return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: 'Bad Request: No data provided.' }) };
        }
        const data = JSON.parse(event.body);
        console.log("Received date request data:", data);

        // Validate required data from frontend
        if (!data.experienceTypeId || !data.requestedDate || !data.requestedTime) {
             // Requester name/email might be optional depending on your Airtable setup
             return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: 'Bad Request: Missing required fields (Experience Type, Date, Time).' }) };
        }

        // --- Prepare data for Airtable using VERIFIED field names ---
        const fieldsToCreate = {
            // Combine date & time into ISO 8601 format for Airtable DateTime field
            // Assumes requestedTime is HH:MM. Adjust if Airtable expects different timezone/format
            'Fecha y hora de inicio': `${data.requestedDate}T${data.requestedTime}:00.000Z`, // Example: '2025-04-20T11:00:00.000Z' (Assumes UTC, adjust if needed)

            // Link to the Experience Type record using its ID
            'Experiencia': [data.experienceTypeId],

            // --- Fields User Said Are Automatic ---
            // 'Modalidad': 'Grupal', // Removed - Assumed automatic
            // 'Estado Evento': 'futuro', // Removed - Assumed automatic (or maybe 'Propuesto'?)

            // --- Requester Info (Include if fields exist in Airtable) ---
             // 'Nombre Solicitante': data.requesterName, // Uncomment and use correct field name if needed
             // 'Email Solicitante': data.requesterEmail, // Uncomment and use correct field name if needed

             // Add any other fields needed for a new event request record
        };
        // *** Ensure the field names above EXACTLY match your Airtable 'eventos' table columns ***

        console.log("Creating Airtable record in 'eventos' table with fields:", fieldsToCreate);

        // Create the record in Airtable (Consider adding retry logic like in submit-reserva if needed)
        const createdRecords = await table.create([{ fields: fieldsToCreate }]);

        console.log('Successfully created new event record:', createdRecords[0].id);

        // Return success response
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: 'Solicitud de fecha enviada con éxito!',
                recordId: createdRecords[0].id
            }),
        };

    } catch (error) {
        console.error("Error creating event record in Airtable:", error);
        // TODO: Consider sending errors to Sentry if configured

        // Return error response
        return {
            statusCode: error.statusCode || 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: 'Error al enviar la solicitud de fecha.',
                // Provide more detail only in non-production environments
                error: process.env.NODE_ENV !== 'production' ? (error.message || "Internal Server Error") : "Ocurrió un error interno."
            }),
        };
    }
    // Note: No Sentry flush here as Sentry wasn't added to this specific file's requirements yet. Add if desired.
};