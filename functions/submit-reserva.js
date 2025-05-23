// functions/submit-reserva.js
// Last Updated: Sunday, April 6, 2025 at 11:01:15 PM -04 (Vitacura, Santiago Metropolitan Region, Chile)

// --- Dependencies ---
const Airtable = require('airtable');
const cache = require('memory-cache');
const retry = require('async-retry');
const Sentry = require("@sentry/aws-serverless"); // UPDATED: Changed package name

// --- Configuration ---
const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID, // Target table for Reservations
    SENTRY_DSN,         // Optional: Sentry Data Source Name
    NODE_ENV           // Optional: Environment name
} = process.env;

// Rate Limiting & Retry Config
const SUBMISSION_WINDOW_MS = 30 * 1000;
const MAX_RETRIES = 3;

// --- Sentry Initialization ---
// Uses the AWSLambda integration, which is expected in @sentry/aws-serverless
if (SENTRY_DSN) {
    try {
        Sentry.AWSLambda.init({ // Initialization remains the same namespace
            dsn: SENTRY_DSN,
            environment: NODE_ENV || 'development',
            tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,
             beforeSend(event, hint) {
                 console.log("Preparing event for Sentry");
                 return event;
            },
        });
        console.log("Sentry initialized with @sentry/aws-serverless.");
    } catch (error) {
        console.error("Sentry initialization failed:", error);
    }
} else {
    console.warn("SENTRY_DSN not found. Sentry logging disabled.");
}

