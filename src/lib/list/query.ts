/** Числа и склонения в подписях списков. */

/** Число с пробелами: 1 387. */
export const fmt = (n: number) => n.toLocaleString("ru-RU").replace(/ /g, " ")

/** Склонение: plural(32, ["волокно", "волокна", "волокон"]) → «волокна». */
export function plural(n: number, [one, few, many]: [string, string, string]) {
  const d = n % 10
  const dd = n % 100
  if (d === 1 && dd !== 11) return one
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few
  return many
}
