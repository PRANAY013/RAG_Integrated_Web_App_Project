// Microsoft Copilot-inspired JavaScript functionality
// fetchUserMessages(): add new backend API for fetching messages after deploying on vercel!!
class CopilotApp {
    constructor() {
        this.currentTheme = 'light';
        this.init();
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


    init() {
        this.setupThemeToggle();
        this.setupChatInput();
        this.setupSuggestionCards();
        this.setupSendButton();
        this.detectSystemTheme();
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
            sendButton.addEventListener('click', () => {
                this.handleSendMessage();
            });
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
        
        // Send message to backend
        const response = await fetch('https://your-backend-url.vercel.app/api/messages', {
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
        // Replace with your actual deployed backend URL
        const response = await fetch('https://your-backend-url.vercel.app/api/messages', {
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
          section.innerHTML = '<div class="chat-item" style="color:#888;">No chats</div>';
          return;
        }
        msgs.forEach((msg, idx) => {
          const item = document.createElement('div');
          item.className = 'chat-item';
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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new CopilotApp();
    addSmoothInteractions();
    setupAccessibility();
    
    // Add loading animation for the page
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    }, 100);
});

// Handle window resize
window.addEventListener('resize', () => {
    const chatInput = document.getElementById('chatInput');
    if (chatInput && document.activeElement === chatInput) {
        setTimeout(() => {
            chatInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
});

// Prevent form submission if wrapped in a form
document.addEventListener('submit', (e) => {
    e.preventDefault();
});




// ----------------------------------------------------

/**
 * Google Authentication Module
 * Comprehensive, non-intrusive authentication system
 * with modern JWT handling and user state management
 */

class GoogleAuthManager {
  constructor(config = {}) {
    this.config = {
      clientId: config.clientId || '',
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
      
      this.isInitialized = true;
      this.log('Google Auth Manager initialized successfully');
      
    } catch (error) {
      this.handleError('Initialization failed', error);
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
      alternativeSignIn: document.getElementById('alternativeSignIn')
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
      client_id: '840850164307-m4lks13qq8ffu6sadbhu05233upog1ni.apps.googleusercontent.com',
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
        token: response.credential
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
   * Restore user session from localStorage
   */
  restoreUserSession() {
    try {
      // Change this line from 'google_r_session' to 'google_auth_session'
      const sessionData = localStorage.getItem('google_auth_session');
      if (!sessionData) return;

      const parsed = JSON.parse(sessionData);
      const sessionAge = Date.now() - parsed.timestamp;
    
      // Session expires after 24 hours
      if (sessionAge > 24 * 60 * 60 * 1000) {
        this.clearUserSession();
        return;
      }

      if (parsed.user) {
        this.currentUser = parsed.user;
        this.updateUIForSignedIn(parsed.user);
      
        // ADD THIS: Fetch and render chat history after session restore
        this.fetchUserMessages().then(messages => {
          this.renderSidebar(messages);
        });
      
        console.log('User session restored');
      }
    } catch (error) {
      console.log('Failed to restore user session:', error);
      this.clearUserSession();
    }
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

// new chat button clears the existing input
document.addEventListener('DOMContentLoaded', function() {
    const newChatBtn = document.getElementById('newChatBtn');
    const chatInput = document.getElementById('chatInput');

    newChatBtn.addEventListener('click', function() {
        chatInput.value = '';
        // Optionally, focus the input after clearing
        chatInput.focus();
    });
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





const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const headerLeft = document.getElementById('headerLeft');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const mainLayout = document.getElementById('mainWrapper');

// Set your default sidebar width here
const SIDEBAR_WIDTH = '280px';

function showSidebar() {
  sidebar.classList.remove('sidebar--hidden');
  sidebarOverlay.classList.remove('hidden');
  mainLayout.style.setProperty('--sidebar-width', SIDEBAR_WIDTH);
  // Hide header-left when sidebar is shown
  if (headerLeft) headerLeft.classList.add('header-left--hidden');
}

function hideSidebar() {
  sidebar.classList.add('sidebar--hidden');
  sidebarOverlay.classList.add('hidden');
  mainLayout.style.setProperty('--sidebar-width', '0px');
  // Show header-left when sidebar is hidden
  if (headerLeft) headerLeft.classList.remove('header-left--hidden');
}


// Toggle sidebar
sidebarToggleBtn.addEventListener('click', () => {
  if (sidebar.classList.contains('sidebar--hidden')) {
    showSidebar();
  } else {
    hideSidebar();
  }
});

// Hide sidebar when clicking overlay
sidebarOverlay.addEventListener('click', hideSidebar);

// Hide sidebar on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideSidebar();
});

// Optionally: Hide sidebar by default on mobile
if (window.innerWidth < 768) {
  hideSidebar();
}
