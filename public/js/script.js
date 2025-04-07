// public/js/script.js
// Handles form navigation, conditional logic, Select2 dropdowns, Flatpickr,
// time bubbles, end time calculation, summary updates, and submissions. Uses jQuery for Select2.
// Last Updated: Monday, April 7, 2025 at 6:31:00 PM -04 Chile Time

// Wait for DOM and jQuery to be ready
$(function() {
    console.log("DOM ready (jQuery)");

    let currentStepId = 'step-q1GJ';
    let historyStack = ['step-q1GJ'];
    let selectedExperienceTypeData = null; // Store full data of selected experience type for duration calculation

    // --- Helper Functions ---
    function setText(elementId, text) { const element = document.getElementById(elementId); if (element) { element.textContent = text !== null && text !== undefined ? text : ''; } }
    function showError(errorElement, message) { if (errorElement) { errorElement.textContent = message; errorElement.classList.remove('d-none'); } else { console.error("Error display element not found. Message:", message); alert(message); } }
    function hideError(errorElement) { if (errorElement) { errorElement.classList.add('d-none'); errorElement.textContent = ''; } }
    function debounce(func, delay) { let timeout; return function (...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; }

    // --- Time Calculation Helper ---
    function calculateEndTime(startTimeHHMM, durationMinutes) {
        if (!startTimeHHMM || durationMinutes === undefined || durationMinutes === null || isNaN(parseInt(durationMinutes))) { return "--:--"; }
        try {
            const durationNum = parseInt(durationMinutes, 10);
            const [startHour, startMinute] = startTimeHHMM.split(':').map(Number);
            if (isNaN(startHour) || isNaN(startMinute)) return "--:--";

            const startDate = new Date(); // Use temp date
            startDate.setHours(startHour, startMinute, 0, 0);
            const endDate = new Date(startDate.getTime() + durationNum * 60000); // Add duration in ms

            const endHour = endDate.getHours().toString().padStart(2, '0');
            const endMinute = endDate.getMinutes().toString().padStart(2, '0');
            return `${endHour}:${endMinute}`;
        } catch (e) { console.error("Error calculating end time:", e); return "--:--"; }
    }

    // --- Navigation Logic ---
    window.showStep = function(stepId) { // Make globally accessible if needed, or keep local
        console.log("Showing step:", stepId);
        document.querySelectorAll('.form-step').forEach(step => { step.classList.add('d-none'); });
        const targetStep = document.getElementById(stepId);
        if (targetStep) { targetStep.classList.remove('d-none'); currentStepId = stepId; window.scrollTo(0, 0); }
        else { console.error(`Step with ID ${stepId} not found.`); document.getElementById('step-q1GJ')?.classList.remove('d-none'); currentStepId = 'step-q1GJ'; }
    }
    window.goToStep = function(stepId) { if (stepId !== currentStepId) { historyStack.push(stepId); showStep(stepId); updateSummary(); } }
    window.goBack = function() { if (historyStack.length > 1) { historyStack.pop(); const previousStepId = historyStack[historyStack.length - 1]; showStep(previousStepId); updateSummary(); } }

    // --- Conditional Logic Handlers ---
    function checkLunchParagraphs() { const exclusiveSwitch = document.getElementById('widget-grSj'); const paraNRxz = document.getElementById('widget-nRxz'); const paraKJ8C = document.getElementById('widget-kJ8C'); const para5A7s = document.getElementById('widget-5A7s'); const isExclusive = exclusiveSwitch ? exclusiveSwitch.checked : false; const is150mExclusive = isExclusive; if(paraNRxz) paraNRxz.classList.toggle('d-none', isExclusive); if(paraKJ8C) paraKJ8C.classList.toggle('d-none', !isExclusive); if(para5A7s) para5A7s.classList.toggle('d-none', !is150mExclusive); }
    function handleGroupSizeChange() { const groupSizeInput = document.getElementById('widget-tZqh'); const groupDetailsSection = document.getElementById('group-details-section'); const singleAttendeeSection = document.getElementById('single-attendee-section'); const groupMembersSection = document.getElementById('group-members-section'); const allAdultsCheckbox = document.getElementById('widget-qdCu'); const ehebCheckbox = document.getElementById('widget-eheb'); const size = parseInt(groupSizeInput?.value, 10) || 0; const isGroup = size > 1; groupDetailsSection?.classList.toggle('d-none', !isGroup); singleAttendeeSection?.classList.toggle('d-none', isGroup); groupMembersSection?.classList.toggle('d-none', !isGroup); if (ehebCheckbox) ehebCheckbox.required = !isGroup; if (!isGroup && allAdultsCheckbox) { allAdultsCheckbox.checked = true; handleGroupRestrictionChange(); } }
    function handleGroupRestrictionChange() { const allAdultsCheckbox = document.getElementById('widget-qdCu'); const groupRestrictionsSection = document.getElementById('group-restrictions-section'); const underageContainer = document.getElementById('widget-oKhU-container'); const underageInput = document.getElementById('widget-oKhU'); const allAdults = allAdultsCheckbox ? allAdultsCheckbox.checked : true; groupRestrictionsSection?.classList.toggle('d-none', allAdults); const isExclusive = document.getElementById('widget-grSj')?.checked; if (underageContainer) { underageContainer.classList.toggle('d-none', !isExclusive); if (underageInput) { underageInput.disabled = !isExclusive || allAdults; if(underageInput.disabled) underageInput.value = 0; } } }

    // --- Summary Update Function ---
    window.updateSummary = function() { try { const isExclusive = document.getElementById('widget-grSj')?.checked; let experienceText = 'No seleccionada'; let experienceId = null; if (isExclusive) { experienceText = 'Exclusiva (Detalle pendiente agendamiento)'; } else { const groupSelectData = $('#widget-oY8v').select2('data'); if (groupSelectData && groupSelectData.length > 0 && groupSelectData[0].id) { experienceText = groupSelectData[0].text; experienceId = groupSelectData[0].id; } else { experienceText = 'Grupal (Pendiente selección)'; } } setText('summary-experiencia', experienceText); const groupSize = parseInt(document.getElementById('widget-tZqh')?.value, 10) || 1; setText('summary-tamano', `${groupSize} persona(s)`); const foodSelectData = $('#widget-3vTL').select2('data'); let comidaText = 'No'; let foodId = null; if (foodSelectData && foodSelectData.length > 0 && foodSelectData[0].id) { comidaText = foodSelectData[0].text; foodId = foodSelectData[0].id; } setText('summary-comida', comidaText); const scheduleDate = document.getElementById('scheduling-date')?.value; const scheduleTime = document.getElementById('scheduling-time')?.value; setText('summary-fecha', scheduleDate && scheduleTime ? `${scheduleDate} ${scheduleTime}` : 'Pendiente agendamiento'); const basePricePerPerson = 50000; const foodPrice = foodId ? 15000 : 0; const discountCode = document.getElementById('widget-3KPv')?.value; const discount = discountCode === 'DESC10' ? 5000 * groupSize : 0; const totalPrice = (basePricePerPerson + foodPrice) * groupSize - discount; const abonoPerPerson = 25000; const totalAbono = abonoPerPerson * groupSize; setText('summary-precio-total', totalPrice >= 0 ? totalPrice.toLocaleString('es-CL') : '0'); setText('summary-descuento', discount.toLocaleString('es-CL')); setText('summary-abono', totalAbono.toLocaleString('es-CL')); setText('checkout-abono-amount', totalAbono.toLocaleString('es-CL')); setText('final-summary-experiencia', experienceText); setText('final-summary-fecha', scheduleDate && scheduleTime ? `${scheduleDate} ${scheduleTime}` : 'Pendiente'); setText('final-summary-grupo', `${groupSize} persona(s)`); setText('final-summary-abono', totalAbono.toLocaleString('es-CL')); } catch (e) { console.error("Error updating summary:", e); } }

    // --- Data Gathering Functions ---
    function gatherFormData() { const formData = {}; try { formData.experienceType = document.getElementById('widget-grSj')?.checked ? 'Exclusiva' : 'Grupal'; formData.groupExperienceId = $('#widget-oY8v').val() || null; formData.foodChoiceId = $('#widget-3vTL').val() || null; const groupSelectData = $('#widget-oY8v').select2('data'); formData.groupExperienceText = (groupSelectData && groupSelectData.length > 0) ? groupSelectData[0].text : null; const foodSelectData = $('#widget-3vTL').select2('data'); formData.foodChoiceText = (foodSelectData && foodSelectData.length > 0) ? foodSelectData[0].text : null; formData.discountCode = document.getElementById('widget-3KPv')?.value || null; const abonoText = document.getElementById('summary-abono')?.textContent || '0'; formData.abonoAmount = parseInt(abonoText.replace(/\D/g,''), 10) || 0; formData.groupSize = parseInt(document.getElementById('widget-tZqh')?.value, 10) || 1; if (formData.groupSize === 1) { formData.allAdultsDrink = document.getElementById('widget-eheb')?.checked ?? null; formData.allOver16 = true; formData.adultsNoDrink = 0; formData.kidsUnder12 = 0; } else { formData.allAdultsDrink = document.getElementById('widget-qdCu')?.checked ?? null; if (formData.allAdultsDrink === false) { formData.allOver16 = document.getElementById('widget-r8jP')?.checked ?? null; formData.adultsNoDrink = parseInt(document.getElementById('widget-5Cc7')?.value, 10) || 0; formData.kidsUnder12 = parseInt(document.getElementById('widget-oKhU')?.value, 10) || 0; } else { formData.allOver16 = true; formData.adultsNoDrink = 0; formData.kidsUnder12 = 0; } } formData.comments = document.getElementById('widget-gfnx')?.value || null; formData.scheduledDate = document.getElementById('scheduling-date')?.value || null; formData.scheduledTime = document.getElementById('scheduling-time')?.value || null; formData.organizerName = document.getElementById('scheduling-name')?.value || null; formData.organizerEmail = document.getElementById('scheduling-email')?.value || null; } catch (error) { console.error("Error gathering form data:", error); return null; } console.log("Form Data Gathered for Submission:", formData); return formData; }

    // --- Submission Functions ---
    async function submitReservation() { const submitButton = document.getElementById('submit-button'); const errorDiv = document.getElementById('submission-error'); if (!submitButton || !errorDiv) { console.error("Submit button or error display element not found."); return; } submitButton.disabled = true; submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Confirmando...'; hideError(errorDiv); const formData = gatherFormData(); if (!formData) { showError(errorDiv, "Error al recopilar datos del formulario."); submitButton.disabled = false; submitButton.textContent = 'Confirmar Reserva'; return; } const backendUrl = '/api/submit-reserva'; try { const response = await fetch(backendUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(formData), }); const result = await response.json(); if (response.ok) { console.log('Submission successful:', result); setText('final-summary-record-id', result.recordId || 'N/A'); goToStep('step-gr5a'); } else { console.error(`Submission failed (${response.status}):`, result); showError(errorDiv, result.message || `Error ${response.status}: Ocurrió un problema al guardar.`); submitButton.disabled = false; submitButton.textContent = 'Confirmar Reserva'; } } catch (error) { console.error('Network or fetch error:', error); showError(errorDiv, 'Error de red al guardar la reserva. Verifica tu conexión e inténtalo de nuevo.'); submitButton.disabled = false; submitButton.textContent = 'Confirmar Reserva'; } }
    async function submitDateRequest() { const submitButton = document.getElementById('submit-request-button'); const errorDiv = document.getElementById('request-submission-error'); const experienceSelect = document.getElementById('request-experience-type'); const dateInput = document.getElementById('request-date'); const timeSelectedInput = document.getElementById('request-time-selected'); let isValid = true; hideError(errorDiv); [experienceSelect, dateInput, timeSelectedInput].forEach(input => { if (!input?.value) { if(input?.id === 'request-time-selected') { document.getElementById('time-bubbles-container')?.classList.add('is-invalid-group'); } else { input?.classList.add('is-invalid'); } isValid = false; } else { if(input?.id === 'request-time-selected') { document.getElementById('time-bubbles-container')?.classList.remove('is-invalid-group'); } else { input?.classList.remove('is-invalid'); } } }); if (!isValid) { showError(errorDiv, "Por favor selecciona tipo, fecha y hora."); return; } submitButton.disabled = true; submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...'; const selectedExpData = $('#request-experience-type').select2('data')[0]; const requestData = { experienceTypeId: experienceSelect.value, experienceTypeName: selectedExpData ? selectedExpData.text : 'N/A', requestedDate: dateInput.value, requestedTime: timeSelectedInput.value, }; console.log("Date Request Data:", requestData); const backendUrl = '/api/create-event'; try { const response = await fetch(backendUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(requestData), }); const result = await response.json(); if (response.ok) { console.log('Date request submission successful:', result); setText('confirm-request-email', ''); setText('confirm-request-details', `${requestData.experienceTypeName} - ${requestData.requestedDate} ${requestData.requestedTime}`); goToStep('step-request-confirm'); } else { console.error(`Date request submission failed (${response.status}):`, result); showError(errorDiv, result.message || `Error ${response.status}: Ocurrió un problema al enviar la solicitud.`); submitButton.disabled = false; submitButton.textContent = 'Enviar Solicitud de Fecha'; } } catch (error) { console.error('Network or fetch error during date request:', error); showError(errorDiv, 'Error de red al enviar la solicitud. Verifica tu conexión e inténtalo de nuevo.'); submitButton.disabled = false; submitButton.textContent = 'Enviar Solicitud de Fecha'; } }

    // --- Initialization Code ---
    console.log("DOM ready, initializing components...");
    showStep(currentStepId);

    // --- Initialize Flatpickr ---
    const dateInputFlatpickr = document.getElementById('request-date');
    if (dateInputFlatpickr) { try { flatpickr(dateInputFlatpickr, { altInput: true, altFormat: "j F, Y", dateFormat: "Y-m-d", minDate: new Date().fp_incr(10), locale: "es", disable: [ function(date) { const day = date.getDay(); return (day >= 1 && day <= 4); } ], }); console.log("Flatpickr initialized for #request-date"); } catch(err) { console.error("Error initializing Flatpickr:", err); } } else { console.warn("Date input #request-date not found for Flatpickr."); }

    // --- Initialize Select2 Dropdowns ---
    console.log("Initializing Select2 dropdowns...");
    try {
        // Helper function for formatting Select2 options
        const formatOption = (data) => {
            if (!data.id) { return data.text || "Buscando..."; } // Placeholder/Searching text

            let detailsHtml = '';
            // Format for Scheduled Events (#widget-oY8v) - uses field names from 'scheduled_events' config
            // Assumes backend sends: id, text (from Evento), Fecha, Hora Inicio, Hora Término, Descripción, Precio
            if (data['Fecha'] || data['Hora Inicio']) {
                const dateFormatted = data['Fecha'] || ''; // Assuming YYYY-MM-DD
                const startTime = data['Hora Inicio'] || '';
                const endTime = data['Hora Término'] || '';
                const timeString = startTime ? (endTime ? `${startTime} - ${endTime}` : startTime) : '';
                const desc = data['Descripción'];
                const price = data['Precio'];
                const priceFormatted = (price !== null && price !== undefined) ? `$${Number(price).toLocaleString('es-CL')}` : '';
                const descShort = (desc && typeof desc === 'string') ? (desc.substring(0, 70) + (desc.length > 70 ? '...' : '')) : '';

                let detailsLine1 = [dateFormatted, timeString].filter(Boolean).join(' | ');
                let detailsLine2 = [priceFormatted, descShort].filter(Boolean).join(' - ');

                detailsHtml = `
                    ${detailsLine1 ? '<small class="d-block text-muted">' + detailsLine1 + '</small>' : ''}
                    ${detailsLine2 ? '<small class="d-block text-muted">' + detailsLine2 + '</small>' : ''}
                `;
            }
            // Format for Experience Types (#request-experience-type) - uses field names from 'experience_types' config
            // Assumes backend sends: id, text (from Experiencia), Descripción, Precio, Duración
            else if (data['Duración'] || data['Precio'] || data['Descripción']) {
                 const duration = data['Duración'];
                 const price = data['Precio'];
                 const desc = data['Descripción'];
                 const priceFormatted = (price !== null && price !== undefined) ? `$${Number(price).toLocaleString('es-CL')}` : '';
                 const durationText = duration ? `${duration} min` : '';
                 const descShort = (desc && typeof desc === 'string') ? (desc.substring(0, 50) + (desc.length > 50 ? '...' : '')) : '';
                 let detailsLine1 = [durationText, priceFormatted].filter(Boolean).join(' | ');
                 detailsHtml = `
                    ${detailsLine1 ? '<small class="d-block text-muted">' + detailsLine1 + '</small>' : ''}
                    ${descShort ? '<small class="d-block text-muted">' + descShort + '</small>' : ''}
                 `;
            }
            // Basic format for others (like Food)
            else {
                 // No extra details currently fetched/displayed for food
            }

             // Use jQuery to return HTML required by Select2's escapeMarkup
             return $(`<div><strong>${data.text}</strong>${detailsHtml}</div>`);
        };

        // Initialize Main Scheduled Events Dropdown (#widget-oY8v)
        $('#widget-oY8v').select2({
            theme: "bootstrap-5",
            placeholder: 'Selecciona evento programado...',
            allowClear: true,
            ajax: {
                url: '/api/get-options', dataType: 'json', delay: 250,
                data: params => ({ tableType: 'scheduled_events', filterValue: 'Grupal', searchTerm: params.term }), // Pass search term if backend supports it
                processResults: data => ({ results: data.results || [] }) // Expect { results: [...] } from backend
            },
            templateResult: formatOption,
            templateSelection: data => data.text || 'Selecciona evento...', // Show only name when selected
            escapeMarkup: markup => markup // Allow HTML rendering
        }).on('change', updateSummary);

        // Initialize Food Options Dropdown (#widget-3vTL)
         $('#widget-3vTL').select2({
            theme: "bootstrap-5", placeholder: 'Selecciona comida (opcional)...', allowClear: true,
             ajax: {
                url: '/api/get-options', dataType: 'json', delay: 250,
                data: params => ({ tableType: 'food', searchTerm: params.term }),
                processResults: data => ({ results: data.results || [] })
            },
            templateResult: formatOption, // Uses basic formatter
            templateSelection: data => data.text || 'Selecciona comida...',
            escapeMarkup: markup => markup
        }).on('change', updateSummary);

        // Initialize Experience Type Dropdown for Requesting Date (#request-experience-type)
        $('#request-experience-type').select2({
            theme: "bootstrap-5", placeholder: 'Selecciona tipo de experiencia...',
             ajax: {
                url: '/api/get-options', dataType: 'json', delay: 250,
                data: params => ({ tableType: 'experience_types', filterValue: 'Grupal', searchTerm: params.term }),
                processResults: data => ({ results: data.results || [] })
            },
            templateResult: formatOption, // Uses detailed formatter
            templateSelection: data => data.text || 'Selecciona tipo...',
            escapeMarkup: markup => markup
        }).on('select2:select', function(e) {
             // Store the full selected data object when an experience type is chosen
             selectedExperienceData = e.params.data;
             console.log("Selected Experience Type Data:", selectedExperienceData);
             // Trigger end time calculation if a start time is already selected
             const selectedStartTime = document.getElementById('request-time-selected')?.value;
             const duration = selectedExperienceData?.['Duración']; // Access using bracket notation for safety
             if (selectedStartTime && duration !== undefined && duration !== null) {
                const endTime = calculateEndTime(selectedStartTime, duration);
                setText('calculated-end-time', endTime);
             } else { setText('calculated-end-time', '--:--'); }
             updateSummary(); // Update main summary if needed
        });

    } catch(err) { console.error("Error initializing Select2:", err); }


    // --- Add Event Listeners ---
    console.log("Adding event listeners...");
    try {
        const addSafeListener = (id, event, handler) => { const element = document.getElementById(id); if (element) { element.addEventListener(event, handler); } else { console.warn(`Element with ID ${id} not found for event listener.`); } };

        // Time Bubble Logic
        const timeBubbleContainer = document.getElementById('time-bubbles-container');
        const hiddenTimeInput = document.getElementById('request-time-selected');
        if (timeBubbleContainer && hiddenTimeInput) {
            timeBubbleContainer.addEventListener('click', (event) => {
                if (event.target.classList.contains('time-bubble')) {
                    const selectedTime = event.target.dataset.time;
                    timeBubbleContainer.querySelectorAll('.time-bubble').forEach(btn => { btn.classList.remove('active', 'btn-primary'); btn.classList.add('btn-outline-primary'); });
                    event.target.classList.add('active', 'btn-primary'); event.target.classList.remove('btn-outline-primary');
                    hiddenTimeInput.value = selectedTime;
                    console.log("Selected Time:", selectedTime);
                    timeBubbleContainer.classList.remove('is-invalid-group');
                    // Calculate End Time
                    const duration = selectedExperienceData?.['Duración']; // Use potentially stored data
                    if (duration !== undefined && duration !== null) { const endTime = calculateEndTime(selectedTime, duration); setText('calculated-end-time', endTime); }
                    else { setText('calculated-end-time', '--:--'); }
                    updateSummary();
                }
            });
        } else { console.warn("Time bubble container or hidden input not found."); }

        // Add ALL other listeners using addSafeListener...
        addSafeListener('btn-request-other-date', 'click', () => goToStep('step-request-start'));
        addSafeListener('btn-agenda-exclusiva', 'click', () => { goToStep('subform-scheduling'); setText('scheduling-title','Agendar Experiencia Exclusiva'); });
        addSafeListener('btn-q1gj-continue', 'click', () => goToStep('step-bSoz'));
        addSafeListener('btn-request-cancel', 'click', () => goToStep('step-q1GJ'));
        addSafeListener('btn-request-select-datetime', 'click', () => { const expType = document.getElementById('request-experience-type'); if (expType && !expType.value) { expType.classList.add('is-invalid'); alert('Por favor selecciona un tipo de experiencia.'); } else { expType?.classList.remove('is-invalid'); goToStep('step-request-select-datetime'); } });
        addSafeListener('btn-request-datetime-back', 'click', goBack);
        addSafeListener('submit-request-button', 'click', submitDateRequest);
        addSafeListener('btn-request-confirm-home', 'click', () => goToStep('step-q1GJ'));
        addSafeListener('btn-aZoD-add', 'click', () => goToStep('subform-group-config'));
        addSafeListener('btn-aZoD-edit', 'click', () => goToStep('subform-group-config'));
        addSafeListener('btn-bsoz-back', 'click', goBack);
        addSafeListener('btn-bsoz-continue', 'click', () => goToStep('step-2sff'));
        addSafeListener('btn-2sff-back', 'click', goBack);
        addSafeListener('btn-2sff-continue', 'click', () => goToStep('step-qf5J'));
        addSafeListener('btn-qf5j-back', 'click', goBack);
        addSafeListener('btn-qf5j-continue', 'click', () => goToStep('step-checkout-placeholder'));
        addSafeListener('btn-checkout-back', 'click', goBack);
        addSafeListener('submit-button', 'click', submitReservation);
        addSafeListener('btn-gr5a-new-booking', 'click', () => window.location.reload());
        addSafeListener('btn-group-config-cancel', 'click', goBack);
        addSafeListener('btn-group-config-save', 'click', () => { setText('subform-aZoD-status', 'Sí'); document.getElementById('btn-aZoD-add')?.classList.add('d-none'); document.getElementById('btn-aZoD-edit')?.classList.remove('d-none'); goBack(); updateSummary(); });
        addSafeListener('btn-scheduling-cancel', 'click', goBack);
        addSafeListener('btn-scheduling-confirm', 'click', () => { setText('subform-3duJ-status','Sí'); goBack(); updateSummary(); });
        addSafeListener('link-solicitar-exclusiva', 'click', (event) => { event.preventDefault(); const exclusiveSwitch = document.getElementById('widget-grSj'); if (exclusiveSwitch) { exclusiveSwitch.checked = true; exclusiveSwitch.dispatchEvent(new Event('change')); } goToStep('step-q1GJ'); });

        // Other Element Listeners
        const exclusiveSwitch = document.getElementById('widget-grSj'); if (exclusiveSwitch) { exclusiveSwitch.addEventListener('change', () => { checkLunchParagraphs(); updateSummary(); }); }
        const groupSizeInput = document.getElementById('widget-tZqh'); if (groupSizeInput) { groupSizeInput.addEventListener('input', debounce(() => { handleGroupSizeChange(); updateSummary(); }, 300)); }
        const allAdultsCheckbox = document.getElementById('widget-qdCu'); if (allAdultsCheckbox) { allAdultsCheckbox.addEventListener('change', handleGroupRestrictionChange); }
        // Select2 elements have change listeners added during init
        const discountInput = document.getElementById('widget-3KPv'); if (discountInput) discountInput.addEventListener('input', updateSummary);
        const scheduleDateInput = document.getElementById('scheduling-date'); if(scheduleDateInput) scheduleDateInput.addEventListener('change', updateSummary);
        const scheduleTimeInput = document.getElementById('scheduling-time'); if(scheduleTimeInput) scheduleTimeInput.addEventListener('change', updateSummary);
        const requestDateFlatpickr = document.getElementById('request-date'); if(requestDateFlatpickr?._flatpickr) { requestDateFlatpickr._flatpickr.config.onChange.push(updateSummary); } // Hook into flatpickr change

    } catch(err) { console.error("Error setting up event listeners:", err); }

    // --- Initial State Checks ---
    console.log("Running initial state checks...");
    try { checkLunchParagraphs(); handleGroupSizeChange(); handleGroupRestrictionChange(); updateSummary(); }
    catch (err) { console.error("Error running initial checks:", err); }
    console.log("Initialization complete.");

}); // End jQuery document ready

