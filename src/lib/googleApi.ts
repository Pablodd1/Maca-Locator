// Client-side integration for Google Calendar and Google Chat APIs
// Uses standard Google OAuth 2.0 Access Token

export type GoogleCalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
};

export type GoogleChatSpace = {
  name: string; // "spaces/AAAAMMMM"
  displayName: string;
  type: string; // "SPACE" or "GROUP_CHAT"
};

// Simple store for Google Access Token in memory
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export function setGoogleAccessToken(token: string, expiresInSeconds: number) {
  cachedToken = token;
  tokenExpiresAt = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem("macalocator_g_token", token);
  localStorage.setItem("macalocator_g_token_expiry", (Date.now() + expiresInSeconds * 1000).toString());
}

export function getGoogleAccessToken(): string | null {
  if (cachedToken) {
    if (Date.now() < tokenExpiresAt) return cachedToken;
    // Expired
    clearGoogleAccessToken();
    return null;
  }

  const stored = localStorage.getItem("macalocator_g_token");
  const expiry = localStorage.getItem("macalocator_g_token_expiry");
  if (stored && expiry) {
    const expTime = parseInt(expiry, 10);
    if (Date.now() < expTime) {
      cachedToken = stored;
      tokenExpiresAt = expTime;
      return stored;
    }
  }
  clearGoogleAccessToken();
  return null;
}

export function clearGoogleAccessToken() {
  cachedToken = null;
  tokenExpiresAt = 0;
  localStorage.removeItem("macalocator_g_token");
  localStorage.removeItem("macalocator_g_token_expiry");
}

export function isGoogleConnected(): boolean {
  return getGoogleAccessToken() !== null;
}

// ----------------- GOOGLE CALENDAR API -----------------

/**
 * Lists upcoming calendar events on the user's primary calendar
 */
export async function listCalendarEvents(): Promise<GoogleCalendarEvent[]> {
  const token = getGoogleAccessToken();
  if (!token) throw new Error("Google account not connected");

  // SANDBOX SIMULATION
  if (token.startsWith("sandbox_")) {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay
    return [
      {
        id: "ev1",
        summary: "🚗 MACALOCATOR: Full Battery Diagnosis (Simulation)",
        description: "Standard electric vehicle battery maintenance and calibration check.",
        start: { dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), timeZone: "UTC" },
        end: { dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), timeZone: "UTC" },
      },
      {
        id: "ev2",
        summary: "🧰 General Car Wash & Tire Rotation (Simulation)",
        description: "Scheduled maintenance for vehicles.",
        start: { dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), timeZone: "UTC" },
        end: { dateTime: new Date(Date.now() + 3.05 * 24 * 60 * 60 * 1000).toISOString(), timeZone: "UTC" },
      },
    ];
  }

  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        clearGoogleAccessToken();
        throw new Error("Google session expired. Please sign in again.");
      }
      throw new Error(`Calendar API returned ${response.status}`);
    }

    const data = await response.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summary,
      description: item.description,
      start: item.start,
      end: item.end,
    }));
  } catch (error) {
    console.error("Error listing calendar events:", error);
    throw error;
  }
}

/**
 * Creates a new event in the user's primary calendar
 */
export async function createCalendarEvent(event: {
  title: string;
  description: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // e.g., "10:00 AM"
}): Promise<any> {
  const token = getGoogleAccessToken();
  if (!token) throw new Error("Google account not connected");

  // Parse date and time into ISO string
  const [hourMin, meridiem] = event.timeStr.split(" ");
  let [hours, minutes] = hourMin.split(":").map(Number);
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const startDateTime = new Date(`${event.dateStr}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

  // SANDBOX SIMULATION
  if (token.startsWith("sandbox_")) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      id: "sim-new-ev-" + Math.random().toString(36).substring(7),
      summary: event.title,
      description: event.description,
      start: { dateTime: startDateTime.toISOString() },
      end: { dateTime: endDateTime.toISOString() },
    };
  }

  const body = {
    summary: event.title,
    description: event.description,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: true,
    },
  };

  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`Calendar Event Creation failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw error;
  }
}

// ----------------- GOOGLE CHAT API -----------------

/**
 * Lists the spaces that the authenticated user is a member of
 */
export async function listChatSpaces(): Promise<GoogleChatSpace[]> {
  const token = getGoogleAccessToken();
  if (!token) throw new Error("Google account not connected");

  // SANDBOX SIMULATION
  if (token.startsWith("sandbox_")) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return [
      { name: "spaces/AAAABBBB", displayName: "🧯 MACALOCATOR Roadside SOS (Simulation)", type: "SPACE" },
      { name: "spaces/CCCCDDDD", displayName: "🚙 My Personal Family Chat (Simulation)", type: "SPACE" },
      { name: "spaces/EEEEFFFF", displayName: "🏢 Fleet Maintenance Hub (Simulation)", type: "SPACE" },
    ];
  }

  try {
    const response = await fetch("https://chat.googleapis.com/v1/spaces", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Chat API returned ${response.status}`);
    }

    const data = await response.json();
    return (data.spaces || []).map((space: any) => ({
      name: space.name,
      displayName: space.displayName || space.name.replace("spaces/", "DM Space: "),
      type: space.spaceType || space.type || "SPACE",
    }));
  } catch (error) {
    console.error("Error listing chat spaces:", error);
    throw error;
  }
}

/**
 * Sends a message to a specific Google Chat space
 */
export async function sendChatMessage(spaceName: string, text: string): Promise<any> {
  const token = getGoogleAccessToken();
  if (!token) throw new Error("Google account not connected");

  // SANDBOX SIMULATION
  if (token.startsWith("sandbox_")) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      name: `${spaceName}/messages/sim-msg-${Math.random().toString(36).substring(7)}`,
      text: text,
      sender: { displayName: "MACALOCATOR App" },
    };
  }

  try {
    const response = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Chat Message send failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
}
