// utils/datetime.ts
// Utility functions for handling datetime with timezone

// ubah format backend ke ISO-compatible
export const normalizeToISO = (dateStr: string): string =>
  dateStr.replace(" ", "T").replace(" +0700", "+07:00");

/**
 * Format ISO datetime string to Indonesian locale date
 * @param dateString - ISO 8601 datetime string (e.g., "2025-10-25T15:00:00+07:00")
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }
): string => {
  try {
    return new Date(dateString).toLocaleDateString("id-ID", options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};

/**
 * Format ISO datetime string to time
 * @param timeString - ISO 8601 datetime string (e.g., "2025-10-25T15:00:00+07:00")
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time string (e.g., "15:00")
 */
export const formatTime = (
  timeString: string,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }
): string => {
  try {
    return new Date(timeString).toLocaleTimeString("id-ID", options);
  } catch (error) {
    console.error("Error formatting time:", error);
    return "-";
  }
};

/**
 * Format ISO datetime string to full datetime
 * @param dateTimeString - ISO 8601 datetime string
 * @returns Formatted datetime string
 */
export const formatDateTime = (dateTimeString: string): string => {
  try {
    const date = new Date(dateTimeString);
    const dateStr = date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr}, ${timeStr}`;
  } catch (error) {
    console.error("Error formatting datetime:", error);
    return "-";
  }
};

/**
 * Get relative date string (Hari ini, Besok, etc.)
 * @param dateString - ISO 8601 datetime string
 * @returns Relative date string or formatted date
 */
export const getRelativeDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset time to compare dates only
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const tomorrowOnly = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate()
    );

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return "Hari ini";
    } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
      return "Besok";
    }

    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch (error) {
    console.error("Error getting relative date:", error);
    return "-";
  }
};

/**
 * Calculate duration between two datetime strings
 * @param startTime - ISO 8601 datetime string
 * @param endTime - ISO 8601 datetime string
 * @returns Duration string (e.g., "1 jam 30 menit")
 */
export const getDuration = (startTime: string, endTime: string): string => {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMinutes = Math.floor(
      (end.getTime() - start.getTime()) / 1000 / 60
    );

    if (diffMinutes < 60) {
      return `${diffMinutes} menit`;
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (minutes === 0) {
      return `${hours} jam`;
    }

    return `${hours} jam ${minutes} menit`;
  } catch (error) {
    console.error("Error calculating duration:", error);
    return "-";
  }
};

/**
 * Convert form inputs to ISO 8601 datetime string
 * @param date - Date string (YYYY-MM-DD)
 * @param time - Time string (HH:mm)
 * @param timezone - Timezone offset (default: +07:00 for WIB)
 * @returns ISO 8601 datetime string
 */
export const toISODateTime = (
  date: string,
  time: string,
  timezone: string = "+07:00"
): string => {
  return `${date}T${time}:00${timezone}`;
};

/**
 * Parse ISO datetime to form inputs
 * @param isoDateTime - ISO 8601 datetime string
 * @returns Object with date and time strings for form inputs
 */
export const parseISODateTime = (
  isoDateTime: string
): { date: string; time: string } => {
  try {
    const dateObj = new Date(isoDateTime);

    const date = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
    const time = dateObj.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }); // HH:mm

    return { date, time };
  } catch (error) {
    console.error("Error parsing ISO datetime:", error);
    return { date: "", time: "" };
  }
};

/**
 * Check if datetime is in the past
 * @param dateTimeString - ISO 8601 datetime string
 * @returns true if datetime is in the past
 */
export const isPast = (dateTimeString: string): boolean => {
  try {
    const date = new Date(dateTimeString);
    return date.getTime() < Date.now();
  } catch (error) {
    console.error("Error checking if past:", error);
    return false;
  }
};

/**
 * Check if datetime is today
 * @param dateTimeString - ISO 8601 datetime string
 * @returns true if datetime is today
 */
export const isToday = (dateTimeString: string): boolean => {
  try {
    const date = new Date(dateTimeString);
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    console.error("Error checking if today:", error);
    return false;
  }
};

/**
 * Get time until datetime
 * @param dateTimeString - ISO 8601 datetime string
 * @returns Human-readable time until string
 */
export const getTimeUntil = (dateTimeString: string): string => {
  try {
    const date = new Date(dateTimeString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) {
      return "Sudah lewat";
    }

    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} hari lagi`;
    } else if (hours > 0) {
      return `${hours} jam lagi`;
    } else if (minutes > 0) {
      return `${minutes} menit lagi`;
    } else {
      return "Sebentar lagi";
    }
  } catch (error) {
    console.error("Error getting time until:", error);
    return "-";
  }
};
