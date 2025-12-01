import type { SchemaDefinition, ColumnDefinition } from '../types/SchemaTypes'
import { ConnectionError, QueryError, AuthenticationRequiredError } from '../errors'
import { coerceFromSheets, coerceToSheets } from '../utils/TypeCoercion'
import { getSheetRange, getRowRange, getColumnRange } from '../utils/A1Notation'
import type { AuthManager } from '../auth/AuthManager'
import { getGapi } from '../auth/GoogleApiLoader'

/**
 * Google Sheets Adapter
 * Handles all interactions with Google Sheets API
 */
export class SheetsAdapter {
  private spreadsheetId: string
  private schemas: Record<string, SchemaDefinition>
  private authManager: AuthManager | null = null

  constructor(spreadsheetId: string, schemas: Record<string, SchemaDefinition>, authManager?: AuthManager) {
    this.spreadsheetId = spreadsheetId
    this.schemas = schemas
    this.authManager = authManager || null
  }

  /**
   * Set auth manager (for dependency injection)
   */
  setAuthManager(authManager: AuthManager): void {
    this.authManager = authManager
  }

  /**
   * Ensure read permission
   */
  private async ensureReadPermission(): Promise<void> {
    if (this.authManager) {
      await this.authManager.ensureReadPermission()
    }
    this.ensureSheetsClient()
  }

  /**
   * Ensure write permission
   */
  private async ensureWritePermission(): Promise<void> {
    if (this.authManager) {
      await this.authManager.ensureWritePermission()
    }
    this.ensureSheetsClient()
  }

  /**
   * Get all data from a sheet
   */
  async getSheet(sheetName: string): Promise<any[]> {
    try {
      await this.ensureReadPermission()
      const gapi = getGapi()
      const range = getSheetRange(sheetName)

      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range
      })

