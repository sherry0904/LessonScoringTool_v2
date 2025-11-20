// types/class.ts

export interface RewardMilestoneMessage {
    threshold: number
    message: string
}

/**
 * 全班總分模式專用設定
 */
export interface ClassTotalModeSettings {
    /**
     * 全班累積多少分觸發一次無敵星星
     * 例如：200 表示 200、400、600... 都會觸發
     */
    pointsPerInvincible: number
    /**
     * 無敵模式持續時間（秒）
     */
    invincibleDurationSeconds: number
    /**
     * 無敵模式下每次加分的點數
     */
    invinciblePointsPerClick: number
}

export interface RewardSettings {
    enabled: boolean

    /**
     * 獎勵模式
     * - 'group-based': 各組獨立計分，收集星星觸發無敵
     * - 'class-total': 全班總分累積，達到門檻全班同時無敵
     */
    mode: 'group-based' | 'class-total'

    // 各組模式設定（mode = 'group-based' 時使用）
    pointsPerStar: number
    starsToInvincible: number
    invincibleDurationSeconds: number
    /**
     * 無敵模式下每次加分時的點數增量
     * @remarks 替代之前的 invincibleScoreValue，命名更清楚
     */
    invinciblePointsPerClick: number
    milestoneMessages?: RewardMilestoneMessage[]

    // 全班總分模式設定（mode = 'class-total' 時使用）
    classTotalMode?: ClassTotalModeSettings
    /**
     * 全班目標分數，達到此分數觸發無敵（全班協作模式）
     */
    classTotalTargetPoints?: number
}

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
    stars: number
    isInvincible: boolean
    invincibleUntil: number | null
    invincibleStarQueue: number
    totalCollectedStars?: number
    scorePool: number
    // 全班模式專用：追蹤無敵加分
    classTotalInvincibleScore?: number // 累積因無敵模式而加的分數
}

export interface ClassHomeworkSettings {
    homeworkId: string // 對應 GlobalHomework 的 id
    releaseDate?: string
    dueDate?: string
    studentStatus: Record<string, 'pending' | 'submitted' | 'needs_correction' | 'completed'>
}

export interface ClassInfo {
    id: string
    name: string
    students: Student[]
    homeworkSettings: ClassHomeworkSettings[]
    groups: Group[]
    groupCount: number
    groupingActive: boolean
    createdAt: Date
    updatedAt: Date
    rewardSettingsMode: 'template' | 'disabled'
    appliedRewardTemplateId: string | null
    customRewardSettings: RewardSettings | null

    // 全班總分模式專用欄位
    /**
     * 當前全班累積總分（僅在全班總分模式使用）
     * 等於所有組別的 totalScore 總和
     */
    classTotalScore?: number
    /**
     * 已觸發過幾次全班無敵星星（僅在全班總分模式使用）
     * 用於計算下一次觸發門檻
     */
    classTotalInvincibleCount?: number
    /**
     * 全班無敵結束時間戳（僅在全班總分模式使用）
     * null 表示目前不在無敵狀態
     */
    classInvincibleUntil?: number | null
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
