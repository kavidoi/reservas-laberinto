// public/js/script.js
// Handles form navigation, conditional logic, dynamic dropdown population, summary updates, and submission.
// Includes logic for simplified Date Request sub-flow.
// Last Updated: Monday, April 7, 2025 at 3:59:32 AM -04 Chile Time

let currentStepId = 'step-q1GJ';
let historyStack = ['step-q1GJ'];

// --- Helper Functions ---
// (setText, showError, hideError remain the same)
function setText(elementId, text) { /* ... */ }
function showError(errorElement, message) { /* ... */ }
function hideError(errorElement) { /* ... */ }

// --- Dynamic Dropdown Population ---
// (populateDropdown remains the same)
async function populateDropdown(selectElementId, tableType, filterValue = null) { /* ... */ }

// --- NEW: Populate Dropdown specifically for Request Date Experience Type ---
async function populateRequestExperienceTypes() {
    const selectElementId = 'request-experience-type';
    const tableType = 'experiences'; // Use the same 'experiences' type
    // We still only want to allow scheduling of 'Grupal' types via this form
    const filterValue = 'Grupal';

    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) { return; } // Exit if element not found

    // Show loading state
    selectElement.disabled = true;
    selectElement.innerHTML = `<option value="" selected disabled>Cargando tipos...</option>`;

    let apiUrl = `/api/get-options?tableType=${encodeURIComponent(tableType)}`;
     if (filterValue) { // Add filter for Grupal
        apiUrl += `&filterValue=${encodeURIComponent(filterValue)}`;
    }
    // NOTE: This currently doesn't filter out non-'futuro' events,
    // it fetches based on 'Modalidad' only, assuming any Grupal type can be requested.
    // If you only want to request types that *also* have 'Estado Evento'='futuro'
    // (which seems less likely for requesting *new* dates), the backend 'get-options'
    // would need adjustment or a new parameter. Assuming fetching all 'Grupal' types is desired here.

    try {
        const response = await fetch(apiUrl);
        const responseContentType = response.headers.get("content-type");
        if (!response.ok) { throw new Error(`HTTP error ${response.status}`); }
        if (!responseContentType || !responseContentType.includes("application/json")) {
             throw new Error(`Received non-JSON response from ${apiUrl}`); }
        const options = await response.json();

        selectElement.innerHTML = `<option value="" selected disabled>Selecciona tipo de experiencia...</option>`; // Restore placeholder

        if (options && Array.isArray(options) && options.length > 0) {
            options.forEach(option => {
                if (option.id && option.name) {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.id;
                    optionElement.textContent = option.name;
                    selectElement.appendChild(optionElement);
                }
            });
             selectElement.selectedIndex = 0; // Ensure placeholder is shown
        } else {
             selectElement.innerHTML = `<option value="" selected disabled>No hay tipos disponibles</option>`;
        }
    } catch (error) {
        console.error(`Failed to populate dropdown #${selectElementId}:`, error);
        selectElement.innerHTML = `<option value="" selected disabled>Error al cargar tipos</option>`;
    } finally {
        selectElement.disabled = false;
    }
}


// --- Navigation Logic ---
// (showStep, goToStep, goBack remain the same)
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


// --- NEW: Submit Date Request to Backend ---
async function submitDateRequest() {
    const submitButton = document.getElementById('submit-request-button');
    const errorDiv = document.getElementById('request-submission-error');
    const experienceSelect = document.getElementById('request-experience-type');
    const dateInput = document.getElementById('request-date');
    const timeInput = document.getElementById('request-time');
    const nameInput = document.getElementById('request-contact-name');
    const emailInput = document.getElementById('request-contact-email');

    // Basic Validation
    let isValid = true;
    hideError(errorDiv); // Clear previous errors
    [experienceSelect, dateInput, timeInput, nameInput, emailInput].forEach(input => {
        if (!input?.value) {
             input?.classList.add('is-invalid'); // Add Bootstrap validation class
             isValid = false;
        } else {
             input?.classList.remove('is-invalid');
        }
    });

    if (!isValid) {
         showError(errorDiv, "Por favor completa todos los campos requeridos.");
         return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';

    const requestData = {
        experienceTypeId: experienceSelect.value, // Record ID of the Evento type
        experienceTypeName: experienceSelect.options[experienceSelect.selectedIndex]?.text, // Name for context
        requestedDate: dateInput.value,
        requestedTime: timeInput.value,
        requesterName: nameInput.value,
        requesterEmail: emailInput.value
        // Add any other fields from the request form here
    };

    console.log("Date Request Data:", requestData);

    // Send to NEW backend endpoint
    const backendUrl = '/api/create-event'; // Needs functions/create-event.js

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(requestData),
        });
        const result = await response.json();

        if (response.ok) {
            console.log('Date request submission successful:', result);
            // Update confirmation step details
            setText('confirm-request-email', requestData.requesterEmail);
            setText('confirm-request-details', `${requestData.experienceTypeName} - ${requestData.requestedDate} ${requestData.requestedTime}`);
            goToStep('step-request-confirm'); // Show confirmation page
        } else {
            console.error(`Date request submission failed (${response.status}):`, result);
            showError(errorDiv, result.message || `Error ${response.status}: Ocurrió un problema al enviar la solicitud.`);
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Solicitud de Fecha';
        }
    } catch (error) {
        console.error('Network or fetch error during date request:', error);
        showError(errorDiv, 'Error de red al enviar la solicitud. Verifica tu conexión e inténtalo de nuevo.');
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar Solicitud de Fecha';
    }
}


