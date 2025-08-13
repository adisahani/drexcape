// Helper function for day icons
const getDayIcon = (dayNum) => {
  switch (parseInt(dayNum)) {
    case 1: return '✈️';
    case 2: return '🌄';
    case 3: return '🚂';
    case 4: return '👋';
    case 5: return '🏖️';
    case 6: return '🎭';
    case 7: return '🏔️';
    default: return '📅';
  }
};

// Helper function to check if content is package information
const isPackageInfo = (content) => {
  const packageKeywords = [
    'accommodation', 'hotel', 'nights', 'budget', 'luxury', 'resort',
    'transport', 'transfer', 'airport', 'local transport', 'vehicle',
    'meals', 'breakfast', 'lunch', 'dinner', 'included', 'excluded',
    'terms', 'prices', 'per person', 'personal expenses', 'entry fees',
    'contact us', 'book now', 'package', 'inclusions', 'exclusions'
  ];
  
  const lowerContent = content.toLowerCase();
  return packageKeywords.some(keyword => lowerContent.includes(keyword));
};

// Helper function to clean activity content
const cleanActivityContent = (content) => {
  if (!content) return '';
  
  // Split by bullet points and filter out ONLY pure package information
  const activities = content.split(/[•\-\*]/).map(activity => activity.trim()).filter(activity => {
    if (!activity) return false;
    
    // Don't filter out departure-related activities
    if (activity.toLowerCase().includes('departure') || 
        activity.toLowerCase().includes('check out') ||
        activity.toLowerCase().includes('transfer') ||
        activity.toLowerCase().includes('airport')) {
      return true;
    }
    
    // Don't filter out activities that contain action words (verbs)
    const actionWords = ['visit', 'explore', 'enjoy', 'see', 'go', 'take', 'have', 'eat', 'drink', 'walk', 'tour', 'experience'];
    const hasAction = actionWords.some(word => activity.toLowerCase().includes(word));
    if (hasAction) {
      return true;
    }
    
    // Only filter out pure package information (pricing, terms, etc.)
    const purePackageKeywords = [
      'per person', 'inclusive', 'exclusive', 'gst', 'terms', 'contact us', 'book now',
      'prices are', 'subject to availability', 'personal expenses', 'entry fees'
    ];
    
    const isPurePackageInfo = purePackageKeywords.some(keyword => 
      activity.toLowerCase().includes(keyword)
    );
    
    return !isPurePackageInfo;
  });
  
  return activities.join('\n• ');
};

