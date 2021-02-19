export function parseTime(input: string | undefined): number {
  if (!input) return 0

  const tsRegex = /^(\d{1,2}|\d\.\d{2}):([0-5]\d):([0-5]\d\.*\d+)?$/
  const result = input.match(tsRegex)
  if (!result) return 0

  // 1: hours
  // 2: minutes
  // 3: seconds
  return (
    parseInt(result[1]) * 60 * 60 +
    parseInt(result[2]) * 60 +
    parseFloat(result[3])
  )
  // 00:00:00.0060000
}

export function formatTime(seconds: number): string {
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor((seconds % 3600) % 60)

  let r = ''
  if (m > 0) r += `${m} m `

  if (s > 0 || m > 0) {
    seconds -= m * 3600
    r += `${(seconds - m * 3600).toFixed(3)} s`
    return r
  } else {
    return `${(seconds * 1000).toFixed(2)} ms`
  }
}
