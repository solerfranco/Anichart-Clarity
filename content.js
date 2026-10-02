let hideUnmarked = true;

// Load user preference for toggling
chrome.storage.local.get(['hideUnmarked'], (res) => {
    if (res.hideUnmarked !== undefined) {
        hideUnmarked = res.hideUnmarked;
    }
});

// Listen for toggle action from background (fallback)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggle_watching') {
        toggleUnmarked();
    }
});

function toggleUnmarked() {
    hideUnmarked = !hideUnmarked;
    chrome.storage.local.set({ hideUnmarked });
    updateCards();
}

function syncToggleUI() {
    const text = document.getElementById('anichart-clarity-toggle-text');
    const cb = document.getElementById('anichart-clarity-checkbox');
    if (text) {
        text.textContent = hideUnmarked ? 'Hide Unmarked' : 'Show All';
    }
    if (cb && cb.checked !== hideUnmarked) {
        cb.checked = hideUnmarked;
    }
}

function createBtn() {
    const btnWrap = document.createElement('div');
    btnWrap.id = 'anichart-clarity-toggle-wrap';
    btnWrap.style.display = 'inline-flex';
    btnWrap.style.alignItems = 'center';
    btnWrap.style.marginRight = '15px';
    btnWrap.style.zIndex = '9999';

    // Label text
    const labelText = document.createElement('span');
    labelText.id = 'anichart-clarity-toggle-text';
    labelText.style.marginRight = '8px';
    labelText.style.fontWeight = 'bold';
    labelText.style.fontSize = '13px';
    labelText.textContent = 'Hide Unmarked';
    btnWrap.appendChild(labelText);

    // Toggle switch container
    const switchLabel = document.createElement('label');
    switchLabel.className = 'clarity-switch';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'anichart-clarity-checkbox';
    // Checked means "Hide Unmarked" is ON
    checkbox.checked = hideUnmarked;
    checkbox.addEventListener('change', (e) => {
        hideUnmarked = e.target.checked;
        chrome.storage.local.set({ hideUnmarked });
        
        if (document.startViewTransition) {
            document.startViewTransition(() => {
                updateCards();
                syncToggleUI();
            });
        } else {
            updateCards();
            syncToggleUI();
        }
    });
    
    const slider = document.createElement('span');
    slider.className = 'clarity-slider';
    
    switchLabel.appendChild(checkbox);
    switchLabel.appendChild(slider);
    btnWrap.appendChild(switchLabel);

    return btnWrap;
}

function injectToggle() {
    if (document.getElementById('anichart-clarity-toggle-wrap')) return;
    
    const filtersContainer = document.querySelector('.filters');
    
    // Only inject if the filters container exists, preventing flashing
    if (!filtersContainer) return;
    
    const wrap = createBtn();
    wrap.style.display = 'inline-flex';
    wrap.style.marginRight = '15px';
    filtersContainer.insertBefore(wrap, filtersContainer.firstChild);
    
    syncToggleUI();
}

function updateCards() {
    const cards = document.querySelectorAll('.media-card');
    let markedCount = 0;
    
    cards.forEach(card => {
        const highlighter = card.querySelector('.highlighter');
        let status = 'none'; // 'none', 'watching', 'maybe'
        
        if (highlighter) {
            const svg = highlighter.querySelector('svg');
            if (svg) {
                const html = svg.innerHTML;
                const lowerHtml = html.toLowerCase();
                
                // The default '+' icon has this exact path:
                if (!html.includes('M12 8v8M8 12h8')) {
                     // Check for yellow/orange colors that indicate "Maybe/Planning"
                     if (lowerHtml.match(/#e6a23c|#f5a623|#ffc107|#ff9800|#f39c12|#e67e22|orange|yellow/) ||
                         card.className.toLowerCase().includes('maybe') ||
                         highlighter.className.toLowerCase().includes('maybe') ||
                         card.className.toLowerCase().includes('planning') ||
                         highlighter.className.toLowerCase().includes('planning')) {
                         status = 'maybe';
                     } else {
                         status = 'watching';
                     }
                }
            }
        }
        
        if (status === 'watching') {
            card.classList.add('is-watching');
            card.classList.remove('is-maybe');
            markedCount++;
        } else if (status === 'maybe') {
            card.classList.add('is-maybe');
            card.classList.remove('is-watching');
            markedCount++;
        } else {
            card.classList.remove('is-watching');
            card.classList.remove('is-maybe');
        }
        
        addEmissionTags(card);
    });
    
    // Hide unmarked body toggle
    if (hideUnmarked && markedCount > 0) {
        document.body.classList.add('hide-unmarked');
    } else {
        document.body.classList.remove('hide-unmarked');
    }

    // Hide empty categories when filtering
    const cardContainers = new Set();
    cards.forEach(c => {
        if (c.parentElement) cardContainers.add(c.parentElement);
    });

    cardContainers.forEach(container => {
        // Find visible cards in this container
        const containerCards = container.querySelectorAll('.media-card');
        if (containerCards.length === 0) return;

        let hasVisible = !hideUnmarked || markedCount === 0;
        if (!hasVisible) {
            for (let c of containerCards) {
                if (c.classList.contains('is-watching') || c.classList.contains('is-maybe')) {
                    hasVisible = true;
                    break;
                }
            }
        }
        
        // Hide the grid container itself
        container.style.display = hasVisible ? '' : 'none';
        
        // Hide the category title (e.g. "TV", "Movies") that appears right before the grid
        let prev = container.previousElementSibling;
        while (prev && (prev.tagName === 'BR' || prev.tagName === 'HR' || prev.classList.contains('ad-container'))) {
             prev = prev.previousElementSibling;
        }
        if (prev && (prev.tagName.match(/^H\d$/) || prev.classList.contains('title') || prev.classList.contains('heading'))) {
            prev.style.display = hasVisible ? '' : 'none';
        }
    });
}

function addEmissionTags(card) {
    const episodeDiv = card.querySelector('.episode');
    if (!episodeDiv) return;
    
    if (episodeDiv.parentElement.querySelector('.emission-tag')) return;
    
    const text = episodeDiv.textContent;
    const match = text.match(/Ep (\d+)/i);
    if (match) {
        const epNum = parseInt(match[1]);
        const tag = document.createElement('span');
        tag.classList.add('emission-tag');
        
        if (epNum > 1) {
            tag.classList.add('emitting');
            tag.textContent = 'EMITTING';
        } else {
            tag.classList.add('not-started');
            tag.textContent = 'UPCOMING';
        }
        
        episodeDiv.parentNode.insertBefore(tag, episodeDiv);
    }
}

let updateTimeout = null;

const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    for (let mut of mutations) {
        if (mut.type === 'childList') {
            for (let node of mut.addedNodes) {
                if (node.nodeType === 1 && (node.classList.contains('media-card') || node.querySelector && node.querySelector('.media-card'))) {
                    shouldUpdate = true;
                    break;
                }
            }
        }
        
        if (mut.target && mut.target.nodeType === 1) {
            if (mut.target.classList && mut.target.classList.contains('highlighter') || mut.target.closest && mut.target.closest('.highlighter')) {
                shouldUpdate = true;
                break;
            }
        }
        
        if (shouldUpdate) break;
    }
    
    if (shouldUpdate) {
        if (updateTimeout) clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            updateCards();
            injectToggle();
        }, 100);
    }
});

window.addEventListener('load', () => {
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'd', 'stroke', 'fill'] });
    updateCards();
    injectToggle();
});
