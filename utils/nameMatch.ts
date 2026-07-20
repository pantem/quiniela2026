export function fuzzyPlayerMatch(predicted: string | null, actual: string | null): boolean {
  if (!predicted || !actual) return false

  const normalize = (s: string) => {
    let normalized = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    normalized = normalized.toLowerCase().trim().replace(/\s+/g, " ")
    normalized = normalized.replace(/[.,;:!?'"]/g, "")
    return normalized
  }

  const a = normalize(predicted)
  const b = normalize(actual)

  if (!a || !b) return false

  if (a === b) return true

  if (a.includes(b) || b.includes(a)) return true

  const aWords = a.split(" ").filter(Boolean)
  const bWords = b.split(" ").filter(Boolean)

  if (aWords.length > 1 || bWords.length > 1) {
    const aLast = aWords[aWords.length - 1]
    const bLast = bWords[bWords.length - 1]
    if (aLast === bLast) return true
  }

  if (aWords.length >= 2 && bWords.length >= 2) {
    const aFirstInit = aWords[0].replace(".", "")
    const bFirstInit = bWords[0].replace(".", "")
    const aLast = aWords[aWords.length - 1]
    const bLast = bWords[bWords.length - 1]
    if (
      aLast === bLast &&
      (aFirstInit.length === 1 || bFirstInit.length === 1) &&
      aFirstInit[0] === bFirstInit[0]
    ) {
      return true
    }
  }

  const maxDist = Math.min(
    Math.max(a.length, b.length) > 8 ? 2 : 1,
    Math.max(a.length, b.length) - 1
  )
  if (levenshtein(a, b) <= maxDist) return true

  return false
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1] + 1, dp[i][j - 1] + 1, dp[i - 1][j] + 1)
      }
    }
  }
  return dp[m][n]
}
