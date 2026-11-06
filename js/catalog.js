// Data objects separate book content from rendering and event handling.
const books = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'classics', description: 'A portrait of ambition, love and illusion during the Jazz Age in America.' },
    { id: 2, title: 'Dune', author: 'Frank Herbert', category: 'science-fiction', description: 'Paul Atreides journeys to Arrakis, a desert world at the center of an interstellar struggle for power.' },
    { id: 3, title: '1984', author: 'George Orwell', category: 'science-fiction', description: 'Winston Smith searches for truth and freedom in a society shaped by surveillance and propaganda.' },
    { id: 4, title: 'Clean Code', author: 'Robert C. Martin', category: 'educational', description: 'Practical principles for writing readable, maintainable software and improving existing code.' },
    { id: 5, title: 'The Hobbit', author: 'J. R. R. Tolkien', category: 'fantasy', description: 'Bilbo Baggins leaves his quiet home for a journey with dwarves, a wizard and an unexpected dragon.' },
    { id: 6, title: 'Sherlock Holmes', author: 'Arthur Conan Doyle', category: 'mystery', description: 'Follow the famous detective and Dr. Watson as observation and deduction unravel puzzling cases.' },
    { id: 7, title: 'Pride and Prejudice', author: 'Jane Austen', category: 'classics', description: 'Elizabeth Bennet navigates family expectations, first impressions and her changing view of Mr. Darcy.' },
    { id: 8, title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', category: 'fantasy', description: 'A young traveler explores friendship, responsibility and the things that matter most.' },
    { id: 9, title: 'Fahrenheit 451', author: 'Ray Bradbury', category: 'science-fiction', description: 'A fireman in a world that burns books begins to question the rules that shape his society.' }
];
window.books = books;
const storedSaved = BookVerse.read('saved', []);
const storedRatings = BookVerse.read('ratings', {});
const library = {
    saved: new Set(Array.isArray(storedSaved) ? storedSaved.filter(id => books.some(book => book.id === id)) : []),
    ratings: storedRatings && typeof storedRatings === 'object' && !Array.isArray(storedRatings) ? storedRatings : {},
    savedOnly: false,
    toggleSaved(id) {
        if (this.saved.has(id)) this.saved.delete(id);
        else this.saved.add(id);
        BookVerse.write('saved', [...this.saved]);
    },
    setRating(id, rating) {
        this.ratings[id] = rating;
        BookVerse.write('ratings', this.ratings);
    },
    getRating(id) {
        const value = this.ratings[id];
        return Number.isInteger(value) && value >= 1 && value <= 5 ? value : 0;
    }
};
const bookGrid = document.querySelector('#book-grid');
const bookSearch = document.querySelector('#book-search');
const categorySelect = document.querySelector('#book-category');
const savedFilter = document.querySelector('#saved-filter');
const categoryNames = { classics: 'Classics', 'science-fiction': 'Science fiction', fantasy: 'Fantasy', educational: 'Educational', mystery: 'Mystery' };
function describeCategory(category) {
    switch (category) {
        case 'classics': return 'Timeless stories about society, ambition and relationships.';
        case 'science-fiction': return 'Explore imagined futures, distant worlds and new ideas.';
        case 'fantasy': return 'Start an adventure beyond the everyday world.';
        case 'educational': return 'Build practical knowledge, one chapter at a time.';
        case 'mystery': return 'Follow the clues and solve a new case.';
        default: return 'Explore all nine books in the BookVerse collection.';
    }
}
function createBookCard(book) {
    const column = document.createElement('div');
    column.className = 'col';
    // Only trusted static data uses innerHTML. User input uses textContent.
    column.innerHTML = `
        <article class="catalog-book bg-white p-4" data-book-id="${book.id}">
            <div class="d-flex align-items-start gap-3">
                <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" data-src="img/book-${book.id}.svg" alt="${book.title} cover" loading="lazy">
                <div><span class="book-type">${categoryNames[book.category]}</span><h3 class="h5 fw-bold mt-2 mb-1">${book.title}</h3><p class="text-muted small mb-0">${book.author}</p></div>
            </div>
            <button type="button" class="btn btn-sm btn-link px-0" data-action="details" aria-expanded="false" aria-controls="description-${book.id}">Read more</button>
            <p id="description-${book.id}" class="book-description text-muted small">${book.description}</p>
            <div class="rating-stars" role="group" aria-label="Rate ${book.title}"></div>
            <p class="rating-label text-muted small mb-3"></p>
            <button type="button" class="btn btn-outline-primary w-100" data-action="save"></button>
        </article>`;
    const card = column.querySelector('article');
    const starGroup = card.querySelector('.rating-stars');
    for (let value = 1; value <= 5; value++) {
        const star = document.createElement('button');
        star.type = 'button'; star.className = 'rating-star'; star.textContent = '\u2605';
        star.dataset.rating = value; star.dataset.action = 'rate';
        star.setAttribute('aria-label', `Rate ${book.title} ${value} out of 5`);
        starGroup.append(star);
    }
    updateCard(card, book.id);
    return column;
}
function updateCard(card, id) {
    const rating = library.getRating(id);
    card.querySelectorAll('.rating-star').forEach(function (star) {
        star.classList.toggle('selected', Number(star.dataset.rating) <= rating);
        star.setAttribute('aria-pressed', String(Number(star.dataset.rating) === rating));
    });
    card.querySelector('.rating-label').textContent = rating ? `Your rating: ${rating} / 5` : 'Choose your rating';
    const saved = library.saved.has(id);
    const button = card.querySelector('[data-action="save"]');
    button.textContent = saved ? 'Remove from reading list' : 'Add to reading list';
    button.setAttribute('aria-pressed', String(saved));
    button.classList.toggle('btn-primary', saved);
    button.classList.toggle('btn-outline-primary', !saved);
    document.querySelector('#reading-count').textContent = 'Reading list: ' + library.saved.size;
}
function renderBooks() {
    const query = bookSearch.value.trim().toLowerCase();
    const visibleBooks = books.filter(function (book) {
        return (categorySelect.value === 'all' || book.category === categorySelect.value)
            && `${book.title} ${book.author}`.toLowerCase().includes(query)
            && (!library.savedOnly || library.saved.has(book.id));
    });
    bookGrid.replaceChildren(...visibleBooks.map(createBookCard));
    document.querySelector('#catalog-count').textContent = `${visibleBooks.length} of ${books.length} books shown`;
    document.querySelector('#empty-catalog').hidden = visibleBooks.length > 0;
    document.querySelector('#reading-count').textContent = 'Reading list: ' + library.saved.size;
    document.querySelector('#category-description').textContent = describeCategory(categorySelect.value);
    document.dispatchEvent(new CustomEvent('bookverse:catalog-rendered'));
}
window.renderBooks = renderBooks;
categorySelect.addEventListener('change', renderBooks);
savedFilter.addEventListener('click', function () {
    library.savedOnly = !library.savedOnly;
    savedFilter.setAttribute('aria-pressed', String(library.savedOnly));
    savedFilter.classList.toggle('active', library.savedOnly);
    renderBooks();
});
document.querySelector('#reset-filters').addEventListener('click', function () {
    bookSearch.value = ''; categorySelect.value = 'all'; library.savedOnly = false;
    savedFilter.setAttribute('aria-pressed', 'false'); savedFilter.classList.remove('active');
    renderBooks(); bookSearch.focus();
});
// Delegation also handles cards that are created after a filter change.
bookGrid.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const card = button.closest('[data-book-id]');
    const id = Number(card.dataset.bookId);
    const book = books.find(item => item.id === id);
    switch (button.dataset.action) {
        case 'details': {
            const expanded = button.getAttribute('aria-expanded') !== 'true';
            card.querySelector('.book-description').style.display = expanded ? 'block' : 'none';
            button.setAttribute('aria-expanded', String(expanded));
            button.textContent = expanded ? 'Read less' : 'Read more';
            break;
        }
        case 'rate':
            library.setRating(id, Number(button.dataset.rating)); updateCard(card, id);
            document.querySelector('#catalog-feedback').textContent = `${book.title}: rated ${library.getRating(id)} out of 5.`;
            if (window.BookVerseToast) window.BookVerseToast(`${book.title} rated ${library.getRating(id)} out of 5.`);
            break;
        case 'save': {
            library.toggleSaved(id); updateCard(card, id);
            const added = library.saved.has(id);
            document.querySelector('#catalog-feedback').textContent = book.title + (added ? ' added to your reading list.' : ' removed from your reading list.');
            if (window.BookVerseToast) window.BookVerseToast(book.title + (added ? ' added to your reading list.' : ' removed from your reading list.'));
            if (added) {
                card.classList.remove('just-saved');
                void card.offsetWidth; // Restart the event-triggered pulse.
                card.classList.add('just-saved'); BookVerse.playSound();
            } else if (library.savedOnly) { renderBooks(); savedFilter.focus(); }
            break;
        }
    }
});
renderBooks();