      return this.parseSheetData(sheetName, response.result.values || [])
    } catch (error: any) {
      if (error instanceof AuthenticationRequiredError) {
        throw error
      }
      throw new ConnectionError(`Failed to read sheet "${sheetName}": ${error.message}`)
    }
  }

  /**
   * Get sheet ID by name
   */
  async getSheetId(sheetName: string): Promise<number> {
    try {
      await this.ensureReadPermission()
      const gapi = getGapi()
      const response = await gapi.client.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      })

      const sheet = response.result.sheets?.find(
        s => s.properties?.title === sheetName
      )

      if (!sheet || !sheet.properties) {
        throw new Error(`Sheet "${sheetName}" not found`)
      }

      return sheet.properties.sheetId!
    } catch (error: any) {
      if (error instanceof AuthenticationRequiredError) {
        throw error
      }
      throw new QueryError(`Failed to get sheet ID for "${sheetName}": ${error.message}`)
    }
  }

  /**
   * Parse sheet data into records
   */
  private parseSheetData(sheetName: string, values: any[][]): any[] {
    if (!values || values.length === 0) {
      return []
    }

    const [headers, ...rows] = values
    const schema = this.schemas[sheetName]

    return rows
      .filter(row => row.some(cell => cell !== '')) // Filter empty rows
      .map(row => {
        const record: Record<string, any> = {}

        headers.forEach((header, index) => {
          const value = row[index] !== undefined ? row[index] : ''
          const columnDef = schema?.columns[header]

          if (columnDef) {
            record[header] = coerceFromSheets(value, columnDef)
          } else {
            record[header] = value
          }
        })

        return record
      })
  }

  /**
   * Append rows to sheet
   */
  async appendRows(sheetName: string, rows: any[]): Promise<void> {
    try {
      await this.ensureWritePermission()
      const gapi = getGapi()
      const headers = await this.getHeaders(sheetName)
      const values = rows.map(row => this.recordToArray(sheetName, row, headers))

      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:A`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values
        }
      })
    } catch (error: any) {
      if (error instanceof AuthenticationRequiredError) {
        throw error
      }
      throw new QueryError(`Failed to append rows to "${sheetName}": ${error.message}`)
    }
  }

  /**
   * Update rows in sheet
   */
  async updateRows(sheetName: string, updates: Array<{ rowIndex: number, data: any }>): Promise<void> {
    try {
      await this.ensureWritePermission()
      const headers = await this.getHeaders(sheetName)

      // Use batchUpdate for better performance
      const requests = updates.map(({ rowIndex, data }) => {
        const values = [this.recordToArray(sheetName, data, headers)]
        const range = getRowRange(sheetName, rowIndex, rowIndex)

        return {
          updateCells: {
            range: {
              sheetId: undefined, // Will be filled later
              startRowIndex: rowIndex - 1,
              endRowIndex: rowIndex,
              startColumnIndex: 0,
              endColumnIndex: headers.length
            },
            rows: [{
              values: values[0].map(value => ({
                userEnteredValue: this.toSheetValue(value)
              }))
            }],
            fields: 'userEnteredValue'
          }
        }
      })

      // Get sheet ID for the requests
      const sheetId = await this.getSheetId(sheetName)
      requests.forEach(req => {
        if (req.updateCells.range) {
          req.updateCells.range.sheetId = sheetId
        }
      })

      const gapi = getGapi()
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests
        }
      })
    } catch (error: any) {
      if (error instanceof AuthenticationRequiredError) {
        throw error
      }
      throw new QueryError(`Failed to update rows in "${sheetName}": ${error.message}`)
    }
  }

  /**
   * Delete rows from sheet
   */
  async deleteRows(sheetName: string, rowIndices: number[]): Promise<void> {
    try {
      await this.ensureWritePermission()
      const gapi = getGapi()
      const sheetId = await this.getSheetId(sheetName)

      // Sort in descending order to delete from bottom to top
      const sortedIndices = [...rowIndices].sort((a, b) => b - a)

      const requests = sortedIndices.map(index => ({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: index - 1, // 0-indexed
            endIndex: index
          }
        }
      }))

      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests
        }
      })
    } catch (error: any) {
      if (error instanceof AuthenticationRequiredError) {
        throw error
      }
      throw new QueryError(`Failed to delete rows from "${sheetName}": ${error.message}`)
    }
  }

  /**
   * Get headers from sheet
   */
  async getHeaders(sheetName: string): Promise<string[]> {
    try {
      await this.ensureReadPermission()
      const gapi = getGapi()
      const range = `${sheetName}!1:1`

      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range
      })

      return response.result.values?.[0] || []
    } catch (error: any) {
      if (error instanceof AuthenticationRequiredError) {
        throw error
      }
      throw new ConnectionError(`Failed to read headers from "${sheetName}": ${error.message}`)
    }
  }

  /**
   * Get column values
   */
  async getColumnValues(sheetName: string, columnName: string): Promise<any[]> {
    try {
      await this.ensureReadPermission()
      const gapi = getGapi()
      const headers = await this.getHeaders(sheetName)
      const columnIndex = headers.indexOf(columnName)

      if (columnIndex === -1) {
        return []
      }

      const columnLetter = String.fromCharCode(65 + columnIndex)
      const range = getColumnRange(sheetName, columnLetter)

      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range
      })

      const values = response.result.values || []
      // Skip header row
      return values.slice(1).map(row => row[0])
    } catch (error: any) {
      if (error instanceof AuthenticationRequiredError) {
        throw error
      }
      throw new QueryError(`Failed to read column "${columnName}" from "${sheetName}": ${error.message}`)
    }
  }

  /**
   * Get max ID from sheet (for auto-increment)
   */
  async getMaxId(sheetName: string, idColumn: string): Promise<number> {
    const values = await this.getColumnValues(sheetName, idColumn)
    const numbers = values
      .filter(v => v !== '' && !isNaN(Number(v)))
      .map(v => Number(v))

    return numbers.length > 0 ? Math.max(...numbers) : 0
  }

  /**
   * Convert record to array based on headers
   */
  private recordToArray(sheetName: string, record: any, headers: string[]): any[] {
    const schema = this.schemas[sheetName]

    return headers.map(header => {
      const value = record[header]
      const columnDef = schema?.columns[header]

      if (columnDef) {
        return coerceToSheets(value, columnDef)
      }

      return value !== undefined ? value : ''
    })
  }

  /**
   * Convert value to Sheets API format
   */
  private toSheetValue(value: any): any {
    if (value === null || value === undefined || value === '') {
      return { stringValue: '' }
    }

    if (typeof value === 'number') {
      return { numberValue: value }
    }

    if (typeof value === 'boolean') {
      return { boolValue: value }
    }

    return { stringValue: value.toString() }
  }

  /**
   * Clear sheet (keep headers)
   */
  async clearSheet(sheetName: string): Promise<void> {
    try {
      await this.ensureWritePermission()
      const gapi = getGapi()
      const range = `${sheetName}!A2:ZZ`

      await gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range
      })
    } catch (error: any) {
      if (error instanceof AuthenticationRequiredError) {
        throw error
      }
      throw new QueryError(`Failed to clear sheet "${sheetName}": ${error.message}`)
    }
  }

  /**
   * Create new sheet
   */
  async createSheet(sheetName: string, headers: string[]): Promise<void> {
    try {
      await this.ensureWritePermission()
      const gapi = getGapi()

      // Create sheet
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      })

      // Add headers
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [headers]
        }
      })
    } catch (error: any) {
      if (error instanceof AuthenticationRequiredError) {
        throw error
      }
      throw new QueryError(`Failed to create sheet "${sheetName}": ${error.message}`)
    }
  }

  /**
   * Ensure the Google Sheets client is available
   */
  private ensureSheetsClient(): void {
    const gapi = getGapi()
    if (!gapi || !gapi.client || !gapi.client.sheets) {
      throw new ConnectionError(
        'Google API client is not initialized. Call db.initialize() and ensure sign-in before making requests.'
      )
    }
  }
}
