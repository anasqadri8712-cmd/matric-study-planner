export function getGreeting(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return { text: "Good Morning", emoji: "\u2600\uFE0F" };
  if (h >= 12 && h < 17) return { text: "Good Afternoon", emoji: "\u{1F324}\uFE0F" };
  if (h >= 17 && h < 21) return { text: "Good Evening", emoji: "\u{1F307}" };
  return { text: "Good Night", emoji: "\u{1F319}" };
}

export function formatToday(date = new Date()) {
  return {
    day: date.toLocaleDateString(undefined, { weekday: "long" }),
    date: date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }),
  };
}
