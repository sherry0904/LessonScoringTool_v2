// types/class.ts
export interface Student {
    id: string
    name: string
    scores: StudentScore[]
    totalScore: number
    averageScore: number
    group?: number | null
    grade?: number | null
    createdAt: Date
    isPresent: boolean
}

export interface StudentScore {
    id: string
    value: number
    categoryId: string
    categoryName: string
    reason?: string
    timestamp: Date
    sessionId?: string | null
}

export interface Group {
    id: string
    name: string
    members: Student[]
    totalScore: number
    averageScore: number
    createdAt: Date
    color: string
}

export interface ClassInfo {
    id: string
    name: string
    students: Student[]
    homeworks: Homework[]
    groups: GroupInfo[]
    groupCount: number
    groupingActive: boolean
    createdAt: Date
    updatedAt: Date
}

export interface GroupInfo {
    id: number
    score: number
    members: string[] // student IDs
}

export interface Homework {
    id: string
    title: string
    createdAt: Date
    studentStatus: Record<string, 'pending' | 'submitted' | 'needs_correction' | 'completed'>
}

export interface ClassSession {
    id: string
    className: string
    date: Date
    startTime: Date
    endTime: Date | null
    notes: string
}

export interface ScoreCategory {
    id: string
    name: string
    color: string
    icon: string
    weight: number
}

export interface ClassSettings {
    maxScore: number
    minScore: number
    scoreCategories: ScoreCategory[]
    enableGrouping: boolean
    enableSound: boolean
    theme: string
}

export interface StudentStats {
    student: Student
    totalScore: number
    averageScore: number
    totalScoreCount: number
    categoryStats: CategoryStats[]
    trend: 'improving' | 'declining' | 'stable'
    ranking: number
}

export interface CategoryStats {
    categoryId: string
    categoryName: string
    total: number
    average: number
    count: number
}

export interface ClassStats {
    totalStudents: number
    totalGroups: number
    averageScore: number
    totalScores: number
    topStudents: Student[]
    categoryStats: CategoryStats[]
    isGroupingActive: boolean
    groupingDuration: number | null
}

export interface ScoreUpdateEvent {
    studentId: string
    score: number
    categoryId: string
    reason?: string
}

export interface GroupingEvent {
    type: 'start' | 'end' | 'assign' | 'remove'
    studentId?: string
    groupId?: string
    timestamp: Date
}
