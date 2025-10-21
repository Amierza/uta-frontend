export const getInitials = (name: string): string => {
  if (!name) return "?";
  const words = name.trim().split(" ");
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-teal-500",
  ];
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Parse PostgreSQL timestamp format to JavaScript Date
const parseTimestamp = (timestamp: string): Date | null => {
  try {
    // Format dari backend: "2025-10-21 07:50:24.26913 +0700 WIB"
    // Kita perlu convert ke format yang valid untuk JavaScript

    // Remove timezone name (WIB, WITA, WIT, dll)
    let cleaned = timestamp.replace(/\s+(WIB|WITA|WIT)$/i, "").trim();

    // Replace first space (between date and time) with 'T'
    // "2025-10-21 07:50:24.26913 +0700" -> "2025-10-21T07:50:24.26913 +0700"
    cleaned = cleaned.replace(" ", "T");

    // Remove space before timezone offset
    // "2025-10-21T07:50:24.26913 +0700" -> "2025-10-21T07:50:24.26913+0700"
    cleaned = cleaned.replace(/\s+([+-])/, "$1");

    // Add colon to timezone offset
    // "2025-10-21T07:50:24.26913+0700" -> "2025-10-21T07:50:24.26913+07:00"
    cleaned = cleaned.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");

    const date = new Date(cleaned);

    if (isNaN(date.getTime())) {
      console.warn("Failed to parse timestamp:", timestamp);
      return null;
    }

    return date;
  } catch (error) {
    console.error("Error parsing timestamp:", timestamp, error);
    return null;
  }
};

export const formatDate = (timestamp: string | null | undefined): string => {
  try {
    if (!timestamp || timestamp === "") {
      console.warn("Empty or null timestamp");
      return "Tanggal Tidak Tersedia";
    }

    const date = parseTimestamp(timestamp);

    if (!date) {
      return "Tanggal Tidak Valid";
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time untuk perbandingan tanggal saja
    const compareToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const compareYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );
    const compareDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (compareDate.getTime() === compareToday.getTime()) {
      return "Hari Ini";
    } else if (compareDate.getTime() === compareYesterday.getTime()) {
      return "Kemarin";
    } else {
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  } catch (error) {
    console.error("Error formatting date:", timestamp, error);
    return "Tanggal Tidak Valid";
  }
};

export const formatTime = (timestamp: string | null | undefined): string => {
  try {
    if (!timestamp || timestamp === "") {
      console.warn("Empty or null timestamp");
      return "--:--";
    }

    const date = parseTimestamp(timestamp);

    if (!date) {
      return "--:--";
    }

    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting time:", timestamp, error);
    return "--:--";
  }
};