// --- Airtable Client Initialization ---
// (Remains the same)
if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    console.error("FATAL: Missing required Airtable environment variables.");
    module.exports.handler = Sentry.AWSLambda.wrapHandler(async () => ({ statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Server configuration error." }) }));
    return;
}
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
const table = base(AIRTABLE_TABLE_ID);


// --- Serverless Function Handler (Wrapped with Sentry) ---
// The wrapHandler function is also expected to be the same namespace
exports.handler = Sentry.AWSLambda.wrapHandler(async (event, context) => {

    // Configure Sentry scope (Remains the same)
    Sentry.configureScope(scope => {
        scope.setTag("aws_request_id", context?.awsRequestId);
        scope.setTag("function_name", context?.functionName || 'submit-reserva');
    });

    // 1. Rate Limiting / Duplicate Prevention Check (Remains the same)
    const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-vercel-forwarded-for'] || event.requestContext?.identity?.sourceIp || 'unknown-ip';
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

    // 2. Method Check (Remains the same)
    if (event.httpMethod !== 'POST') {
        if (ip !== 'unknown-ip') cache.del(ip);
        await Sentry.flush(2000);
        return { statusCode: 405, headers: { 'Allow': 'POST', "Content-Type": "application/json" }, body: JSON.stringify({ message: 'Method Not Allowed.' }) };
    }

    // 3. Process Request (Remains the same)
    let data;
    let response;

    try {
        // Parse Data
        if (!event.body) {
             if (ip !== 'unknown-ip') cache.del(ip);
             throw new Error('Bad Request: No data provided.');
        }
        data = JSON.parse(event.body);
        Sentry.setContext("request_data", { /* ... data context ... */ });
        console.log("Received Parsed Data:", data);

        // Determine Action: Create or Update
        const recordIdToUpdate = data.recordIdToUpdate;
        let operationType = recordIdToUpdate ? 'update' : 'create';

        // Map fields
        const fields = { /* ... field mappings remain the same ... */
            'Codigo Descuento': data.discountCode,
            'Tipo Experiencia': data.experienceType,
            'Fecha Agendada': data.scheduledDate,
            'Hora Agendada': data.scheduledTime,
            'Tamaño Grupo': data.groupSize,
            'Comentarios Alergias': data.comments,
            'Abono Pagado': data.abonoAmount,
            'Nombre Organizador': data.organizerName,
            'Email Organizador': data.organizerEmail,
            'Todos Mayores Edad/Beben': data.allAdultsDrink,
            'Todos Mayores 16': data.allOver16,
            'Adultos No Beben': data.adultsNoDrink,
            'Niños Menores 12': data.kidsUnder12,
            'Experiencia Grupal Seleccionada': data.groupExperienceId ? [data.groupExperienceId] : undefined,
            'Comida Adicional Seleccionada': data.foodChoiceId ? [data.foodChoiceId] : undefined,
        };

        // Clean fields (Remains the same)
        const cleanedFields = {};
        for (const key in fields) { /* ... cleaning logic ... */
            const value = fields[key];
            if (value !== undefined && value !== null) {
                 if (typeof value === 'string' && value.trim() === '' && key !== 'Comentarios Alergias') { continue; }
                 if (['Tamaño Grupo', 'Abono Pagado', 'Adultos No Beben', 'Niños Menores 12'].includes(key)) {
                     const numValue = Number(value);
                     if (!isNaN(numValue)) { cleanedFields[key] = numValue; } else { console.warn(`Invalid number for ${key}:`, value); }
                 } else { cleanedFields[key] = value; }
             }
         }
        console.log(`Cleaned fields for Airtable ${operationType}:`, cleanedFields);
        Sentry.setContext("airtable_payload", { operation: operationType, fields: cleanedFields });

        // Perform Airtable Operation with Retry Logic (Remains the same)
        let airtableResult;
        await retry(
            async (bail, attempt) => { /* ... retry logic ... */
                 console.log(`Attempting Airtable ${operationType}, attempt #${attempt}`);
                try {
                    if (operationType === 'update') {
                        if (!recordIdToUpdate) { bail(new Error("recordIdToUpdate is missing for update operation.")); return; }
                        airtableResult = await table.update([{ id: recordIdToUpdate, fields: cleanedFields }]);
                        console.log(`Successfully updated Airtable record: ${airtableResult[0].id}`);
                    } else { // Create
                        airtableResult = await table.create([{ fields: cleanedFields }]);
                        console.log(`Successfully created Airtable record: ${airtableResult[0].id}`);
                    }
                } catch (error) {
                    console.error(`Airtable API error on attempt ${attempt}:`, error.message);
                    Sentry.captureException(error, { level: 'error', tags: { airtable_attempt: attempt, operation: operationType }});
                    if (error.statusCode && error.statusCode >= 400 && ![429, 423].includes(error.statusCode)) { bail(error); return; }
                    throw error;
                }
            },
            { /* ... retry options ... */
                retries: MAX_RETRIES, minTimeout: 1000, factor: 2,
                onRetry: (error, attempt) => {
                    console.warn(`Retrying Airtable ${operationType} (attempt ${attempt}) due to error: ${error.message}`);
                    Sentry.captureMessage(`Retrying Airtable ${operationType} attempt ${attempt}`, 'warning');
                }
            }
        );

        const finalRecordId = airtableResult[0].id;

        // Update cache on success (Remains the same)
        if (ip !== 'unknown-ip') {
             cache.put(ip, { status: 'completed', recordId: finalRecordId }, SUBMISSION_WINDOW_MS);
             console.log(`Marked IP ${ip} cache as completed with recordId ${finalRecordId}.`);
        }

        // Set success response (Remains the same)
        response = {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Reserva ${operationType === 'update' ? 'actualizada' : 'creada'} con éxito!`,
                recordId: finalRecordId
            }),
        };

    } catch (error) { // Handle errors (Remains the same)
        console.error(`Unhandled error during submission processing:`, error);
        Sentry.captureException(error, { level: 'error', tags: { handler_phase: 'processing' } });
        if (ip !== 'unknown-ip' && cache.get(ip) === 'processing') { cache.del(ip); }
        response = { /* ... error response structure ... */
            statusCode: error.message?.includes("Non-retryable") ? 400 : (error.statusCode || 500),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                 message: error.message?.includes("Non-retryable") ? 'Error de validación con Airtable.' : 'Error al procesar la solicitud.',
                 error: NODE_ENV !== 'production' ? (error.message || "Internal Server Error") : "Ocurrió un error interno.",
            }),
         };
    } finally { // Flush Sentry (Remains the same)
         await Sentry.flush(2000);
    }

    return response;

}); // End Sentry wrapHandler