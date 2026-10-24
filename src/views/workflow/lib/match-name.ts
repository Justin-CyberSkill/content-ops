/** Lowercase without accents, so "linh" finds "Nguyễn Thuỳ Linh" and "thuy" finds "Thuỳ". */
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

/** Whether a name contains what was typed, ignoring case and Vietnamese accents. */
export function matchesName(name: string, query: string) {
  const wanted = fold(query.trim());
  return !wanted || fold(name).includes(wanted);
}
