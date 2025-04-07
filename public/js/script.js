// public/js/script.js
// Handles form navigation, conditional logic, dynamic dropdown population, summary updates, and submission.
// Last Updated: Monday, April 7, 2025 at 3:19:15 AM -04 (Vitacura, Santiago Metropolitan Region, Chile)

let currentStepId = 'step-q1GJ'; // Start with the first step
let historyStack = ['step-q1GJ']; // Keep track of visited steps for back button

// --- Helper Functions ---

function setText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text !== null && text !== undefined ? text : '';
    }
}

function showError(errorElement, message) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
    } else {
        console.error("Error display element not found. Message:", message);
        alert(message);
    }
}

function hideError(errorElement) {
     if (errorElement) {
        errorElement.classList.add('d-none');
        errorElement.textContent = '';
    }
}

// --- Dynamic Dropdown Population ---
async function populateDropdown(selectElementId, tableType, filterValue = null) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) {
        console.error(`Dropdown element #${selectElementId} not found.`);
        return;
    }

    const defaultOptionValue = "";
    let originalPlaceholderText = 'Selecciona...';
    const placeholderOption = selectElement.querySelector(`option[value='${defaultOptionValue}']`);
    if (placeholderOption) {
        originalPlaceholderText = placeholderOption.textContent;
        placeholderOption.textContent = 'Cargando opciones...';
    } else {
        selectElement.innerHTML = `<option value="${defaultOptionValue}" selected disabled>Cargando opciones...</option>`;
    }
    selectElement.disabled = true;

    let apiUrl = `/api/get-options?tableType=${encodeURIComponent(tableType)}`;
    if (filterValue) {
        apiUrl += `&filterValue=${encodeURIComponent(filterValue)}`;
    }

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
        if (!responseContentType || !responseContentType.includes("application/json")) {
             throw new Error(`Received non-JSON response from ${apiUrl}`);
        }
        const options = await response.json();

        selectElement.innerHTML = `<option value="${defaultOptionValue}" selected disabled>${originalPlaceholderText}</option>`; // Restore placeholder

        if (options && Array.isArray(options) && options.length > 0) {
            options.forEach(option => {
                if (option.id && option.name) {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.id;
                    optionElement.textContent = option.name;
                    selectElement.appendChild(optionElement);
                } else { console.warn("Received invalid option data:", option); }
            });
            console.log(`Successfully populated #${selectElementId} with ${options.length} options.`);
            selectElement.selectedIndex = 0; // Force display of placeholder
        } else if (options && options.length === 0) {
             selectElement.innerHTML = `<option value="${defaultOptionValue}" selected disabled>No hay opciones disponibles</option>`;
             selectElement.selectedIndex = 0; // Force display of placeholder
             console.log(`No options found for #${selectElementId}.`);
        } else { throw new Error("Invalid data format received from options API."); }

    } catch (error) {
        console.error(`Failed to fetch or populate dropdown #${selectElementId}:`, error);
        selectElement.innerHTML = `<option value="${defaultOptionValue}" selected disabled>Error al cargar</option>`;
    } finally {
        selectElement.disabled = false;
    }
}


// --- Navigation Logic ---
function showStep(stepId) {
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.add('d-none');
    });
    const targetStep = document.getElementById(stepId);
    if (targetStep) {
        targetStep.classList.remove('d-none');
        currentStepId = stepId;
        window.scrollTo(0, 0);
    } else {
        console.error(`Step with ID ${stepId} not found.`);
        document.getElementById('step-q1GJ')?.classList.remove('d-none');
        currentStepId = 'step-q1GJ';
    }
}

function goToStep(stepId) {
    if (stepId !== currentStepId) {
        historyStack.push(stepId);
        showStep(stepId);
        updateSummary();
    }
}

function goBack() {
    if (historyStack.length > 1) {
        historyStack.pop();
        const previousStepId = historyStack[historyStack.length - 1];
        showStep(previousStepId);
        updateSummary();
    }
}