// Parse AI-generated itinerary details into structured day data
export const parseItineraryDetails = (details) => {
  if (!details) return { days: [], accommodation: '', meals: '', transport: '' };

  const days = [];
  let packageInfo = '';
  let accommodation = '';
  let meals = '';
  let transport = '';
  
  // Parse the entire content as a single block
  const lines = details.split('\n');
  let currentDay = null;
  let currentSection = '';
  let currentContent = [];
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;
    
    // Check for day headers
    const dayMatch = trimmedLine.match(/Day (\d+)[:.\-]?\s*(.+)/i);
    if (dayMatch) {
      // Save previous day if exists
      if (currentDay) {
        // Save last section of previous day
        if (currentSection && currentContent.length > 0) {
          const content = currentContent.join('\n');
          const cleanedContent = cleanActivityContent(content);
          
          switch (currentSection.toLowerCase()) {
            case 'morning':
              currentDay.morning = cleanedContent;
              break;
            case 'afternoon':
              currentDay.afternoon = cleanedContent;
              break;
            case 'evening':
            case 'night':
              currentDay.evening = cleanedContent;
              break;
          }
        }
        days.push(currentDay);
      }
      
      // Start new day
      const dayNumber = dayMatch[1];
      const dayDescription = dayMatch[2];
      
      currentDay = {
        icon: getDayIcon(dayNumber),
        dayTitle: `Day ${dayNumber}: ${dayDescription}`,
        morning: '',
        afternoon: '',
        evening: ''
      };
      currentSection = '';
      currentContent = [];
    } else if (trimmedLine.match(/^(Morning|Afternoon|Evening|Night)[:.\-]?\s*/i)) {
      // Save previous section
      if (currentSection && currentContent.length > 0 && currentDay) {
        const content = currentContent.join('\n');
        const cleanedContent = cleanActivityContent(content);
        
        switch (currentSection.toLowerCase()) {
          case 'morning':
            currentDay.morning = cleanedContent;
            break;
          case 'afternoon':
            currentDay.afternoon = cleanedContent;
            break;
          case 'evening':
          case 'night':
            currentDay.evening = cleanedContent;
            break;
        }
      }
      
      // Start new section
      currentSection = trimmedLine.match(/^([^:.\-]+)[:.\-]?\s*/i)?.[1] || '';
      currentContent = [];
    } else if (currentDay && currentSection) {
      // Add to current section
      currentContent.push(trimmedLine);
    } else if (currentDay && !currentSection) {
      // If we have a day but no section, check if this is package info
      if (isPackageInfo(trimmedLine)) {
        packageInfo += trimmedLine + '\n';
        
        // Extract specific information
        if (isAccommodationInfo(trimmedLine)) {
          accommodation += trimmedLine + '\n';
        } else if (isMealsInfo(trimmedLine)) {
          meals += trimmedLine + '\n';
        } else if (isTransportInfo(trimmedLine)) {
          transport += trimmedLine + '\n';
        }
      }
    } else {
      // If no current day, check if this is package info
      if (isPackageInfo(trimmedLine)) {
        packageInfo += trimmedLine + '\n';
        
        // Extract specific information
        if (isAccommodationInfo(trimmedLine)) {
          accommodation += trimmedLine + '\n';
        } else if (isMealsInfo(trimmedLine)) {
          meals += trimmedLine + '\n';
        } else if (isTransportInfo(trimmedLine)) {
          transport += trimmedLine + '\n';
        }
      }
    }
  });
  
  // Save last section and day
  if (currentDay) {
    if (currentSection && currentContent.length > 0) {
      const content = currentContent.join('\n');
      const cleanedContent = cleanActivityContent(content);
      
      switch (currentSection.toLowerCase()) {
        case 'morning':
          currentDay.morning = cleanedContent;
          break;
        case 'afternoon':
          currentDay.afternoon = cleanedContent;
          break;
        case 'evening':
        case 'night':
          currentDay.evening = cleanedContent;
          break;
      }
    }
    days.push(currentDay);
  }
  
  // Add default content for departure days if they're empty
  days.forEach(day => {
    const isDepartureDay = day.dayTitle.toLowerCase().includes('departure');
    
    if (isDepartureDay) {
      if (!day.morning && !day.afternoon && !day.evening) {
        // Add default departure activities
        day.morning = '• Enjoy breakfast at hotel\n• Check out from the hotel';
        day.afternoon = '• Transfer to airport for departure';
        day.evening = '• Departure from destination';
      } else {
        // If some sections are empty, add appropriate defaults
        if (!day.morning) {
          day.morning = '• Enjoy breakfast at hotel\n• Check out from the hotel';
        }
        if (!day.afternoon) {
          day.afternoon = '• Transfer to airport for departure';
        }
        if (!day.evening) {
          day.evening = '• Departure from destination';
        }
      }
    } else {
      // For non-departure days, add default evening if missing
      if (!day.evening) {
        day.evening = '• Free time for relaxation and dinner';
      }
    }
  });
  
  // Store package info for later use
  if (packageInfo) {
    if (typeof window !== 'undefined') {
      window.packageInfo = packageInfo.trim();
    }
  }
  
  return {
    days,
    accommodation: accommodation.trim(),
    meals: meals.trim(),
    transport: transport.trim()
  };
};

// Helper function to identify accommodation information
const isAccommodationInfo = (content) => {
  const accommodationKeywords = [
    'accommodation', 'hotel', 'nights', 'budget', 'luxury', 'resort', 'stay', 'check in', 'check out'
  ];
  
  const lowerContent = content.toLowerCase();
  return accommodationKeywords.some(keyword => lowerContent.includes(keyword));
};

// Helper function to identify meals information
const isMealsInfo = (content) => {
  const mealsKeywords = [
    'meals', 'breakfast', 'lunch', 'dinner', 'included', 'excluded', 'restaurant', 'dining'
  ];
  
  const lowerContent = content.toLowerCase();
  return mealsKeywords.some(keyword => lowerContent.includes(keyword));
};

// Helper function to identify transport information
const isTransportInfo = (content) => {
  const transportKeywords = [
    'transport', 'transfer', 'airport', 'local transport', 'vehicle', 'car', 'bus', 'train'
  ];
  
  const lowerContent = content.toLowerCase();
  return transportKeywords.some(keyword => lowerContent.includes(keyword));
}; 