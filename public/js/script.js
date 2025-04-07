// public/js/script.js
// Handles form navigation, conditional logic, dynamic dropdown population, summary updates, and submission.
// Uses addEventListener instead of inline onclick attributes.
// Last Updated: Monday, April 7, 2025 at 11:17:53 AM -04 Chile Time

let currentStepId = 'step-q1GJ';
let historyStack = ['step-q1GJ'];

// --- Helper Functions ---
function setText(elementId, text) { /* ... */ } // (Keep existing helper)
function showError(errorElement, message) { /* ... */ } // (Keep existing helper)
function hideError(errorElement) { /* ... */ } // (Keep existing helper)

// --- Dynamic Dropdown Population ---
// (populateDropdown remains the same)
async function populateDropdown(selectElementId, tableType, filterValue = null) { /* ... */ }
// (populateRequestExperienceTypes remains the same)
async function populateRequestExperienceTypes() { /* ... */ }


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
// (updateSummary function remains the same)
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

    // --- Populate Dropdowns ---
    console.log("Initiating dropdown population...");
    populateDropdown('widget-oY8v', 'experiences', 'Grupal');
    populateDropdown('widget-3vTL', 'food');
    populateRequestExperienceTypes();

    // --- Add Event Listeners ---
    console.log("Adding event listeners...");
    try {
        // --- Step q1GJ Buttons ---
        const btnRequestOtherDate = document.getElementById('btn-request-other-date');
        if (btnRequestOtherDate) btnRequestOtherDate.addEventListener('click', () => goToStep('step-request-start'));

        const btnAgendaExclusiva = document.getElementById('btn-agenda-exclusiva');
        if (btnAgendaExclusiva) btnAgendaExclusiva.addEventListener('click', () => {
            goToStep('subform-scheduling');
            // Optionally set title here if needed, though subform itself might have title
            const schedulingTitle = document.getElementById('scheduling-title');
            if(schedulingTitle) schedulingTitle.textContent='Agendar Experiencia Exclusiva';
        });

        const btnQ1gjContinue = document.getElementById('btn-q1gj-continue');
        if (btnQ1gjContinue) btnQ1gjContinue.addEventListener('click', () => goToStep('step-bSoz'));

        // --- Step request-start Buttons ---
        const btnRequestCancel = document.getElementById('btn-request-cancel');
        if (btnRequestCancel) btnRequestCancel.addEventListener('click', () => goToStep('step-q1GJ')); // Go back to start

        const btnRequestSelectDatetime = document.getElementById('btn-request-select-datetime');
        if (btnRequestSelectDatetime) btnRequestSelectDatetime.addEventListener('click', () => {
             // Optional: Add validation here before proceeding
             const experienceTypeSelect = document.getElementById('request-experience-type');
             if (experienceTypeSelect && !experienceTypeSelect.value) {
                 experienceTypeSelect.classList.add('is-invalid');
                 alert('Por favor selecciona un tipo de experiencia.');
             } else {
                experienceTypeSelect?.classList.remove('is-invalid');
                goToStep('step-request-select-datetime');
             }
        });

        // --- Step request-select-datetime Buttons ---
        const btnRequestDatetimeBack = document.getElementById('btn-request-datetime-back');
        if (btnRequestDatetimeBack) btnRequestDatetimeBack.addEventListener('click', goBack); // Go back to request-start

        const submitRequestButton = document.getElementById('submit-request-button');
        if (submitRequestButton) submitRequestButton.addEventListener('click', submitDateRequest);

         // --- Step request-confirm Buttons ---
        const btnRequestConfirmHome = document.getElementById('btn-request-confirm-home');
        if (btnRequestConfirmHome) btnRequestConfirmHome.addEventListener('click', () => goToStep('step-q1GJ'));

        // --- Step bSoz Buttons ---
        const btnConfigGroupAdd = document.getElementById('btn-aZoD-add');
        if (btnConfigGroupAdd) btnConfigGroupAdd.addEventListener('click', () => goToStep('subform-group-config'));

        const btnConfigGroupEdit = document.getElementById('btn-aZoD-edit');
        if (btnConfigGroupEdit) btnConfigGroupEdit.addEventListener('click', () => goToStep('subform-group-config'));

        const btnBsozBack = document.getElementById('btn-bsoz-back');
        if (btnBsozBack) btnBsozBack.addEventListener('click', goBack);

        const btnBsozContinue = document.getElementById('btn-bsoz-continue');
        if (btnBsozContinue) btnBsozContinue.addEventListener('click', () => goToStep('step-2sff'));

        // --- Step 2sff Buttons ---
        const btn2sffBack = document.getElementById('btn-2sff-back');
        if (btn2sffBack) btn2sffBack.addEventListener('click', goBack);

        const btn2sffContinue = document.getElementById('btn-2sff-continue');
        if (btn2sffContinue) btn2sffContinue.addEventListener('click', () => goToStep('step-qf5J'));

        // --- Step qf5j Buttons ---
        const btnQf5jBack = document.getElementById('btn-qf5j-back');
        if (btnQf5jBack) btnQf5jBack.addEventListener('click', goBack);

        const btnQf5jContinue = document.getElementById('btn-qf5j-continue');
        if (btnQf5jContinue) btnQf5jContinue.addEventListener('click', () => goToStep('step-checkout-placeholder'));

        // --- Step checkout Buttons ---
        const btnCheckoutBack = document.getElementById('btn-checkout-back');
        if (btnCheckoutBack) btnCheckoutBack.addEventListener('click', goBack);

        const submitButton = document.getElementById('submit-button');
        if (submitButton) submitButton.addEventListener('click', submitReservation);

        // --- Step gr5a Buttons ---
        const btnGr5aNewBooking = document.getElementById('btn-gr5a-new-booking');
        if (btnGr5aNewBooking) btnGr5aNewBooking.addEventListener('click', () => window.location.reload());

        // --- Subform Group Config Buttons ---
        const btnGroupConfigCancel = document.getElementById('btn-group-config-cancel');
        if (btnGroupConfigCancel) btnGroupConfigCancel.addEventListener('click', goBack); // Assumes goBack is appropriate

        const btnGroupConfigSave = document.getElementById('btn-group-config-save');
        if (btnGroupConfigSave) btnGroupConfigSave.addEventListener('click', () => {
            // Simulate saving and returning
            setText('subform-aZoD-status', 'Sí');
            document.getElementById('btn-aZoD-add')?.classList.add('d-none');
            document.getElementById('btn-aZoD-edit')?.classList.remove('d-none');
            goBack(); // Go back to step bSoz
            updateSummary();
        });

        // --- Subform Scheduling Buttons ---
        const btnSchedulingCancel = document.getElementById('btn-scheduling-cancel');
        if (btnSchedulingCancel) btnSchedulingCancel.addEventListener('click', goBack); // Assumes goBack is appropriate

        const btnSchedulingConfirm = document.getElementById('btn-scheduling-confirm');
        if (btnSchedulingConfirm) btnSchedulingConfirm.addEventListener('click', () => {
             // Simulate saving and returning
             setText('subform-3duJ-status','Sí');
             // TODO: Need to actually capture date/time from this subform and store it
             // For now, just go back
             goBack(); // Go back to step q1GJ
             updateSummary();
        });

        // --- Other Element Listeners ---
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
        const scheduleDateInput = document.getElementById('scheduling-date');
        const scheduleTimeInput = document.getElementById('scheduling-time');
        if(scheduleDateInput) scheduleDateInput.addEventListener('change', updateSummary);
        if(scheduleTimeInput) scheduleTimeInput.addEventListener('change', updateSummary);
        const requestDateInput = document.getElementById('request-date');
        const requestTimeInput = document.getElementById('request-time');
        // Add listeners if request date/time changes should affect anything immediately
        // if(requestDateInput) requestDateInput.addEventListener('change', someFunction);
        // if(requestTimeInput) requestTimeInput.addEventListener('change', someFunction);


    } catch(err) { console.error("Error setting up event listeners:", err); }

    // --- Initialize Flatpickr ---
    const dateInputFlatpickr = document.getElementById('request-date');
    if (dateInputFlatpickr) {
        try {
            flatpickr(dateInputFlatpickr, {
                altInput: true,
                altFormat: "j F, Y",
                dateFormat: "Y-m-d",
                minDate: new Date().fp_incr(10),
                locale: "es", // Will work now locale file loads
                disable: [
                    function(date) { // Disable Mon, Tue, Wed, Thu
                        const day = date.getDay();
                        return (day >= 1 && day <= 4);
                    }
                ],
            });
            console.log("Flatpickr initialized for #request-date");
        } catch(err) { console.error("Error initializing Flatpickr:", err); }
    } else {
        console.warn("Date input #request-date not found for Flatpickr.");
    }

    // --- Initial State Checks ---
    console.log("Running initial state checks...");
    try {
        checkLunchParagraphs();
        handleGroupSizeChange();
        handleGroupRestrictionChange();
        updateSummary();
    } catch (err) { console.error("Error running initial checks:", err); }
    console.log("Initialization complete.");

}); // End DOMContentLoaded listener