// --- Conditional Logic Handlers ---
function checkLunchParagraphs() {
    const exclusiveSwitch = document.getElementById('widget-grSj');
    const paraNRxz = document.getElementById('widget-nRxz');
    const paraKJ8C = document.getElementById('widget-kJ8C');
    const para5A7s = document.getElementById('widget-5A7s');
    const isExclusive = exclusiveSwitch ? exclusiveSwitch.checked : false;
    const is150mExclusive = isExclusive; // Simplified assumption
    if(paraNRxz) paraNRxz.classList.toggle('d-none', isExclusive);
    if(paraKJ8C) paraKJ8C.classList.toggle('d-none', !isExclusive);
    if(para5A7s) para5A7s.classList.toggle('d-none', !is150mExclusive);
}

function handleGroupSizeChange() {
    const groupSizeInput = document.getElementById('widget-tZqh');
    const groupDetailsSection = document.getElementById('group-details-section');
    const singleAttendeeSection = document.getElementById('single-attendee-section');
    const groupMembersSection = document.getElementById('group-members-section');
    const allAdultsCheckbox = document.getElementById('widget-qdCu');
    const ehebCheckbox = document.getElementById('widget-eheb');
    const size = parseInt(groupSizeInput?.value, 10) || 0;
    const isGroup = size > 1;
    groupDetailsSection?.classList.toggle('d-none', !isGroup);
    singleAttendeeSection?.classList.toggle('d-none', isGroup);
    groupMembersSection?.classList.toggle('d-none', !isGroup);
    if (ehebCheckbox) ehebCheckbox.required = !isGroup;
    if (!isGroup && allAdultsCheckbox) {
        allAdultsCheckbox.checked = true;
        handleGroupRestrictionChange();
    }
}

function handleGroupRestrictionChange() {
    const allAdultsCheckbox = document.getElementById('widget-qdCu');
    const groupRestrictionsSection = document.getElementById('group-restrictions-section');
    const underageContainer = document.getElementById('widget-oKhU-container');
    const underageInput = document.getElementById('widget-oKhU');
    const allAdults = allAdultsCheckbox ? allAdultsCheckbox.checked : true;
    groupRestrictionsSection?.classList.toggle('d-none', allAdults);
    const isExclusive = document.getElementById('widget-grSj')?.checked;
    if (underageContainer) {
         underageContainer.classList.toggle('d-none', !isExclusive);
         if (underageInput) {
             underageInput.disabled = !isExclusive || allAdults;
             if(underageInput.disabled) underageInput.value = 0;
         }
    }
}

