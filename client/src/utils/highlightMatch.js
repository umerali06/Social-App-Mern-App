export function highlightMatch(text, query) {
  if (!text) return ""; // ✅ Avoid .replace() on undefined
  if (!query) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape regex
  const regex = new RegExp(`(${escapedQuery})`, "gi");

  return text.replace(regex, "<mark>$1</mark>");
}
