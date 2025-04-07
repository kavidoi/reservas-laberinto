// public/js/script.js
// Handles form navigation, conditional logic, dynamic dropdown population, summary updates, and submission.
// Last Updated: Sunday, April 6, 2025 at 10:28:52 PM -04 (Vitacura, Santiago Metropolitan Region, Chile)

let currentStepId = 'step-q1GJ'; // Start with the first step
let historyStack = ['step-q1GJ']; // Keep track of visited steps for back button

// --- Helper Functions ---

// Helper to safely set text content
function setText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text !== null && text !== undefined ? text : ''; // Ensure text is not null/undefined
    } else {
        // console.warn(`Element with ID ${elementId} not found for setText.`);
    }
}

// Helper to show error messages in the designated div
function showError(errorElement, message) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
    } else {
        console.error("Error display element not found. Message:", message);
        alert(message); // Fallback if error div is missing
    }
}

// Helper to hide the error message div
function hideError(errorElement) {
     if (errorElement) {
        errorElement.classList.add('d-none');
        errorElement.textContent = ''; // Clear text
    }
}

// --- Dynamic Dropdown Population ---
async function populateDropdown(selectElementId, tableType, filterValue = null) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) {
        console.error(`Dropdown element #${selectElementId} not found.`);
        return;
    }

    const defaultOptionValue = ""; // Value for the placeholder/disabled option
    let originalPlaceholderText = 'Selecciona...'; // Default placeholder
    const placeholderOption = selectElement.querySelector(`option[value='${defaultOptionValue}']`);
    if (placeholderOption) {
        originalPlaceholderText = placeholderOption.textContent; // Grab text before overwriting
        placeholderOption.textContent = 'Cargando opciones...'; // Update existing placeholder
    } else {
        // Add placeholder if it doesn't exist
        selectElement.innerHTML = `<option value="${defaultOptionValue}" selected disabled>Cargando opciones...</option>`;
    }

    // Show loading state
    selectElement.disabled = true;

    // Use relative path for API call - works with Netlify/Vercel function routing/rewrites
    let apiUrl = `/api/get-options?tableType=${encodeURIComponent(tableType)}`;
    if (filterValue) {
        apiUrl += `&filterValue=${encodeURIComponent(filterValue)}`;
    }

    try {
        const response = await fetch(apiUrl);
        const responseContentType = response.headers.get("content-type");
        if (!response.ok) {
             let errorMsg = `HTTP error ${response.status}`;
             // Try to get more specific error from JSON response if available
             if (responseContentType && responseContentType.includes("application/json")) {
                 try {
                     const errorJson = await response.json();
                     errorMsg += `: ${errorJson.message || 'Failed to load options'}`;
                 } catch (e) { /* Ignore parsing error if body isn't valid JSON */ }
             } else {
                 errorMsg += ` - ${response.statusText}`;
             }
            throw new Error(errorMsg);
        }

        if (!responseContentType || !responseContentType.includes("application/json")) {
             // Handle cases where the server returned success but not JSON
             throw new Error(`Received non-JSON response from ${apiUrl}`);
        }

        const options = await response.json();

        // Clear loading message, restore/set placeholder
        selectElement.innerHTML = `<option value="${defaultOptionValue}" selected disabled>${originalPlaceholderText}</option>`;

        if (options && Array.isArray(options) && options.length > 0) {
            options.forEach(option => {
                if (option.id && option.name) { // Basic validation of received data
                    const optionElement = document.createElement('option');
                    optionElement.value = option.id; // Use Airtable Record ID as value
                    optionElement.textContent = option.name;
                    selectElement.appendChild(optionElement);
                } else {
                    console.warn("Received invalid option data:", option);
                }
            });
            console.log(`Successfully populated #${selectElementId} with ${options.length} options.`);
        } else if (options && options.length === 0) {
             // Keep placeholder, maybe change text
             selectElement.innerHTML = `<option value="${defaultOptionValue}" selected disabled>No hay opciones disponibles</option>`;
             console.log(`No options found for #${selectElementId}.`);
        } else {
             // Handle cases where response is JSON but not the expected array format
             throw new Error("Invalid data format received from options API.");
        }

    } catch (error) {
        console.error(`Failed to fetch or populate dropdown #${selectElementId}:`, error);
        selectElement.innerHTML = `<option value="${defaultOptionValue}" selected disabled>Error al cargar</option>`;
        // Optionally display error to user more prominently
    } finally {
        selectElement.disabled = false; // Re-enable dropdown regardless of outcome
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
        window.scrollTo(0, 0); // Scroll to top on step change
    } else {
        console.error(`Step with ID ${stepId} not found.`);
        document.getElementById('step-q1GJ')?.classList.remove('d-none'); // Fallback
        currentStepId = 'step-q1GJ';
    }
}

