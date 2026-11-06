const contactForm = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');
const steps = [...document.querySelectorAll('[data-form-step]')];
const stepNames = ['Your details', 'Reading preferences', 'Review your profile'];
let currentStep = 0;
const validationFields = {
    userName: { errorId: 'name-error', validate: value => value.trim().length >= 2 ? '' : 'Enter a name with at least 2 characters.' },
    userEmail: { errorId: 'email-error', validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Enter a valid email, for example name@example.com.' },
    userPassword: { errorId: 'password-error', validate: value => value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value) ? '' : 'Use at least 8 characters, including a letter and a number.' },
    confirmPassword: { errorId: 'confirm-error', validate: value => value && value === contactForm.elements.userPassword.value ? '' : 'Passwords must match.' },
    message: { errorId: 'message-error', validate: value => value.trim().length >= 10 ? '' : 'Write at least 10 characters.' }
};
function validateField(name) {
    const field = contactForm.elements[name];
    const message = validationFields[name].validate(field.value);
    document.getElementById(validationFields[name].errorId).textContent = message;
    field.classList.toggle('is-invalid', Boolean(message));
    field.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
}
function validateStep(index) {
    const names = index === 0 ? ['userName', 'userEmail', 'userPassword', 'confirmPassword'] : index === 1 ? ['message'] : [];
    const valid = names.map(validateField).every(Boolean);
    if (!valid) steps[index].querySelector('.is-invalid').focus();
    return valid;
}
function updateReview() {
    const review = document.getElementById('profile-review');
    const fields = {
        Name: contactForm.elements.userName.value.trim(),
        Email: contactForm.elements.userEmail.value.trim(),
        Category: contactForm.elements.category.selectedOptions[0].textContent,
        Message: contactForm.elements.message.value.trim()
    };
    review.replaceChildren();
    Object.entries(fields).forEach(function ([label, value]) {
        const term = document.createElement('dt'); const detail = document.createElement('dd');
        term.className = 'col-sm-3'; detail.className = 'col-sm-9';
        term.textContent = label; detail.textContent = value;
        review.append(term, detail);
    });
}
function showStep(index, moveFocus = true) {
    currentStep = index;
    steps.forEach((step, i) => { step.hidden = i !== index; });
    document.getElementById('step-status').textContent = `Step ${index + 1} of 3 - ${stepNames[index]}`;
    document.getElementById('form-progress').style.width = `${(index + 1) / steps.length * 100}%`;
    document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(index + 1));
    document.getElementById('form-back').hidden = index === 0;
    document.getElementById('form-next').hidden = index === steps.length - 1;
    document.getElementById('form-submit').hidden = index !== steps.length - 1;
    formSuccess.hidden = true;
    if (index === 2) updateReview();
    if (moveFocus) steps[index].querySelector('legend').focus();
}
// Higher-order navigation receives the display function as a callback.
function navigateStep(direction, onStepChanged) {
    if (direction > 0 && !validateStep(currentStep)) return;
    const nextStep = Math.max(0, Math.min(steps.length - 1, currentStep + direction));
    onStepChanged(nextStep);
}
document.getElementById('form-next').addEventListener('click', () => navigateStep(1, showStep));
document.getElementById('form-back').addEventListener('click', () => navigateStep(-1, showStep));
Object.keys(validationFields).forEach(function (name) {
    contactForm.elements[name].addEventListener('input', function () {
        validateField(name);
        if (name === 'userPassword' && contactForm.elements.confirmPassword.value) validateField('confirmPassword');
        formSuccess.hidden = true;
    });
});
contactForm.elements.termsCheck.addEventListener('change', function () {
    document.getElementById('terms-error').textContent = '';
    contactForm.elements.termsCheck.classList.remove('is-invalid');
    contactForm.elements.termsCheck.removeAttribute('aria-invalid');
    formSuccess.hidden = true;
});
contactForm.addEventListener('submit', function (event) {
    event.preventDefault();
    contactForm.dataset.validated = 'false';
    if (currentStep < steps.length - 1) { navigateStep(1, showStep); return; }
    for (let i = 0; i < 2; i++) {
        showStep(i, false);
        if (!validateStep(i)) return;
    }
    showStep(2, false);
    const accepted = contactForm.elements.termsCheck.checked;
    document.getElementById('terms-error').textContent = accepted ? '' : 'Confirm that you understand this is a demo.';
    contactForm.elements.termsCheck.classList.toggle('is-invalid', !accepted);
    contactForm.elements.termsCheck.setAttribute('aria-invalid', String(!accepted));
    if (!accepted) { contactForm.elements.termsCheck.focus(); return; }
    contactForm.dataset.validated = 'true';
});
contactForm.addEventListener('reset', function () {
    document.querySelectorAll('.field-error').forEach(error => { error.textContent = ''; });
    contactForm.querySelectorAll('[aria-invalid]').forEach(function (field) {
        field.classList.remove('is-invalid'); field.removeAttribute('aria-invalid');
    });
    document.getElementById('profile-review').replaceChildren(); showStep(0);
});
showStep(0, false);
