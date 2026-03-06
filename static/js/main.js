/**
 * Main application logic for Markdown to PDF Converter
 * Handles file upload, text input, configuration, and API calls
 */
console.log('main.js loading');
window.addEventListener('error', function(e) {
    console.error('Global error caught:', e.error);
});

class MarkdownToPDFConverter {
    constructor() {
        try {
            // DOM Elements
            this.tabs = document.querySelectorAll('.tab');
            this.tabContents = document.querySelectorAll('.tab-content');
            this.fileInput = document.getElementById('file-input');
            this.browseBtn = document.getElementById('browse-btn');
            this.dropArea = document.getElementById('drop-area');
            this.filePreview = document.getElementById('file-preview');
            this.fileName = document.getElementById('file-name');
            this.fileSize = document.getElementById('file-size');
            this.removeFileBtn = document.getElementById('remove-file');
            this.markdownText = document.getElementById('markdown-text');
            this.pasteTextBtn = document.getElementById('paste-text');
            this.addDividerBtn = document.getElementById('add-divider');
            this.clearTextBtn = document.getElementById('clear-text');
            this.sampleTextBtn = document.getElementById('sample-text');
            this.combinedStats = document.getElementById('combined-stats');
            this.convertBtn = document.getElementById('convert-btn');
            this.resetConfigBtn = document.getElementById('reset-config');
            this.presetsSelect = document.getElementById('presets');
            this.resultArea = document.getElementById('result-area');
            this.errorArea = document.getElementById('error-area');
            this.downloadLink = document.getElementById('download-link');
            this.openLink = document.getElementById('open-link');
            this.dismissErrorBtn = document.getElementById('dismiss-error');
            this.loadingOverlay = document.getElementById('loading-overlay');
            this.cancelConversionBtn = document.getElementById('cancel-conversion');

            // Configuration inputs
            this.configInputs = {
                pdfEngine: document.getElementById('pdf-engine'),
                documentClass: document.getElementById('document-class'),
                geometry: document.getElementById('geometry'),
                fontsize: document.getElementById('fontsize'),
                mainfont: document.getElementById('mainfont'),
                linestretch: document.getElementById('linestretch'),
                colorlinks: document.getElementById('colorlinks'),
                numberSections: document.getElementById('number-sections'),
                toc: document.getElementById('toc'),
                languageZh: document.getElementById('language-zh'),
                languageJa: document.getElementById('language-ja'),
                languageKo: document.getElementById('language-ko'),
                cjkMainfont: document.getElementById('cjk-mainfont'),
                cjkSansfont: document.getElementById('cjk-sansfont'),
                cjkMonofont: document.getElementById('cjk-monofont')
            };

            // Additional DOM elements
            this.cjkFontsGroup = document.getElementById('cjk-fonts-group');

            // Modal elements
            this.openModalStatsBtn = document.getElementById('open-modal-stats');
            this.openModalActionBtn = document.getElementById('open-modal-action');
            this.modal = document.getElementById('config-modal');
            this.closeModalBtn = document.getElementById('close-modal');
            this.cancelModalBtn = document.getElementById('cancel-modal');
            this.saveModalBtn = document.getElementById('save-modal');
            this.resetAllModalBtn = document.getElementById('reset-all-modal');
            this.modalTitle = document.getElementById('modal-title');

            // Modal state
            this.previousFocusElement = null;
            this.debouncedUpdateTextStats = MarkdownToPDFConverter.debounce(() => this.updateTextStats(), 300);

            // State
            this.currentFile = null;
            this.currentPreset = null;
            this.abortController = null;
            this.currentRequestId = null;
            this.currentOutputFilename = null;

            console.log('MarkdownToPDFConverter constructor called');
            this.init();
        } catch (error) {
            console.error('Error in MarkdownToPDFConverter constructor:', error);
        }
    }

