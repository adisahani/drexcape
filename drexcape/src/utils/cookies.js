// Cookie utility functions for contact form tracking
export const setCookie = (name, value, days = 30) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

export const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
};

// Contact form specific functions
export const hasUserFilledContactForm = async () => {
  try {
    // First check with backend API for session-based access
    const response = await fetch('/api/user/access-status', {
      method: 'GET',
      credentials: 'include' // Include cookies for session
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('🔍 === hasUserFilledContactForm API check ===');
      console.log('  - API Response:', data);
      console.log('  - hasAccess:', data.hasAccess);
      
      if (data.hasAccess) {
        return true;
      }
    }
  } catch (error) {
    console.log('API check failed, falling back to cookie check:', error);
  }
  
  // Fallback to cookie check for backward compatibility
  const userData = getCookie('drexcape_user_data');
  const popupInteracted = getCookie('drexcape_popup_interacted');
  console.log('🔍 === hasUserFilledContactForm cookie fallback ===');
  console.log('  - userData:', userData);
  console.log('  - popupInteracted:', popupInteracted);
  console.log('  - Result:', userData && popupInteracted === 'submitted');
  // Only return true if user has actually submitted the form, not just dismissed it
  return userData && popupInteracted === 'submitted';
};

export const markUserAsContacted = () => {
  console.log('✅ markUserAsContacted called - setting submitted cookie');
  setCookie('drexcape_popup_interacted', 'submitted', 365); // Keep for 1 year
};

// Reset dismissal status when user attempts to access locked content
export const resetPopupInteraction = () => {
  console.log('🗑️ resetPopupInteraction called - deleting popup interaction cookie');
  deleteCookie('drexcape_popup_interacted');
};

// NEW FUNCTION: Reset dismissal status
export const resetPopupDismissal = () => {
  console.log('🗑️ resetPopupDismissal called - deleting popup interaction cookie');
  deleteCookie('drexcape_popup_interacted');
}; 