// Assignment 6 - jQuery features for the BookVerse project.
// jQuery is loaded from the official CDN in the <head> of every page.

if (!window.jQuery) {
    console.error('BookVerse jQuery features require an internet connection to load the official jQuery CDN.');
} else {
$(document).ready(function () {
    console.log('jQuery is ready!');

    // Shared visual components: the reading progress bar and toast region.
    $('body').prepend(
        '<div id="reading-progress" role="progressbar" aria-label="Page scroll progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
        '<span id="reading-progress-fill"></span></div>'
    );
    $('body').append('<div id="bookverse-toast-container" aria-live="polite" aria-atomic="false"></div>');

    window.BookVerseToast = function (message) {
        if (!message) return;
        const $toast = $('<div>', { class: 'bookverse-toast', role: 'status' }).text(message);
        $('#bookverse-toast-container').append($toast);
        $toast.hide().fadeIn(180).delay(2600).fadeOut(350, function () {
            $(this).remove();
        });
    };

    // Task 4. Scroll progress uses the current scroll position and total page height.
    function updateScrollProgress() {
        const scrollTop = $(window).scrollTop();
        const scrollable = $(document).height() - $(window).height();
        const progress = scrollable > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollable) * 100)) : 0;
        $('#reading-progress-fill').css('width', progress + '%');
        $('#reading-progress').attr('aria-valuenow', String(Math.round(progress)));
    }
    $(window).on('scroll resize', updateScrollProgress);
    updateScrollProgress();

    // Task 9. Images are assigned their real src only shortly before entering the viewport.
    function loadVisibleImages() {
        const viewportBottom = $(window).scrollTop() + $(window).height() + 220;
        $('img[data-src]').filter(function () {
            return $(this).is(':visible') && $(this).offset().top < viewportBottom;
        }).each(function () {
            const $image = $(this);
            const source = $image.attr('data-src');
            if (!source) return;
            $image.attr('src', source).removeAttr('data-src').addClass('lazy-loaded');
        });
    }
    $(window).on('scroll resize', loadVisibleImages);
    const catalogCarousel = document.getElementById('catalogCarousel');
    if (catalogCarousel) catalogCarousel.addEventListener('slid.bs.carousel', loadVisibleImages);
    $(document).on('bookverse:catalog-rendered', loadVisibleImages);
    loadVisibleImages();

    // Task 1 and Task 2. Live filtering and autocomplete suggestions on the catalog page.
    const $search = $('#book-search');
    const $suggestions = $('#search-suggestions');

    function getSearchMatches(query) {
        if (!Array.isArray(window.books) || query.length < 2) return $();
        const normalized = query.toLowerCase();
        return $(window.books).filter(function () {
            return (this.title + ' ' + this.author).toLowerCase().includes(normalized);
        }).slice(0, 5);
    }

    function renderSuggestions(query) {
        if (!$suggestions.length) return;
        $suggestions.empty();
        if (query.length < 2) {
            $suggestions.prop('hidden', true);
            return;
        }

        const matches = getSearchMatches(query);
        if (!matches.length) {
            $('<div>', { class: 'search-suggestion text-muted', role: 'option' })
                .text('No matching titles. Try another keyword.')
                .appendTo($suggestions);
        } else {
            matches.each(function () {
                const book = this;
                const $option = $('<button>', {
                    type: 'button', class: 'search-suggestion', role: 'option',
                    'aria-label': book.title + ' by ' + book.author
                });
                $('<span>').text(book.title).appendTo($option);
                $('<small>').text(book.author).appendTo($option);
                $option.data('book-title', book.title).appendTo($suggestions);
            });
        }
        $suggestions.prop('hidden', false);
    }

    // Task 3. Escape user input before building a regular expression and mark every match.
    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    function escapeHtml(value) {
        return value.replace(/[&<>"']/g, function (character) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
        });
    }
    function highlightSearchTerms(query) {
        if (!$('#book-grid').length) return;
        const terms = [...new Set(query.trim().split(/\s+/).filter(Boolean))].sort(function (a, b) { return b.length - a.length; });
        const expression = terms.length
            ? new RegExp('(' + terms.map(escapeRegExp).join('|') + ')', 'ig')
            : null;
        $('.catalog-book').each(function () {
            const $card = $(this);
            $card.find('h3, .d-flex.align-items-start .text-muted.small').each(function () {
                const original = $(this).text();
                if (!expression) {
                    $(this).text(original);
                    return;
                }
                const safeText = escapeHtml(original);
                $(this).html(safeText.replace(expression, '<mark class="search-highlight">$1</mark>'));
            });
        });
    }

    if ($search.length) {
        $search.on('input keyup', function (event) {
            const query = $(this).val().trim();
            if (typeof window.renderBooks === 'function') window.renderBooks();
            renderSuggestions(query);
            highlightSearchTerms(query);
        });

        $suggestions.on('click', '.search-suggestion[data-book-title]', function () {
            const title = $(this).data('book-title');
            $search.val(title);
            if (typeof window.renderBooks === 'function') window.renderBooks();
            renderSuggestions('');
            highlightSearchTerms(title);
            $suggestions.prop('hidden', true);
            $search.trigger('focus');
        });

        $search.on('keydown', function (event) {
            if (event.key === 'Escape') $suggestions.prop('hidden', true);
            if (event.key === 'ArrowDown' && !$suggestions.prop('hidden')) {
                event.preventDefault();
                $suggestions.find('button').first().trigger('focus');
            }
        });
        $suggestions.on('keydown', 'button', function (event) {
            if (event.key === 'Escape') { $suggestions.prop('hidden', true); $search.trigger('focus'); }
        });
        $(document).on('click', function (event) {
            if (!$(event.target).closest('#book-search, #search-suggestions').length) $suggestions.prop('hidden', true);
        });
        $(document).on('bookverse:catalog-rendered', function () {
            highlightSearchTerms($search.val());
        });

        $('#reset-filters').on('click', function () {
            $suggestions.prop('hidden', true);
            highlightSearchTerms('');
        });
    }

    // Task 5. Number counters animate once when their cards enter the viewport.
    function animateVisibleCounters() {
        const viewportBottom = $(window).scrollTop() + $(window).height();
        $('[data-counter]:not(.counter-complete)').each(function () {
            const $counter = $(this);
            if ($counter.offset().top > viewportBottom - 40) return;
            const target = Number($counter.attr('data-counter')) || 0;
            $counter.addClass('counter-complete').prop('countValue', 0).animate(
                { countValue: target },
                {
                    duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1400,
                    easing: 'swing',
                    step: function (now) { $counter.text(Math.floor(now).toLocaleString('en-US') + '+'); },
                    complete: function () { $counter.text(target.toLocaleString('en-US') + '+'); }
                }
            );
        });
    }
    $(window).on('scroll resize', animateVisibleCounters);
    animateVisibleCounters();

    // Task 6. A short delayed response simulates a server request without sending form data.
    $('#contact-form').on('submit', function () {
        const form = this;
        if (form.dataset.validated !== 'true') return;
        const $button = $('#form-submit');
        if ($button.prop('disabled')) return;
        $button.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Please wait...');
        setTimeout(function () {
            $button.prop('disabled', false).text('Finish profile');
            form.dataset.validated = 'false';
            $('#form-success').prop('hidden', false).trigger('focus');
            if (window.BookVerse && typeof window.BookVerse.playSound === 'function') window.BookVerse.playSound();
            window.BookVerseToast('Your BookVerse profile form was submitted successfully.');
        }, 1100);
    });

    $('#subscribe-form').on('submit', function () {
        const form = this;
        if (form.dataset.validated !== 'true') return;
        const $button = $(form).find('button[type="submit"]');
        if ($button.prop('disabled')) return;
        $button.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Please wait...');
        setTimeout(function () {
            $button.prop('disabled', false).text('Subscribe');
            form.dataset.validated = 'false';
            $('#subscribe-message').text('Thank you! The popup form works correctly. No data was sent.');
            form.reset();
            window.BookVerseToast('Subscription demo completed successfully.');
        }, 950);
    });

    // Task 7. Toasts confirm key user actions and fade away automatically.
    $('[data-theme-toggle]').on('click', function () {
        window.BookVerseToast($(this).attr('aria-pressed') === 'true' ? 'Night theme enabled.' : 'Light theme enabled.');
    });
    $('.theme-button').on('click', function () { window.BookVerseToast('Background color updated.'); });
    $('[data-sound-toggle]').on('click', function () { window.BookVerseToast('Sound preference updated.'); });
    $('[data-popup-open]').on('click', function () { window.BookVerseToast('Subscription form opened.'); });

    // Task 8. Copy the supplied text and show a checkmark + tooltip-style confirmation.
    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }
        const $temporary = $('<textarea>', { readonly: true }).css({ position: 'fixed', opacity: 0 }).val(text).appendTo('body');
        $temporary[0].select();
        const copied = document.execCommand('copy');
        $temporary.remove();
        if (!copied) throw new Error('Clipboard is not available in this browser.');
    }
    $(document).on('click', '[data-copy-text]', async function () {
        const $button = $(this);
        const originalText = $button.text();
        try {
            await copyText(String($button.attr('data-copy-text') || ''));
            $button.text('✓ Copied').attr('aria-label', 'Copied to clipboard');
            $button.siblings('.copy-feedback').text('Copied to clipboard!');
            $button.attr('title', 'Copied to clipboard!');
            window.BookVerseToast('Project link copied to clipboard.');
            setTimeout(function () {
                $button.text(originalText).attr('aria-label', originalText).attr('title', 'Copy to clipboard');
                $button.siblings('.copy-feedback').text('');
            }, 2200);
        } catch (error) {
            $button.siblings('.copy-feedback').text('Copy was not available. Select the link manually.');
        }
    });
});
}
