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
        let isMarked = false;
        
        if (highlighter) {
            const svg = highlighter.querySelector('svg');
            if (svg) {
                const html = svg.innerHTML;
                // The default '+' icon has this exact path:
                if (!html.includes('M12 8v8M8 12h8')) {
                     isMarked = true;
                }
            }
        }
        
        if (isMarked) {
            card.classList.add('is-watching');
            markedCount++;
        } else {
            card.classList.remove('is-watching');
        }
        
        addEmissionTags(card);
    });
    
    // Update body classes based on toggle and markedCount
    // If markedCount === 0, we force show everything.
    if (hideUnmarked && markedCount > 0) {
        document.body.classList.add('hide-unmarked');
    } else {
        document.body.classList.remove('hide-unmarked');
    }
    
    syncToggleUI();
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
