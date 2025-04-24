// utils/validateUser.js

export const validateUserId = (userId) => {
    // Example: Ensure userId is a non-empty string or a valid format
    return typeof userId === 'string' && userId.length > 0;
  };
  
  export const validateInterests = (interests) => {
    return Array.isArray(interests) && interests.every((interest) => typeof interest === 'string');
  };
  