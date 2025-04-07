// public/js/script.js
// Uses Select2 for advanced dropdowns, includes time bubbles and end time calculation.
// Last Updated: Monday, April 7, 2025 at 4:01:42 PM -04 Chile Time

let currentStepId = 'step-q1GJ';
let historyStack = ['step-q1GJ'];
let selectedExperienceData = null; // Store full data of selected experience type for duration calculation

// --- Helper Functions ---
function setText(elementId, text) { const element = document.getElementById(elementId); if (element) { element.textContent = text !== null && text !== undefined ? text : ''; } }
function showError(errorElement, message) { if (errorElement) { errorElement.textContent = message; errorElement.classList.remove('d-none'); } else { console.error("Error display element not found. Message:", message); alert(message); } }
function hideError(errorElement) { if (errorElement) { errorElement.classList.add('d-none'); errorElement.textContent = ''; } }
function debounce(func, delay) { let timeout; return function (...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; }

// --- Time Calculation Helper ---
function calculateEndTime(startTimeHHMM, durationMinutes) {
    if (!startTimeHHMM || durationMinutes === undefined || durationMinutes === null || isNaN(parseInt(durationMinutes))) {
        return "--:--";
    }
    try {
        const durationNum = parseInt(durationMinutes, 10);
        const [startHour, startMinute] = startTimeHHMM.split(':').map(Number);

        const startDate = new Date(); // Use today's date just for calculation
        startDate.setHours(startHour, startMinute, 0, 0); // Set start time

        const endDate = new Date(startDate.getTime() + durationNum * 60000); // Add duration in milliseconds

        const endHour = endDate.getHours().toString().padStart(2, '0');
        const endMinute = endDate.getMinutes().toString().padStart(2, '0');
        return `${endHour}:${endMinute}`;
    } catch (e) {
        console.error("Error calculating end time:", e);
        return "--:--";
    }
}

// --- Navigation & UI Logic ---
function showStep(stepId) { document.querySelectorAll('.form-step').forEach(step => { step.classList.add('d-none'); }); const targetStep = document.getElementById(stepId); if (targetStep) { targetStep.classList.remove('d-none'); currentStepId = stepId; window.scrollTo(0, 0); } else { console.error(`Step with ID ${stepId} not found.`); document.getElementById('step-q1GJ')?.classList.remove('d-none'); currentStepId = 'step-q1GJ'; } }
function goToStep(stepId) { if (stepId !== currentStepId) { historyStack.push(stepId); showStep(stepId); updateSummary(); } }
function goBack() { if (historyStack.length > 1) { historyStack.pop(); const previousStepId = historyStack[historyStack.length - 1]; showStep(previousStepId); updateSummary(); } }
function checkLunchParagraphs() { /* ... remains same ... */ }
function handleGroupSizeChange() { /* ... remains same ... */ }
function handleGroupRestrictionChange() { /* ... remains same ... */ }

// --- Summary Update Function (Modified for Select2) ---
function updateSummary() {
    try {
        const isExclusive = document.getElementById('widget-grSj')?.checked;
        let experienceText = 'No seleccionada';
        let experienceId = null;
        if (isExclusive) {
            experienceText = 'Exclusiva (Detalle pendiente agendamiento)';
        } else {
             // Get data from Select2
             const groupSelectData = $('#widget-oY8v').select2('data'); // Requires jQuery
             if (groupSelectData && groupSelectData.length > 0 && groupSelectData[0].id) {
                 experienceText = groupSelectData[0].text; // Use the primary display text
                 experienceId = groupSelectData[0].id;
             } else { experienceText = 'Grupal (Pendiente selección)'; }
        }
        setText('summary-experiencia', experienceText);

        const groupSize = parseInt(document.getElementById('widget-tZqh')?.value, 10) || 1;
        setText('summary-tamano', `${groupSize} persona(s)`);

        const foodSelectData = $('#widget-3vTL').select2('data'); // Requires jQuery
        let comidaText = 'No';
        let foodId = null;
        if (foodSelectData && foodSelectData.length > 0 && foodSelectData[0].id) {
            comidaText = foodSelectData[0].text;
            foodId = foodSelectData[0].id;
        }
        setText('summary-comida', comidaText);

        const scheduleDate = document.getElementById('scheduling-date')?.value;
        const scheduleTime = document.getElementById('scheduling-time')?.value; // Note: main scheduling time, not request time
        setText('summary-fecha', scheduleDate && scheduleTime ? `${scheduleDate} ${scheduleTime}` : 'Pendiente agendamiento');

        // TODO: Implement accurate pricing logic
        const basePricePerPerson = 50000; const foodPrice = foodId ? 15000 : 0;
        const discountCode = document.getElementById('widget-3KPv')?.value;
        const discount = discountCode === 'DESC10' ? 5000 * groupSize : 0;
        const totalPrice = (basePricePerPerson + foodPrice) * groupSize - discount;
        const abonoPerPerson = 25000; const totalAbono = abonoPerPerson * groupSize;

        setText('summary-precio-total', totalPrice >= 0 ? totalPrice.toLocaleString('es-CL') : '0');
        setText('summary-descuento', discount.toLocaleString('es-CL'));
        setText('summary-abono', totalAbono.toLocaleString('es-CL'));
        setText('checkout-abono-amount', totalAbono.toLocaleString('es-CL'));

        setText('final-summary-experiencia', experienceText);
        setText('final-summary-fecha', scheduleDate && scheduleTime ? `${scheduleDate} ${scheduleTime}` : 'Pendiente');
        setText('final-summary-grupo', `${groupSize} persona(s)`);
        setText('final-summary-abono', totalAbono.toLocaleString('es-CL'));

    } catch (e) { console.error("Error updating summary:", e); }
}

// --- Data Gathering Functions ---
function gatherFormData() { // For Main Reservation Submission
    const formData = {};
    try {
        formData.experienceType = document.getElementById('widget-grSj')?.checked ? 'Exclusiva' : 'Grupal';
        // Get value (ID) from Select2
        formData.groupExperienceId = $('#widget-oY8v').val() || null; // Requires jQuery
        formData.foodChoiceId = $('#widget-3vTL').val() || null; // Requires jQuery

        // Get text descriptions (optional, could look up later based on ID if needed)
        formData.groupExperienceText = formData.groupExperienceId ? $('#widget-oY8v').select2('data')[0]?.text : null;
        formData.foodChoiceText = formData.foodChoiceId ? $('#widget-3vTL').select2('data')[0]?.text : null;

        formData.discountCode = document.getElementById('widget-3KPv')?.value || null;
        const abonoText = document.getElementById('summary-abono')?.textContent || '0';
        formData.abonoAmount = parseInt(abonoText.replace(/\D/g,''), 10) || 0;
        formData.groupSize = parseInt(document.getElementById('widget-tZqh')?.value, 10) || 1;
        // Group condition logic remains the same...
        if (formData.groupSize === 1) { /*...*/ } else { /*...*/ }
        formData.comments = document.getElementById('widget-gfnx')?.value || null;
        // Get data from the *exclusive* scheduling subform if used, otherwise null
        formData.scheduledDate = document.getElementById('scheduling-date')?.value || null;
        formData.scheduledTime = document.getElementById('scheduling-time')?.value || null;
        formData.organizerName = document.getElementById('scheduling-name')?.value || null;
        formData.organizerEmail = document.getElementById('scheduling-email')?.value || null;

    } catch (error) { console.error("Error gathering form data:", error); return null; }
    console.log("Form Data Gathered for Submission:", formData);
    return formData;
}

// --- Submission Functions ---
async function submitReservation() { /* ... remains largely the same, calls gatherFormData ... */ }

// Modified to get selected time from hidden input and remove name/email
async function submitDateRequest() {
    const submitButton = document.getElementById('submit-request-button');
    const errorDiv = document.getElementById('request-submission-error');
    const experienceSelect = document.getElementById('request-experience-type');
    const dateInput = document.getElementById('request-date');
    const timeSelectedInput = document.getElementById('request-time-selected'); // Use hidden input

    let isValid = true;
    hideError(errorDiv);
    // Validate required fields
    [experienceSelect, dateInput, timeSelectedInput].forEach(input => {
        if (!input?.value) {
             // Highlight label or container for time bubbles maybe?
             if(input?.id === 'request-time-selected') {
                 document.getElementById('time-bubbles-container')?.classList.add('is-invalid-group'); // Example class
             } else {
                input?.classList.add('is-invalid');
             }
             isValid = false;
        } else {
             if(input?.id === 'request-time-selected') {
                 document.getElementById('time-bubbles-container')?.classList.remove('is-invalid-group');
             } else {
                 input?.classList.remove('is-invalid');
             }
        }
    });

    if (!isValid) { showError(errorDiv, "Por favor selecciona tipo, fecha y hora."); return; }

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';

    // Retrieve full selected data for experience type to get name
    const selectedExpData = $('#request-experience-type').select2('data')[0];

    const requestData = {
        experienceTypeId: experienceSelect.value,
        experienceTypeName: selectedExpData ? selectedExpData.text : 'N/A', // Get name from Select2 data
        requestedDate: dateInput.value,
        requestedTime: timeSelectedInput.value, // Get time from hidden input
        // Removed requesterName and requesterEmail
    };
    console.log("Date Request Data:", requestData);
    const backendUrl = '/api/create-event';
    try {
        const response = await fetch(backendUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(requestData), });
        const result = await response.json();
        if (response.ok) {
            console.log('Date request submission successful:', result);
            // Update confirmation step (email part removed)
            setText('confirm-request-email', 'tu email (no solicitado en formulario)'); // Placeholder text
            setText('confirm-request-details', `${requestData.experienceTypeName} - ${requestData.requestedDate} ${requestData.requestedTime}`);
            goToStep('step-request-confirm');
        } else { /* ... error handling ... */ showError(errorDiv, result.message || `Error ${response.status}`); submitButton.disabled = false; submitButton.textContent = 'Enviar Solicitud de Fecha'; }
    } catch (error) { /* ... error handling ... */ showError(errorDiv, 'Error de red'); submitButton.disabled = false; submitButton.textContent = 'Enviar Solicitud de Fecha'; }
}


