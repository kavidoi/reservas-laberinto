// public/js/script.js
// Handles form navigation, conditional logic, dynamic dropdown population, summary updates, and submission.
// Last Updated: Monday, April 7, 2025 at 2:48:10 AM -04 (Vitacura, Santiago Metropolitan Region, Chile)

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

        selectElement.innerHTML = `<option value="<span class="math-inline">\{defaultOptionValue\}" selected disabled\></span>{originalPlaceholderText}</option>`; // Restore placeholder

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
            selectElement.selectedIndex = 0; // *** ADDED: Force display of placeholder ***
        } else if (options && options.length === 0) {
             selectElement.innerHTML = `<option value="${defaultOptionValue}" selected disabled>No hay opciones disponibles</option>`;
             selectElement.selectedIndex = 0; // *** ADDED: Force display of placeholder ***
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
// (showStep, goToStep, goBack functions remain the same as before)
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
// (checkLunchParagraphs, handleGroupSizeChange, handleGroupRestrictionChange remain the same)
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
// (updateSummary function remains the same as before)
function updateSummary() {
    try {
        const isExclusive = document.getElementById('widget-grSj')?.checked;
        let experienceText = 'No seleccionada';
        let experienceId = null;
        if (isExclusive) {
            experience