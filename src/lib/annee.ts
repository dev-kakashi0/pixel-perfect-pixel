export function anneeAcademiqueCourante(d = new Date()) {
  const base = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
  return `${base}-${base + 1}`;
}