    // Static debounce utility
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Hardcoded presets for modal
    static PRESETS = {
        academic: {
            'document-class': 'article',
            'fontsize': '12pt',
            'geometry': 'margin=1in',
            'linestretch': '1.25',
            'colorlinks': false,
            'number-sections': true,
            'toc': true
        },
        simple: {
            'document-class': 'article',
            'fontsize': '12pt',
            'geometry': 'margin=0.75in',
            'colorlinks': true,
            'number-sections': false,
            'toc': false
        },
        book: {
            'document-class': 'book',
            'fontsize': '11pt',
            'geometry': 'margin=1.5in,headheight=15pt',
            'linestretch': '1.15',
            'colorlinks': true,
            'number-sections': true,
            'toc': true
        },
        chinese: {
            'language': 'zh'
        },
        japanese: {
            'language': 'ja'
        },
        korean: {
            'language': 'ko'
        }
    };

    init() {
        console.log('MarkdownToPDFConverter init() called');
        // Tab switching
        this.setupTabs();

        // File upload handling
        this.setupFileUpload();

        // Text input handling
        this.setupTextInput();

        // Configuration handling
        this.setupConfiguration();

        // Language handling
        this.setupLanguageHandling();

        // Modal handling
        this.setupModal();

        // Event listeners for buttons
        this.setupEventListeners();

        // Load presets from API
        this.loadPresets();

        // Initialize text stats
        this.updateTextStats();
    }

