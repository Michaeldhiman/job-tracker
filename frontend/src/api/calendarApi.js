import axiosClient from './axiosClient.js';

/**
 * Fetches the user's Google Calendar connection status and email
 */
export const getCalendarStatus = async () => {
  const response = await axiosClient.get('/api/calendar/status');
  return response.data;
};

/**
 * Fetches custom events from the application database
 */
export const getCalendarEvents = async () => {
  const response = await axiosClient.get('/api/calendar/events');
  return response.data;
};

/**
 * Creates a new event and triggers sync with Google Calendar
 */
export const createCalendarEvent = async (eventData) => {
  const response = await axiosClient.post('/api/calendar/events', eventData);
  return response.data;
};

/**
 * Updates an event and syncs modifications to Google Calendar
 */
export const updateCalendarEvent = async (id, eventData) => {
  const response = await axiosClient.put(`/api/calendar/events/${id}`, eventData);
  return response.data;
};

/**
 * Deletes an event from the database and Google Calendar
 */
export const deleteCalendarEvent = async (id) => {
  const response = await axiosClient.delete(`/api/calendar/events/${id}`);
  return response.data;
};

/**
 * Triggers a manual two-way synchronization
 */
export const syncCalendar = async () => {
  const response = await axiosClient.post('/api/calendar/sync');
  return response.data;
};

/**
 * Gets the Google OAuth redirect consent screen URL
 */
export const getGoogleAuthUrl = async () => {
  const response = await axiosClient.get('/api/calendar/auth/init');
  return response.data;
};

export const updateCalendarPreferences = async (preferences) => {
  const response = await axiosClient.put('/api/calendar/preferences', preferences);
  return response.data;
};

/**
 * Disconnects the user's Google Calendar account
 */
export const disconnectCalendar = async () => {
  const response = await axiosClient.post('/api/calendar/disconnect');
  return response.data;
};
