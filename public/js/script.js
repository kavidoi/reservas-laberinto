// public/js/script.js
// Handles form navigation, conditional logic, dynamic dropdown population, summary updates, and submission.
// Uses addEventListener instead of inline onclick attributes. Ensures const initializers.
// Last Updated: Monday, April 7, 2025 at 11:45:32 AM -04 Chile Time

let currentStepId = 'step-q1GJ';
let historyStack = ['step-q1GJ'];

// --- Helper Functions ---
function setText(elementId, text) { const element = document.getElementById(elementId); if (element) { element.textContent = text !== null && text !== undefined ? text : ''; } }
function showError(errorElement, message) { if (errorElement) { errorElement.textContent = message; errorElement.classList.remove('d-none'); } else { console.error("Error display element not found. Message:", message); alert(message); } }
function hideError(errorElement) { if (errorElement) { errorElement.classList.add('d-none'); errorElement.textContent = ''; } }

// --- Dynamic Dropdown Population ---
async function populateDropdown(selectElementId, tableType, filterValue = null) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) { console.error(`Dropdown element #${selectElementId} not found.`); return; }

    const defaultOptionValue = "";
    let originalPlaceholderText = 'Selecciona...';
    const placeholderOption = selectElement.querySelector(`option[value='${defaultOptionValue}']`);
    if (placeholderOption) { originalPlaceholderText = placeholderOption.textContent; placeholderOption.textContent = 'Cargando opciones...';}
    else { selectElement.innerHTML = `<option value="${defaultOptionValue}" selected disabled>Cargando opciones...</option>`; }
    selectElement.disabled = true;

    let apiUrl = `/api/get-options?tableType=${encodeURIComponent(tableType)}`;
    if (filterValue) { apiUrl += `&filterValue=${encodeURIComponent(filterValue)}`; }

    try {
        const response = await fetch(apiUrl);
        const responseContentType = response.headers.get("content-type");
        if (!response.ok) {
             let errorMsg = `HTTP error ${response.status}`;
             if (responseContentType && responseContentType.includes("application/json")) {
                 try { const errorJson = await response.json(); errorMsg += `: ${errorJson.message || 'Failed to load options'}`; } catch (e) {}
             } else { errorMsg += ` - ${response.statusText}`; }
            throw new Error(errorMsg);
        }
        if (!responseContentType || !responseContentType.includes("application/json")) { throw new Error(`Received non-JSON response from ${apiUrl}`); }

        const options = await response.json();
        console.log(`Workspaceed options for ${selectElementId}:`, options); // Log fetched data

        selectElement.innerHTML = `<option value="${defaultOptionValue}" selected disabled>${originalPlaceholderText}</option>`; // Restore placeholder

        if (options && Array.isArray(options) && options.length > 0) {
            options.forEach(option => {
                if (option.id && option.name) {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.id; // Use Airtable Record ID as value
                    optionElement.textContent = option.name;
                    selectElement.appendChild(optionElement); // Add the actual option
                } else { console.warn("Received invalid option data:", option); }
            });
            console.log(`Successfully populated #${selectElementId} with ${options.length} options.`);
        } else if (options && options.length === 0) {
             selectElement.innerHTML = `<option value="${defaultOptionValue}" selected disabled>No hay opciones disponibles</option>`;
             console.log(`No options found for #${selectElementId}.`);
        } else { throw new Error("Invalid data format received from options API."); }

    } catch (error) {
        console.error(`Failed to fetch or populate dropdown #${selectElementId}:`, error);
        selectElement.innerHTML = `<option value="${defaultOptionValue}" selected disabled>Error al cargar</option>`;
    } finally {
        selectElement.disabled = false; // Re-enable dropdown
    }
}