    setupTabs() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.getAttribute('data-target');
                this.switchTab(targetId);
            });
        });
    }

    switchTab(targetId) {
        // Update active tab
        this.tabs.forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.tab[data-target="${targetId}"]`).classList.add('active');

        // Update active content
        this.tabContents.forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(targetId).classList.add('active');
    }

    setupFileUpload() {
        // Browse button
        this.browseBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, () => {
                this.dropArea.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, () => {
                this.dropArea.classList.remove('dragover');
            });
        });

        this.dropArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        // Remove file
        this.removeFileBtn.addEventListener('click', () => {
            this.clearFile();
        });
    }

    handleFileSelect(file) {
        // Validate file type and size
        const allowedExtensions = ['md', 'txt', 'markdown'];
        const maxSize = 16 * 1024 * 1024; // 16MB

        const extension = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            this.showError('Invalid file type. Please upload a .md, .txt, or .markdown file.');
            return;
        }

        if (file.size > maxSize) {
            this.showError('File too large. Maximum size is 16MB.');
            return;
        }

        // Store file and update UI
        this.currentFile = file;
        this.updateFilePreview();

        // Switch to file tab if not already
        this.switchTab('file-tab');
    }

    updateFilePreview() {
        if (!this.currentFile) {
            this.filePreview.classList.add('hidden');
            return;
        }

        this.fileName.textContent = this.currentFile.name;
        this.fileSize.textContent = this.formatFileSize(this.currentFile.size);
        this.filePreview.classList.remove('hidden');
    }

    clearFile() {
        this.currentFile = null;
        this.fileInput.value = '';
        this.filePreview.classList.add('hidden');
    }

    setupTextInput() {
        // Text area input with debounced update
        this.markdownText.addEventListener('input', this.debouncedUpdateTextStats);

        // Paste text button
        this.pasteTextBtn.addEventListener('click', async () => {
            await this.pasteText();
        });

        // Add divider button
        this.addDividerBtn.addEventListener('click', () => {
            this.addDivider();
        });

        // Clear text button
        this.clearTextBtn.addEventListener('click', () => {
            this.markdownText.value = '';
            this.updateTextStats();
        });

        // Sample text button
        this.sampleTextBtn.addEventListener('click', () => {
            this.loadSampleText();
        });
    }

    updateTextStats() {
        const text = this.markdownText.value;
        const chars = text.length;
        const lines = text.split('\n').length;

        this.combinedStats.textContent = `${chars.toLocaleString()} characters, ${lines.toLocaleString()} lines`;
    }

    loadSampleText() {
        const sampleText = `# Sample Markdown Document

## Introduction
This is a sample Markdown document to demonstrate the conversion capabilities.

### Features
- **Easy to write** - Simple syntax
- *Flexible* - Supports various elements
- \`Code blocks\` - With syntax highlighting

## Code Example
\`\`\`python
def hello_world():
    print("Hello, World!")
    return True
\`\`\`

## Math (LaTeX)
Inline math: $E = mc^2$

Display math:
$$
\\int_a^b f(x) dx = F(b) - F(a)
$$

## Table
| Name | Age | Role |
|------|-----|------|
| Alice | 28 | Developer |
| Bob | 32 | Designer |

## Links and Images
[OpenAI](https://openai.com)
![Placeholder](https://via.placeholder.com/150)

> "This is a blockquote."
> – Author

---

**Enjoy converting!**`;

        this.markdownText.value = sampleText;
        this.updateTextStats();
    }

    async pasteText() {
        try {
            const text = await navigator.clipboard.readText();
            // Insert at cursor position or replace selection
            const textarea = this.markdownText;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            // Replace selection or insert at cursor
            const before = textarea.value.substring(0, start);
            const after = textarea.value.substring(end);
            textarea.value = before + text + after;

            // Move cursor to end of inserted text
            const newCursorPos = start + text.length;
            textarea.selectionStart = newCursorPos;
            textarea.selectionEnd = newCursorPos;

            // Update stats
            this.updateTextStats();

            // Focus the textarea
            textarea.focus();
        } catch (error) {
            console.error('Failed to paste from clipboard:', error);
            alert('Unable to paste from clipboard. Please ensure you have granted clipboard permissions.');
        }
    }

    addDivider() {
        // Insert Markdown divider at cursor position with empty line spacing
        const textarea = this.markdownText;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);

        // Check if we're at the beginning of the text
        const isAtBeginning = start === 0;
        const isAtEnd = end === textarea.value.length;

        // Analyze text before cursor to determine needed spacing
        let spacingBefore = '';
        if (!isAtBeginning) {
            // Count newlines at the end of 'before' text
            let newlineCount = 0;
            for (let i = before.length - 1; i >= 0; i--) {
                if (before.charAt(i) === '\n') {
                    newlineCount++;
                } else {
                    break;
                }
            }

            // Ensure at least two newlines before the divider (empty line)
            if (newlineCount === 0) {
                spacingBefore = '\n\n';
            } else if (newlineCount === 1) {
                spacingBefore = '\n';
            }
            // If newlineCount >= 2, we already have empty line spacing
        } else {
            // At beginning of text, no spacing needed before
            spacingBefore = '';
        }

        // Analyze text after cursor to determine needed spacing
        let spacingAfter = '';
        if (!isAtEnd) {
            // Count newlines at the beginning of 'after' text
            let newlineCount = 0;
            for (let i = 0; i < after.length; i++) {
                if (after.charAt(i) === '\n') {
                    newlineCount++;
                } else {
                    break;
                }
            }

            // Ensure at least two newlines after the divider (empty line)
            if (newlineCount === 0) {
                spacingAfter = '\n\n';
            } else if (newlineCount === 1) {
                spacingAfter = '\n';
            }
            // If newlineCount >= 2, we already have empty line spacing
        } else {
            // At end of text, add spacing after
            spacingAfter = '\n\n';
        }

        // Markdown divider with proper spacing
        const divider = spacingBefore + '---' + spacingAfter;

        // Replace selection or insert at cursor
        textarea.value = before + divider + after;

        // Move cursor to end of inserted divider (after the final spacing)
        const newCursorPos = start + divider.length;
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;

        // Update stats
        this.updateTextStats();

        // Focus the textarea
        textarea.focus();
    }

    setupConfiguration() {
        // Preset selection
        this.presetsSelect.addEventListener('change', (e) => {
            const presetId = e.target.value;
            if (presetId) {
                this.applyPreset(presetId);
            } else {
                // Custom preset selected - uncheck language checkboxes and hide CJK fonts
                this.currentPreset = null;
                this.configInputs.languageZh.checked = false;
                this.configInputs.languageJa.checked = false;
                this.configInputs.languageKo.checked = false;
                this.updateCJKFontsVisibility();
            }
        });

        // Reset configuration (only if button exists)
        if (this.resetConfigBtn) {
            this.resetConfigBtn.addEventListener('click', () => {
                this.resetConfiguration();
            });
        }
    }

    setupLanguageHandling() {
        // Mutual exclusivity for language checkboxes
        const languageCheckboxes = [this.configInputs.languageZh, this.configInputs.languageJa, this.configInputs.languageKo];
        languageCheckboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                if (e.target.checked) {
                    // Uncheck other language checkboxes
                    languageCheckboxes.forEach(other => {
                        if (other !== e.target) other.checked = false;
                    });
                }
                // Update CJK fonts group visibility
                this.updateCJKFontsVisibility();
            });
        });
    }

    updateCJKFontsVisibility() {
        // Show CJK fonts group if any language checkbox is checked
        const languageCheckboxes = [this.configInputs.languageZh, this.configInputs.languageJa, this.configInputs.languageKo];
        const anyChecked = languageCheckboxes.some(cb => cb.checked);
        this.cjkFontsGroup.style.display = anyChecked ? 'block' : 'none';
    }

    setupModal() {
        try {
            console.log('Setting up modal...');
            console.log('openModalStatsBtn:', this.openModalStatsBtn);
            console.log('openModalActionBtn:', this.openModalActionBtn);
            console.log('modal:', this.modal);
            console.log('closeModalBtn:', this.closeModalBtn);
            console.log('cancelModalBtn:', this.cancelModalBtn);
            console.log('saveModalBtn:', this.saveModalBtn);
            console.log('resetAllModalBtn:', this.resetAllModalBtn);

            // Check for required elements
            if (!this.openModalStatsBtn || !this.openModalActionBtn || !this.modal) {
                console.error('Modal setup failed: missing required DOM elements');
                // Show visible error
                this.showVisibleError('Modal setup failed: missing required DOM elements. Check browser console.');
                return;
            }

            // Check for modal control elements
            if (!this.closeModalBtn) {
                console.warn('closeModalBtn not found');
            }
            if (!this.cancelModalBtn) {
                console.warn('cancelModalBtn not found');
            }
            if (!this.saveModalBtn) {
                console.warn('saveModalBtn not found');
            }
            if (!this.resetAllModalBtn) {
                console.warn('resetAllModalBtn not found');
            }

        // Track previously focused element for accessibility
        this.previousFocusElement = null;

        // Open modal from both buttons
        const openModal = () => {
            console.log('Opening modal, closeModalBtn:', this.closeModalBtn);
            console.log('Modal classList before:', this.modal.classList);
            alert('Modal opened - debugging'); // Temporary debug
            this.modal.classList.remove('hidden');
            console.log('Modal classList after:', this.modal.classList);
            this.modal.setAttribute('aria-hidden', 'false');
            this.previousFocusElement = document.activeElement;
            if (this.closeModalBtn) {
                this.closeModalBtn.focus();
                console.log('Focused close button');
            } else {
                console.error('Cannot focus closeModalBtn: element not found');
            }
            // Additional debug: check computed display style
            const display = window.getComputedStyle(this.modal).display;
            console.log('Modal computed display:', display);
        };

        // Safe event listener helper
        const safeAddEventListener = (element, event, handler) => {
            if (element) {
                console.log(`Adding ${event} listener to`, element.id || element);
                element.addEventListener(event, handler);
            } else {
                console.warn(`Cannot add ${event} listener to missing element`);
            }
        };

        safeAddEventListener(this.openModalStatsBtn, 'click', openModal);
        safeAddEventListener(this.openModalActionBtn, 'click', openModal);

        // Close modal
        const closeModal = () => {
            this.modal.classList.add('hidden');
            this.modal.setAttribute('aria-hidden', 'true');
            if (this.previousFocusElement) {
                this.previousFocusElement.focus();
            }
        };

        safeAddEventListener(this.closeModalBtn, 'click', closeModal);
        safeAddEventListener(this.cancelModalBtn, 'click', closeModal);

        // Save modal (just close for now, configuration is already saved to state)
        safeAddEventListener(this.saveModalBtn, 'click', () => {
            closeModal();
            // Optional: Show confirmation or update UI
        });

        // Close modal when clicking outside
        safeAddEventListener(this.modal, 'click', (e) => {
            if (e.target === this.modal) {
                closeModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                closeModal();
            }
        });

        // Language support - show CJK fonts when any CJK language is selected
        // This is already handled by setupLanguageHandling(), but we need to ensure
        // the event delegation works for modal checkboxes
        const languageCheckboxes = document.querySelectorAll('input[name="language"]');
        const modalBody = document.querySelector('.modal-body');

        // Event delegation for language checkboxes in modal
        if (modalBody) {
            modalBody.addEventListener('change', (e) => {
                if (e.target.matches('input[name="language"]')) {
                    const anyChecked = Array.from(languageCheckboxes).some(cb => cb.checked);
                    this.cjkFontsGroup.style.display = anyChecked ? 'block' : 'none';
                }
            });
        }

        // Preset selection - handled by setupConfiguration() via this.presetsSelect

        // Reset all button in modal
        safeAddEventListener(this.resetAllModalBtn, 'click', () => {
            // Reset text area
            this.markdownText.value = '';
            this.updateTextStats();

            // Reset modal settings
            this.presetsSelect.value = '';
            this.configInputs.pdfEngine.value = 'xelatex';
            this.configInputs.documentClass.value = 'article';
            this.configInputs.geometry.value = 'margin=1in';
            this.configInputs.linestretch.value = '';
            this.configInputs.mainfont.value = '';
            this.configInputs.fontsize.value = '12pt';
            this.configInputs.colorlinks.checked = true;
            this.configInputs.numberSections.checked = false;
            this.configInputs.toc.checked = false;

            // Reset language checkboxes
            languageCheckboxes.forEach(cb => cb.checked = false);
            this.cjkFontsGroup.style.display = 'none';

            // Optional: Show confirmation
            console.log('All settings reset');
        });

        console.log('Modal setup complete');
        // Show temporary success message
        this.showVisibleSuccess('Modal system ready. Click "Configuration Options" to open modal.');
        } catch (error) {
            console.error('Error in setupModal:', error);
        }
    }

    async loadPresets() {
        try {
            const response = await fetch('/api/config-presets');
            const presets = await response.json();

            // Store presets for later use
            this.presets = presets;
        } catch (error) {
            console.error('Failed to load presets:', error);
        }
    }

    applyPreset(presetId) {
        // Check API presets first
        if (this.presets && this.presets[presetId]) {
            const preset = this.presets[presetId];
            this.currentPreset = presetId;
            this.presetsSelect.value = presetId;

            // Update form inputs
            this.configInputs.pdfEngine.value = preset.pdf_engine;
            this.configInputs.documentClass.value = preset.document_class;
            this.configInputs.geometry.value = preset.geometry;
            this.configInputs.fontsize.value = preset.fontsize;
            this.configInputs.mainfont.value = preset.mainfont || '';
            this.configInputs.linestretch.value = preset.linestretch || '';
            this.configInputs.colorlinks.checked = preset.colorlinks;
            this.configInputs.numberSections.checked = preset.number_sections;
            this.configInputs.toc.checked = preset.toc;

            // Update language settings
            const language = preset.language || '';
            this.configInputs.languageZh.checked = language === 'zh';
            this.configInputs.languageJa.checked = language === 'ja';
            this.configInputs.languageKo.checked = language === 'ko';

            // Update CJK fonts group visibility
            this.updateCJKFontsVisibility();

            // Update CJK font overrides
            this.configInputs.cjkMainfont.value = preset.cjk_mainfont || '';
            this.configInputs.cjkSansfont.value = preset.cjk_sansfont || '';
            this.configInputs.cjkMonofont.value = preset.cjk_monofont || '';
            return;
        }

        // Check hardcoded presets
        if (MarkdownToPDFConverter.PRESETS[presetId]) {
            this.applyHardcodedPreset(presetId);
            return;
        }

        console.warn(`Preset ${presetId} not found`);
    }

    applyHardcodedPreset(presetId) {
        const preset = MarkdownToPDFConverter.PRESETS[presetId];
        this.currentPreset = presetId;
        this.presetsSelect.value = presetId;

        // Apply each configuration value from preset
        Object.entries(preset).forEach(([key, value]) => {
            switch (key) {
                case 'document-class':
                    this.configInputs.documentClass.value = value;
                    break;
                case 'fontsize':
                    this.configInputs.fontsize.value = value;
                    break;
                case 'geometry':
                    this.configInputs.geometry.value = value;
                    break;
                case 'linestretch':
                    this.configInputs.linestretch.value = value;
                    break;
                case 'colorlinks':
                    this.configInputs.colorlinks.checked = value;
                    break;
                case 'number-sections':
                    this.configInputs.numberSections.checked = value;
                    break;
                case 'toc':
                    this.configInputs.toc.checked = value;
                    break;
                case 'language':
                    // Set the appropriate language checkbox
                    this.configInputs.languageZh.checked = value === 'zh';
                    this.configInputs.languageJa.checked = value === 'ja';
                    this.configInputs.languageKo.checked = value === 'ko';
                    break;
                default:
                    console.warn(`Unknown preset key: ${key}`);
            }
        });

        // Update CJK fonts group visibility
        this.updateCJKFontsVisibility();
    }

    resetConfiguration() {
        // Reset to default values
        this.configInputs.pdfEngine.value = 'xelatex';
        this.configInputs.documentClass.value = 'article';
        this.configInputs.geometry.value = 'margin=1in';
        this.configInputs.fontsize.value = '12pt';
        this.configInputs.mainfont.value = '';
        this.configInputs.linestretch.value = '';
        this.configInputs.colorlinks.checked = true;
        this.configInputs.numberSections.checked = false;
        this.configInputs.toc.checked = false;

        // Reset language settings
        this.configInputs.languageZh.checked = false;
        this.configInputs.languageJa.checked = false;
        this.configInputs.languageKo.checked = false;
        this.updateCJKFontsVisibility();

        // Reset CJK font overrides
        this.configInputs.cjkMainfont.value = '';
        this.configInputs.cjkSansfont.value = '';
        this.configInputs.cjkMonofont.value = '';


        this.presetsSelect.value = '';
        this.currentPreset = null;
    }

    setupEventListeners() {
        // Convert button
        this.convertBtn.addEventListener('click', () => {
            this.convert();
        });


        // Open file button
        this.openLink.addEventListener('click', () => {
            this.openFile();
        });

        // Dismiss error button
        this.dismissErrorBtn.addEventListener('click', () => {
            this.hideError();
        });

        // Cancel conversion button
        this.cancelConversionBtn.addEventListener('click', () => {
            this.cancelConversion();
        });
    }

    async convert() {
        // Validate input
        if (!this.currentFile && !this.markdownText.value.trim()) {
            this.showError('Please upload a file or enter some Markdown text.');
            return;
        }

        // Generate unique request ID for cancellation
        this.currentRequestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

        // Collect configuration
        const config = this.collectConfiguration();
        config.request_id = this.currentRequestId;

        // Show loading overlay
        this.showLoading();

        // Create abort controller for cancellation
        this.abortController = new AbortController();

        try {
            let result;

            if (this.currentFile) {
                // File upload conversion
                result = await this.convertFile(this.currentFile, config);
            } else {
                // Text conversion
                result = await this.convertText(this.markdownText.value, config);
            }

            if (result.success) {
                this.showResult(result.download_url);
            } else {
                this.showError(result.error || 'Conversion failed.');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                // Cancellation handled by cancelConversion method
                return;
            }
            console.error('Conversion error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.hideLoading();
            this.abortController = null;
            this.currentRequestId = null;
        }
    }

    collectConfiguration() {
        let language = '';
        if (this.configInputs.languageZh.checked) language = 'zh';
        else if (this.configInputs.languageJa.checked) language = 'ja';
        else if (this.configInputs.languageKo.checked) language = 'ko';

        return {
            pdf_engine: this.configInputs.pdfEngine.value,
            document_class: this.configInputs.documentClass.value,
            geometry: this.configInputs.geometry.value,
            fontsize: this.configInputs.fontsize.value,
            mainfont: this.configInputs.mainfont.value,
            linestretch: this.configInputs.linestretch.value,
            colorlinks: this.configInputs.colorlinks.checked,
            number_sections: this.configInputs.numberSections.checked,
            toc: this.configInputs.toc.checked,
            language: language,
            cjk_mainfont: this.configInputs.cjkMainfont.value,
            cjk_sansfont: this.configInputs.cjkSansfont.value,
            cjk_monofont: this.configInputs.cjkMonofont.value,
            east_asian_line_breaks: language !== ''  // Auto-enable for East Asian languages
        };
    }

    async convertFile(file, config) {
        const formData = new FormData();
        formData.append('file', file);

        // Append config as form data
        Object.entries(config).forEach(([key, value]) => {
            formData.append(key, value);
        });

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
            signal: this.abortController?.signal
        });

        return response.json();
    }

    async convertText(text, config) {
        const payload = {
            text,
            ...config
        };

        const response = await fetch('/convert-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: this.abortController?.signal
        });

        return response.json();
    }

    showResult(downloadUrl) {
        this.downloadLink.href = downloadUrl;
        this.resultArea.classList.remove('hidden');
        this.errorArea.classList.add('hidden');

        // Extract filename from download URL for open functionality
        // URL format: /download/filename.pdf
        const parts = downloadUrl.split('/');
        this.currentOutputFilename = parts[parts.length - 1];
    }

    async openFile() {
        if (!this.currentOutputFilename) {
            this.showError('No PDF file available to open.');
            return;
        }

        try {
            // Send request to open file with default application
            const response = await fetch(`/open/${this.currentOutputFilename}`);
            const result = await response.json();

            if (result.success) {
                // Show success message but keep result area visible
                // Could show a temporary notification, but for now just log
                console.log('Open request successful:', result.message);
            } else {
                this.showError(`Failed to open file: ${result.error || result.message}`);
            }
        } catch (error) {
            console.error('Open request failed:', error);
            this.showError('Network error while trying to open file.');
        }
    }

    showError(message) {
        document.getElementById('error-message').textContent = message;
        this.errorArea.classList.remove('hidden');
        this.resultArea.classList.add('hidden');
    }

    showVisibleError(message) {
        // Create a temporary visible error message at top of page
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f72585;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-family: sans-serif;
            font-size: 14px;
            max-width: 80%;
            text-align: center;
        `;
        errorDiv.textContent = `Debug: ${message}`;
        document.body.appendChild(errorDiv);
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 10000);
    }

    showVisibleSuccess(message) {
        // Create a temporary success message at top of page
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #4cc9f0;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-family: sans-serif;
            font-size: 14px;
            max-width: 80%;
            text-align: center;
        `;
        successDiv.textContent = `✓ ${message}`;
        document.body.appendChild(successDiv);
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 5000);
    }

    hideError() {
        this.errorArea.classList.add('hidden');
    }

    resetConversion() {
        this.resultArea.classList.add('hidden');
        this.clearFile();
        this.markdownText.value = '';
        this.updateTextStats();
        this.resetConfiguration();
        this.switchTab('file-tab');
        this.currentOutputFilename = null;
    }

    async cancelConversion() {
        if (this.abortController) {
            // Send cancellation request to server if we have a request ID
            if (this.currentRequestId) {
                try {
                    await fetch('/cancel', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ request_id: this.currentRequestId }),
                        signal: AbortSignal.timeout(2000) // Timeout after 2 seconds
                    });
                } catch (error) {
                    // Ignore errors - cancellation may have already completed
                    console.log('Cancel request failed (likely already cancelled):', error);
                }
            }

            // Abort the ongoing fetch request
            this.abortController.abort();
            this.abortController = null;
            this.hideLoading();
            this.showError('Conversion cancelled by user.');
        }
    }

    showLoading() {
        this.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Test function for debugging modal
window.testModal = function() {
    console.log('Testing modal...');
    const btn = document.getElementById('open-modal-stats');
    if (btn) {
        console.log('Found button, clicking...');
        btn.click();
    } else {
        console.error('Button not found');
    }
};

// Auto-test modal if debug parameter present
if (window.location.search.includes('debug=modal')) {
    setTimeout(() => {
        console.log('Auto-testing modal due to debug parameter');
        window.testModal();
    }, 3000);
}

// Initialize converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - initializing MarkdownToPDFConverter');
    new MarkdownToPDFConverter();
});