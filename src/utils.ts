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

export const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Hari Ini";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Kemarin";
  } else {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
};
