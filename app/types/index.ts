// 基本類型定義
export interface Student {
    id: string
    name: string
    number: string // 座號
    scores: StudentScore[]
    totalScore: number
    averageScore: number
    group?: string
    isPresent: boolean
    createdAt: Date
    updatedAt: Date
}

export interface StudentScore {
    id: string
    studentId: string
    score: number
    category: ScoreCategory
    note?: string
    timestamp: Date
    teacherNote?: string
}

export interface Group {
    id: string
    name: string
    color: string
    studentIds: string[]
    createdAt: Date
    isActive: boolean
}

export interface ClassSession {
    id: string
    className: string
    date: Date
    students: Student[]
    groups: Group[]
    isGroupingActive: boolean
    groupingStartTime?: Date
    groupingEndTime?: Date
    settings: ClassSettings
}

export interface ClassSettings {
    maxScore: number
    minScore: number
    scoreCategories: ScoreCategory[]
    enableGrouping: boolean
    enableSound: boolean
    theme: 'light' | 'dark' | 'auto'
}

export interface ScoreCategory {
    id: string
    name: string
    color: string
    icon?: string
    weight: number // 權重
}

// UI 相關類型
export interface TabItem {
    id: string
    label: string
    icon?: string
    component?: string
}

export interface Toast {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration?: number
}

export interface Modal {
    id: string
    title: string
    isOpen: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

// 統計相關類型
export interface StudentStats {
    studentId: string
    totalScores: number
    averageScore: number
    scoresByCategory: Record<string, number>
    participationRate: number
    lastActiveDate: Date
}

export interface ClassStats {
    totalStudents: number
    presentStudents: number
    averageClassScore: number
    topPerformers: Student[]
    categoryBreakdown: Record<string, number>
    sessionDuration: number
}

// 表單相關類型
export interface StudentForm {
    name: string
    number: string
    isPresent: boolean
}

export interface ScoreForm {
    studentId: string
    score: number
    category: string
    note?: string
}

export interface GroupForm {
    name: string
    color: string
    studentIds: string[]
}

// API 相關類型
export interface ApiResponse<T> {
    data: T
    success: boolean
    message?: string
    errors?: string[]
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

// 常量類型
export type ScoreRange = 'excellent' | 'good' | 'average' | 'needs-improvement'
export type ViewMode = 'grid' | 'list' | 'statistics'
export type SortBy = 'name' | 'number' | 'score' | 'group' | 'date'
export type SortOrder = 'asc' | 'desc'

// 事件類型
export interface ScoreUpdateEvent {
    studentId: string
    oldScore: number
    newScore: number
    category: ScoreCategory
    timestamp: Date
}

export interface GroupingEvent {
    type: 'start' | 'end' | 'update'
    groups: Group[]
    timestamp: Date
}

// 設定類型
export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto'
    language: 'zh-TW' | 'en'
    soundEnabled: boolean
    animationsEnabled: boolean
    defaultView: ViewMode
    autoSave: boolean
    compactMode: boolean
}

// 匯出/匯入類型
export interface ExportData {
    classSession: ClassSession
    exportDate: Date
    version: string
}

export interface ImportOptions {
    overwriteExisting: boolean
    mergeGroups: boolean
    preserveTimestamps: boolean
}

// 實用類型助手
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
