// functions/submit-reserva.js
// Handles creating/updating reservations in Airtable with retries and basic rate limiting.
// Last Updated: Sunday, April 6, 2025 at 10:28:52 PM -04 (Vitacura, Santiago Metropolitan Region, Chile)

// --- Dependencies ---
const Airtable = require('airtable');
const cache = require('memory-cache'); // Requires 'npm install memory-cache'
const retry = require('async-retry'); // Requires 'npm install async-retry'
const Sentry = require("@sentry/serverless"); // Requires 'npm install @sentry/serverless'

// --- Configuration ---
const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID, // Target table for Reservations (e.g., tblJSKGb4IBeyUwyo)
    SENTRY_DSN,         // Optional: Sentry Data Source Name for error tracking
    NODE_ENV           // Optional: Environment name ('development', 'production', etc.)
} = process.env;

// Rate Limiting & Retry Config
const SUBMISSION_WINDOW_MS = 30 * 1000; // 30 seconds window for duplicate check per IP/instance
const MAX_RETRIES = 3;                // Max retries for Airtable operations on failure

// --- Sentry Initialization ---
if (SENTRY_DSN) {
    try {
        Sentry.AWSLambda.init({ // Assumes AWS Lambda context (works for Netlify/Vercel)
            dsn: SENTRY_DSN,
            environment: NODE_ENV || 'development',
            tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0, // Adjust sampling
             // Optional: Add beforeSend hook for data scrubbing if needed
             beforeSend(event, hint) {
                 console.log("Preparing event for Sentry");
                 // Example: Could remove sensitive data from event.contexts.request_data here
                 return event;
            },
        });
        console.log("Sentry initialized.");
    } catch (error) {
        console.error("Sentry initialization failed:", error);
    }
} else {
    console.warn("SENTRY_DSN not found. Sentry logging disabled.");
}


// --- Airtable Client Initialization ---
if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    console.error("FATAL: Missing required Airtable environment variables.");
    module.exports.handler = Sentry.AWSLambda.wrapHandler(async () => ({
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Server configuration error: Missing Airtable credentials." })
    }));
    return;
}
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
const table = base(AIRTABLE_TABLE_ID); // Use the main Reservations table ID here