// --- Document Ready - Initial Setup & Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    showStep(currentStepId);

    // --- Initialize Flatpickr ---
    const dateInputFlatpickr = document.getElementById('request-date');
    if (dateInputFlatpickr) { try { flatpickr(dateInputFlatpickr, { /* ... options ... */ }); console.log("Flatpickr initialized..."); } catch(err) { console.error("Error initializing Flatpickr:", err); } } else { console.warn("Date input #request-date not found..."); }

    // --- Initialize Select2 Dropdowns ---
    console.log("Initiating Select2 dropdown population...");
    try {
        // Helper function for formatting Select2 options
        const formatOption = (data) => {
            if (!data.id) { return data.text; } // Placeholder

            let detailsHtml = '';
            // Format for Scheduled Events (#widget-oY8v)
            if (data['Fecha'] && data['Hora Inicio']) {
                const dateFormatted = data['Fecha']; // Assuming YYYY-MM-DD
                const startTime = data['Hora Inicio'] || '';
                const endTime = data['Hora Término'] || '';
                const timeString = endTime ? `${startTime} - ${endTime}` : startTime;
                const desc = data['Descripción'];
                const descShort = (desc && typeof desc === 'string') ? (desc.substring(0, 70) + (desc.length > 70 ? '...' : '')) : '';
                detailsHtml = `
                    <small class="d-block text-muted">${dateFormatted} | ${timeString}</small>
                    <small class="d-block text-muted">${descShort}</small>
                `;
            }
            // Format for Experience Types (#request-experience-type)
            else if (data['Duración'] || data['Precio'] || data['Descripción']) {
                 const duration = data['Duración'];
                 const price = data['Precio'];
                 const desc = data['Descripción'];
                 const priceFormatted = (price !== null && price !== undefined) ? `$${Number(price).toLocaleString('es-CL')}` : '';
                 const durationText = duration ? `${duration} min` : '';
                 const descShort = (desc && typeof desc === 'string') ? (desc.substring(0, 50) + (desc.length > 50 ? '...' : '')) : '';
                 let detailsLine = [durationText, priceFormatted].filter(Boolean).join(' | '); // Join Duration | Price
                 detailsHtml = `
                    <small class="d-block text-muted">${detailsLine}</small>
                    <small class="d-block text-muted">${descShort}</small>
                 `;
            }
            // Format for Food (#widget-3vTL) - currently no details fetched
            else {
                 // detailsHtml = `<small class="d-block text-muted">ID: ${data.id}</small>`;
            }

            // Use jQuery to build the element (Select2 expects jQuery object or HTML string)
             return $(`<div><strong>${data.text}</strong>${detailsHtml}</div>`);
        };

        // Initialize Main Scheduled Events Dropdown
        $('#widget-oY8v').select2({
            theme: "bootstrap-5",
            placeholder: 'Selecciona evento...',
            allowClear: true,
            ajax: {
                url: '/api/get-options',
                dataType: 'json',
                delay: 250, // wait 250ms before firing request
                data: function (params) {
                    return {
                        tableType: 'scheduled_events',
                        filterValue: 'Grupal', // Hardcoded filter
                        searchTerm: params.term // search term for potential future backend search
                    };
                },
                processResults: function (data) { // Adapt API response to Select2 format
                    return {
                        results: data.results // The backend now returns { results: [...] }
                    };
                },
                cache: true
            },
            templateResult: formatOption, // How options look in the dropdown
            templateSelection: function(data) { return data.text; }, // How selected item looks
            escapeMarkup: function(markup) { return markup; } // Allow HTML in templates
        }).on('change', updateSummary); // Update summary when selection changes

        // Initialize Food Options Dropdown
         $('#widget-3vTL').select2({
            theme: "bootstrap-5",
            placeholder: 'Selecciona comida...',
            allowClear: true,
             ajax: {
                url: '/api/get-options',
                dataType: 'json',
                delay: 250,
                data: function (params) {
                    return { tableType: 'food' };
                },
                processResults: function (data) { return { results: data.results }; },
                cache: true
            },
            templateResult: formatOption, // Use same basic formatter
            templateSelection: function(data) { return data.text; },
            escapeMarkup: function(markup) { return markup; }
        }).on('change', updateSummary);

        // Initialize Experience Type Dropdown for Requesting Date
        $('#request-experience-type').select2({
            theme: "bootstrap-5",
            placeholder: 'Selecciona tipo de experiencia...',
            // allowClear: true, // Maybe not needed here?
             ajax: {
                url: '/api/get-options',
                dataType: 'json',
                delay: 250,
                data: function (params) {
                    return {
                        tableType: 'experience_types',
                        filterValue: 'Grupal' // Only show Grupal types
                    };
                },
                processResults: function (data) { return { results: data.results }; },
                cache: true
            },
            templateResult: formatOption, // Uses the detailed formatter
            templateSelection: function(data) { return data.text; }, // Show only name when selected
            escapeMarkup: function(markup) { return markup; }
        }).on('select2:select', function(e) {
             // Store the full selected data object when an experience type is chosen
             selectedExperienceData = e.params.data;
             console.log("Selected Experience Type Data:", selectedExperienceData);
             // Trigger end time calculation if a start time is already selected
             const selectedStartTime = document.getElementById('request-time-selected')?.value;
             if (selectedStartTime && selectedExperienceData?.['Duración']) {
                const endTime = calculateEndTime(selectedStartTime, selectedExperienceData['Duración']);
                setText('calculated-end-time', endTime);
             } else {
                 setText('calculated-end-time', '--:--'); // Reset if no duration
             }
             updateSummary(); // Also update main summary if needed
        });


    } catch(err) { console.error("Error initializing Select2:", err); }


    // --- Add Event Listeners ---
    console.log("Adding event listeners...");
    try {
        const addSafeListener = (id, event, handler) => { /* ... */ }; // Keep helper

        // --- Time Bubble Logic ---
        const timeBubbleContainer = document.getElementById('time-bubbles-container');
        const hiddenTimeInput = document.getElementById('request-time-selected');
        if (timeBubbleContainer && hiddenTimeInput) {
            timeBubbleContainer.addEventListener('click', (event) => {
                if (event.target.classList.contains('time-bubble')) {
                    const selectedTime = event.target.dataset.time; // Get time from data-time attribute

                    // Update UI: remove active class from all, add to clicked
                    timeBubbleContainer.querySelectorAll('.time-bubble').forEach(btn => {
                        btn.classList.remove('active', 'btn-primary'); // Use active state, maybe style change
                        btn.classList.add('btn-outline-primary');
                    });
                    event.target.classList.add('active', 'btn-primary');
                    event.target.classList.remove('btn-outline-primary');

                    // Store value
                    hiddenTimeInput.value = selectedTime;
                    console.log("Selected Time:", selectedTime);
                    timeBubbleContainer.classList.remove('is-invalid-group'); // Remove validation error visual if present

                    // --- Calculate and Display End Time ---
                    if (selectedExperienceData?.['Duración']) {
                         const duration = selectedExperienceData['Duración'];
                         const endTime = calculateEndTime(selectedTime, duration);
                         setText('calculated-end-time', endTime);
                    } else {
                        console.warn("Cannot calculate end time: Experience type or duration not selected/available.");
                        setText('calculated-end-time', '--:--');
                    }
                     updateSummary(); // Update summary if needed
                }
            });
        } else { console.warn("Time bubble container or hidden input not found."); }

        // --- Other Button/Input Listeners ---
        // (Add listeners using addSafeListener as before)
        // ...
        addSafeListener('submit-request-button', 'click', submitDateRequest);
        addSafeListener('submit-button', 'click', submitReservation);
        // ... Add ALL OTHER listeners from previous script...

         // Link in rules text
        addSafeListener('link-solicitar-exclusiva', 'click', (event) => {
            event.preventDefault();
            const exclusiveSwitch = document.getElementById('widget-grSj');
            if (exclusiveSwitch) {
                exclusiveSwitch.checked = true;
                exclusiveSwitch.dispatchEvent(new Event('change')); // Trigger listener
            }
            goToStep('step-q1GJ');
        });

        // Input listeners for summary updates etc.
        const exclusiveSwitch = document.getElementById('widget-grSj'); if (exclusiveSwitch) { exclusiveSwitch.addEventListener('change', () => { checkLunchParagraphs(); updateSummary(); }); }
        const groupSizeInput = document.getElementById('widget-tZqh'); if (groupSizeInput) { groupSizeInput.addEventListener('input', debounce(() => { handleGroupSizeChange(); updateSummary(); }, 300)); }
        const allAdultsCheckbox = document.getElementById('widget-qdCu'); if (allAdultsCheckbox) { allAdultsCheckbox.addEventListener('change', handleGroupRestrictionChange); }
        // Note: Select2 change events added during initialization above
        // const groupSelect = document.getElementById('widget-oY8v'); if (groupSelect) groupSelect.addEventListener('change', updateSummary); // Covered by Select2 init
        // const foodSelect = document.getElementById('widget-3vTL'); if (foodSelect) foodSelect.addEventListener('change', updateSummary); // Covered by Select2 init
        const discountInput = document.getElementById('widget-3KPv'); if (discountInput) discountInput.addEventListener('input', updateSummary);
        const scheduleDateInput = document.getElementById('scheduling-date'); if(scheduleDateInput) scheduleDateInput.addEventListener('change', updateSummary);
        const scheduleTimeInput = document.getElementById('scheduling-time'); if(scheduleTimeInput) scheduleTimeInput.addEventListener('change', updateSummary);
        const requestDateFlatpickr = document.getElementById('request-date'); // Flatpickr triggers 'change' on its hidden input
        if(requestDateFlatpickr) requestDateFlatpickr._flatpickr.config.onChange.push(updateSummary); // Hook into flatpickr change if needed


    } catch(err) { console.error("Error setting up event listeners:", err); }

    // --- Initial State Checks ---
    console.log("Running initial state checks...");
    try {
        checkLunchParagraphs(); handleGroupSizeChange(); handleGroupRestrictionChange(); updateSummary();
    } catch (err) { console.error("Error running initial checks:", err); }
    console.log("Initialization complete.");

}); // End DOMContentLoaded listener