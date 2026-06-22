import axios from "axios";
import GoogleToken from "../models/GoogleToken.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import { config } from "../config/runtimeConfig.js";

// Helper to get Google OAuth configuration from environment variables
const getOAuthConfig = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google OAuth environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI");
  }

  return { clientId, clientSecret, redirectUri };
};

/**
 * Generates the redirect URL for Google OAuth consent screen
 */
export const getAuthUrl = (state) => {
  const { clientId, redirectUri } = getOAuthConfig();
  const scope = "openid email profile https://www.googleapis.com/auth/calendar";
  
  return `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent&` +
    `state=${state}`;
};

/**
 * Exchanges auth code for access/refresh tokens
 */
export const exchangeCode = async (code) => {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();

  const response = await axios.post("https://oauth2.googleapis.com/token", {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  // refresh_token is only returned by Google on the first authorization.
  // On subsequent reconnects the field will be absent — callers must handle null.
  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token || null,
    expiresIn: response.data.expires_in,
  };
};

/**
 * Fetches user profile from Google to get their email address
 */
export const getGoogleUserInfo = async (accessToken) => {
  const response = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data; // contains email
};

/**
 * Ensures the user has a valid access token. Refreshes if expired.
 */
export const refreshAccessToken = async (userId) => {
  const tokenRecord = await GoogleToken.findOne({ userId });
  if (!tokenRecord) {
    throw new Error("Google Calendar connection tokens not found.");
  }

  const now = new Date();
  // Refresh if expired or expiring soon.
  if (tokenRecord.tokenExpiry.getTime() - now.getTime() > config.googleCalendar.tokenRefreshSkewMs) {
    return tokenRecord.accessToken;
  }

  const { clientId, clientSecret } = getOAuthConfig();

  try {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokenRecord.refreshToken,
      grant_type: "refresh_token",
    });

    tokenRecord.accessToken = response.data.access_token;
    tokenRecord.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
    await tokenRecord.save();

    return tokenRecord.accessToken;
  } catch (error) {
    console.error(`Failed to refresh Google token for user ${userId}`, error.response?.data || error.message);
    
    // If authorization has been revoked, disconnect the user in our app
    if (error.response?.data?.error === "invalid_grant") {
      await User.findByIdAndUpdate(userId, {
        googleCalendarConnected: false,
        googleCalendarEmail: null,
      });
      await GoogleToken.deleteOne({ userId });
    }
    
    throw new Error("Google Calendar authentication expired. Please reconnect.");
  }
};

/**
 * Formats a date and a HH:MM time string into an ISO 8601 datetime string
 * that Google Calendar will interpret as the user's wall-clock time.
 *
 * We deliberately avoid converting through UTC here because:
 *   new Date(`${date}T${time}:00`)  →  parsed as LOCAL server time
 *   .toISOString()                  →  then shifted to UTC
 * If the server is not in UTC this produces the wrong timestamp in Google Calendar.
 *
 * Instead we build the ISO string directly so the Google API receives
 * an offset-free local datetime together with the user-supplied IANA timeZone,
 * letting Google handle the conversion correctly.
 */
const formatDateTime = (date, timeString) => {
  // Extract just the date portion (YYYY-MM-DD) without any timezone conversion
  const rawDate = new Date(date);
  const year  = rawDate.getUTCFullYear();
  const month = String(rawDate.getUTCMonth() + 1).padStart(2, '0');
  const day   = String(rawDate.getUTCDate()).padStart(2, '0');
  // Return a "local" datetime string; the caller supplies the timeZone separately
  return `${year}-${month}-${day}T${timeString}:00`;
};

/**
 * Creates an event on the user's primary Google Calendar
 */
export const createGoogleEvent = async (userId, event, userDoc = null) => {
  const accessToken = await refreshAccessToken(userId);
  
  const startDateTime = formatDateTime(event.date, event.startTime);
  const endDateTime = formatDateTime(event.date, event.endTime);

  // Resolve the user's IANA timezone; default to UTC if not set
  const user = userDoc || await User.findById(userId).select("timezone calendarEnableReminders");
  const timeZone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const enableReminders = user?.calendarEnableReminders !== false;

  const googleEventPayload = {
    summary: event.title,
    description: event.description || "",
    start: {
      dateTime: startDateTime,
      timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone,
    },
  };

  if (enableReminders) {
    googleEventPayload.reminders = {
      useDefault: false,
      overrides: [
        { method: "email", minutes: config.googleCalendar.reminderEmailMinutes },
        ...config.googleCalendar.reminderPopupMinutes.map((reminderMinutes) => ({
          method: "popup",
          minutes: reminderMinutes,
        })),
      ],
    };
  } else {
    googleEventPayload.reminders = { useDefault: false, overrides: [] };
  }

  const response = await axios.post(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    googleEventPayload,
    {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
    }
  );

  return response.data.id;
};

