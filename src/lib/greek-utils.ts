/** Strip accents/breathing marks so Greek comparisons work without diacriticals. */
export function normalizeGreek(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
