import * as XLSX from 'xlsx'

/**
 * @interface SheetData
 * @description 定義單一工作表的結構與資料
 * @property {string} sheetName - 工作表名稱
 * @property {string[][]} [header] - 放置在資料上方的標頭內容，為二維陣列
 * @property {Record<string, any>[]} data - 主要資料，為物件陣列
 * @property {{ wch: number }[]} [columnWidths] - 設定欄位寬度
 * @property {XLSX.Range[]} [merges] - 設定合併儲存格
 */
interface SheetData {
    sheetName: string
    header?: (string | number)[][]
    data: Record<string, any>[]
    columnWidths?: { wch: number }[]
    merges?: XLSX.Range[]
}

const sanitizeCellValue = (value: unknown): unknown => {
    if (typeof value === 'string') {
        const trimmed = value.trimStart()
        if (trimmed.startsWith("'") || trimmed.length === 0) {
            return value
        }

        const firstChar = trimmed[0]
        if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@') {
            return `'${value}`
        }
    }

    return value
}

const sanitizeRow = (row: (string | number)[]) => row.map((cell) => sanitizeCellValue(cell))

const sanitizeRecord = (record: Record<string, any>) => {
    const sanitizedEntries = Object.entries(record).map(([key, value]) => {
        return [key, sanitizeCellValue(value)]
    })
    return Object.fromEntries(sanitizedEntries)
}

/**
 * `useExcelExport` Composable
 * 提供一個通用的方法來將資料匯出為 Excel (.xlsx) 檔案。
 * 支援多工作表、自訂標頭、欄寬與合併儲存格。
 */
export const useExcelExport = () => {
    /**
     * 匯出資料至 Excel 檔案
     * @param {SheetData[]} sheets - 要匯出的工作表資料陣列
     * @param {string} fileName - 匯出的檔案名稱 (不需包含 .xlsx)
     */
    const exportToExcel = (sheets: SheetData[], fileName: string) => {
        const workbook = XLSX.utils.book_new()

        sheets.forEach((sheetInfo) => {
            const { sheetName, header = [], data, columnWidths, merges } = sheetInfo

            // 1. 根據 header 建立基本工作表
            const sanitizedHeader = header.map((row) => sanitizeRow(row))
            const worksheet = XLSX.utils.aoa_to_sheet(sanitizedHeader)

            // 2. 在 header 下方加入主要資料
            const sanitizedData = data.map((row) => sanitizeRecord(row))
            XLSX.utils.sheet_add_json(worksheet, sanitizedData, {
                origin: header.length > 0 ? -1 : 0, // -1 代表自動從 header 下一行開始
                skipHeader: false, // 保留 data 物件的 key 作為標題列
            })

            // 3. 設定欄位寬度
            if (columnWidths) {
                worksheet['!cols'] = columnWidths
            }

            // 4. 設定合併儲存格
            if (merges) {
                worksheet['!merges'] = merges
            }

            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        })

        // 5. 寫入檔案並觸發下載
        XLSX.writeFile(workbook, `${fileName}.xlsx`)
    }

    return { exportToExcel }
}
