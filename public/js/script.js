// public/js/script.js
// Handles form navigation, conditional logic, dynamic dropdown population, summary updates, and submission.
// Populates request dropdown with details. Uses addEventListener.
// Last Updated: Monday, April 7, 2025 at 12:05:12 PM -04 Chile Time

let currentStepId = 'step-q1GJ';
let historyStack = ['step-q1GJ'];

// --- Helper Functions ---
function setText(elementId, text) { /* ... */ } // (Keep existing)
function showError(errorElement, message) { /* ... */ } // (Keep existing)
function hideError(errorElement) { /* ... */ } // (Keep existing)
function debounce(func, delay) { /* ... */ } // (Keep existing)

/**
 * Fetch options from the given API URL and validate the response.
 */
async function fetchOptions(apiUrl) {
    const response = await fetch(apiUrl);
    const responseContentType = response.headers.get("content-type");
    if (!response.ok) { /* ... error handling ... */ throw new Error(`HTTP error ${response.status}`); }
    if (!responseContentType || !responseContentType.includes("application/json")) { throw new Error(`Received non-JSON response from ${apiUrl}`); }
    const options = await response.json();
    if (!Array.isArray(options)) { console.error("Invalid data format:", options); throw new Error("Invalid data format received."); }
    return options;
}

/**
 * Update the dropdown UI based on the fetched options or an error.
 * Now handles options with a 'details' object.
 */
function updateDropdownUI(selectElement, options, error = null, placeholderText = 'Selecciona...') {
    const defaultOptionValue = "";
    selectElement.innerHTML = ''; // Clear previous options

    const placeholderOption = document.createElement('option');
    placeholderOption.value = defaultOptionValue;
    placeholderOption.selected = true;
    placeholderOption.disabled = true;
    placeholderOption.textContent = error ? "Error al cargar" : placeholderText;
    selectElement.appendChild(placeholderOption);

    if (!error && Array.isArray(options)) {
        if (options.length > 0) {
            options.forEach(option => {
                if (option && typeof option.id === 'string' && typeof option.name === 'string') {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.id;

                    // --- Format Option Text ---
                    let displayText = option.name;
                    // Check if details exist (for experience_types)
                    if (option.details) {
                        const desc = option.details['Descripción']; // Use exact field name
                        const price = option.details['Precio'];   // Use exact field name
                        const priceFormatted = (price !== null && price !== undefined) ? `$${Number(price).toLocaleString('es-CL')}` : ''; // Format price if exists
                        const descShort = (desc && typeof desc === 'string') ? (desc.substring(0, 70) + (desc.length > 70 ? '...' : '')) : ''; // Shorten description

                        displayText = `${option.name}`; // Start with name
                        if (priceFormatted) {
                            displayText += ` (${priceFormatted})`; // Add price
                        }
                         if (descShort) {
                            displayText += ` - ${descShort}`; // Add short description
                        }
                    }
                    optionElement.textContent = displayText;
                    // --- End Format Option Text ---

                    selectElement.appendChild(optionElement);
                } else {
                    console.warn("Skipping invalid option structure:", option);
                }
            });
            console.log(`Successfully populated #${selectElement.id} with ${options.length} options.`);
        } else {
            placeholderOption.textContent = "No hay opciones disponibles";
            console.log(`No options found for #${selectElement.id}.`);
        }
    } else if (error) {
        console.error(`Failed to populate dropdown #${selectElement.id}:`, error);
    }
}


// --- Dynamic Dropdown Population (Main Function) ---
async function populateDropdown(selectElementId, tableType, filterValue = null) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) { console.error(`Dropdown element #${selectElementId} not found.`); return; }
    selectElement.disabled = true;

    // Determine placeholder based on element ID or tableType
    let loadingText = 'Cargando opciones...';
    let placeholderText = 'Selecciona...';
    if (selectElementId === 'request-experience-type') {
        loadingText = 'Cargando tipos...';
        placeholderText = 'Selecciona tipo de experiencia...';
    }

    updateDropdownUI(selectElement, null, null, loadingText); // Show loading state

    const apiUrl = `/api/get-options?tableType=${encodeURIComponent(tableType)}${filterValue ? '&filterValue=' + encodeURIComponent(filterValue) : ''}`;
    try {
        const options = await fetchOptions(apiUrl);
        console.log(`Workspaceed options for ${selectElementId}:`, options);
        updateDropdownUI(selectElement, options, null, placeholderText); // Update with data or 'no options'
    } catch (error) {
        updateDropdownUI(selectElement, null, error, placeholderText); // Show error state
    } finally {
        selectElement.disabled = false; // Re-enable dropdown
    }
}

// --- REMOVED populateRequestExperienceTypes() ---
// The main populateDropdown now handles fetching details via config


// --- Navigation Logic ---
// (showStep, goToStep, goBack functions remain the same)
function showStep(stepId) { /* ... */ }
function goToStep(stepId) { /* ... */ }
function goBack() { /* ... */ }

// --- Conditional Logic Handlers ---
// (checkLunchParagraphs, handleGroupSizeChange, handleGroupRestrictionChange remain the same)
function checkLunchParagraphs() { /* ... */ }
function handleGroupSizeChange() { /* ... */ }
function handleGroupRestrictionChange() { /* ... */ }

// --- Summary Update Function ---
// (updateSummary remains the same)
function updateSummary() { /* ... */ }

// --- Data Gathering for Main Submission ---
// (gatherFormData remains the same)
function gatherFormData() { /* ... */ }

// --- Submit Main Reservation to Backend ---
// (submitReservation remains the same)
async function submitReservation() { /* ... */ }

// --- Submit Date Request to Backend ---
// (submitDateRequest remains the same)
async function submitDateRequest() { /* ... */ }


// --- Document Ready - Initial Setup & Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    showStep(currentStepId);

    // --- Initialize Flatpickr ---
    // (Remains the same)
    const dateInputFlatpickr = document.getElementById('request-date');
    if (dateInputFlatpickr) { try { flatpickr(dateInputFlatpickr, { /* ... options ... */ }); console.log("Flatpickr initialized..."); } catch(err) { console.error("Error initializing Flatpickr:", err); } } else { console.warn("Date input #request-date not found..."); }

    // --- Populate Dropdowns ---
    console.log("Initiating dropdown population...");
    // Use new keys for clarity
    populateDropdown('widget-oY8v', 'scheduled_events', 'Grupal'); // Main form - Scheduled Events (filtered)
    populateDropdown('widget-3vTL', 'food');                       // Main form - Food Options
    populateDropdown('request-experience-type', 'experience_types', 'Grupal'); // Subform - Experience Types (filtered)


    // --- Add Event Listeners ---
    console.log("Adding event listeners...");
    // (All listeners remain the same as previous full version)
    try {
         const addSafeListener = (id, event, handler) => { /* ... */ };
         // Add all button/input listeners using addSafeListener...
         addSafeListener('btn-request-other-date', 'click', () => goToStep('step-request-start'));
         // ... (all other listeners) ...
         const scheduleTimeInput = document.getElementById('scheduling-time'); if(scheduleTimeInput) scheduleTimeInput.addEventListener('change', updateSummary);
    } catch(err) { console.error("Error setting up event listeners:", err); }

    // --- Initial State Checks ---
    console.log("Running initial state checks...");
    try {
        checkLunchParagraphs(); handleGroupSizeChange(); handleGroupRestrictionChange(); updateSummary();
    } catch (err) { console.error("Error running initial checks:", err); }
    console.log("Initialization complete.");

}); // End DOMContentLoaded listener