// --- Populate Dropdown specifically for Request Date Experience Type ---
async function populateRequestExperienceTypes() {
    const selectElementId = 'request-experience-type';
    const tableType = 'experiences';
    const filterValue = 'Grupal';

    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) { return; }

    selectElement.disabled = true;
    selectElement.innerHTML = `<option value="" selected disabled>Cargando tipos...</option>`;

    let apiUrl = `/api/get-options?tableType=${encodeURIComponent(tableType)}`;
     if (filterValue) { apiUrl += `&filterValue=${encodeURIComponent(filterValue)}`; }
    // Fetches experiences based on Modalidad = 'Grupal' only.

    try {
        const response = await fetch(apiUrl);
        const responseContentType = response.headers.get("content-type");
        if (!response.ok) { throw new Error(`HTTP error ${response.status}`); }
        if (!responseContentType || !responseContentType.includes("application/json")) { throw new Error(`Received non-JSON response from ${apiUrl}`); }
        const options = await response.json();
        console.log(`Workspaceed options for ${selectElementId}:`, options);

        selectElement.innerHTML = `<option value="" selected disabled>Selecciona tipo de experiencia...</option>`;

        if (options && Array.isArray(options) && options.length > 0) {
            options.forEach(option => {
                if (option.id && option.name) {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.id;
                    optionElement.textContent = option.name;
                    selectElement.appendChild(optionElement);
                }
            });
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
function showStep(stepId) { document.querySelectorAll('.form-step').forEach(step => { step.classList.add('d-none'); }); const targetStep = document.getElementById(stepId); if (targetStep) { targetStep.classList.remove('d-none'); currentStepId = stepId; window.scrollTo(0, 0); } else { console.error(`Step with ID ${stepId} not found.`); document.getElementById('step-q1GJ')?.classList.remove('d-none'); currentStepId = 'step-q1GJ'; } }
function goToStep(stepId) { if (stepId !== currentStepId) { historyStack.push(stepId); showStep(stepId); updateSummary(); } }
function goBack() { if (historyStack.length > 1) { historyStack.pop(); const previousStepId = historyStack[historyStack.length - 1]; showStep(previousStepId); updateSummary(); } }

// --- Conditional Logic Handlers ---
function checkLunchParagraphs() { const exclusiveSwitch = document.getElementById('widget-grSj'); const paraNRxz = document.getElementById('widget-nRxz'); const paraKJ8C = document.getElementById('widget-kJ8C'); const para5A7s = document.getElementById('widget-5A7s'); const isExclusive = exclusiveSwitch ? exclusiveSwitch.checked : false; const is150mExclusive = isExclusive; if(paraNRxz) paraNRxz.classList.toggle('d-none', isExclusive); if(paraKJ8C) paraKJ8C.classList.toggle('d-none', !isExclusive); if(para5A7s) para5A7s.classList.toggle('d-none', !is150mExclusive); }
function handleGroupSizeChange() { const groupSizeInput = document.getElementById('widget-tZqh'); const groupDetailsSection = document.getElementById('group-details-section'); const singleAttendeeSection = document.getElementById('single-attendee-section'); const groupMembersSection = document.getElementById('group-members-section'); const allAdultsCheckbox = document.getElementById('widget-qdCu'); const ehebCheckbox = document.getElementById('widget-eheb'); const size = parseInt(groupSizeInput?.value, 10) || 0; const isGroup = size > 1; groupDetailsSection?.classList.toggle('d-none', !isGroup); singleAttendeeSection?.classList.toggle('d-none', isGroup); groupMembersSection?.classList.toggle('d-none', !isGroup); if (ehebCheckbox) ehebCheckbox.required = !isGroup; if (!isGroup && allAdultsCheckbox) { allAdultsCheckbox.checked = true; handleGroupRestrictionChange(); } }
function handleGroupRestrictionChange() { const allAdultsCheckbox = document.getElementById('widget-qdCu'); const groupRestrictionsSection = document.getElementById('group-restrictions-section'); const underageContainer = document.getElementById('widget-oKhU-container'); const underageInput = document.getElementById('widget-oKhU'); const allAdults = allAdultsCheckbox ? allAdultsCheckbox.checked : true; groupRestrictionsSection?.classList.toggle('d-none', allAdults); const isExclusive = document.getElementById('widget-grSj')?.checked; if (underageContainer) { underageContainer.classList.toggle('d-none', !isExclusive); if (underageInput) { underageInput.disabled = !isExclusive || allAdults; if(underageInput.disabled) underageInput.value = 0; } } }

// --- Summary Update Function ---
function updateSummary() { try { const isExclusive = document.getElementById('widget-grSj')?.checked; let experienceText = 'No seleccionada'; let experienceId = null; if (isExclusive) { experienceText = 'Exclusiva (Detalle pendiente agendamiento)'; } else { const groupSelect = document.getElementById('widget-oY8v'); if (groupSelect && groupSelect.selectedIndex > 0 && groupSelect.value) { experienceText = groupSelect.options[groupSelect.selectedIndex].text; experienceId = groupSelect.value; } else { experienceText = 'Grupal (Pendiente selección)'; } } setText('summary-experiencia', experienceText); const groupSize = parseInt(document.getElementById('widget-tZqh')?.value, 10) || 1; setText('summary-tamano', `${groupSize} persona(s)`); const comidaSelect = document.getElementById('widget-3vTL'); let comidaText = 'No'; let foodId = null; if (comidaSelect && comidaSelect.selectedIndex > 0 && comidaSelect.value) { comidaText = comidaSelect.options[comidaSelect.selectedIndex].text; foodId = comidaSelect.value; } setText('summary-comida', comidaText); const scheduleDate = document.getElementById('scheduling-date')?.value; const scheduleTime = document.getElementById('scheduling-time')?.value; setText('summary-fecha', scheduleDate && scheduleTime ? `${scheduleDate} ${scheduleTime}` : 'Pendiente agendamiento'); const basePricePerPerson = 50000; const foodPrice = foodId ? 15000 : 0; const discountCode = document.getElementById('widget-3KPv')?.value; const discount = discountCode === 'DESC10' ? 5000 * groupSize : 0; const totalPrice = (basePricePerPerson + foodPrice) * groupSize - discount; const abonoPerPerson = 25000; const totalAbono = abonoPerPerson * groupSize; setText('summary-precio-total', totalPrice >= 0 ? totalPrice.toLocaleString('es-CL') : '0'); setText('summary-descuento', discount.toLocaleString('es-CL')); setText('summary-abono', totalAbono.toLocaleString('es-CL')); setText('checkout-abono-amount', totalAbono.toLocaleString('es-CL')); setText('final-summary-experiencia', experienceText); setText('final-summary-fecha', scheduleDate && scheduleTime ? `${scheduleDate} ${scheduleTime}` : 'Pendiente'); setText('final-summary-grupo', `${groupSize} persona(s)`); setText('final-summary-abono', totalAbono.toLocaleString('es-CL')); } catch (e) { console.error("Error updating summary:", e); } }

// --- Data Gathering for Main Submission ---
function gatherFormData() { const formData = {}; try { const isExclusive = document.getElementById('widget-grSj')?.checked; formData.experienceType = isExclusive ? 'Exclusiva' : 'Grupal'; const groupSelect = document.getElementById('widget-oY8v'); if (!isExclusive && groupSelect?.value) { formData.groupExperienceText = groupSelect.options[groupSelect.selectedIndex]?.text; formData.groupExperienceId = groupSelect.value; } else { formData.groupExperienceText = null; formData.groupExperienceId = null; } const comidaSelect = document.getElementById('widget-3vTL'); if (comidaSelect?.value) { formData.foodChoiceText = comidaSelect.options[comidaSelect.selectedIndex]?.text; formData.foodChoiceId = comidaSelect.value; } else { formData.foodChoiceText = null; formData.foodChoiceId = null; } formData.discountCode = document.getElementById('widget-3KPv')?.value || null; const abonoText = document.getElementById('summary-abono')?.textContent || '0'; formData.abonoAmount = parseInt(abonoText.replace(/\D/g,''), 10) || 0; formData.groupSize = parseInt(document.getElementById('widget-tZqh')?.value, 10) || 1; if (formData.groupSize === 1) { formData.allAdultsDrink = document.getElementById('widget-eheb')?.checked ?? null; formData.allOver16 = true; formData.adultsNoDrink = 0; formData.kidsUnder12 = 0; } else { formData.allAdultsDrink = document.getElementById('widget-qdCu')?.checked ?? null; if (formData.allAdultsDrink === false) { formData.allOver16 = document.getElementById('widget-r8jP')?.checked ?? null; formData.adultsNoDrink = parseInt(document.getElementById('widget-5Cc7')?.value, 10) || 0; formData.kidsUnder12 = parseInt(document.getElementById('widget-oKhU')?.value, 10) || 0; } else { formData.allOver16 = true; formData.adultsNoDrink = 0; formData.kidsUnder12 = 0; } } formData.comments = document.getElementById('widget-gfnx')?.value || null; formData.scheduledDate = document.getElementById('scheduling-date')?.value || null; formData.scheduledTime = document.getElementById('scheduling-time')?.value || null; formData.organizerName = document.getElementById('scheduling-name')?.value || null; formData.organizerEmail = document.getElementById('scheduling-email')?.value || null; } catch (error) { console.error("Error gathering form data:", error); return null; } console.log("Form Data Gathered for Submission:", formData); return formData; }

// --- Submit Main Reservation to Backend ---
async function submitReservation() { const submitButton = document.getElementById('submit-button'); const errorDiv = document.getElementById('submission-error'); if (!submitButton || !errorDiv) { console.error("Submit button or error display element not found."); return; } submitButton.disabled = true; submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Confirmando...'; hideError(errorDiv); const formData = gatherFormData(); if (!formData) { showError(errorDiv, "Error al recopilar datos del formulario."); submitButton.disabled = false; submitButton.textContent = 'Confirmar Reserva'; return; } const backendUrl = '/api/submit-reserva'; try { const response = await fetch(backendUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(formData), }); const result = await response.json(); if (response.ok) { console.log('Submission successful:', result); setText('final-summary-record-id', result.recordId || 'N/A'); goToStep('step-gr5a'); } else { console.error(`Submission failed (${response.status}):`, result); showError(errorDiv, result.message || `Error ${response.status}: Ocurrió un problema al guardar.`); submitButton.disabled = false; submitButton.textContent = 'Confirmar Reserva'; } } catch (error) { console.error('Network or fetch error:', error); showError(errorDiv, 'Error de red al guardar la reserva. Verifica tu conexión e inténtalo de nuevo.'); submitButton.disabled = false; submitButton.textContent = 'Confirmar Reserva'; } }

// --- Submit Date Request to Backend ---
async function submitDateRequest() { const submitButton = document.getElementById('submit-request-button'); const errorDiv = document.getElementById('request-submission-error'); const experienceSelect = document.getElementById('request-experience-type'); const dateInput = document.getElementById('request-date'); const timeInput = document.getElementById('request-time'); const nameInput = document.getElementById('request-contact-name'); const emailInput = document.getElementById('request-contact-email'); let isValid = true; hideError(errorDiv); [experienceSelect, dateInput, timeInput, nameInput, emailInput].forEach(input => { if (!input?.value) { input?.classList.add('is-invalid'); isValid = false; } else { input?.classList.remove('is-invalid'); } }); if (!isValid) { showError(errorDiv, "Por favor completa todos los campos requeridos."); return; } submitButton.disabled = true; submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...'; const requestData = { experienceTypeId: experienceSelect.value, experienceTypeName: experienceSelect.options[experienceSelect.selectedIndex]?.text, requestedDate: dateInput.value, requestedTime: timeInput.value, requesterName: nameInput.value, requesterEmail: emailInput.value }; console.log("Date Request Data:", requestData); const backendUrl = '/api/create-event'; try { const response = await fetch(backendUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(requestData), }); const result = await response.json(); if (response.ok) { console.log('Date request submission successful:', result); setText('confirm-request-email', requestData.requesterEmail); setText('confirm-request-details', `${requestData.experienceTypeName} - ${requestData.requestedDate} ${requestData.requestedTime}`); goToStep('step-request-confirm'); } else { console.error(`Date request submission failed (${response.status}):`, result); showError(errorDiv, result.message || `Error ${response.status}: Ocurrió un problema al enviar la solicitud.`); submitButton.disabled = false; submitButton.textContent = 'Enviar Solicitud de Fecha'; } } catch (error) { console.error('Network or fetch error during date request:', error); showError(errorDiv, 'Error de red al enviar la solicitud. Verifica tu conexión e inténtalo de nuevo.'); submitButton.disabled = false; submitButton.textContent = 'Enviar Solicitud de Fecha'; } }


// --- Document Ready - Initial Setup & Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    showStep(currentStepId);

    // --- Initialize Flatpickr ---
    const dateInputFlatpickr = document.getElementById('request-date');
    if (dateInputFlatpickr) {
        try {
            flatpickr(dateInputFlatpickr, { altInput: true, altFormat: "j F, Y", dateFormat: "Y-m-d", minDate: new Date().fp_incr(10), locale: "es", disable: [ function(date) { const day = date.getDay(); return (day >= 1 && day <= 4); } ], });
            console.log("Flatpickr initialized for #request-date");
        } catch(err) { console.error("Error initializing Flatpickr:", err); }
    } else { console.warn("Date input #request-date not found for Flatpickr."); }

    // --- Populate Dropdowns ---
    console.log("Initiating dropdown population...");
    populateDropdown('widget-oY8v', 'experiences', 'Grupal');
    populateDropdown('widget-3vTL', 'food');
    populateRequestExperienceTypes();

    // --- Add Event Listeners ---
    console.log("Adding event listeners...");
    try { // Wrap listener setup
        const addSafeListener = (id, event, handler) => { const element = document.getElementById(id); if (element) { element.addEventListener(event, handler); } else { console.warn(`Element with ID ${id} not found for event listener.`); } };

        // Step q1GJ Buttons
        addSafeListener('btn-request-other-date', 'click', () => goToStep('step-request-start'));
        addSafeListener('btn-agenda-exclusiva', 'click', () => { goToStep('subform-scheduling'); setText('scheduling-title','Agendar Experiencia Exclusiva'); });
        addSafeListener('btn-q1gj-continue', 'click', () => goToStep('step-bSoz'));
        // Step request-start Buttons
        addSafeListener('btn-request-cancel', 'click', () => goToStep('step-q1GJ'));
        addSafeListener('btn-request-select-datetime', 'click', () => { const expType = document.getElementById('request-experience-type'); if (expType && !expType.value) { expType.classList.add('is-invalid'); alert('Por favor selecciona un tipo de experiencia.'); } else { expType?.classList.remove('is-invalid'); goToStep('step-request-select-datetime'); } });
        // Step request-select-datetime Buttons
        addSafeListener('btn-request-datetime-back', 'click', goBack);
        addSafeListener('submit-request-button', 'click', submitDateRequest);
         // Step request-confirm Buttons
        addSafeListener('btn-request-confirm-home', 'click', () => goToStep('step-q1GJ'));
        // Step bSoz Buttons
        addSafeListener('btn-aZoD-add', 'click', () => goToStep('subform-group-config'));
        addSafeListener('btn-aZoD-edit', 'click', () => goToStep('subform-group-config'));
        addSafeListener('btn-bsoz-back', 'click', goBack);
        addSafeListener('btn-bsoz-continue', 'click', () => goToStep('step-2sff'));
        // Step 2sff Buttons
        addSafeListener('btn-2sff-back', 'click', goBack);
        addSafeListener('btn-2sff-continue', 'click', () => goToStep('step-qf5J'));
        // Step qf5j Buttons
        addSafeListener('btn-qf5j-back', 'click', goBack);
        addSafeListener('btn-qf5j-continue', 'click', () => goToStep('step-checkout-placeholder'));
        // Step checkout Buttons
        addSafeListener('btn-checkout-back', 'click', goBack);
        addSafeListener('submit-button', 'click', submitReservation);
        // Step gr5a Buttons
        addSafeListener('btn-gr5a-new-booking', 'click', () => window.location.reload());
        // Subform Group Config Buttons
        addSafeListener('btn-group-config-cancel', 'click', goBack);
        addSafeListener('btn-group-config-save', 'click', () => { setText('subform-aZoD-status', 'Sí'); document.getElementById('btn-aZoD-add')?.classList.add('d-none'); document.getElementById('btn-aZoD-edit')?.classList.remove('d-none'); goBack(); updateSummary(); });
        // Subform Scheduling Buttons
        addSafeListener('btn-scheduling-cancel', 'click', goBack);
        addSafeListener('btn-scheduling-confirm', 'click', () => { setText('subform-3duJ-status','Sí'); goBack(); updateSummary(); });

        // --- Other Element Listeners ---
        const exclusiveSwitch = document.getElementById('widget-grSj'); if (exclusiveSwitch) { exclusiveSwitch.addEventListener('change', () => { checkLunchParagraphs(); updateSummary(); }); }
        const groupSizeInput = document.getElementById('widget-tZqh'); if (groupSizeInput) { groupSizeInput.addEventListener('input', () => { handleGroupSizeChange(); updateSummary(); }); }
        const allAdultsCheckbox = document.getElementById('widget-qdCu'); if (allAdultsCheckbox) { allAdultsCheckbox.addEventListener('change', handleGroupRestrictionChange); }
        const groupSelect = document.getElementById('widget-oY8v'); if (groupSelect) groupSelect.addEventListener('change', updateSummary);
        const foodSelect = document.getElementById('widget-3vTL'); if (foodSelect) foodSelect.addEventListener('change', updateSummary);
        const discountInput = document.getElementById('widget-3KPv'); if (discountInput) discountInput.addEventListener('input', updateSummary);
        const scheduleDateInput = document.getElementById('scheduling-date'); if(scheduleDateInput) scheduleDateInput.addEventListener('change', updateSummary);
        const scheduleTimeInput = document.getElementById('scheduling-time'); if(scheduleTimeInput) scheduleTimeInput.addEventListener('change', updateSummary);

    } catch(err) { console.error("Error setting up event listeners:", err); }

    // --- Initial State Checks ---
    console.log("Running initial state checks...");
    try {
        checkLunchParagraphs(); handleGroupSizeChange(); handleGroupRestrictionChange(); updateSummary();
    } catch (err) { console.error("Error running initial checks:", err); }
    console.log("Initialization complete.");

}); // End DOMContentLoaded listener