/**
 * A1 Notation utilities
 * Helpers for working with Google Sheets A1 notation
 */

/**
 * Convert column index to letter (0 -> A, 1 -> B, 25 -> Z, 26 -> AA, etc.)
 */
export function columnIndexToLetter(index: number): string {
  let letter = ''
  let num = index

  while (num >= 0) {
    letter = String.fromCharCode((num % 26) + 65) + letter
    num = Math.floor(num / 26) - 1
  }

  return letter
}

/**
 * Convert column letter to index (A -> 0, B -> 1, Z -> 25, AA -> 26, etc.)
 */
export function columnLetterToIndex(letter: string): number {
  let index = 0

  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64)
  }

  return index - 1
}

/**
 * Get A1 range for entire sheet
 */
export function getSheetRange(sheetName: string, maxColumn = 'ZZ'): string {
  return `${sheetName}!A:${maxColumn}`
}

/**
 * Get A1 range for specific row range
 */
export function getRowRange(sheetName: string, startRow: number, endRow: number, maxColumn = 'ZZ'): string {
  return `${sheetName}!A${startRow}:${maxColumn}${endRow}`
}

/**
 * Get A1 range for specific cell
 */
export function getCellRange(sheetName: string, row: number, column: string | number): string {
  const col = typeof column === 'number' ? columnIndexToLetter(column) : column
  return `${sheetName}!${col}${row}`
}

/**
 * Get A1 range for column
 */
export function getColumnRange(sheetName: string, column: string | number): string {
  const col = typeof column === 'number' ? columnIndexToLetter(column) : column
  return `${sheetName}!${col}:${col}`
}