// --- Serverless Function Handler (Wrapped with Sentry) ---
exports.handler = Sentry.AWSLambda.wrapHandler(async (event, context) => {

    Sentry.configureScope(scope => {
        scope.setTag("aws_request_id", context?.awsRequestId);
        scope.setTag("function_name", context?.functionName || 'submit-reserva');
    });

    // 1. Rate Limiting / Duplicate Prevention Check
    const ip = event.headers['x-nf-client-connection-ip'] || // Netlify header
               event.headers['x-vercel-forwarded-for'] ||   // Vercel fallback
               event.requestContext?.identity?.sourceIp ||  // AWS API Gateway fallback
               'unknown-ip';
    Sentry.setUser({ ip_address: ip });

    let operationBlockedByCache = false;
    let cacheResponse = null;

    if (ip !== 'unknown-ip') {
        const cacheEntry = cache.get(ip);
        if (cacheEntry === 'processing') {
            console.warn(`Duplicate submission attempt detected for IP ${ip} (already processing).`);
            Sentry.captureMessage(`Duplicate submission attempt (processing) for IP: ${ip}`, 'warning');
            operationBlockedByCache = true;
            cacheResponse = { statusCode: 429, body: JSON.stringify({ message: 'Una solicitud ya está en proceso, por favor espera.' }) };
        } else if (cacheEntry && cacheEntry.status === 'completed') {
             console.warn(`Duplicate submission attempt detected for IP ${ip} (recently completed).`);
             Sentry.captureMessage(`Duplicate submission attempt (completed) for IP: ${ip}`, 'warning');
             operationBlockedByCache = true;
             cacheResponse = { statusCode: 429, body: JSON.stringify({ message: `Ya se registró una reserva recientemente desde esta conexión. ID: ${cacheEntry.recordId}` }) };
        } else {
            cache.put(ip, 'processing', SUBMISSION_WINDOW_MS);
            console.log(`IP ${ip} marked as 'processing' in cache for ${SUBMISSION_WINDOW_MS / 1000}s.`);
        }
    } else {
        console.warn("Could not determine client IP for rate limiting/duplicate check.");
        Sentry.captureMessage("Could not determine client IP.", 'warning');
    }

    if (operationBlockedByCache) {
        await Sentry.flush(2000);
        return { ...cacheResponse, headers: { "Content-Type": "application/json" } };
    }

    // 2. Method Check
    if (event.httpMethod !== 'POST') {
        if (ip !== 'unknown-ip') cache.del(ip);
        await Sentry.flush(2000);
        return { statusCode: 405, headers: { 'Allow': 'POST', "Content-Type": "application/json" }, body: JSON.stringify({ message: 'Method Not Allowed.' }) };
    }

    // 3. Process Request
    let data;
    let response;

    try {
        // Parse Data
        if (!event.body) {
             if (ip !== 'unknown-ip') cache.del(ip);
             throw new Error('Bad Request: No data provided.');
        }
        data = JSON.parse(event.body);
        Sentry.setContext("request_data", { // Log received keys/info to Sentry context
            keys: Object.keys(data),
            hasRecordId: !!data.recordIdToUpdate,
            groupSize: data.groupSize,
            experienceType: data.experienceType,
        });
        console.log("Received Parsed Data:", data);

        // Determine Action: Create or Update
        const recordIdToUpdate = data.recordIdToUpdate; // Frontend needs to send this for updates
        let operationType = recordIdToUpdate ? 'update' : 'create';

        // Map frontend data to Airtable field names
        // Ensure these field names EXACTLY match your Airtable columns
        const fields = {
            'Codigo Descuento': data.discountCode,
            'Tipo Experiencia': data.experienceType,
            'Fecha Agendada': data.scheduledDate, // Needs YYYY-MM-DD
            'Hora Agendada': data.scheduledTime,   // Needs HH:MM
            'Tamaño Grupo': data.groupSize,
            'Comentarios Alergias': data.comments,
            'Abono Pagado': data.abonoAmount,
            'Nombre Organizador': data.organizerName,
            'Email Organizador': data.organizerEmail,
            'Todos Mayores Edad/Beben': data.allAdultsDrink,
            'Todos Mayores 16': data.allOver16,
            'Adultos No Beben': data.adultsNoDrink,
            'Niños Menores 12': data.kidsUnder12,
            // --- Linked Records (Requires Record IDs from frontend) ---
            'Experiencia Grupal Seleccionada': data.groupExperienceId ? [data.groupExperienceId] : undefined,
            'Comida Adicional Seleccionada': data.foodChoiceId ? [data.foodChoiceId] : undefined,
        };

        // Clean fields
        const cleanedFields = {};
        for (const key in fields) {
            const value = fields[key];
            if (value !== undefined && value !== null) {
                 if (typeof value === 'string' && value.trim() === '' && key !== 'Comentarios Alergias') {
                     continue;
                 }
                 if (['Tamaño Grupo', 'Abono Pagado', 'Adultos No Beben', 'Niños Menores 12'].includes(key)) {
                     const numValue = Number(value);
                     if (!isNaN(numValue)) {
                         cleanedFields[key] = numValue;
                     } else { console.warn(`Invalid number for ${key}:`, value); }
                 } else {
                    cleanedFields[key] = value;
                 }
             }
         }
        console.log(`Cleaned fields for Airtable ${operationType}:`, cleanedFields);
        Sentry.setContext("airtable_payload", { operation: operationType, fields: cleanedFields });

        // Perform Airtable Operation with Retry Logic
        let airtableResult;
        await retry(
            async (bail, attempt) => {
                console.log(`Attempting Airtable ${operationType}, attempt #${attempt}`);
                try {
                    if (operationType === 'update') {
                        if (!recordIdToUpdate) {
                             // Bail if update is attempted without ID
                             bail(new Error("recordIdToUpdate is missing for update operation."));
                             return;
                        }
                        airtableResult = await table.update([{ id: recordIdToUpdate, fields: cleanedFields }]);
                        console.log(`Successfully updated Airtable record: ${airtableResult[0].id}`);
                    } else { // Create
                        airtableResult = await table.create([{ fields: cleanedFields }]);
                        console.log(`Successfully created Airtable record: ${airtableResult[0].id}`);
                    }
                } catch (error) {
                    console.error(`Airtable API error on attempt ${attempt}:`, error.message);
                    Sentry.captureException(error, { level: 'error', tags: { airtable_attempt: attempt, operation: operationType }});
                    // Don't retry on client errors (4xx) except for specific ones
                    if (error.statusCode && error.statusCode >= 400 && ![429, 423].includes(error.statusCode)) {
                        console.log(`Non-retryable Airtable error (Status ${error.statusCode}), bailing.`);
                        bail(error); // Stops retrying
                        return;
                    }
                    throw error; // Trigger retry
                }
            },
            {
                retries: MAX_RETRIES,
                minTimeout: 1000, factor: 2,
                onRetry: (error, attempt) => {
                    console.warn(`Retrying Airtable ${operationType} (attempt ${attempt}) due to error: ${error.message}`);
                    Sentry.captureMessage(`Retrying Airtable ${operationType} attempt ${attempt}`, 'warning');
                }
            }
        ); // End retry block

        const finalRecordId = airtableResult[0].id;

        // Update cache on success
        if (ip !== 'unknown-ip') {
             cache.put(ip, { status: 'completed', recordId: finalRecordId }, SUBMISSION_WINDOW_MS);
             console.log(`Marked IP ${ip} cache as completed with recordId ${finalRecordId}.`);
        }

        // Set success response
        response = {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Reserva ${operationType === 'update' ? 'actualizada' : 'creada'} con éxito!`,
                recordId: finalRecordId
            }),
        };

    } catch (error) {
        console.error(`Unhandled error during submission processing:`, error);
        Sentry.captureException(error, { level: 'error', tags: { handler_phase: 'processing' } });

        // Clear processing marker from cache on error
        if (ip !== 'unknown-ip' && cache.get(ip) === 'processing') {
             cache.del(ip);
             console.log(`Cleared 'processing' state for IP ${ip} due to error.`);
        }

        // Set error response
        response = {
            statusCode: error.message?.includes("Non-retryable") ? 400 : (error.statusCode || 500), // Use 400 for validation errors from Airtable
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                 message: error.message?.includes("Non-retryable") ? 'Error de validación con Airtable.' : 'Error al procesar la solicitud.',
                 error: NODE_ENV !== 'production' ? (error.message || "Internal Server Error") : "Ocurrió un error interno.",
            }),
        };
    } finally {
         // Ensure Sentry flushes events
         await Sentry.flush(2000);
    }

    return response; // Return the determined response

}); // End Sentry wrapHandler