function goToStep(stepId) {
    // Add basic validation or checks here if needed before proceeding
    if (stepId !== currentStepId) {
        historyStack.push(stepId);
        showStep(stepId);
        updateSummary(); // Update summary when navigating forward
    }
}

function goBack() {
    if (historyStack.length > 1) {
        historyStack.pop();
        const previousStepId = historyStack[historyStack.length - 1];
        showStep(previousStepId);
        updateSummary(); // Update summary when navigating back
    }
}

// --- Conditional Logic Handlers ---

function checkLunchParagraphs() {
    const exclusiveSwitch = document.getElementById('widget-grSj');
    const paraNRxz = document.getElementById('widget-nRxz');
    const paraKJ8C = document.getElementById('widget-kJ8C');
    const para5A7s = document.getElementById('widget-5A7s');

    const isExclusive = exclusiveSwitch ? exclusiveSwitch.checked : false;
    // Placeholder - needs better logic if '150m' condition is complex
    const is150mExclusive = isExclusive;

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

    if (!isGroup && allAdultsCheckbox) { // Reset if size becomes 1
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
    // Debounce or throttle this function if it gets called too frequently
    // leading to performance issues, but likely fine for this form.
    try {
        // Experience Type and Name
        const isExclusive = document.getElementById('widget-grSj')?.checked;
        let experienceText = 'No seleccionada';
        let experienceId = null; // For potential price calculation
        if (isExclusive) {
            experienceText = 'Exclusiva (Detalle pendiente agendamiento)';
        } else {
             const groupSelect = document.getElementById('widget-oY8v');
             if (groupSelect && groupSelect.selectedIndex > 0 && groupSelect.value) {
                 experienceText = groupSelect.options[groupSelect.selectedIndex].text;
                 experienceId = groupSelect.value;
             } else {
                 experienceText = 'Grupal (Pendiente selección)';
             }
        }
        setText('summary-experiencia', experienceText);

        // Group Size
        const groupSize = parseInt(document.getElementById('widget-tZqh')?.value, 10) || 1;
        setText('summary-tamano', `${groupSize} persona(s)`);

        // Comida
        const comidaSelect = document.getElementById('widget-3vTL');
        let comidaText = 'No';
        let foodId = null; // For potential price calculation
        if (comidaSelect && comidaSelect.selectedIndex > 0 && comidaSelect.value) {
            comidaText = comidaSelect.options[comidaSelect.selectedIndex].text;
            foodId = comidaSelect.value;
        }
        setText('summary-comida', comidaText);

        // Date
        const scheduleDate = document.getElementById('scheduling-date')?.value;
        const scheduleTime = document.getElementById('scheduling-time')?.value;
        setText('summary-fecha', scheduleDate && scheduleTime ? `${scheduleDate} ${scheduleTime}` : 'Pendiente agendamiento');

        // Prices (Placeholder - Needs real pricing logic based on selected IDs/size)
        // TODO: Replace example pricing with actual calculation logic
        const basePricePerPerson = 50000;
        const foodPrice = foodId ? 15000 : 0;
        const discountCode = document.getElementById('widget-3KPv')?.value;
        const discount = discountCode === 'DESC10' ? 5000 * groupSize : 0;
        const totalPrice = (basePricePerPerson + foodPrice) * groupSize - discount;
        const abonoPerPerson = 25000;
        const totalAbono = abonoPerPerson * groupSize; // Simple example, might vary

        setText('summary-precio-total', totalPrice >= 0 ? totalPrice.toLocaleString('es-CL') : '0');
        setText('summary-descuento', discount.toLocaleString('es-CL'));
        setText('summary-abono', totalAbono.toLocaleString('es-CL'));
        setText('checkout-abono-amount', totalAbono.toLocaleString('es-CL'));

        // Update final summary placeholders
        setText('final-summary-experiencia', experienceText);
        setText('final-summary-fecha', scheduleDate && scheduleTime ? `${scheduleDate} ${scheduleTime}` : 'Pendiente');
        setText('final-summary-grupo', `${groupSize} persona(s)`);
        setText('final-summary-abono', totalAbono.toLocaleString('es-CL'));

    } catch (e) {
        console.error("Error updating summary:", e);
    }
}

// --- Data Gathering for Submission ---
function gatherFormData() {
    const formData = {};
    try {
        // Step q1GJ
        const isExclusive = document.getElementById('widget-grSj')?.checked;
        formData.experienceType = isExclusive ? 'Exclusiva' : 'Grupal';
        const groupSelect = document.getElementById('widget-oY8v');
        if (!isExclusive && groupSelect?.value) {
            formData.groupExperienceText = groupSelect.options[groupSelect.selectedIndex]?.text;
            formData.groupExperienceId = groupSelect.value; // Actual Record ID
        } else {
             formData.groupExperienceText = null;
             formData.groupExperienceId = null;
        }

        // Step 2sff
        const comidaSelect = document.getElementById('widget-3vTL');
         if (comidaSelect?.value) {
            formData.foodChoiceText = comidaSelect.options[comidaSelect.selectedIndex]?.text;
            formData.foodChoiceId = comidaSelect.value; // Actual Record ID
        } else {
             formData.foodChoiceText = null;
             formData.foodChoiceId = null;
        }

        // Step qf5J / Checkout
        formData.discountCode = document.getElementById('widget-3KPv')?.value || null; // Send null if empty
        const abonoText = document.getElementById('summary-abono')?.textContent || '0';
        formData.abonoAmount = parseInt(abonoText.replace(/\D/g,''), 10) || 0;

        // Subform: Group Config
        formData.groupSize = parseInt(document.getElementById('widget-tZqh')?.value, 10) || 1;
        if (formData.groupSize === 1) {
             formData.allAdultsDrink = document.getElementById('widget-eheb')?.checked ?? null;
             formData.allOver16 = true;
             formData.adultsNoDrink = 0;
             formData.kidsUnder12 = 0;
        } else {
            formData.allAdultsDrink = document.getElementById('widget-qdCu')?.checked ?? null;
            if (formData.allAdultsDrink === false) { // Only capture these if checkbox is unchecked
                 formData.allOver16 = document.getElementById('widget-r8jP')?.checked ?? null;
                 formData.adultsNoDrink = parseInt(document.getElementById('widget-5Cc7')?.value, 10) || 0;
                 formData.kidsUnder12 = parseInt(document.getElementById('widget-oKhU')?.value, 10) || 0;
            } else { // If all adults drink, these don't apply or are true
                 formData.allOver16 = true;
                 formData.adultsNoDrink = 0;
                 formData.kidsUnder12 = 0;
            }
        }
        formData.comments = document.getElementById('widget-gfnx')?.value || null; // Send null if empty

        // Subform: Scheduling
        formData.scheduledDate = document.getElementById('scheduling-date')?.value || null;
        formData.scheduledTime = document.getElementById('scheduling-time')?.value || null;
        formData.organizerName = document.getElementById('scheduling-name')?.value || null;
        formData.organizerEmail = document.getElementById('scheduling-email')?.value || null;

        // Add recordIdToUpdate if implementing edit functionality
        // formData.recordIdToUpdate = document.getElementById('hidden-record-id')?.value || null;

    } catch (error) {
        console.error("Error gathering form data:", error);
        // Prevent submission if critical data is missing?
        return null; // Indicate failure
    }

    console.log("Form Data Gathered for Submission:", formData);
    return formData;
}


// --- Submit Reservation to Backend ---
async function submitReservation() {
    const submitButton = document.getElementById('submit-button');
    const errorDiv = document.getElementById('submission-error');
    if (!submitButton || !errorDiv) {
        console.error("Submit button or error display element not found.");
        return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Confirmando...';
    hideError(errorDiv); // Clear previous errors

    const formData = gatherFormData();
    // Handle case where gathering data failed
    if (!formData) {
         showError(errorDiv, "Error al recopilar datos del formulario.");
         submitButton.disabled = false;
         submitButton.textContent = 'Confirmar Reserva';
         return;
    }

    const backendUrl = '/api/submit-reserva'; // Relative path for Netlify/Vercel

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const result = await response.json(); // Attempt to parse JSON

        if (response.ok) {
            console.log('Submission successful:', result);
            setText('final-summary-record-id', result.recordId || 'N/A');
            goToStep('step-gr5a'); // Show Thank You page
            // Optionally clear form or reset state here
        } else {
            console.error(`Submission failed (${response.status}):`, result);
            showError(errorDiv, result.message || `Error ${response.status}: Ocurrió un problema al guardar.`);
            submitButton.disabled = false;
            submitButton.textContent = 'Confirmar Reserva';
        }
    } catch (error) {
        console.error('Network or fetch error:', error);
        showError(errorDiv, 'Error de red al guardar la reserva. Verifica tu conexión e inténtalo de nuevo.');
        submitButton.disabled = false;
        submitButton.textContent = 'Confirmar Reserva';
    }
}


// --- Document Ready - Initial Setup & Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed"); // Log when DOM is ready

    // Show the initial step
    showStep(currentStepId);

    // --- Populate Dropdowns ---
    console.log("Initiating dropdown population...");
    populateDropdown('widget-oY8v', 'experiences', 'Grupal'); // Experiences filtered for 'Grupal'
    populateDropdown('widget-3vTL', 'food');                  // All food items

    // --- Add Event Listeners ---
    console.log("Adding event listeners...");

    const exclusiveSwitch = document.getElementById('widget-grSj');
    if (exclusiveSwitch) {
        exclusiveSwitch.addEventListener('change', () => {
            console.log("Exclusive switch changed");
            const isExclusive = exclusiveSwitch.checked;
            document.getElementById('widget-oY8v-container')?.classList.toggle('d-none', isExclusive);
            document.getElementById('widget-3duJ-container')?.classList.toggle('d-none', !isExclusive);
            if (isExclusive) {
                 const groupSelect = document.getElementById('widget-oY8v');
                 if(groupSelect) groupSelect.value = ""; // Reset group dropdown
            } else {
                setText('subform-3duJ-status', 'No');
                const scheduleDateInput = document.getElementById('scheduling-date');
                const scheduleTimeInput = document.getElementById('scheduling-time');
                if (scheduleDateInput) scheduleDateInput.value = '';
                if (scheduleTimeInput) scheduleTimeInput.value = '';
            }
            checkLunchParagraphs();
            updateSummary();
        });
    } else { console.warn("Exclusive switch not found"); }

    const groupSizeInput = document.getElementById('widget-tZqh');
    if (groupSizeInput) {
        groupSizeInput.addEventListener('input', () => {
             console.log("Group size changed");
            handleGroupSizeChange();
            updateSummary();
        });
    } else { console.warn("Group size input not found"); }

    const allAdultsCheckbox = document.getElementById('widget-qdCu');
    if (allAdultsCheckbox) {
        allAdultsCheckbox.addEventListener('change', handleGroupRestrictionChange);
    } else { console.warn("All adults checkbox not found"); }

    // Dropdown Change Listeners for Summary Update
    const groupSelect = document.getElementById('widget-oY8v');
    const foodSelect = document.getElementById('widget-3vTL');
    if (groupSelect) groupSelect.addEventListener('change', updateSummary); else { console.warn("Group select not found"); }
    if (foodSelect) foodSelect.addEventListener('change', updateSummary); else { console.warn("Food select not found"); }

    // Discount Code Listener
    const discountInput = document.getElementById('widget-3KPv');
    if (discountInput) discountInput.addEventListener('input', updateSummary); else { console.warn("Discount input not found"); }

    // Scheduling Input Listener (for summary update)
    const scheduleDateInput = document.getElementById('scheduling-date');
    const scheduleTimeInput = document.getElementById('scheduling-time');
    if(scheduleDateInput) scheduleDateInput.addEventListener('change', updateSummary); else { console.warn("Schedule date input not found"); }
    if(scheduleTimeInput) scheduleTimeInput.addEventListener('change', updateSummary); else { console.warn("Schedule time input not found"); }

    // --- Initial State Checks ---
    console.log("Running initial state checks...");
    // Ensure elements exist before calling handlers that might access them immediately
    if (exclusiveSwitch) checkLunchParagraphs();
    if (groupSizeInput) handleGroupSizeChange();
    if (allAdultsCheckbox) handleGroupRestrictionChange();
    updateSummary(); // Calculate initial summary
    console.log("Initialization complete.");
});