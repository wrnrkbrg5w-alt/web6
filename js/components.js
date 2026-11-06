document.querySelectorAll('.faq-question').forEach(function (question) {
    let hideTimer;
    question.addEventListener('click', function () {
        const answer = document.getElementById(question.getAttribute('aria-controls'));
        const willOpen = question.getAttribute('aria-expanded') === 'false';

        clearTimeout(hideTimer);
        question.setAttribute('aria-expanded', String(willOpen));
        answer.hidden = false;

        if (willOpen) {
            answer.style.maxHeight = answer.scrollHeight + 'px';
        } else {
            answer.style.maxHeight = '0px';
            hideTimer = setTimeout(function () {
                if (question.getAttribute('aria-expanded') === 'false') answer.hidden = true;
            }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300);
        }
    });
});

const popup = document.getElementById('subscribe-popup');
const openPopupButton = document.querySelector('[data-popup-open]');
const closePopupButton = document.querySelector('[data-popup-close]');
const subscribeForm = document.getElementById('subscribe-form');
let lastFocusedElement = null;

function openPopup() {
    if (!popup) return;
    lastFocusedElement = document.activeElement;
    popup.hidden = false;
    document.body.classList.add('popup-open');
    requestAnimationFrame(function () {
        popup.classList.add('is-open');
        document.getElementById('subscriber-name').focus();
    });
}

function closePopup() {
    if (!popup) return;
    popup.classList.remove('is-open');
    document.body.classList.remove('popup-open');
    setTimeout(function () {
        popup.hidden = true;
        if (lastFocusedElement) lastFocusedElement.focus();
    }, 200);
}

if (openPopupButton) openPopupButton.addEventListener('click', openPopup);
if (closePopupButton) closePopupButton.addEventListener('click', closePopup);

if (popup) {
    popup.addEventListener('click', function (event) {
        if (event.target === popup) closePopup();
    });
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && popup && !popup.hidden) closePopup();
    if (event.key === 'Tab' && popup && !popup.hidden) {
        const controls = [...popup.querySelectorAll('button, input')];
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
        }
    }
});

if (subscribeForm) {
    subscribeForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!subscribeForm.reportValidity()) return;

        subscribeForm.dataset.validated = 'true';
    });
}
