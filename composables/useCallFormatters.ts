/**
 * Composable providing formatting utilities for call-related data
 */
export function useCallFormatters() {
  /**
   * Formats a duration in seconds to a human-readable string
   * @param seconds - Duration in seconds
   * @returns Formatted string (MM:SS or HH:MM:SS)
   *
   * @example
   * formatDuration(65) // "01:05"
   * formatDuration(3665) // "01:01:05"
   */
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Formats a phone number for display
   * @param number - Raw phone number
   * @returns Formatted phone number
   *
   * @example
   * formatPhoneNumber("+5511987654321") // "+55 11 98765-4321"
   */
  const formatPhoneNumber = (number: string): string => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, '')

    // Brazilian phone number format: +55 11 98765-4321
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
    }

    // If already formatted or unknown format, return as-is
    return number
  }

  return {
    formatDuration,
    formatPhoneNumber,
  }
}
