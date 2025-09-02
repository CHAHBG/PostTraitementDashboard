/**
 * Modal component
 */

let activeModal = null;

/**
 * Initialize the modal system
 */
export function initModalSystem() {
  // Find all modal triggers
  const modalTriggers = document.querySelectorAll('[data-modal]');
  
  modalTriggers.forEach(trigger => {
    const modalId = trigger.getAttribute('data-modal');
    trigger.addEventListener('click', () => openModal(modalId));
  });
  
  // Add click handler for the "About" link in the footer
  const aboutLink = document.querySelector('.js-open-about');
  if (aboutLink) {
    aboutLink.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('aboutModal');
    });
  }
  
  // Add click handlers for close buttons
  const closeButtons = document.querySelectorAll('.close-modal');
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      closeModal(modal.id);
    });
  });
  
  // Close modal when clicking outside of content
  document.addEventListener('click', (event) => {
    if (activeModal && event.target.classList.contains('modal')) {
      closeModal(activeModal.id);
    }
  });
  
  // Close modal when pressing Escape
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeModal) {
      closeModal(activeModal.id);
    }
  });
}

/**
 * Open a modal by its ID
 * @param {string} modalId - ID of the modal to open
 */
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  
  if (!modal) {
    console.error(`Modal with ID "${modalId}" not found`);
    return;
  }
  
  // Close any open modal first
  if (activeModal) {
    closeModal(activeModal.id);
  }
  
  // Show the modal
  modal.classList.add('active');
  activeModal = modal;
  
  // Add ARIA attributes
  modal.setAttribute('aria-hidden', 'false');
  
  // Prevent scrolling on the body
  document.body.style.overflow = 'hidden';
  
  // Find the first focusable element and focus it
  const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
  
  // Dispatch custom event
  window.dispatchEvent(new CustomEvent('modalopen', { detail: { modalId } }));
}

/**
 * Close a modal by its ID
 * @param {string} modalId - ID of the modal to close
 */
export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  
  if (!modal) {
    console.error(`Modal with ID "${modalId}" not found`);
    return;
  }
  
  // Hide the modal
  modal.classList.remove('active');
  activeModal = null;
  
  // Update ARIA attributes
  modal.setAttribute('aria-hidden', 'true');
  
  // Restore scrolling on the body
  document.body.style.overflow = '';
  
  // Dispatch custom event
  window.dispatchEvent(new CustomEvent('modalclose', { detail: { modalId } }));
}
