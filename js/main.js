// Shared settings and methods; storage failures leave the page usable in memory.
const BookVerse = {
    memory: {},
    read(key, fallback) {
        try { return JSON.parse(localStorage.getItem('bookverse-' + key)) ?? fallback; }
        catch { return this.memory[key] ?? fallback; }
    },
    write(key, value) {
        this.memory[key] = value;
        try { localStorage.setItem('bookverse-' + key, JSON.stringify(value)); }
        catch { /* Private browsing may disable persistent storage. */ }
    },
    sound: new Audio('audio/notification.wav'),
    async playSound(force = false) {
        if (!force && !this.soundEnabled) return;
        const status = document.querySelector('[data-sound-status]');
        try {
            // Rewind one audio element to prevent overlapping sounds.
            this.sound.pause();
            this.sound.currentTime = 0;
            await this.sound.play();
            if (status) status.textContent = 'Notification sound played.';
        } catch {
            if (status) status.textContent = 'Sound could not play. Try the Play sound button.';
        }
    }
};
window.BookVerse = BookVerse;
BookVerse.sound.volume = 0.35;
BookVerse.soundEnabled = BookVerse.read('sound', true) === true;
const themeToggle = document.querySelector('[data-theme-toggle]');
const pageColors = [
    { color: '#f8f9fa', name: 'Light' },
    { color: '#eef5ff', name: 'Sky' },
    { color: '#f4f0ff', name: 'Lavender' },
    { color: '#edf8f2', name: 'Mint' }
];
let currentColor = 0;
const themeButton = document.querySelector('.theme-button');
function applyTheme(night) {
    document.documentElement.setAttribute('data-bs-theme', night ? 'dark' : 'light');
    document.body.style.removeProperty('background-color');
    themeToggle.textContent = night ? 'Day mode' : 'Night mode';
    themeToggle.setAttribute('aria-pressed', String(night));
    themeButton.disabled = night;
    themeButton.textContent = night ? 'Background: Night' : 'Change background';
}
applyTheme(BookVerse.read('theme', 'light') === 'dark');
themeToggle.addEventListener('click', function () {
    const night = document.documentElement.getAttribute('data-bs-theme') !== 'dark';
    applyTheme(night);
    BookVerse.write('theme', night ? 'dark' : 'light');
});
themeButton.addEventListener('click', function () {
    currentColor = (currentColor + 1) % pageColors.length;
    const selected = pageColors[currentColor];
    document.body.style.setProperty('background-color', selected.color, 'important');
    themeButton.textContent = 'Background: ' + selected.name;
});
const soundToggle = document.querySelector('[data-sound-toggle]');
function updateSoundButton() {
    soundToggle.textContent = 'Sound: ' + (BookVerse.soundEnabled ? 'on' : 'off');
    soundToggle.setAttribute('aria-pressed', String(BookVerse.soundEnabled));
}
updateSoundButton();
soundToggle.addEventListener('click', function () {
    BookVerse.soundEnabled = !BookVerse.soundEnabled;
    BookVerse.write('sound', BookVerse.soundEnabled);
    if (!BookVerse.soundEnabled) BookVerse.sound.pause();
    updateSoundButton();
});
document.querySelector('[data-test-sound]').addEventListener('click', () => BookVerse.playSound(true));

// Arrow navigation wraps around; Tab keeps its normal browser behavior.
const menuLinks = [...document.querySelectorAll('.navbar-nav .nav-link')];
menuLinks.forEach(function (link, index) {
    link.addEventListener('keydown', function (event) {
        let nextIndex;
        switch (event.key) {
            case 'ArrowRight': case 'ArrowDown': nextIndex = (index + 1) % menuLinks.length; break;
            case 'ArrowLeft': case 'ArrowUp': nextIndex = (index - 1 + menuLinks.length) % menuLinks.length; break;
            case 'Home': nextIndex = 0; break;
            case 'End': nextIndex = menuLinks.length - 1; break;
            default: return;
        }
        event.preventDefault();
        menuLinks[nextIndex].focus();
    });
});
const dateTimeElement = document.querySelector('.current-datetime');
function updateDateTime() {
    dateTimeElement.textContent = new Date().toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit', second: '2-digit'
    });
}
updateDateTime();
setInterval(updateDateTime, 1000);
const greetingForm = document.getElementById('greeting-form');
if (greetingForm) {
    greetingForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const name = document.getElementById('reader-name').value.trim();
        document.getElementById('reader-greeting').textContent = name ? 'Welcome, ' + name + '!' : 'Welcome, reader!';
        document.getElementById('greeting-message').textContent = name ? 'Your next story is waiting in the catalog.' : 'Enter your name to personalize the greeting.';
    });
}