/**
 * Updates an event on the user's primary Google Calendar
 */
export const updateGoogleEvent = async (userId, googleEventId, event, userDoc = null) => {
  const accessToken = await refreshAccessToken(userId);

  const startDateTime = formatDateTime(event.date, event.startTime);
  const endDateTime = formatDateTime(event.date, event.endTime);

  const user = userDoc || await User.findById(userId).select("timezone calendarEnableReminders");
  const timeZone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const enableReminders = user?.calendarEnableReminders !== false;

  const googleEventPayload = {
    summary: event.title,
    description: event.description || "",
    start: {
      dateTime: startDateTime,
      timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone,
    },
  };

  if (enableReminders) {
    googleEventPayload.reminders = {
      useDefault: false,
      overrides: [
        { method: "email", minutes: config.googleCalendar.reminderEmailMinutes },
        ...config.googleCalendar.reminderPopupMinutes.map((reminderMinutes) => ({
          method: "popup",
          minutes: reminderMinutes,
        })),
      ],
    };
  } else {
    googleEventPayload.reminders = { useDefault: false, overrides: [] };
  }

  await axios.put(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
    googleEventPayload,
    {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
    }
  );
};

/**
 * Deletes an event on the user's primary Google Calendar
 */
export const deleteGoogleEvent = async (userId, googleEventId) => {
  try {
    const accessToken = await refreshAccessToken(userId);
    await axios.delete(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  } catch (error) {
    // If the event was already deleted directly on Google Calendar, ignore the error
    if (error.response?.status === 410 || error.response?.status === 404) {
      return;
    }
    throw error;
  }
};

/**
 * Performs a two-way synchronization between the application database and Google Calendar
 */
export const syncEvents = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.googleCalendarConnected) return;

  const accessToken = await refreshAccessToken(userId);

  // Sync window starts at the configured lookback.
  const timeMin = new Date(Date.now() - config.googleCalendar.syncPastDays * 24 * 60 * 60 * 1000).toISOString();
  
  // 1. Fetch Google Calendar events using the configured result cap.
  const response = await axios.get(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&maxResults=${config.googleCalendar.syncMaxResults}&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const googleEvents = response.data.items || [];
  if (response.data.nextPageToken) {
    console.warn(`[GoogleCalendar] syncEvents: response contains a nextPageToken. Only the first ${config.googleCalendar.syncMaxResults} events were synced.`);
  }

  // 2. Import / Sync Google Calendar events into local db
  for (const gEvt of googleEvents) {
    if (gEvt.status === "cancelled") {
      if (user.calendarSyncCancellations !== false) {
        await Event.deleteOne({ userId, googleEventId: gEvt.id });
      }
      continue;
    }

    // Skip events created by our own app sync to avoid feedback loops
    // (We match by title or other criteria if needed, but googleEventId check handles matching already)
    const localStart = gEvt.start.dateTime || gEvt.start.date;
    const localEnd = gEvt.end.dateTime || gEvt.end.date;
    if (!localStart) continue;

    const startDate = new Date(localStart);
    const endDate = new Date(localEnd);
    
    const startTimeStr = startDate.toISOString().split("T")[1].substring(0, 5);
    const endTimeStr = endDate.toISOString().split("T")[1].substring(0, 5);

    const eventPayload = {
      title: gEvt.summary || "Google Calendar Event",
      description: gEvt.description || "",
      date: new Date(startDate.toISOString().split("T")[0]),
      startTime: startTimeStr,
      endTime: endTimeStr,
      syncStatus: "synced",
    };

    const existingEvent = await Event.findOne({ userId, googleEventId: gEvt.id });
    
    if (existingEvent) {
      if (user.calendarSyncUpdates !== false) {
        Object.assign(existingEvent, eventPayload);
        await existingEvent.save();
      }
    } else {
      // Create new local event matching Google Calendar
      await Event.create({
        userId,
        googleEventId: gEvt.id,
        ...eventPayload
      });
    }
  }

  // 3. Push local pending/new events to Google Calendar
  const pendingEvents = await Event.find({ 
    userId, 
    $or: [
      { googleEventId: { $exists: false } },
      { googleEventId: null },
      { syncStatus: "pending" }
    ]
  });

  for (const event of pendingEvents) {
    try {
      if (!event.googleEventId) {
        if (user.calendarAutoCreate === false) continue;
        const googleEventId = await createGoogleEvent(userId, event, user);
        event.googleEventId = googleEventId;
      } else if (user.calendarSyncUpdates !== false) {
        await updateGoogleEvent(userId, event.googleEventId, event, user);
      } else {
        continue;
      }
      event.syncStatus = "synced";
      await event.save();
    } catch (err) {
      console.error(`Failed to push local event ${event._id} to Google Calendar`, err.message);
      event.syncStatus = "failed";
      await event.save();
    }
  }
};
