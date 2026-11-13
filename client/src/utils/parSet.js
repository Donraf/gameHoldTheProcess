/**
 * Короткое отображаемое имя набора параметров: «Название (№id)»,
 * а если названия нет (старые данные) — просто «№id».
 */
export function parSetLabel(parSet) {
  if (parSet == null) {
    return "";
  }
  const name = (parSet.name ?? "").trim();
  return name ? `${name} (№${parSet.id})` : `№${parSet.id}`;
}