// --- Summary Update Function ---
function updateSummary() {
    try {
        const isExclusive = document.getElementById('widget-grSj')?.checked;
        let experienceText = 'No seleccionada';
        let experienceId = null;
        if (isExclusive) {
            experienceText = 'Exclusiva (Detalle pendiente agendamiento)';
        } else {
             const groupSelect = document.getElementById('widget-oY8v');
             if (groupSelect && groupSelect.selectedIndex > 0 && groupSelect.value) {
                 experienceText = groupSelect.options[groupSelect.selectedIndex].text;
                 experienceId = groupSelect.value;
             } else { experienceText = 'Grupal (Pendiente selección)'; }
        }
        setText('summary-experiencia', experienceText);

        const groupSize = parseInt(document.getElementById('widget-tZqh')?.value, 10) || 1;
        setText('summary-tamano', `${groupSize} persona(s)`);

        const comidaSelect = document.getElementById('widget-3vTL');
        let comidaText = 'No';
        let foodId = null;
        if (comidaSelect && comidaSelect.selectedIndex > 0 && comidaSelect.value) {
            comidaText = comidaSelect.options[comidaSelect.selectedIndex].text;
            foodId = comidaSelect.value;
        }
        setText('summary-comida', comidaText);

        const scheduleDate = document.getElementById('scheduling-date')?.value;
        const scheduleTime = document.getElementById('scheduling-time')?.value;
        setText('summary-fecha', scheduleDate && scheduleTime ? `${scheduleDate} ${scheduleTime}` : 'Pendiente agendamiento');

        // TODO: Implement accurate pricing logic based on experienceId, foodId, groupSize
        const basePricePerPerson = 50000; const foodPrice = foodId ? 15000 : 0;
        const discountCode = document.getElementById('widget-3KPv')?.value;
        const discount = discountCode === 'DESC10' ? 5000 * groupSize : 0; // Example discount
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

// --- Data Gathering for Submission ---
function gatherFormData() {
    const formData = {};
    try {
        const isExclusive = document.getElementById('widget-grSj')?.checked;
        formData.experienceType = isExclusive ? 'Exclusiva' : 'Grupal';
        const groupSelect = document.getElementById('widget-oY8v');
        if (!isExclusive && groupSelect?.value) {
            formData.groupExperienceText = groupSelect.options[groupSelect.selectedIndex]?.text;
            formData.groupExperienceId = groupSelect.value; // Actual Record ID
        } else { formData.groupExperienceText = null; formData.groupExperienceId = null; }

        const comidaSelect = document.getElementById('widget-3vTL');
         if (comidaSelect?.value) {
            formData.foodChoiceText = comidaSelect.options[comidaSelect.selectedIndex]?.text;
            formData.foodChoiceId = comidaSelect.value; // Actual Record ID
        } else { formData.foodChoiceText = null; formData.foodChoiceId = null; }

        formData.discountCode = document.getElementById('widget-3KPv')?.value || null;
        const abonoText = document.getElementById('summary-abono')?.textContent || '0';
        formData.abonoAmount = parseInt(abonoText.replace(/\D/g,''), 10) || 0;

        formData.groupSize = parseInt(document.getElementById('widget-tZqh')?.value, 10) || 1;
        if (formData.groupSize === 1) {
             formData.allAdultsDrink = document.getElementById('widget-eheb')?.checked ?? null;
             formData.allOver16 = true; formData.adultsNoDrink = 0; formData.kidsUnder12 = 0;
        } else {
            formData.allAdultsDrink = document.getElementById('widget-qdCu')?.checked ?? null;
            if (formData.allAdultsDrink === false) {
                 formData.allOver16 = document.getElementById('widget-r8jP')?.checked ?? null;
                 formData.adultsNoDrink = parseInt(document.getElementById('widget-5Cc7')?.value, 10) || 0;
                 formData.kidsUnder12 = parseInt(document.getElementById('widget-oKhU')?.value, 10) || 0;
            } else { formData.allOver16 = true; formData.adultsNoDrink = 0; formData.kidsUnder12 = 0; }
        }
        formData.comments = document.getElementById('widget-gfnx')?.value || null;

        formData.scheduledDate = document.getElementById('scheduling-date')?.value || null;
        formData.scheduledTime = document.getElementById('scheduling-time')?.value || null;
        formData.organizerName = document.getElementById('scheduling-name')?.value || null;
        formData.organizerEmail = document.getElementById('scheduling-email')?.value || null;

        // formData.recordIdToUpdate = document.getElementById('hidden-record-id')?.value || null;

    } catch (error) { console.error("Error gathering form data:", error); return null; }
    console.log("Form Data Gathered for Submission:", formData);
    return formData;
}


// --- Submit Reservation to Backend ---
async function submitReservation() {
    const submitButton = document.getElementById('submit-button');
    const errorDiv = document.getElementById('submission-error');
    if (!submitButton || !errorDiv) { console.error("Submit button or error display element not found."); return; }

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Confirmando...';
    hideError(errorDiv);

    const formData = gatherFormData();
    if (!formData) {
         showError(errorDiv, "Error al recopilar datos del formulario.");
         submitButton.disabled = false; submitButton.textContent = 'Confirmar Reserva'; return;
    }
    const backendUrl = '/api/submit-reserva'; // Relative path for Netlify/Vercel

    try {
        const response = await fetch(backendUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(formData),
        });
        const result = await response.json();
        if (response.ok) {
            console.log('Submission successful:', result);
            setText('final-summary-record-id', result.recordId || 'N/A');
            goToStep('step-gr5a');
        } else {
            console.error(`Submission failed (${response.status}):`, result);
            showError(errorDiv, result.message || `Error ${response.status}: Ocurrió un problema al guardar.`);
            submitButton.disabled = false; submitButton.textContent = 'Confirmar Reserva';
        }
    } catch (error) {
        console.error('Network or fetch error:', error);
        showError(errorDiv, 'Error de red al guardar la reserva. Verifica tu conexión e inténtalo de nuevo.');
        submitButton.disabled = false; submitButton.textContent = 'Confirmar Reserva';
    }
}


// --- Document Ready - Initial Setup & Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    showStep(currentStepId);

    // --- Populate Dropdowns ---
    console.log("Initiating dropdown population...");
    populateDropdown('widget-oY8v', 'experiences', 'Grupal'); // Experiences filtered for 'Grupal' & 'futuro'
    populateDropdown('widget-3vTL', 'food');                  // All food items

    // --- Add Event Listeners ---
    console.log("Adding event listeners...");
    try { // Add try-catch around listener setup for robustness
        const exclusiveSwitch = document.getElementById('widget-grSj');
        if (exclusiveSwitch) { exclusiveSwitch.addEventListener('change', () => { console.log("Exclusive switch changed"); const isExclusive = exclusiveSwitch.checked; document.getElementById('widget-oY8v-container')?.classList.toggle('d-none', isExclusive); document.getElementById('widget-3duJ-container')?.classList.toggle('d-none', !isExclusive); if (isExclusive) { const groupSelect = document.getElementById('widget-oY8v'); if(groupSelect) groupSelect.value = ""; } else { setText('subform-3duJ-status', 'No'); const scheduleDateInput = document.getElementById('scheduling-date'); const scheduleTimeInput = document.getElementById('scheduling-time'); if (scheduleDateInput) scheduleDateInput.value = ''; if (scheduleTimeInput) scheduleTimeInput.value = ''; } checkLunchParagraphs(); updateSummary(); }); } else { console.warn("Exclusive switch not found"); }
        const groupSizeInput = document.getElementById('widget-tZqh');
        if (groupSizeInput) { groupSizeInput.addEventListener('input', () => { console.log("Group size changed"); handleGroupSizeChange(); updateSummary(); }); } else { console.warn("Group size input not found"); }
        const allAdultsCheckbox = document.getElementById('widget-qdCu');
        if (allAdultsCheckbox) { allAdultsCheckbox.addEventListener('change', handleGroupRestrictionChange); } else { console.warn("All adults checkbox not found"); }
        const groupSelect = document.getElementById('widget-oY8v');
        const foodSelect = document.getElementById('widget-3vTL');
        if (groupSelect) groupSelect.addEventListener('change', updateSummary); else { console.warn("Group select not found"); }
        if (foodSelect) foodSelect.addEventListener('change', updateSummary); else { console.warn("Food select not found"); }
        const discountInput = document.getElementById('widget-3KPv');
        if (discountInput) discountInput.addEventListener('input', updateSummary); else { console.warn("Discount input not found"); }
        const scheduleDateInput = document.getElementById('scheduling-date');
        const scheduleTimeInput = document.getElementById('scheduling-time');
        if(scheduleDateInput) scheduleDateInput.addEventListener('change', updateSummary); else { console.warn("Schedule date input not found"); }
        if(scheduleTimeInput) scheduleTimeInput.addEventListener('change', updateSummary); else { console.warn("Schedule time input not found"); }
    } catch(err) { console.error("Error setting up event listeners:", err); }

    // --- Initial State Checks ---
    console.log("Running initial state checks...");
    try { // Add try-catch around initial checks
        checkLunchParagraphs(); // Check element existence inside function
        handleGroupSizeChange(); // Check element existence inside function
        handleGroupRestrictionChange(); // Check element existence inside function
        updateSummary();
    } catch (err) { console.error("Error running initial checks:", err); }
    console.log("Initialization complete.");
}); // <--- Ensure this final closing part is present