// Microsoft Copilot-inspired JavaScript functionality
// fetchUserMessages(): add new backend API for fetching messages after deploying on vercel!!
class CopilotApp {
    constructor() {
        this.currentTheme = 'light';
        this.init();
    }

    init() {
        this.setupThemeToggle();
        this.setupChatInput();
        this.setupSuggestionCards();
        this.setupSendButton();
        this.detectSystemTheme();
        this.initializeNewChatButton();
    }

    // Add this to your CopilotApp init() method
    initializeNewChatButton() {
        const newChatBtn = document.getElementById('newChatBtn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                console.log('🔄 New Chat button clicked');
                this.handleNewChat();
            });
            console.log('✅ New Chat button event listener added');
        } else {
            console.warn('⚠️ New Chat button not found');
        }
    }

    // Add this method to handle the complete new chat process
    handleNewChat() {
        // Hide sidebar
        this.hideSidebarOnNewChat();
        
        // Reset chat state if RAG integration exists
        if (window.ragChat && typeof window.ragChat.startNewChat === 'function') {
            window.ragChat.startNewChat();
        }
        
        // Clear input field
        const chatInput = document.querySelector('.chat-input');
        if (chatInput) {
            chatInput.value = '';
            chatInput.focus();
        }
        
        console.log('✅ New chat initiated');
    }


    renderSidebar(messages) {
    // Group messages by date
      const today = [];
      const week = [];
      const month = [];
      const now = new Date();

      messages.forEach(msg => {
        const msgDate = new Date(msg.timestamp);
        const diffDays = (now - msgDate) / (1000 * 60 * 60 * 24);
        if (diffDays < 1) {
          today.push(msg);
        } else if (diffDays < 7) {
          week.push(msg);
        } else if (diffDays < 30) {
          month.push(msg);
        }
      });

      function renderSection(sectionId, msgs) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        section.innerHTML = '';
        if (msgs.length === 0) {
          // Use CSS class instead of inline style
          section.innerHTML = '<div class="chat-item chat-item--empty">No messages yet</div>';
          return;
        }
        msgs.forEach((msg, idx) => {
          const item = document.createElement('div');
          item.className = 'chat-item chat-item--dynamic';
          item.dataset.chatId = msg._id || idx;
          item.innerHTML = `
            <span class="chat-icon">💬</span>
            <span class="chat-title">${msg.message.substring(0, 30)}${msg.message.length > 30 ? '…' : ''}</span>`;
          section.appendChild(item);
        });
      }

      renderSection('chat-section-today', today);
      renderSection('chat-section-week', week);
      renderSection('chat-section-month', month);
    }

    
    hideSidebarOnNewChat() {
        console.log('🔄 Hiding sidebar for new chat...');
        
        // Get sidebar elements
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.querySelector('.sidebar-overlay');
        const body = document.body;
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        
        if (!sidebar) {
            console.warn('⚠️ Sidebar element not found');
            return;
        }
        
        // Check if sidebar is currently open
        const isOpen = sidebar.classList.contains('open');
        
        if (isOpen) {
            // Remove open class and add hidden class
            sidebar.classList.remove('open');
            sidebar.classList.add('sidebar--hidden');
            
            // Hide overlay if it exists
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
            
            // Remove body scroll lock
            if (body) {
                body.classList.remove('sidebar-open');
            }
            
            // Update sidebar toggle button state
            if (sidebarToggle) {
                sidebarToggle.classList.remove('active');
            }
            
            console.log('✅ Sidebar hidden successfully');
        } else {
            console.log('ℹ️ Sidebar was already closed');
        }
    }



    // Theme Management
    detectSystemTheme() {
        // Check system preference for initial theme
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.currentTheme = 'dark';
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            this.currentTheme = 'light';
            document.documentElement.setAttribute('data-theme', 'light');
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (e.matches) {
                this.setTheme('dark');
            } else {
                this.setTheme('light');
            }
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });

            // Add keyboard support
            themeToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        // Add smooth transition
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        
        // Update aria-label for accessibility
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
            themeToggle.setAttribute('aria-label', label);
        }
    }

    // Chat Input Management
    setupChatInput() {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            // Auto-resize functionality
            chatInput.addEventListener('input', () => {
                this.autoResizeTextarea(chatInput);
                this.updateSendButtonState();
            });

            // Handle Enter key
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });

            // Focus management
            chatInput.addEventListener('focus', () => {
                this.scrollToInput();
            });

            // Initial resize
            this.autoResizeTextarea(chatInput);
        }
    }

    autoResizeTextarea(textarea) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        
        // Set height based on scrollHeight, with min and max constraints
        const minHeight = 24;
        const maxHeight = 120;
        const scrollHeight = textarea.scrollHeight;
        
        if (scrollHeight <= maxHeight) {
            textarea.style.height = Math.max(scrollHeight, minHeight) + 'px';
            textarea.style.overflowY = 'hidden';
        } else {
            textarea.style.height = maxHeight + 'px';
            textarea.style.overflowY = 'auto';
        }
    }

    updateSendButtonState() {
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');
        
        if (chatInput && sendButton) {
            const hasContent = chatInput.value.trim().length > 0;
            sendButton.style.opacity = hasContent ? '1' : '0.6';
        }
    }

    setupSendButton() {
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
            // Remove any existing event listeners by cloning
            const newSendButton = sendButton.cloneNode(true);
            sendButton.parentNode.replaceChild(newSendButton, sendButton);
            
            newSendButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔄 Send button clicked - checking for RAG Chat Manager');
                
                // Check if RAG Chat Manager exists and is ready
                if (window.ragChat && typeof window.ragChat.handleSendMessage === 'function') {
                    console.log('✅ Delegating to RAG Chat Manager');
                    window.ragChat.handleSendMessage();
                } else {
                    console.warn('⚠️ RAG Chat Manager not available, using fallback');
                    this.handleSendMessage(); // Fallback to local handler
                }
            });
            
            console.log('✅ Send button event listener updated');
        } else {
            console.error('❌ Send button not found!');
        }
    }

    async handleSendMessage() {
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');
    
        if (chatInput && sendButton) {
            const message = chatInput.value.trim();
        
            if (message.length > 0) {
                // Add loading state
                sendButton.classList.add('loading');
                sendButton.style.pointerEvents = 'none';
                
                try {
                    const sessionData = JSON.parse(localStorage.getItem('google_auth_session'));
                    
                    // Send message to backend - UPDATED URL for local development
                    const response = await fetch('http://localhost:3001/api/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + sessionData.token
                        },
                        body: JSON.stringify({
                            message: message,
                            userId: this.currentUser.id
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        chatInput.value = '';
                        this.autoResizeTextarea(chatInput);
                        this.updateSendButtonState();
                        
                        // UPDATE SIDEBAR after successful message send
                        this.fetchUserMessages().then(messages => {
                            this.renderSidebar(messages);
                        });
                    } else {
                        console.error('Failed to send message');
                    }
                } catch (error) {
                    console.error('Error sending message:', error);
                } finally {
                    // Remove loading state
                    sendButton.classList.remove('loading');
                    sendButton.style.pointerEvents = 'auto';
                }
            }
        }
    }

    async fetchUserMessages() {
        const sessionData = localStorage.getItem('google_auth_session');
        if (!sessionData) return [];
    
        const parsed = JSON.parse(sessionData);
        if (!parsed.token) return [];

        try {
            // UPDATED URL for local development
            const response = await fetch('http://localhost:3001/api/messages', {
                headers: {
                    'Authorization': 'Bearer ' + parsed.token
                }
            });
        
            const data = await response.json();
            if (data.success) {
                return data.messages;
            } else {
                console.error('Failed to fetch messages:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Error fetching messages:', error.message);
            return [];
        }
    }

    showResponseDemo(userMessage) {
        // Create a simple response indicator
        const responseDiv = document.createElement('div');
        responseDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: var(--copilot-surface);
            border: 1px solid var(--copilot-border);
            border-radius: 12px;
            padding: 16px;
            box-shadow: var(--copilot-shadow-elevated);
            max-width: 300px;
            z-index: 1000;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
        `;
        
        responseDiv.innerHTML = `
            <div style="font-size: 14px; color: var(--copilot-text-secondary); margin-bottom: 8px;">
                Demo Response:
            </div>
            <div style="font-size: 16px; color: var(--copilot-text);">
                I received your message: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}"
            </div>
        `;
        
        document.body.appendChild(responseDiv);
        
        // Animate in
        setTimeout(() => {
            responseDiv.style.opacity = '1';
            responseDiv.style.transform = 'translateY(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            responseDiv.style.opacity = '0';
            responseDiv.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (responseDiv.parentNode) {
                    responseDiv.parentNode.removeChild(responseDiv);
                }
            }, 300);
        }, 3000);
    }

    setupSuggestionCards() {
        const suggestionCards = document.querySelectorAll('.suggestion-card');
        
        suggestionCards.forEach(card => {
            card.addEventListener('click', () => {
                const suggestionText = card.querySelector('h3')?.textContent;
                if (suggestionText) {
                    this.fillInputWithSuggestion(suggestionText);
                }
            });

            // Add keyboard support
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });

            // Add focus styles
            card.addEventListener('focus', () => {
                card.style.outline = '2px solid var(--copilot-primary)';
                card.style.outlineOffset = '2px';
            });

            card.addEventListener('blur', () => {
                card.style.outline = 'none';
            });
        });
    }

    fillInputWithSuggestion(suggestion) {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.value = `Help me ${suggestion.toLowerCase()}`;
            chatInput.focus();
            this.autoResizeTextarea(chatInput);
            this.updateSendButtonState();
            this.scrollToInput();
        }
    }

    scrollToInput() {
        const inputContainer = document.querySelector('.input-container');
        if (inputContainer) {
            inputContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }
    }

    // Utility Methods
    debounce(func, wait) {
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
}

// Smooth scroll behavior for suggestion cards
function addSmoothInteractions() {
    // Add subtle hover effects to interactive elements
    const interactiveElements = document.querySelectorAll('.suggestion-card, .theme-toggle, .send-button');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = this.classList.contains('suggestion-card') 
                ? 'translateY(-2px)' 
                : 'scale(1.05)';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

// Enhanced focus management
function setupAccessibility() {
    // Skip link for keyboard navigation
    const skipLink = document.createElement('a');
    skipLink.href = '#chatInput';
    skipLink.textContent = 'Skip to main input';
    skipLink.className = 'sr-only';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--copilot-primary);
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
        transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Announce theme changes to screen readers
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                const theme = document.documentElement.getAttribute('data-theme');
                announcer.textContent = `Switched to ${theme} mode`;
            }
        });
    });
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
}

// ----------------------------------------------------

/**
 * Google Authentication Module
 * Comprehensive, non-intrusive authentication system
 * with modern JWT handling and user state management
 * UPDATED: Now supports both Google OAuth and local authentication
 */

class GoogleAuthManager {
    constructor(config = {}) {
        this.config = {
            clientId: config.clientId || '840850164307-m4lks13qq8ffu6sadbhu05233upog1ni.apps.googleusercontent.com',
            onSignIn: config.onSignIn || (() => {}),
            onSignOut: config.onSignOut || (() => {}),
            onError: config.onError || (() => {}),
            debugMode: config.debugMode || false,
            autoPrompt: config.autoPrompt || false,
            ...config
        };

        this.currentUser = null;
        this.isInitialized = false;
        this.elements = {};
        
        this.init();
    }

    /**
     * Initialize the authentication system
     */
    async init() {
        try {
            this.log('Initializing Google Auth Manager...');
            
            // Cache DOM elements
            this.cacheElements();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Wait for Google library to load
            await this.waitForGoogleLibrary();
            
            // Initialize Google Sign-In
            this.initializeGoogleSignIn();
            
            // Restore user session if exists
            this.restoreUserSession();

            // Check auth status and update sidebar
            await this.restoreUserSession();
            await this.checkAuthAndUpdateSidebar();
            
            this.isInitialized = true;
            this.log('Google Auth Manager initialized successfully');
            
        } catch (error) {
            this.handleError('Initialization failed', error);
        }
    }

    /**
     * Update sidebar user profile text
     */
    updateSidebarProfile(userData) {
        const userNameElement = document.querySelector('.user-name');
        const userEmailElement = document.querySelector('.user-email');
        
        if (userNameElement && userData.name) {
            userNameElement.textContent = userData.name;
        }
        
        if (userEmailElement && userData.email) {
            userEmailElement.textContent = userData.email;
        }
        
        this.log('✅ Sidebar profile updated:', userData.name, userData.email);
    }

    /**
     * Clear sidebar user profile text
     */
    clearSidebarProfile() {
        const userNameElement = document.querySelector('.user-name');
        const userEmailElement = document.querySelector('.user-email');
        
        if (userNameElement) {
            userNameElement.textContent = 'User';
        }
        
        if (userEmailElement) {
            userEmailElement.textContent = 'user@example.com';
        }
        
        this.log('✅ Sidebar profile cleared');
    }

    /**
 * Check authentication status and update sidebar - FIXED URL
 */
async checkAuthAndUpdateSidebar() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            this.clearSidebarProfile();
            return;
        }

        // FIXED: Use correct URL with full localhost path
        const response = await fetch('http://localhost:3001/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            this.updateSidebarProfile(data.user);
            this.currentUser = data.user;
            
            // Also update the session storage
            const sessionData = {
                token: token,
                user: data.user
            };
            localStorage.setItem('google_auth_session', JSON.stringify(sessionData));
            
        } else {
            console.warn('Token verification failed, clearing session');
            localStorage.removeItem('authToken');
            localStorage.removeItem('google_auth_session');
            this.clearSidebarProfile();
        }
    } catch (error) {
        this.handleError('Auth check failed', error);
        this.clearSidebarProfile();
    }
}



    /**
     * Cache DOM elements for better performance
     */
    cacheElements() {
      this.elements = {
          userProfileContainer: document.getElementById('userProfileContainer'),
          userProfileButton: document.getElementById('userProfileButton'),
          userDropdown: document.getElementById('userDropdown'),
          userIcon: document.getElementById('userIcon'),
          userAvatar: document.getElementById('userAvatar'),
          userInitials: document.getElementById('userInitials'),
          signedOutSection: document.getElementById('signedOutSection'),
          signedInSection: document.getElementById('signedInSection'),
          googleSignInButton: document.getElementById('googleSignInButton'),
          userName: document.getElementById('userName'),
          userEmail: document.getElementById('userEmail'),
          dropdownUserAvatar: document.getElementById('dropdownUserAvatar'),
          dropdownUserInitials: document.getElementById('dropdownUserInitials'),
          signOutButton: document.getElementById('signOutButton'),
          profileSettings: document.getElementById('profileSettings'),
          preferences: document.getElementById('preferences'),
          alternativeSignIn: document.getElementById('alternativeSignIn'),
          // Local authentication elements - CORRECTED
          localEmailInput: document.getElementById('localEmailInput'),
          localPasswordInput: document.getElementById('localPasswordInput'),
          localRegisterNameInput: document.getElementById('localRegisterNameInput'),
          localRegisterEmailInput: document.getElementById('localRegisterEmailInput'),
          localRegisterPasswordInput: document.getElementById('localRegisterPasswordInput'),
          localSignInForm: document.getElementById('localSignInForm'),
          localRegisterForm: document.getElementById('localRegisterForm'),
          toggleToRegister: document.getElementById('toggleToRegister'),
          toggleToSignIn: document.getElementById('toggleToSignIn')
      };
  }


    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Profile button click
        if (this.elements.userProfileButton) {
            this.elements.userProfileButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        // Sign out button
        if (this.elements.signOutButton) {
            this.elements.signOutButton.addEventListener('click', () => {
                this.signOut();
            });
        }

        // Profile settings button
        if (this.elements.profileSettings) {
            this.elements.profileSettings.addEventListener('click', () => {
                this.handleProfileSettings();
            });
        }

        // Preferences button
        if (this.elements.preferences) {
            this.elements.preferences.addEventListener('click', () => {
                this.handlePreferences();
            });
        }

        // Alternative sign in button
        if (this.elements.alternativeSignIn) {
            this.elements.alternativeSignIn.addEventListener('click', () => {
                this.handleAlternativeSignIn();
            });
        }

        // NEW: Local authentication event listeners
        if (this.elements.localSignInForm) {
            this.elements.localSignInForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLocalSignIn();
            });
        }

        if (this.elements.localRegisterForm) {
            this.elements.localRegisterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLocalRegister();
            });
        }

        if (this.elements.toggleToRegister) {
            this.elements.toggleToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        if (this.elements.toggleToSignIn) {
            this.elements.toggleToSignIn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSignInForm();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.elements.userProfileContainer?.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Close dropdown on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
            }
        });
    }

    /**
     * NEW: Handle local sign in
     */
    async handleLocalSignIn() {
        const email = this.elements.localEmailInput?.value;
        const password = this.elements.localPasswordInput?.value;

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Create user object similar to Google auth
                const user = {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    picture: data.user.picture,
                    token: data.token,
                    authType: 'local'
                };

                // Store token in the correct localStorage key
                localStorage.setItem('authToken', data.token);
                
                // Also store complete session data
                localStorage.setItem('google_auth_session', JSON.stringify({
                    token: data.token,
                    user: user
                }));

                this.currentUser = user;
                this.saveUserSession(user);
                this.updateUIForSignedIn(user);
                this.updateSidebarProfile(user);
                this.closeDropdown();
                this.config.onSignIn(user);

                // Fetch and render messages
                const messages = await this.fetchUserMessages();
                if (window.copilotApp && typeof window.copilotApp.renderSidebar === 'function') {
                    window.copilotApp.renderSidebar(messages);
                }

                this.log('✅ Local user signed in successfully:', user);
            } else {
                this.showError(data.message || 'Sign in failed');
            }
        } catch (error) {
            this.handleError('Local sign in failed', error);
            this.showError('Network error. Please try again.');
        }
    }

    /**
     * NEW: Handle local registration
     */
    async handleLocalRegister() {
    const email = this.elements.localRegisterEmailInput?.value;
    const password = this.elements.localRegisterPasswordInput?.value;
    const name = this.elements.localRegisterNameInput?.value;

    console.log('Register attempt:', { email, name, password: password ? 'provided' : 'missing' });

    if (!email || !password || !name) {
        this.showError('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, name })
        });

        const data = await response.json();
        console.log('Register response:', data);

        if (data.success) {
            const user = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                picture: data.user.picture,
                token: data.token,
                authType: 'local'
            };

            this.currentUser = user;
            this.saveUserSession(user);
            this.updateUIForSignedIn(user);
            this.closeDropdown();
            this.config.onSignIn(user);
            this.updateSidebarProfile(user);

            console.log('Local user registered successfully:', user);
        } else {
            this.showError(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Local registration failed:', error);
        this.showError('Network error. Please try again.');
    }
}

    /**
     * NEW: Show register form
     */
    showRegisterForm() {
        if (this.elements.localSignInForm) {
            this.elements.localSignInForm.style.display = 'none';
        }
        if (this.elements.localRegisterForm) {
            this.elements.localRegisterForm.style.display = 'block';
        }
    }

    /**
     * NEW: Show sign in form
     */
    showSignInForm() {
        if (this.elements.localRegisterForm) {
            this.elements.localRegisterForm.style.display = 'none';
        }
        if (this.elements.localSignInForm) {
            this.elements.localSignInForm.style.display = 'block';
        }
    }

    /**
     * NEW: Show error message
     */
    showError(message) {
        // You can customize this to show errors in your UI
        console.error('Auth Error:', message);
        alert(message); // Simple alert for now - you can replace with better UI
    }

    /**
     * Wait for Google library to load
     */
    waitForGoogleLibrary() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 50;
            let attempts = 0;

            const checkLibrary = () => {
                attempts++;
                
                if (window.google && window.google.accounts && window.google.accounts.id) {
                    resolve();
                    return;
                }

                if (attempts >= maxAttempts) {
                    reject(new Error('Google library failed to load'));
                    return;
                }

                setTimeout(checkLibrary, 100);
            };

            checkLibrary();
        });
    }

    /**
     * Initialize Google Sign-In
     */
    initializeGoogleSignIn() {
        if (!this.config.clientId) {
            this.handleError('Configuration error', new Error('Client ID is required'));
            return;
        }

        // Initialize the Google Identity Services
        google.accounts.id.initialize({
            client_id: this.config.clientId,
            callback: this.handleCredentialResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true,
            context: 'signin'
        });

        // Render the Sign-In button
        this.renderSignInButton();

        // Set up One Tap if enabled
        if (this.config.autoPrompt) {
            this.setupOneTap();
        }

        // Make handleCredentialResponse globally accessible for HTML callback
        window.handleCredentialResponse = this.handleCredentialResponse.bind(this);
    }

    /**
     * Render the Google Sign-In button
     */
    renderSignInButton() {
        if (this.elements.googleSignInButton) {
            google.accounts.id.renderButton(
                this.elements.googleSignInButton,
                {
                    theme: 'outline',
                    size: 'large',
                    width: '100%',
                    text: 'signin_with',
                    shape: 'rectangular',
                    logo_alignment: 'left'
                }
            );
        }
    }

    /**
     * Set up Google One Tap
     */
    setupOneTap() {
        // Only show One Tap if user is not already signed in
        if (!this.currentUser) {
            google.accounts.id.prompt((notification) => {
                this.log('One Tap notification:', notification);
                
                if (notification.isNotDisplayed()) {
                    this.log('One Tap not displayed:', notification.getNotDisplayedReason());
                } else if (notification.isSkippedMoment()) {
                    this.log('One Tap skipped:', notification.getSkippedReason());
                } else if (notification.isDismissedMoment()) {
                    this.log('One Tap dismissed:', notification.getDismissedReason());
                }
            });
        }
    }

    /**
     * Handle credential response from Google
     */
    async handleCredentialResponse(response) {
        try {
            this.log('Credential response received');
            
            // Decode the JWT token
            const userInfo = this.decodeJWT(response.credential);
            
            if (!userInfo) {
                throw new Error('Invalid credential token');
            }

            // Create user object
            const user = {
                id: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                given_name: userInfo.given_name,
                family_name: userInfo.family_name,
                email_verified: userInfo.email_verified,
                token: response.credential,
                authType: 'google'
            };

            // Store user information
            this.currentUser = user;
            
            // Save to localStorage for session persistence
            this.saveUserSession(user);
            
            // Update UI
            this.updateUIForSignedIn(user);

            this.fetchUserMessages().then(messages => {
                this.renderSidebar(messages);
            });
            
            // Close dropdown
            this.closeDropdown();
            
            // Call custom sign-in callback
            this.config.onSignIn(user);
            this.updateSidebarProfile(user);
            
            this.log('User signed in successfully:', user);
            
        } catch (error) {
            this.handleError('Sign-in failed', error);
        }
    }

    /**
     * Decode JWT token
     */
    decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            this.handleError('JWT decode failed', error);
            return null;
        }
    }

    /**
     * Sign out the user
     */
    signOut() {
        try {
            // Sign out from Google
            if (window.google && google.accounts && google.accounts.id) {
                google.accounts.id.disableAutoSelect();
            }

            // Clear user data
            this.currentUser = null;
            
            // Remove from localStorage
            this.clearUserSession();
            
            // Update UI
            this.updateUIForSignedOut();
            
            // Close dropdown
            this.closeDropdown();
            
            // Call custom sign-out callback
            this.config.onSignOut();
            this.clearSidebarProfile();
            
            this.log('User signed out successfully');
            
        } catch (error) {
            this.handleError('Sign-out failed', error);
        }
    }

    /**
     * Toggle dropdown visibility
     */
    toggleDropdown() {
        if (this.elements.userDropdown) {
            const isVisible = this.elements.userDropdown.classList.contains('show');
            
            if (isVisible) {
                this.closeDropdown();
            } else {
                this.openDropdown();
            }
        }
    }

    /**
     * Open dropdown
     */
    openDropdown() {
        if (this.elements.userDropdown) {
            this.elements.userDropdown.classList.add('show');
            this.elements.userProfileButton?.setAttribute('aria-expanded', 'true');
        }
    }

    /**
     * Close dropdown
     */
    closeDropdown() {
        if (this.elements.userDropdown) {
            this.elements.userDropdown.classList.remove('show');
            this.elements.userProfileButton?.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * Update UI for signed-in state
     */
    updateUIForSignedIn(user) {
        // Hide user icon, show avatar or initials
        if (this.elements.userIcon) {
            this.elements.userIcon.style.display = 'none';
        }

        // Set profile button avatar
        if (user.picture && this.elements.userAvatar) {
            this.elements.userAvatar.src = user.picture;
            this.elements.userAvatar.style.display = 'block';
            if (this.elements.userInitials) {
                this.elements.userInitials.style.display = 'none';
            }
        } else {
            // Use initials as fallback
            const initials = this.generateInitials(user.name);
            if (this.elements.userInitials) {
                this.elements.userInitials.textContent = initials;
                this.elements.userInitials.style.display = 'flex';
            }
            if (this.elements.userAvatar) {
                this.elements.userAvatar.style.display = 'none';
            }
        }

        // Update dropdown content
        if (this.elements.userName) {
            this.elements.userName.textContent = user.name || 'User';
        }
        if (this.elements.userEmail) {
            this.elements.userEmail.textContent = user.email || '';
        }

        // Update dropdown avatar
        if (user.picture && this.elements.dropdownUserAvatar) {
            this.elements.dropdownUserAvatar.src = user.picture;
            this.elements.dropdownUserAvatar.style.display = 'block';
            if (this.elements.dropdownUserInitials) {
                this.elements.dropdownUserInitials.style.display = 'none';
            }
        } else {
            const initials = this.generateInitials(user.name);
            if (this.elements.dropdownUserInitials) {
                this.elements.dropdownUserInitials.textContent = initials;
                this.elements.dropdownUserInitials.style.display = 'flex';
            }
            if (this.elements.dropdownUserAvatar) {
                this.elements.dropdownUserAvatar.style.display = 'none';
            }
        }

        // Show signed-in section, hide signed-out section
        if (this.elements.signedInSection) {
            this.elements.signedInSection.style.display = 'block';
        }
        if (this.elements.signedOutSection) {
            this.elements.signedOutSection.style.display = 'none';
        }
    }

    /**
     * Update UI for signed-out state
     */
    updateUIForSignedOut() {
        // Show user icon, hide avatar and initials
        if (this.elements.userIcon) {
            this.elements.userIcon.style.display = 'block';
        }
        if (this.elements.userAvatar) {
            this.elements.userAvatar.style.display = 'none';
        }
        if (this.elements.userInitials) {
            this.elements.userInitials.style.display = 'none';
        }

        // Show signed-out section, hide signed-in section
        if (this.elements.signedOutSection) {
            this.elements.signedOutSection.style.display = 'block';
        }
        if (this.elements.signedInSection) {
            this.elements.signedInSection.style.display = 'none';
        }

        // Reset forms to sign in view
        this.showSignInForm();
    }

    /**
     * Generate initials from name
     */
    generateInitials(name) {
        if (!name) return 'U';
        
        const words = name.trim().split(' ');
        if (words.length === 1) {
            return words[0].charAt(0).toUpperCase();
        } else {
            return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
        }
    }

    /**
     * Save user session to localStorage
     */
    saveUserSession(user) {
        try {
            const sessionData = {
                user: user,
                timestamp: Date.now()
            };
            localStorage.setItem('google_auth_session', JSON.stringify(sessionData));
        } catch (error) {
            this.log('Failed to save user session:', error);
        }
    }

    /**
 * Enhanced session restoration with backend token validation
 */
async restoreUserSession() {
    try {
        const sessionData = localStorage.getItem('google_auth_session');
        const authToken = localStorage.getItem('authToken');
        
        console.log('🔄 Attempting to restore user session...');
        console.log('Session data exists:', !!sessionData);
        console.log('Auth token exists:', !!authToken);
        
        if (sessionData && authToken) {
            const session = JSON.parse(sessionData);
            if (session.user) {
                // Validate token with backend before restoring UI
                const isValid = await this.validateTokenWithBackend(authToken);
                
                if (isValid) {
                    this.currentUser = session.user;
                    this.updateUIForSignedIn(session.user);
                    this.updateSidebarProfile(session.user);
                    this.config.onSignIn(session.user);
                    
                    // Fetch and render messages
                    const messages = await this.fetchUserMessages();
                    if (window.copilotApp && typeof window.copilotApp.renderSidebar === 'function') {
                        window.copilotApp.renderSidebar(messages);
                    }
                    
                    this.log('✅ User session restored and validated:', session.user);
                } else {
                    // Token is invalid, clear everything
                    this.clearInvalidSession();
                }
            }
        } else {
            this.clearSidebarProfile();
            this.log('ℹ️ No session data to restore');
        }
    } catch (error) {
        this.handleError('Session restoration failed', error);
        this.clearInvalidSession();
    }
}

/**
 * Validate token with backend
 */
async validateTokenWithBackend(token) {
    try {
        console.log('🔍 Validating token with backend...');
        const response = await fetch('http://localhost:3001/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Token validation successful');
            // Update session with fresh user data
            this.currentUser = data.user;
            return true;
        } else {
            console.warn('⚠️ Token validation failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Token validation error:', error);
        return false;
    }
}

/**
 * Clear invalid session data
 */
clearInvalidSession() {
    console.log('🧹 Clearing invalid session data...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('google_auth_session');
    this.currentUser = null;
    this.clearSidebarProfile();
    this.updateUIForSignedOut();
    this.config.onSignOut();
    this.log('✅ Invalid session cleared');
}

    /**
     * Clear user session from localStorage
     */
    clearUserSession() {
        try {
            localStorage.removeItem('google_auth_session');
        } catch (error) {
            this.log('Failed to clear user session:', error);
        }

        const todaySection = document.getElementById('chat-section-today');
        const weekSection = document.getElementById('chat-section-week');
        const monthSection = document.getElementById('chat-section-month');
        if (todaySection) todaySection.innerHTML = '';
        if (weekSection) weekSection.innerHTML = '';
        if (monthSection) monthSection.innerHTML = '';

        //clear current user
        this.currentUser = null;
    }

    /**
     * NEW: Fetch user messages (moved from CopilotApp for better integration)
     */
    async fetchUserMessages() {
        const sessionData = localStorage.getItem('google_auth_session');
        if (!sessionData) return [];
    
        const parsed = JSON.parse(sessionData);
        if (!parsed.token) return [];

        try {
            const response = await fetch('http://localhost:3001/api/messages', {
                headers: {
                    'Authorization': 'Bearer ' + parsed.token
                }
            });
        
            const data = await response.json();
            if (data.success) {
                return data.messages;
            } else {
                console.error('Failed to fetch messages:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Error fetching messages:', error.message);
            return [];
        }
    }

    /**
     * NEW: Render sidebar (moved from CopilotApp for better integration)
     */
    renderSidebar(messages) {
        const today = [];
        const week = [];
        const month = [];
        const now = new Date();

        messages.forEach(msg => {
            const msgDate = new Date(msg.timestamp);
            const diffDays = (now - msgDate) / (1000 * 60 * 60 * 24);
            if (diffDays < 1) {
                today.push(msg);
            } else if (diffDays < 7) {
                week.push(msg);
            } else if (diffDays < 30) {
                month.push(msg);
            }
        });

        function renderSection(sectionId, msgs) {
            const section = document.getElementById(sectionId);
            if (!section) return;
            section.innerHTML = '';
            if (msgs.length === 0) {
                section.innerHTML = '<div class="chat-item chat-item--empty">No messages yet</div>';
                return;
            }
            msgs.forEach((msg, idx) => {
                const item = document.createElement('div');
                item.className = 'chat-item chat-item--dynamic';
                item.dataset.chatId = msg._id || idx;
                item.innerHTML = `
                    <span class="chat-icon">💬</span>
                    <span class="chat-title">${msg.message.substring(0, 30)}${msg.message.length > 30 ? '…' : ''}</span>`;
                section.appendChild(item);
            });
        }

        renderSection('chat-section-today', today);
        renderSection('chat-section-week', week);
        renderSection('chat-section-month', month);
    }

    /**
     * Handle profile settings click
     */
    handleProfileSettings() {
        this.log('Profile settings clicked');
        this.closeDropdown();
        // Add your profile settings logic here
        // Example: window.location.href = '/profile';
    }

    /**
     * Handle preferences click
     */
    handlePreferences() {
        this.log('Preferences clicked');
        this.closeDropdown();
        // Add your preferences logic here
        // Example: window.location.href = '/preferences';
    }

    /**
     * Handle alternative sign in click
     */
    handleAlternativeSignIn() {
        this.log('Alternative sign in clicked');
        this.closeDropdown();
        // Add your alternative sign in logic here
        // Example: window.location.href = '/signin';
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is signed in
     */
    isSignedIn() {
        return !!this.currentUser;
    }

    /**
     * Enable One Tap
     */
    enableOneTap() {
        this.config.autoPrompt = true;
        this.setupOneTap();
    }

    /**
     * Disable One Tap
     */
    disableOneTap() {
        this.config.autoPrompt = false;
        if (window.google && google.accounts && google.accounts.id) {
            google.accounts.id.cancel();
        }
    }

    /**
     * Error handling
     */
    handleError(message, error) {
        this.log(`Error: ${message}`, error);
        this.config.onError({ message, error });
    }

    /**
     * Logging utility
     */
    log(...args) {
        if (this.config.debugMode) {
            console.log('[GoogleAuthManager]', ...args);
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        // Remove event listeners
        // Clear user data
        this.currentUser = null;
        this.isInitialized = false;
        
        // Clear session
        this.clearUserSession();
        
        this.log('GoogleAuthManager destroyed');
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleAuthManager;
} else if (typeof window !== 'undefined') {
    window.GoogleAuthManager = GoogleAuthManager;
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new CopilotApp();
    window.copilotApp = app
    addSmoothInteractions();
    setupAccessibility();
    
    // NEW: Initialize authentication manager
    const authManager = new GoogleAuthManager({
        debugMode: true,
        onSignIn: (user) => {
            console.log('User signed in:', user);
            // Update CopilotApp with current user
            app.currentUser = user;
        },
        onSignOut: () => {
            console.log('User signed out');
            // Clear CopilotApp user
            app.currentUser = null;
        },
        onError: (error) => {
            console.error('Auth error:', error);
        }
    });
    // Make auth manager globally accessible
    window.authManager = authManager;

    
    // Add loading animation for the page
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    }, 100);

    // Initialize document upload
    window.documentUpload = new DocumentUploadManager();

    // Load documents if user is already authenticated
    setTimeout(async () => {
        const token = localStorage.getItem('authToken');
        if (token && window.documentUpload) {
            await window.documentUpload.refreshDocumentList();
        }
    }, 2000);
  
});

// Select all chat items
const chatItems = document.querySelectorAll('.chat-item');

chatItems.forEach(item => {
    item.addEventListener('click', function() {
        // Remove 'active' from currently active item
        document.querySelector('.chat-item.active')?.classList.remove('active');
        // Add 'active' to the clicked item
        this.classList.add('active');
    });
});

// Sidebar functionality - FIXED VERSION
document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggle = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mainWrapper = document.getElementById('mainWrapper');

    console.log('Sidebar elements:', { 
        toggle: !!sidebarToggle, 
        sidebar: !!sidebar, 
        overlay: !!sidebarOverlay,
        mainWrapper: !!mainWrapper
    });

    let sidebarOpen = false;

    function showSidebar() {
        console.log('Showing sidebar');
        sidebarOpen = true;
        
        if (sidebar) {
            sidebar.classList.remove('sidebar--hidden');
            // Force visibility
            sidebar.style.visibility = 'visible';
            sidebar.style.opacity = '1';
            sidebar.style.zIndex = '1000';
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('hidden');
            sidebarOverlay.style.visibility = 'visible';
            sidebarOverlay.style.opacity = '1';
        }
        
        if (mainWrapper) {
            mainWrapper.classList.add('sidebar-open');
        }
    }

    function hideSidebar() {
        console.log('Hiding sidebar');
        sidebarOpen = false;
        
        if (sidebar) {
            sidebar.classList.add('sidebar--hidden');
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.classList.add('hidden');
            sidebarOverlay.style.visibility = 'hidden';
            sidebarOverlay.style.opacity = '0';
        }
        
        if (mainWrapper) {
            mainWrapper.classList.remove('sidebar-open');
        }
    }

    function toggleSidebar() {
        console.log('Toggle sidebar - current state:', sidebarOpen ? 'open' : 'closed');
        if (sidebarOpen) {
            hideSidebar();
        } else {
            showSidebar();
        }
    }

    // Event listeners
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });
        console.log('Sidebar toggle listener added');
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', hideSidebar);
    }

    // Initialize sidebar as hidden
    hideSidebar();

});


// Prevent form submission if wrapped in a form
document.addEventListener('submit', (e) => {
    e.preventDefault();
});

// Enhanced RAG Chat Manager 
class RAGChatManager {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';

    this.token = this.getAuthToken();
    this.currentSessionId = this.generateSessionId();

    this.isProcessing = false;
    this.isChatActive = false;

    this.initializeChat();
    this.initializeNewChatButton();
  }

  getAuthToken() {
    // First try direct authToken
    let token = localStorage.getItem('authToken');
    
    // If not found, try google_auth_session
    if (!token) {
      const sessionData = localStorage.getItem('google_auth_session');
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData);
          token = parsed.token;
        } catch (e) {
          console.error('Failed to parse session data:', e);
        }
      }
    }
    
    console.log('Retrieved auth token:', token ? 'Found' : 'Not found');
    return token;
  }

  async refreshToken() {
    // Primary: Direct authToken
    let token = localStorage.getItem('authToken');
    
    // Fallback: Google auth session
    if (!token) {
        const sessionData = localStorage.getItem('google_auth_session');
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                token = parsed.token;
                // Sync the token to primary storage
                if (token) {
                    localStorage.setItem('authToken', token);
                }
            } catch (e) {
                console.error('Failed to parse session data:', e);
            }
        }
    }
    
    // Validate token with backend
    if (token) {
        const isValid = await this.validateToken(token);
        if (isValid) {
            this.token = token;
            console.log('🔑 Token validated and refreshed');
            return true;
        } else {
            // Token is invalid, clear everything
            this.clearAuthData();
            return false;
        }
    }
    
    console.warn('⚠️ No auth token available - user may need to sign in again');
    this.displayError('Please sign in to continue chatting');
    return false;
}

async validateToken(token) {
    try {
        const response = await fetch(`${this.apiBase}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}

/**
 * Clear authentication data
 */
clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('google_auth_session');
    this.token = null;
    
    // Trigger UI update through GoogleAuthManager
    if (window.googleAuth && typeof window.googleAuth.clearInvalidSession === 'function') {
        window.googleAuth.clearInvalidSession();
    }
}

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  initializeChat() {
    // Connect to your existing chat input and send button
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.send-button');
    
    if (chatInput && sendButton) {
      // Handle Enter key
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !this.isProcessing) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });

      // Handle send button click
      sendButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (!this.isProcessing) {
          this.handleSendMessage();
        }
      });

      console.log('✅ RAG Chat Manager initialized');
    } else {
      console.error('❌ Chat input or send button not found');
    }
  }

  initializeNewChatButton() {
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        this.startNewChat();
      });
      console.log('✅ New Chat button functionality initialized');
    } else {
      console.warn('⚠️ New Chat button not found in DOM');
    }
  }

  async handleSendMessage() {
    const chatInput = document.querySelector('.chat-input');
    if (!chatInput || this.isProcessing) return;

    const message = chatInput.value.trim();
    if (!message) return;

    this.isProcessing = true;
    chatInput.value = '';
    
    try {
      await this.sendMessage(message);
    } finally {
      this.isProcessing = false;
    }
  }

  async sendMessage(message) {
    try {
      // Validate authentication before sending
        const tokenValid = await this.refreshToken();
        if (!tokenValid) {
            throw new Error('Authentication required - please sign in again');
        }
        
        console.log('🚀 Sending message to RAG service...');
        
        // Activate chat mode and show user message
        this.activateChatMode();
        this.displayUserMessage(message);
        this.showTypingIndicator();

      const response = await fetch(`${this.apiBase}/messages/rag/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          message: message,
          sessionId: this.currentSessionId
        })
      });

      const result = await response.json();
      this.hideTypingIndicator();

      if (result.success) {
        this.displayAIResponse(result.aiResponse);
        console.log('✅ Message sent and response received');
      } else {
        this.displayError('Failed to get response: ' + result.message);
        console.error('❌ Backend error:', result);
      }
    } catch (error) {
      this.hideTypingIndicator();
      this.displayError('Connection error - check if backend is running');
      console.error('❌ Frontend error:', error);
    }
  }

  activateChatMode() {
    if (!this.isChatActive) {
      this.isChatActive = true;
      
      // Get all necessary elements
      const welcomeSection = document.querySelector('.welcome-section');
      const mainContent = document.querySelector('.main-content');
      const chatContainer = document.getElementById('chat-container');
      const suggestionsGrid = document.querySelector('.suggestions-grid');
      
      console.log('🎯 Activating chat mode...');
      
      // Step 1: Hide welcome section with animation
      if (welcomeSection) {
        welcomeSection.classList.add('hidden');
      }
      
      // Step 2: Hide suggestions grid
      if (suggestionsGrid) {
        suggestionsGrid.style.display = 'none';
      }
      
      // Step 3: Activate chat layout (with slight delay for smooth transition)
      setTimeout(() => {
        if (mainContent) {
          mainContent.classList.add('chat-active');
        }
        
        if (chatContainer) {
          chatContainer.classList.add('active');
        }
        
        console.log('✅ Chat mode activated successfully');
      }, 150); // Small delay for smooth transition
    }
  }

  startNewChat() {
    console.log('🔄 Starting new chat...');
    
    // Reset chat state
    this.isChatActive = false;
    this.isProcessing = false;
    this.currentSessionId = this.generateSessionId();
    
    // Get all necessary elements
    const welcomeSection = document.querySelector('.welcome-section');
    const mainContent = document.querySelector('.main-content');
    const chatContainer = document.getElementById('chat-container');
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    const contentContainer = document.querySelector('.content-container');
    
    // Step 1: Hide chat container
    if (chatContainer) {
      chatContainer.classList.remove('active');
      // Clear chat content after animation
      setTimeout(() => {
        chatContainer.innerHTML = '';
      }, 300);
    }
    
    // Step 2: Remove chat-active class from main content
    if (mainContent) {
      mainContent.classList.remove('chat-active');
    }
    
    // Step 3: Show welcome section and suggestions (with delay)
    setTimeout(() => {
      if (welcomeSection) {
        welcomeSection.classList.remove('hidden');
      }
      
      if (suggestionsGrid) {
        suggestionsGrid.style.display = '';
      }

      if (contentContainer) {
        contentContainer.style.display = '';
      }
      
      console.log('✅ New chat started - welcome section restored');

      // Step 4: Clear input field and focus
      const chatInput = document.querySelector('.chat-input');
      if (chatInput) {
        chatInput.value = '';
        chatInput.focus();
      }

    }, 200);

    // Step 5: Update sidebar to refresh chat history
    if (window.copilotApp && window.copilotApp.fetchUserMessages) {
      setTimeout(() => {
        window.copilotApp.fetchUserMessages();
      }, 500);
    }
    
    // Step 6: Visual feedback for button click
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
      newChatBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        newChatBtn.style.transform = '';
      }, 150);
    }

    if (window.copilotApp && typeof window.copilotApp.hideSidebarOnNewChat === 'function') {
        window.copilotApp.hideSidebarOnNewChat();
    }
    
    // Reset all chat state
    this.isChatActive = false;
    this.isProcessing = false;
    this.currentSessionId = this.generateSessionId();

  }


  displayUserMessage(message) {
    const chatContainer = this.getChatContainer();
    if (!chatContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-text">${this.escapeHtml(message)}</div>
        <div class="message-time">${new Date().toLocaleTimeString()}</div>
      </div>
    `;
    
    chatContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

formatAIResponse(text) {
  // Step 1: Clean and normalize the input text
  let formattedText = text.trim();
  
  // Step 2: Preserve markdown formatting BEFORE cleaning HTML
  formattedText = this.preserveMarkdownFormatting(formattedText);
  
  // Step 3: Remove any existing malformed HTML (but preserve our markers)
  formattedText = formattedText.replace(/<[^>]*>/g, '');
  
  // Step 4: Fix broken formatting patterns
  formattedText = this.fixBrokenFormatting(formattedText);
  
  // Step 5: Apply proper formatting
  formattedText = this.applyProperFormatting(formattedText);
  
  // Step 6: Convert markdown to HTML
  formattedText = this.convertMarkdownToHTML(formattedText);
  
  // Step 7: Clean up and finalize
  formattedText = this.finalCleanup(formattedText);
  
  return formattedText;
}

// NEW METHOD: Preserve markdown before processing
preserveMarkdownFormatting(text) {
  // Use unique markers to preserve markdown during processing
  text = text.replace(/\*\*([^*]+)\*\*/g, '{{BOLD_START}}$1{{BOLD_END}}');
  text = text.replace(/\*([^*]+)\*/g, '{{ITALIC_START}}$1{{ITALIC_END}}');
  
  return text;
}

// NEW METHOD: Convert preserved markdown to HTML
convertMarkdownToHTML(text) {
  // Convert our preserved markers to HTML
  text = text.replace(/\{\{BOLD_START\}\}([^{]+)\{\{BOLD_END\}\}/g, '<strong>$1</strong>');
  text = text.replace(/\{\{ITALIC_START\}\}([^{]+)\{\{ITALIC_END\}\}/g, '<em>$1</em>');
  
  return text;
}


fixBrokenFormatting(text) {
  // Fix broken numbered lists like "1. * • Start with"
  text = text.replace(/(\d+)\.\s*\*\s*•\s*([^*•]+)\s*\*\s*•\s*:\s*/g, '$1. **$2**: ');
  
  // Fix broken bullet points like "• item">1."
  text = text.replace(/•\s*item">\s*(\d+)\.\s*/g, '$1. ');
  
  // Fix broken asterisk patterns
  text = text.replace(/\*\s*•\s*([^*•]+)\s*\*\s*•\s*/g, '**$1**');
  
  // Fix broken line breaks in sentences
  text = text.replace(/([a-z])\.\s*([A-Z])/g, '$1. $2');
  
  // Fix "The document" repetitions
  text = text.replace(/\s*The document\s*/g, ' ');
  
  return text;
}

applyProperFormatting(text) {
  // Split into logical sections, including markdown headers
  const sections = text.split(/(?=\d+\.\s|\n\n|Here's|Overall|Some of the key points|\*\*[IVX]+\.\s|\*\*[A-Z][^*]*\*\*)/);
  let result = '';
  
  sections.forEach(section => {
    const trimmed = section.trim();
    if (!trimmed) return;
    
    if (this.isNumberedList(trimmed)) {
      result += this.formatNumberedList(trimmed);
    } else if (this.isBulletList(trimmed)) {
      result += this.formatBulletList(trimmed);
    } else if (this.isHeader(trimmed)) {
      result += this.formatHeader(trimmed);
    } else {
      result += this.formatParagraph(trimmed);
    }
  });
  
  return result;
}

isNumberedList(text) {
  return /^\d+\.\s/.test(text) || text.includes('1.') || text.includes('2.');
}

isBulletList(text) {
  return /^[•·-]\s/.test(text) || text.includes('•') || text.includes('key points');
}

isHeader(text) {
  return text.includes('Here\'s') || 
         text.includes('Overall') || 
         text.includes('Some of the key') ||
         /\*\*[IVX]+\.\s/.test(text) || // Roman numerals like **I.**, **II.**
         /\*\*[A-Z][^*]*\*\*/.test(text); // Any **CAPITALIZED TEXT**
}


formatNumberedList(text) {
  // Extract all numbered items
  const items = text.split(/(?=\d+\.\s)/).filter(item => item.trim());
  let result = '<div class="numbered-list">';
  
  items.forEach(item => {
    const match = item.match(/^(\d+)\.\s*(.+)$/s);
    if (match) {
      const number = match[1];
      const content = match[2].trim();
      result += `
        <div class="numbered-item">
          <span class="number">${number}.</span>
          <span class="content">${this.formatContent(content)}</span>
        </div>
      `;
    }
  });
  
  result += '</div>';
  return result;
}

formatBulletList(text) {
  // Handle bullet points
  const lines = text.split('\n').filter(line => line.trim());
  let result = '<div class="bullet-list">';
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      const content = trimmed.replace(/^[•-]\s*/, '');
      result += `
        <div class="bullet-item">
          <span class="bullet">•</span>
          <span class="content">${this.formatContent(content)}</span>
        </div>
      `;
    } else if (trimmed) {
      result += `<p>${this.formatContent(trimmed)}</p>`;
    }
  });
  
  result += '</div>';
  return result;
}

formatHeader(text) {
  // Handle markdown headers like **I. Introduction**
  if (/\*\*([IVX]+\.\s[^*]+)\*\*/.test(text)) {
    const match = text.match(/\*\*([IVX]+\.\s[^*]+)\*\*/);
    if (match) {
      return `<h3 class="response-header">${match[1]}</h3>`;
    }
  }
  
  // Handle other markdown headers
  if (/\*\*([^*]+)\*\*/.test(text)) {
    const match = text.match(/\*\*([^*]+)\*\*/);
    if (match) {
      return `<h4 class="response-subheader">${match[1]}</h4>`;
    }
  }
  
  // Existing logic for other headers
  const cleanText = text.replace(/^(Here's|Overall|Some of the key points)/, '').trim();
  if (text.includes('Here\'s')) {
    return `<h4 class="response-header">Key Points:</h4>`;
  } else if (text.includes('Overall')) {
    return `<h4 class="response-subheader">Summary</h4><p>${cleanText}</p>`;
  } else {
    return `<h4 class="response-subheader">Key Highlights</h4>`;
  }
}


formatParagraph(text) {
  // Split long paragraphs into sentences
  const sentences = text.split(/(?<=[.!?])\s+/);
  let result = '<p>';
  
  sentences.forEach((sentence, index) => {
    const trimmed = sentence.trim();
    if (trimmed) {
      result += this.formatContent(trimmed);
      if (index < sentences.length - 1) {
        result += ' ';
      }
    }
  });
  
  result += '</p>';
  return result;
}

formatContent(content) {
  // Just clean up extra spaces - markdown conversion happens elsewhere
  content = content.replace(/\s+/g, ' ').trim();
  return content;
}


finalCleanup(text) {
  // Remove empty paragraphs
  text = text.replace(/<p>\s*<\/p>/g, '');
  
  // Fix nested HTML issues
  text = text.replace(/<p>\s*<h4/g, '<h4');
  text = text.replace(/<\/h4>\s*<\/p>/g, '</h4>');
  text = text.replace(/<p>\s*<div/g, '<div');
  text = text.replace(/<\/div>\s*<\/p>/g, '</div>');
  
  // Ensure proper spacing
  text = text.replace(/(<\/div>)(<div)/g, '$1\n$2');
  text = text.replace(/(<\/h4>)(<p)/g, '$1\n$2');
  text = text.replace(/(<\/p>)(<h4)/g, '$1\n$2');
  
  return text.trim();
}

  formatNumberedLists(text) {
    // Match numbered lists and keep them together
    // This regex finds patterns like "1. Text" or "1.\n\nText" and normalizes them
    text = text.replace(/(\d+)\.\s*\n*\s*([A-Z][^.]*?)(?=\s*\d+\.|$|\n\n[A-Z])/g, 
      '<div class="numbered-item"><span class="number">$1.</span> <span class="content">$2</span></div>');
    
    // Handle numbered lists that are part of longer sentences
    text = text.replace(/(\d+)\.\s*([A-Z][^.]*?\.)/g, 
      '<div class="numbered-item"><span class="number">$1.</span> <span class="content">$2</span></div>');
    
    return text;
  }

  formatBulletPoints(text) {
    // Handle various bullet point formats
    text = text.replace(/[-•*]\s*([^-•*\n]+)/g, 
      '<div class="bullet-item"><span class="bullet">•</span> <span class="content">$1</span></div>');
    
    return text;
  }

  formatSectionHeaders(text) {
    // Detect section headers (sentences ending with colons)
    text = text.replace(/^([A-Z][^:]*:)\s*$/gm, '<h4 class="response-header">$1</h4>');
    
    // Handle topic transitions
    text = text.replace(/(The document|The paper|Moving on to|Additionally|Furthermore|Moreover|In conclusion|Overall|Main points)/g, 
      '<h4 class="response-subheader">$1</h4>');
    
    return text;
  }

  formatParagraphs(text) {
    // Split text into sentences for better paragraph handling
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
    let result = '';
    let currentParagraph = '';
    
    sentences.forEach((sentence, index) => {
      // Skip if sentence is already formatted as HTML
      if (sentence.includes('<div class=') || sentence.includes('<h4 class=')) {
        if (currentParagraph.trim()) {
          result += `<p>${currentParagraph.trim()}</p>`;
          currentParagraph = '';
        }
        result += sentence;
        return;
      }
      
      // Add sentence to current paragraph
      currentParagraph += sentence + ' ';
      
      // Create new paragraph after certain patterns
      if (this.shouldBreakParagraph(sentence, sentences[index + 1])) {
        result += `<p>${currentParagraph.trim()}</p>`;
        currentParagraph = '';
      }
    });
    
    // Add remaining content as final paragraph
    if (currentParagraph.trim()) {
      result += `<p>${currentParagraph.trim()}</p>`;
    }
    
    return result;
  }

  shouldBreakParagraph(currentSentence, nextSentence) {
    if (!nextSentence) return true;
    
    // Break after sentences that introduce new topics
    const topicIntroducers = [
      'The document', 'The paper', 'Moving on', 'Additionally', 
      'Furthermore', 'Moreover', 'In conclusion', 'Overall'
    ];
    
    return topicIntroducers.some(phrase => 
      currentSentence.includes(phrase) || nextSentence.includes(phrase)
    );
  }

  cleanupFormatting(text) {
    // Remove empty paragraphs
    text = text.replace(/<p>\s*<\/p>/g, '');
    
    // Fix nested HTML issues
    text = text.replace(/<p>\s*<h4/g, '<h4');
    text = text.replace(/<\/h4>\s*<\/p>/g, '</h4>');
    text = text.replace(/<p>\s*<div/g, '<div');
    text = text.replace(/<\/div>\s*<\/p>/g, '</div>');
    
    // Ensure proper spacing between elements
    text = text.replace(/(<\/div>)(<div)/g, '$1\n$2');
    text = text.replace(/(<\/h4>)(<p)/g, '$1\n$2');
    
    return text.trim();
  }

  displayAIResponse(response) {
    const chatContainer = this.getChatContainer();
    if (!chatContainer) return;

    // Enhanced formatting for AI responses
    const formattedMessage = this.formatAIResponse(response.message);
    const formattedSources = this.formatSources(response.sources);

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-text">${formattedMessage}</div>
        ${response.sources && response.sources.length > 0 ? 
          `<div class="message-sources">
            <div class="sources-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              <span>Sources</span>
            </div>
            <div class="sources-list">
              ${formattedSources}
            </div>
          </div>` : ''}
        <div class="message-time">
          ${new Date().toLocaleTimeString()} 
          (${response.processingTime?.toFixed(2)}s)
        </div>
      </div>
    `;
    
    chatContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  formatSources(sources) {
    if (!sources || sources.length === 0) return '';
    
    return sources.map((source, index) => {
      try {
        const sourceData = typeof source === 'string' ? JSON.parse(source) : source;
        return `
          <div class="source-item">
            <div class="source-number">[${index + 1}]</div>
            <div class="source-details">
              <div class="source-filename">${sourceData.file_name || 'Document'}</div>
              <div class="source-meta">Page ${sourceData.page_label || 'N/A'} • ${this.formatFileSize(sourceData.file_size)}</div>
            </div>
          </div>
        `;
      } catch (e) {
        return `
          <div class="source-item">
            <div class="source-number">[${index + 1}]</div>
            <div class="source-details">
              <div class="source-filename">Document Reference</div>
              <div class="source-meta">Source ${index + 1}</div>
            </div>
          </div>
        `;
      }
    }).join('');
  }

  formatFileSize(bytes) {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Enhanced method to handle different response types
  detectResponseType(text) {
    // Check for numbered lists
    if (/\d+\.\s/.test(text)) return 'numbered-list';
    
    // Check for bullet points
    if (/[-•*]\s/.test(text)) return 'bullet-list';
    
    // Check for headers (colons at end of lines)
    if (/^[A-Z][^:]*:$/m.test(text)) return 'structured';
    
    // Default to paragraph
    return 'paragraph';
  }

  // Alternative formatting method for different content types
  formatByType(text) {
    const type = this.detectResponseType(text);
    
    switch (type) {
      case 'numbered-list':
        return this.formatNumberedContent(text);
      case 'bullet-list':
        return this.formatBulletContent(text);
      case 'structured':
        return this.formatStructuredContent(text);
      default:
        return this.formatParagraphContent(text);
    }
  }

  formatNumberedContent(text) {
    // Specialized formatting for numbered content
    const lines = text.split('\n');
    let result = '';
    let inList = false;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (/^\d+\./.test(trimmed)) {
        if (!inList) {
          result += '<div class="numbered-list">';
          inList = true;
        }
        const match = trimmed.match(/^(\d+)\.\s*(.+)$/);
        if (match) {
          result += `<div class="numbered-item">
            <span class="number">${match[1]}.</span>
            <span class="content">${match[2]}</span>
          </div>`;
        }
      } else if (trimmed && inList) {
        // Continue previous item
        result = result.replace(/<\/span><\/div>$/, ` ${trimmed}</span></div>`);
      } else if (trimmed) {
        if (inList) {
          result += '</div>';
          inList = false;
        }
        result += `<p>${trimmed}</p>`;
      }
    });
    
    if (inList) result += '</div>';
    return result;
  }

  formatBulletContent(text) {
    // Similar approach for bullet points
    return text.replace(/[-•*]\s*([^\n]+)/g, 
      '<div class="bullet-item"><span class="bullet">•</span> <span class="content">$1</span></div>');
  }

  formatStructuredContent(text) {
    // Handle structured content with headers
    return text.replace(/^([A-Z][^:]*:)\s*$/gm, '<h4 class="response-header">$1</h4>')
               .replace(/\n\n/g, '</p><p>')
               .replace(/^/, '<p>')
               .replace(/$/, '</p>')
               .replace(/<p><h4/g, '<h4')
               .replace(/<\/h4><\/p>/g, '</h4>');
  }

  formatParagraphContent(text) {
    // Simple paragraph formatting
    return text.split('\n\n')
               .filter(para => para.trim())
               .map(para => `<p>${para.trim()}</p>`)
               .join('');
  }

  showTypingIndicator() {
    const chatContainer = this.getChatContainer();
    if (!chatContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="message-content">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    
    chatContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  displayError(error) {
    const chatContainer = this.getChatContainer();
    if (!chatContainer) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'message error-message';
    errorDiv.innerHTML = `
      <div class="message-content">
        <div class="message-text">❌ ${this.escapeHtml(error)}</div>
        <div class="message-time">${new Date().toLocaleTimeString()}</div>
      </div>
    `;
    
    chatContainer.appendChild(errorDiv);
    this.scrollToBottom();
  }

  getChatContainer() {
    let chatContainer = document.getElementById('chat-container');
    if (!chatContainer) {
      // Create chat container if it doesn't exist
      chatContainer = document.createElement('div');
      chatContainer.id = 'chat-container';
      chatContainer.className = 'chat-container';
      
      // Insert after main content
      const mainContent = document.querySelector('.main-content');
      if (mainContent && mainContent.parentNode) {
        mainContent.parentNode.insertBefore(chatContainer, mainContent.nextSibling);
      } else {
        // Fallback: append to body
        document.body.appendChild(chatContainer);
      }
    }
    return chatContainer;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  scrollToBottom() {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        // Smooth scroll to bottom
        chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
        });
    }
  }
}

// Enhanced initialization in your app.js
document.addEventListener('DOMContentLoaded', () => {
  // Initialize existing CopilotApp first
  const copilotApp = new CopilotApp();
  
  // Then initialize RAG Chat Manager with slight delay
  setTimeout(() => {
    window.ragChat = new RAGChatManager();
    
    // Connect to your existing chat input and send button
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.send-button');
    
    if (chatInput && sendButton) {
      // Handle Enter key
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !window.ragChat.isProcessing) {
          e.preventDefault();
          handleSendMessage();
        }
      });

      // Handle send button click
      sendButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (!window.ragChat.isProcessing) {
          handleSendMessage();
        }
      });

      function handleSendMessage() {
        const message = chatInput.value.trim();
        if (message) {
          window.ragChat.sendMessage(message);
          chatInput.value = '';
        }
      }
    }
    
    console.log('✅ Complete RAG integration initialized');
  }, 1000);
});


class DocumentUploadManager {
    constructor() {
        this.uploadOverlay = null;
        this.uploadZone = null;
        this.fileInput = null;
        this.progressModal = null;
        this.uploadButton = null;
        this.allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.init();
    }

    init() {
        console.log('🔧 Initializing DocumentUploadManager...');
        this.cacheElements();
        this.setupEventListeners();
        this.setupGlobalDragAndDrop();
        console.log('✅ Document Upload Manager initialized');
    }

    cacheElements() {
        this.uploadOverlay = document.getElementById('uploadOverlay');
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('fileInput');
        this.progressModal = document.getElementById('uploadProgressModal');
        this.uploadButton = document.getElementById('uploadButton');
        this.browseFilesBtn = document.getElementById('browseFilesBtn');
        this.cancelUploadBtn = document.getElementById('cancelUploadBtn');
        this.progressBar = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.uploadFileList = document.getElementById('uploadFileList');

        // Debug: Check if elements exist
        console.log('🔍 Element check:', {
            uploadButton: !!this.uploadButton,
            uploadOverlay: !!this.uploadOverlay,
            uploadZone: !!this.uploadZone,
            fileInput: !!this.fileInput
        });
    }

    setupEventListeners() {
        // Upload button in input area
        if (this.uploadButton) {
            this.uploadButton.addEventListener('click', () => {
                console.log('📎 Upload button clicked!');
                this.showUploadOverlay();
            });
            console.log('✅ Upload button event listener added');
        } else {
            console.error('❌ Upload button not found!');
        }

        // Browse files button
        if (this.browseFilesBtn) {
            this.browseFilesBtn.addEventListener('click', () => this.triggerFileInput());
        }

        // Cancel upload button
        if (this.cancelUploadBtn) {
            this.cancelUploadBtn.addEventListener('click', () => this.hideUploadOverlay());
        }

        // File input change
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFileSelection(e.target.files));
        }

        // Upload zone drag and drop
        if (this.uploadZone) {
            this.uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            this.uploadZone.addEventListener('drop', (e) => this.handleDrop(e));
        }

        // Overlay click to close
        if (this.uploadOverlay) {
            this.uploadOverlay.addEventListener('click', (e) => {
                if (e.target === this.uploadOverlay) {
                    this.hideUploadOverlay();
                }
            });
        }

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideUploadOverlay();
            }
        });
    }

    setupGlobalDragAndDrop() {
        let dragCounter = 0;

        document.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            if (this.isDraggedFileValid(e)) {
                this.showUploadOverlay();
                if (this.uploadOverlay) {
                    this.uploadOverlay.classList.add('drag-over');
                }
            }
        });

        document.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter === 0 && this.uploadOverlay) {
                this.uploadOverlay.classList.remove('drag-over');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            if (this.uploadOverlay) {
                this.uploadOverlay.classList.remove('drag-over');
            }
        });
    }

    isDraggedFileValid(e) {
        const items = e.dataTransfer.items;
        if (!items) return false;

        for (let item of items) {
            if (item.kind === 'file') {
                return true;
            }
        }
        return false;
    }

    showUploadOverlay() {
        console.log('🔧 showUploadOverlay called');
        if (this.uploadOverlay) {
            console.log('✅ Showing upload overlay');
            this.uploadOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            console.error('❌ Upload overlay element not found!');
        }
    }

    hideUploadOverlay() {
        if (this.uploadOverlay) {
            this.uploadOverlay.classList.remove('active', 'drag-over');
            document.body.style.overflow = '';
        }
        if (this.uploadZone) {
            this.uploadZone.classList.remove('drag-over');
        }
    }

    triggerFileInput() {
        if (this.fileInput) {
            this.fileInput.click();
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.uploadZone) {
            this.uploadZone.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.uploadZone && !this.uploadZone.contains(e.relatedTarget)) {
            this.uploadZone.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.uploadZone) {
            this.uploadZone.classList.remove('drag-over');
        }
        
        const files = e.dataTransfer.files;
        this.handleFileSelection(files);
    }

    async handleFileSelection(files) {
        if (!files || files.length === 0) return;

        const validFiles = [];
        const errors = [];

        // Validate files
        Array.from(files).forEach(file => {
            if (!this.allowedTypes.includes(file.type)) {
                errors.push(`${file.name}: Unsupported file type`);
                return;
            }

            if (file.size > this.maxFileSize) {
                errors.push(`${file.name}: File too large (max 10MB)`);
                return;
            }

            validFiles.push(file);
        });

        if (errors.length > 0) {
            alert('Upload errors:\n' + errors.join('\n'));
        }

        if (validFiles.length > 0) {
            this.hideUploadOverlay();
            await this.uploadFiles(validFiles);
        }
    }

    async uploadFiles(files) {
        this.showProgressModal();
        
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('documents', file);
            });

            this.displayUploadingFiles(files);
            this.updateProgress(10);

            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:3001/api/documents/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            this.updateProgress(70);

            if (response.ok) {
                const result = await response.json();
                this.updateProgress(100);
                this.handleUploadSuccess(result);
                
                // Refresh document list
                await this.refreshDocumentList();
                
            } else {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

        } catch (error) {
            console.error('Upload error:', error);
            this.handleUploadError(error);
        }
    }

    showProgressModal() {
        if (this.progressModal) {
            this.progressModal.classList.add('active');
        }
    }

    hideProgressModal() {
        if (this.progressModal) {
            this.progressModal.classList.remove('active');
        }
    }

    displayUploadingFiles(files) {
        if (!this.uploadFileList) return;

        this.uploadFileList.innerHTML = '';
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'upload-file-item';
            fileItem.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <span>${file.name}</span>
            `;
            this.uploadFileList.appendChild(fileItem);
        });
    }

    updateProgress(percent) {
        if (this.progressBar) {
            this.progressBar.style.width = `${percent}%`;
        }
        if (this.progressText) {
            this.progressText.textContent = `${Math.round(percent)}%`;
        }
    }

    handleUploadSuccess(result) {
        this.updateProgress(100);
        
        // Mark files as successful
        const fileItems = this.uploadFileList.querySelectorAll('.upload-file-item');
        fileItems.forEach(item => {
            item.classList.add('success');
        });

        setTimeout(() => {
            this.hideProgressModal();
            alert(result.message || 'Documents uploaded successfully!');
            
            // Trigger RAG reindexing
            this.triggerDocumentReindex();
        }, 1000);
    }

    handleUploadError(error) {
        const fileItems = this.uploadFileList.querySelectorAll('.upload-file-item');
        fileItems.forEach(item => {
            item.classList.add('error');
        });

        setTimeout(() => {
            this.hideProgressModal();
            alert('Upload failed. Please try again.');
        }, 1000);
    }

    async triggerDocumentReindex() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:3001/api/documents/reindex', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                console.log('✅ Document reindexing triggered');
            }
        } catch (error) {
            console.error('Reindex error:', error);
        }
    }


    async refreshDocumentList() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:3001/api/documents/list', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateDocumentDisplay(data.documents);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    }

    updateDocumentDisplay(documents) {
        // Update sidebar or create a document management panel
        this.renderDocumentList(documents);
        
        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('documentsUpdated', {
            detail: { documents }
        }));
    }

    renderDocumentList(documents) {
        // Create or update document list in sidebar
        let documentSection = document.getElementById('document-section');
        if (!documentSection) {
            documentSection = this.createDocumentSection();
        }

        documentSection.innerHTML = `
            <div class="section-header">
                <h4>My Documents</h4>
                <span class="document-count">${documents.length}</span>
            </div>
            <div class="document-list">
                ${documents.map(doc => `
                    <div class="document-item" data-file-id="${doc._id}">
                        <div class="document-icon">📄</div>
                        <div class="document-info">
                            <div class="document-name">${doc.originalName}</div>
                            <div class="document-meta">
                                ${this.formatFileSize(doc.size)} • 
                                ${new Date(doc.uploadedAt).toLocaleDateString()}
                            </div>
                        </div>
                        <button class="document-delete" onclick="window.documentUpload.deleteDocument('${doc._id}')">
                            ×
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    createDocumentSection() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return null;

        const documentSection = document.createElement('div');
        documentSection.id = 'document-section';
        documentSection.className = 'sidebar-section document-section';
        
        // Insert before the user profile section
        const userProfile = sidebar.querySelector('.sidebar-footer');
        if (userProfile) {
            sidebar.insertBefore(documentSection, userProfile);
        } else {
            sidebar.appendChild(documentSection);
        }

        return documentSection;
    }

    async deleteDocument(fileId) {
        if (!confirm('Are you sure you want to delete this document?')) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:3001/api/documents/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.showSuccessMessage('Document deleted successfully');
                await this.refreshDocumentList();
            } else {
                throw new Error('Failed to delete document');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showErrorMessage('Failed to delete document');
        }
    }

    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }


}


