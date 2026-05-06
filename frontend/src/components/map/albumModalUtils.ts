export function formatAlbumDate(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  // assume the user is inputting date "locally", ignoring timezone differences
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-US", { timeZone: "UTC" });
}

export function toDateInputValue(value: string) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
}

export function cloudinaryImageUrl(
  cloudName: string | undefined,
  publicId: string,
) {
  if (!cloudName) return "";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
}
