export function cn(...values) {
  return values.flatMap((value) => {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }).join(" ");
}