// --- Document Ready - Initial Setup & Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    showStep(currentStepId);

    // --- Initialize Flatpickr Date Picker ---
    const dateInput = document.getElementById('request-date');
    if (dateInput) {
        flatpickr(dateInput, {
            altInput: true, // Shows formatted date to user, sends standard format
            altFormat: "j F, Y", // How user sees date e.g., "7 Abril, 2025"
            dateFormat: "Y-m-d", // How date is sent to backend e.g., "2025-04-07"
            minDate: new Date().fp_incr(10), // Minimum date is 10 days from today
            locale: "es", // Use Spanish locale
            disable: [
                function(date) {
                    // Disable Monday (1) to Thursday (4)
                    const day = date.getDay();
                    return (day === 1 || day === 2 || day === 3 || day === 4);
                }
            ],
            // Add more options if needed
        });
        console.log("Flatpickr initialized for #request-date");
    } else {
        console.warn("Date input #request-date not found for Flatpickr.");
    }


    // --- Populate Dropdowns ---
    console.log("Initiating dropdown population...");
    populateDropdown('widget-oY8v', 'experiences', 'Grupal'); // Main form group experiences
    populateDropdown('widget-3vTL', 'food');                  // Main form food options
    populateRequestExperienceTypes();                          // Subform experience types


    // --- Add Event Listeners ---
    console.log("Adding event listeners...");
    try {
        // Existing Listeners...
        const exclusiveSwitch = document.getElementById('widget-grSj');
        if (exclusiveSwitch) { exclusiveSwitch.addEventListener('change', () => { /* ... */ checkLunchParagraphs(); updateSummary(); }); }
        const groupSizeInput = document.getElementById('widget-tZqh');
        if (groupSizeInput) { groupSizeInput.addEventListener('input', () => { handleGroupSizeChange(); updateSummary(); }); }
        const allAdultsCheckbox = document.getElementById('widget-qdCu');
        if (allAdultsCheckbox) { allAdultsCheckbox.addEventListener('change', handleGroupRestrictionChange); }
        const groupSelect = document.getElementById('widget-oY8v');
        const foodSelect = document.getElementById('widget-3vTL');
        if (groupSelect) groupSelect.addEventListener('change', updateSummary);
        if (foodSelect) foodSelect.addEventListener('change', updateSummary);
        const discountInput = document.getElementById('widget-3KPv');
        if (discountInput) discountInput.addEventListener('input', updateSummary);
        const scheduleDateInput = document.getElementById('scheduling-date'); // For main exclusive scheduling
        const scheduleTimeInput = document.getElementById('scheduling-time');
        if(scheduleDateInput) scheduleDateInput.addEventListener('change', updateSummary);
        if(scheduleTimeInput) scheduleTimeInput.addEventListener('change', updateSummary);

        // Add listener for NEW request date/time inputs if needed for validation/summary
        const requestDate = document.getElementById('request-date');
        const requestTime = document.getElementById('request-time');
        // Example: if(requestDate) requestDate.addEventListener('change', someValidationFunction);

    } catch(err) { console.error("Error setting up event listeners:", err); }

    // --- Initial State Checks ---
    console.log("Running initial state checks...");
    try {
        checkLunchParagraphs();
        handleGroupSizeChange();
        handleGroupRestrictionChange();
        updateSummary();
    } catch (err) { console.error("Error running initial checks:", err); }
    console.log("Initialization complete.");
});