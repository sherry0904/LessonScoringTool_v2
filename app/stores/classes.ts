// ...保留唯一一份正確的 defineStore 區塊...
import { defineStore } from 'pinia'
import type {
    ClassInfo,
    Student,
    Homework,
    Group,
    StudentScore,
    RewardSettings,
    InvincibleEventLog,
} from '~/types/class'
import { useExcelExport } from '~/composables/useExcelExport'
import { useHomeworkStore } from '~/stores/homework'
import { useUIStore } from '~/stores/ui'
import { useRewardsStore } from '~/stores/rewards' // 引入 rewards store
import {
    getClassTotalThreshold,
    getClassTotalInvincibleDuration,
    getClassTotalInvinciblePoints,
} from '~/constants/rewards'

const BACKUP_SCHEMA_VERSION = '2.1.0'

export const useClassesStore = defineStore('classes', () => {
    // State
    const classes = ref<ClassInfo[]>([])
    const currentClassId = ref<string | null>(null)
    const isLoaded = ref(false) // 新增狀態旗標

    // 分組活動狀態（每個 classId 一份）
    const groupingBaseScores = ref<Record<string, Record<string, number>>>({})
    const groupingSessionScores = ref<Record<string, Record<string, number>>>({})
    const groupingActivityNames = ref<Record<string, string>>({})
    const groupingSessionGroupScores = ref<Record<string, Record<string, number>>>({})
    const groupingSessionIndividualScores = ref<Record<string, Record<string, number>>>({})

    // Computed
    const currentClass = computed(() => {
        return classes.value.find((c) => c.id === currentClassId.value) || null
    })

    const totalClasses = computed(() => classes.value.length)

    // Actions
    const setGroupingActivityName = (classId: string, name: string) => {
        groupingActivityNames.value[classId] = name
        saveToStorage()
    }

    const setGroupingBaseScores = (classId: string, scores: Record<string, number>) => {
        groupingBaseScores.value[classId] = scores
        saveToStorage()
    }

    const getGroupingBaseScores = (classId: string): Record<string, number> | undefined => {
        return groupingBaseScores.value[classId]
    }

    const setGroupingSessionScores = (classId: string, scores: Record<string, number>) => {
        groupingSessionScores.value[classId] = scores
        saveToStorage()
    }

    const getGroupingSessionScores = (classId: string): Record<string, number> | undefined => {
        return groupingSessionScores.value[classId]
    }

    const clearGroupingScores = (classId: string) => {
        delete groupingBaseScores.value[classId]
        delete groupingSessionScores.value[classId]
        saveToStorage()
    }

    const updateClass = (classId: string, updates: Partial<ClassInfo>) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData) return false

        Object.assign(classData, updates)
        classData.updatedAt = new Date()
        saveToStorage()
        return true
    }

    /**
     * 套用範本到單一班級（簡化版 - 立即生效）
     * @param classId 班級 ID
     * @param templateId 範本 ID
     */
    const applyTemplateToClass = (classId: string, templateId: string | null): boolean => {
        const classIndex = classes.value.findIndex((c) => c.id === classId)
        if (classIndex === -1) return false

        const rewardsStore = useRewardsStore()

        // 驗證範本是否存在
        if (templateId && !rewardsStore.getTemplateById(templateId)) {
            console.error(`範本 ${templateId} 不存在`)
            return false
        }

        // 直接修改 class 對象，然後用 splice 替換以觸發響應性
        const classData = classes.value[classIndex]
        const oldTriggerCount = classData.classTotalInvincibleCount

        classData.rewardSettingsMode = 'template'
        classData.appliedRewardTemplateId = templateId
        classData.customRewardSettings = null
        classData.updatedAt = new Date()

        // 當切換範本時，需要重新計算全班無敵觸發次數
        if (templateId) {
            const template = rewardsStore.getTemplateById(templateId)
            console.log('🎯 applyTemplateToClass 檢查模式:', {
                templateId,
                hasTemplate: !!template,
                hasSettings: !!template?.settings,
                mode: template?.settings?.mode,
                classTotalScore: classData.classTotalScore,
                groupingActive: classData.groupingActive,
            })
            if (template?.settings && template.settings.mode === 'class-total') {
                const totalScore = classData.classTotalScore || 0
                const threshold = getClassTotalThreshold(template.settings)
                const newTriggerCount = Math.floor(totalScore / threshold)

                console.log('✅ 重新計算 classTotalInvincibleCount:', {
                    oldTriggerCount,
                    totalScore,
                    threshold,
                    newTriggerCount,
                    calculation: `Math.floor(${totalScore} / ${threshold}) = ${newTriggerCount}`,
                })

                classData.classTotalInvincibleCount = newTriggerCount
            }
        }

        // 使用 splice 來觸發 Vue 的響應性
        classes.value.splice(classIndex, 1, classData)

        // 強制觸發響應性更新 - 重新賦值整個數組
        classes.value = [...classes.value]

        // 處理現有的星星數，檢查是否需要觸發無敵
        if (templateId && classData.groupingActive) {
            const template = rewardsStore.getTemplateById(templateId)
            if (template?.settings && template.settings.enabled) {
                _processExistingStars(classData, template.settings)
            }
        }

        saveToStorage()
        return true
    }

    /**
     * 設定獎勵模式（簡化版 - 立即生效）
     */
    const setRewardSettingsMode = (classId: string, mode: 'disabled' | 'template'): boolean => {
        const classIndex = classes.value.findIndex((c) => c.id === classId)
        if (classIndex === -1) return false

        // 使用 splice 來觸發響應式更新
        const classData = { ...classes.value[classIndex] }
        classData.rewardSettingsMode = mode

        // 清除不相關的設定
        if (mode === 'disabled') {
            classData.appliedRewardTemplateId = null
            classData.customRewardSettings = null
        } else if (mode === 'template') {
            classData.customRewardSettings = null
            // appliedRewardTemplateId 由後續呼叫 applyTemplateToClass 設定
        }

        classData.updatedAt = new Date()
        classes.value.splice(classIndex, 1, classData)

        saveToStorage()
        return true
    }

    /**
     * 批量應用範本到多個班級（簡化版 - 立即生效）
     * @param templateId 範本 ID
     * @param classIds 要應用的班級 ID 陣列
     */

    const applyTemplateToMultipleClasses = (templateId: string, classIds: string[]): boolean => {
        if (!templateId || !Array.isArray(classIds) || classIds.length === 0) {
            return false
        }

        const rewardsStore = useRewardsStore()

        // 驗證範本是否存在
        if (!rewardsStore.getTemplateById(templateId)) {
            console.error(`範本 ${templateId} 不存在`)
            return false
        }

        let successCount = 0
        classIds.forEach((classId) => {
            if (applyTemplateToClass(classId, templateId)) {
                successCount++
            }
        })

        return successCount === classIds.length
    }

    /**
     * 重設所有班級回到預設獎勵範本狀態
     * 用於系統重設時
     */
    const resetAllClassesToDefault = (): boolean => {
        try {
            const rewardsStore = useRewardsStore()
            const defaultTemplate = rewardsStore.defaultTemplate

            if (!defaultTemplate) {
                console.error('無可用的預設範本')
                return false
            }

            // 重設所有班級
            classes.value.forEach((classData) => {
                classData.rewardSettingsMode = 'template'
                classData.appliedRewardTemplateId = defaultTemplate.id
                classData.customRewardSettings = null
                classData.updatedAt = new Date()
            })

            saveToStorage()
            return true
        } catch (error) {
            console.error('重設班級獎勵設定失敗:', error)
            return false
        }
    }

    /**
     * 在獎勵設定變更時，重新計算分組中各組的星星數
     * 用於當 pointsPerStar 改變時重新計算
     * @param classId 班級 ID
     * @param oldPointsPerStar 舊的 pointsPerStar
     * @param newPointsPerStar 新的 pointsPerStar
     */
    const deleteClass = (classId: string) => {
        const index = classes.value.findIndex((c) => c.id === classId)
        if (index > -1) {
            classes.value.splice(index, 1)
            if (currentClassId.value === classId) {
                currentClassId.value = null
            }
            saveToStorage()
            return true
        }
        return false
    }

    const createClass = (name: string, studentsInput: string): ClassInfo => {
        const rewardsStore = useRewardsStore()
        const defaultTemplate = rewardsStore.defaultTemplate

        const classId = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // 解析學生輸入
        const students = parseStudentsInput(studentsInput)

        const newClass: ClassInfo = {
            id: classId,
            name: name.trim(),
            students,
            homeworkSettings: [],
            groups: [],
            groupCount: 4,
            groupingActive: false,
            groupingStartedAt: null,
            groupingEndedAt: null,
            invincibleEvents: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            // 初始化獎勵機制設定：新班級預設不套用範本，由老師手動選擇
            rewardSettingsMode: 'disabled',
            appliedRewardTemplateId: null,
            customRewardSettings: null,
        }
        classes.value.push(newClass)
        saveToStorage()
        return newClass
    }

    const selectClass = (classId: string | null) => {
        // 只有在 ID 變更時才更新，避免不必要的存儲操作
        if (currentClassId.value === classId) return

        if (classId === null) {
            currentClassId.value = null
        } else if (classes.value.find((c) => c.id === classId)) {
            currentClassId.value = classId
        } else {
            // 如果傳入的 classId 無效，也清除當前的選擇
            currentClassId.value = null
        }

        // 當班級變更時，重設抽籤工具的狀態
        const uiStore = useUIStore()
        uiStore.resetPickerState()

        saveToStorage()
    }

    const addStudentToClass = (classId: string, name: string, studentId?: string) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData) return null

        const newStudent: Student = {
            id: studentId || `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            scores: [],
            totalScore: 0,
            averageScore: 0,
            group: null,
            grade: null,
            createdAt: new Date(),
            isPresent: true,
        }

        classData.students.push(newStudent)
        classData.updatedAt = new Date()
        saveToStorage()
        return newStudent
    }

    const updateStudent = (classId: string, studentId: string, updates: Partial<Student>) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData) return false

        const studentIndex = classData.students.findIndex((s) => s.id === studentId)
        if (studentIndex > -1) {
            classData.students[studentIndex] = {
                ...classData.students[studentIndex],
                ...updates,
            }
            classData.updatedAt = new Date()
            saveToStorage()
            return true
        }
        return false
    }

    const removeStudentFromClass = (classId: string, studentId: string) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData) return false

        const index = classData.students.findIndex((s) => s.id === studentId)
        if (index > -1) {
            classData.students.splice(index, 1)
            classData.updatedAt = new Date()
            saveToStorage()
            return true
        }
        return false
    }

    const updateClassHomeworkSettings = (
        classId: string,
        homeworkId: string,
        settings: { releaseDate?: string; dueDate?: string },
    ) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData) return false

        if (!Array.isArray(classData.homeworkSettings)) {
            classData.homeworkSettings = []
        }

        const settingIndex = classData.homeworkSettings.findIndex(
            (s) => s.homeworkId === homeworkId,
        )

        if (settingIndex > -1) {
            // 更新現有設定
            classData.homeworkSettings[settingIndex] = {
                ...classData.homeworkSettings[settingIndex],
                ...settings,
            }
        } else {
            // 新增設定時，初始化所有學生的狀態為 'pending'
            const studentStatus = classData.students.reduce(
                (acc, student) => {
                    acc[student.id] = 'pending'
                    return acc
                },
                {} as Record<string, 'pending' | 'submitted' | 'needs_correction' | 'completed'>,
            )

            classData.homeworkSettings.push({ homeworkId, ...settings, studentStatus })
        }
        classData.updatedAt = new Date()
        saveToStorage()
        return true
    }

    const updateStudentHomeworkStatus = (
        classId: string,
        homeworkId: string,
        studentId: string,
        status: 'pending' | 'submitted' | 'needs_correction' | 'completed',
    ) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData) return false
        if (!Array.isArray(classData.homeworkSettings)) classData.homeworkSettings = []

        let homeworkSetting = classData.homeworkSettings.find((s) => s.homeworkId === homeworkId)

        // 如果設定不存在，則自動建立
        if (!homeworkSetting) {
            const studentStatus = classData.students.reduce(
                (acc, student) => {
                    acc[student.id] = 'pending'
                    return acc
                },
                {} as Record<string, 'pending' | 'submitted' | 'needs_correction' | 'completed'>,
            )
            const newSetting = { homeworkId, studentStatus }
            classData.homeworkSettings.push(newSetting)
            homeworkSetting = newSetting
        }

        if (!homeworkSetting.studentStatus) homeworkSetting.studentStatus = {}
        homeworkSetting.studentStatus[studentId] = status
        classData.updatedAt = new Date()
        saveToStorage()
        return true
    }

    const startClassGrouping = (classId: string) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (classData) {
            // 1. 快照學生的基底分數
            const baseScores: Record<string, number> = {}
            for (const student of classData.students) {
                baseScores[student.id] = student.totalScore
            }
            groupingBaseScores.value[classId] = baseScores

            // 2. 重設本次活動的加分紀錄
            groupingSessionScores.value[classId] = {}
            groupingSessionGroupScores.value[classId] = {}
            groupingSessionIndividualScores.value[classId] = {}

            // 3. 重設組別分數
            if (Array.isArray(classData.groups)) {
                classData.groups.forEach((group) => {
                    group.totalScore = 0
                    group.stars = 0
                    group.invincibleStarQueue = 0
                    group.isInvincible = false
                    group.invincibleUntil = null
                    group.totalCollectedStars = 0
                    group.scorePool = 0 // 初始化計分池
                    group.classTotalInvincibleScore = 0
                })
            }

            // 3.5. 重設全班總分相關的狀態
            classData.classTotalScore = 0
            classData.classTotalInvincibleCount = 0
            classData.classInvincibleUntil = null

            // 3.6. 記錄活動時間與事件
            classData.groupingStartedAt = new Date()
            classData.groupingEndedAt = null
            classData.invincibleEvents = []

            // 4. 啟動分組模式
            classData.groupingActive = true
            classData.updatedAt = new Date()
            saveToStorage()
        }
    }

    const endClassGrouping = (classId: string) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData) return

        // 結束分組模式
        classData.groupingActive = false
        classData.updatedAt = new Date()
        classData.groupingEndedAt = new Date()

        // 重置無敵狀態和星星
        if (Array.isArray(classData.groups)) {
            classData.groups.forEach((group) => {
                group.isInvincible = false
                group.invincibleUntil = null
                group.invincibleStarQueue = 0
                group.stars = 0
                group.totalCollectedStars = 0
            })
        }

        // 清理本次活動暫存分數
        delete groupingBaseScores.value[classId]
        delete groupingSessionScores.value[classId]
        delete groupingSessionGroupScores.value[classId]
        delete groupingSessionIndividualScores.value[classId]

        saveToStorage()
    }

    const updateGroups = (classId: string, groups: Group[]) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (classData) {
            classData.groups = groups.map((group) => ({
                ...group,
                totalCollectedStars: group.totalCollectedStars ?? group.stars ?? 0,
            }))
            classData.updatedAt = new Date()
            saveToStorage()
        }
    }

    const updateGroupCount = (classId: string, count: number) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (classData) {
            classData.groupCount = count
            classData.updatedAt = new Date()
            saveToStorage()
        }
    }

    /**
     * 計算全班總分（所有組別的 totalScore 總和）
     */
    const calculateClassTotalScore = (classId: string): number => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData || !classData.groups) return 0

        return classData.groups.reduce((sum, group) => sum + (group.totalScore || 0), 0)
    }

    /**
     * 檢查並觸發全班無敵星星（僅用於全班總分模式）
     * 當全班總分達到門檻時，所有組別同時進入無敵狀態
     */
    const checkAndTriggerClassTotalInvincible = (classId: string) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData || !classData.groupingActive) return false

        const rewardsStore = useRewardsStore()
        let settings: RewardSettings | null | undefined = null

        if (classData.rewardSettingsMode === 'template') {
            settings = rewardsStore.getTemplateById(classData.appliedRewardTemplateId)?.settings
        }

        // 只在全班總分模式且啟用時處理
        if (!settings || !settings.enabled || settings.mode !== 'class-total') {
            return false
        }

        // 計算全班當前總分
        const totalScore = calculateClassTotalScore(classId)
        classData.classTotalScore = totalScore

        const threshold = getClassTotalThreshold(settings)

        // 計算應該觸發第幾次無敵（totalScore / threshold 的整數部分）
        const expectedTriggerCount = Math.floor(totalScore / threshold)
        const currentTriggerCount = classData.classTotalInvincibleCount || 0

        // 如果達到新的門檻，觸發全班無敵
        if (expectedTriggerCount > currentTriggerCount) {
            // 更新觸發計數
            classData.classTotalInvincibleCount = expectedTriggerCount

            // 所有組別同時進入無敵狀態
            const now = Date.now()
            const durationSeconds = getClassTotalInvincibleDuration(settings)
            const addedDuration = durationSeconds * 1000

            // 如果已在無敵狀態，延長時間；否則從現在開始
            const currentInvincibleEnd = classData.classInvincibleUntil || 0
            const invincibleEnd =
                currentInvincibleEnd > now
                    ? currentInvincibleEnd + addedDuration // 延長
                    : now + addedDuration // 新起

            classData.groups.forEach((group) => {
                group.isInvincible = true
                group.invincibleUntil = invincibleEnd
            })

            // 設定全班無敵結束時間
            classData.classInvincibleUntil = invincibleEnd

            saveToStorage()
            return true // 返回 true 表示觸發了無敵
        }

        return false
    }

    const addScoreToGroup = (classId: string, groupId: string, score: number) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData || !classData.groupingActive) return

        if (!classData.groupingStartedAt) {
            classData.groupingStartedAt = new Date()
        }
        if (!Array.isArray(classData.invincibleEvents)) {
            classData.invincibleEvents = []
        }

        const group = classData.groups.find((g) => g.id === groupId)
        if (!group) return

        const rewardsStore = useRewardsStore()
        let settings: RewardSettings | null | undefined = null

        if (classData.rewardSettingsMode === 'template') {
            settings = rewardsStore.getTemplateById(classData.appliedRewardTemplateId)?.settings
        }

        let finalScore = score

        // 檢查獎勵模式
        const isClassTotalMode = settings?.enabled && settings.mode === 'class-total'

        // 記錄是否為無敵加分
        let isInvincibleScore = false

        // 檢查無敵狀態並使用固定加分值
        if (group.isInvincible && group.invincibleUntil && group.invincibleUntil > Date.now()) {
            if (settings && settings.enabled && score > 0) {
                isInvincibleScore = true
                if (isClassTotalMode) {
                    // 全班模式：使用全班模式的無敵加分值
                    finalScore = getClassTotalInvinciblePoints(settings)
                } else {
                    // 各組模式：使用各組模式的無敵加分值
                    finalScore = settings.invinciblePointsPerClick
                }
            }
        }

        // 1. 更新組別的當前活動總分 (僅供顯示)
        group.totalScore += finalScore

        // 追蹤全班模式下的無敵加分
        if (isClassTotalMode && isInvincibleScore) {
            group.classTotalInvincibleScore = (group.classTotalInvincibleScore || 0) + finalScore
        }

        if (isInvincibleScore) {
            const event: InvincibleEventLog = {
                id: `invincible_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                groupId: group.id,
                groupName: group.name,
                points: finalScore,
                timestamp: new Date(),
            }
            classData.invincibleEvents.push(event)
        }

        // 2. 為每位出席組員更新分數 (session 和 永久)
        const sessionScores = groupingSessionScores.value[classId] || {}
        const activityName = groupingActivityNames.value[classId] || '小組活動'

        group.members.forEach((member) => {
            const student = classData.students.find((s) => s.id === member.id)
            if (student && student.isPresent) {
                // 更新 session 分數
                sessionScores[student.id] = (sessionScores[student.id] || 0) + finalScore

                // 更新團體加分 session 追蹤
                if (!groupingSessionGroupScores.value[classId]) {
                    groupingSessionGroupScores.value[classId] = {}
                }
                groupingSessionGroupScores.value[classId][student.id] =
                    (groupingSessionGroupScores.value[classId][student.id] || 0) + finalScore

                // 更新學生個人總分 (計入永久紀錄)
                const newScore: StudentScore = {
                    id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    value: finalScore,
                    categoryId: 'group',
                    categoryName: '小組活動',
                    reason: `${group.name} (${activityName})`,
                    timestamp: new Date(),
                }
                student.scores.push(newScore)
                _updateStudentStats(student)
            }
        })
        groupingSessionScores.value[classId] = sessionScores

        // 3. 處理獎勵機制
        if (settings && settings.enabled) {
            if (isClassTotalMode) {
                // ===== 全班總分模式 =====
                // 檢查是否達到全班無敵門檻，並返回結果供呼叫端判斷
                const wasTriggered = checkAndTriggerClassTotalInvincible(classId)
                // 如果觸發了無敵，標記以便通知
                group.wasInvincibleTriggered = wasTriggered
            } else if (settings.pointsPerStar > 0) {
                // ===== 各組模式 =====
                // 將本次獲得的分數加入計分池
                group.scorePool = (group.scorePool || 0) + finalScore

                // 檢查計分池是否足以兌換星星
                while (group.scorePool >= settings.pointsPerStar) {
                    // 兌換一顆星星
                    group.scorePool -= settings.pointsPerStar
                    group.stars = (group.stars || 0) + 1
                    group.totalCollectedStars = (group.totalCollectedStars || 0) + 1

                    // 檢查是否觸發無敵狀態
                    if ((group.stars || 0) >= settings.starsToInvincible) {
                        // 消耗所需星星
                        group.stars -= settings.starsToInvincible

                        if (
                            group.isInvincible &&
                            group.invincibleUntil &&
                            group.invincibleUntil > Date.now()
                        ) {
                            // 如果已在無敵狀態，則將一次無敵機會加入佇列
                            group.invincibleStarQueue = (group.invincibleStarQueue || 0) + 1
                        } else {
                            // 否則，啟動新的無敵狀態
                            group.isInvincible = true
                            group.invincibleUntil =
                                Date.now() + settings.invincibleDurationSeconds * 1000
                        }
                    }
                }
            }
        }

        saveToStorage()
    }

    const checkInvincibleStatus = () => {
        const now = Date.now()
        let changed = false

        classes.value.forEach((cls) => {
            if (!cls.groupingActive || !cls.groups) return

            const rewardsStore = useRewardsStore()
            let settings: RewardSettings | null | undefined = null
            if (cls.rewardSettingsMode === 'template') {
                settings = rewardsStore.getTemplateById(cls.appliedRewardTemplateId)?.settings
            }

            if (!settings || !settings.enabled) return

            const isClassTotalMode = settings.mode === 'class-total'

            if (isClassTotalMode) {
                // ===== 全班總分模式 =====
                // 檢查全班無敵時間是否已過期
                if (cls.classInvincibleUntil && cls.classInvincibleUntil <= now) {
                    changed = true
                    // 結束全班無敵狀態
                    cls.classInvincibleUntil = null

                    // 所有組別同時結束無敵
                    cls.groups.forEach((group) => {
                        group.isInvincible = false
                        group.invincibleUntil = null
                    })
                }
            } else {
                // ===== 各組模式 =====
                // 檢查無敵狀態
                cls.groups.forEach((group) => {
                    if (group.isInvincible && group.invincibleUntil) {
                        // 檢查無敵時間是否已經過期
                        if (group.invincibleUntil <= now) {
                            changed = true
                            if (group.invincibleStarQueue > 0) {
                                // 激活佇列中的下一個無敵狀態
                                group.invincibleStarQueue--
                                // 設置新的無敵結束時間（確保未來時間）
                                group.invincibleUntil = Math.max(
                                    now + 100, // 確保至少有 100ms 的緩衝
                                    now + settings.invincibleDurationSeconds * 1000,
                                )
                                // 保持 isInvincible = true，讓新的無敵期繼續
                            } else {
                                // 完全結束無敵狀態
                                group.isInvincible = false
                                group.invincibleUntil = null
                                group.invincibleStarQueue = 0
                            }
                        }
                    }
                })
            }
        })

        if (changed) {
            saveToStorage()
        }
    }

    const addIndividualScoreInGroup = (classId: string, studentId: string, score: number) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData || !classData.groupingActive) return

        const student = classData.students.find((s) => s.id === studentId)
        if (!student || !student.isPresent) return

        // 1. Update session score
        const sessionScores = groupingSessionScores.value[classId] || {}
        sessionScores[studentId] = (sessionScores[studentId] || 0) + score
        groupingSessionScores.value[classId] = sessionScores

        // 更新個人加分 session 追蹤
        if (!groupingSessionIndividualScores.value[classId]) {
            groupingSessionIndividualScores.value[classId] = {}
        }
        groupingSessionIndividualScores.value[classId][studentId] =
            (groupingSessionIndividualScores.value[classId][studentId] || 0) + score

        // 2. Update permanent score
        const newScore: StudentScore = {
            id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            value: score,
            categoryId: 'group_individual',
            categoryName: '小組個別評分',
            reason: '小組內個別評分',
            timestamp: new Date(),
        }
        student.scores.push(newScore)
        _updateStudentStats(student)

        saveToStorage()
    }

    const addScoreToStudent = (
        classId: string,
        studentId: string,
        score: number,
        reason: string,
    ) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData) return

        const student = classData.students.find((s) => s.id === studentId)
        if (!student) return

        const newScore: StudentScore = {
            id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            value: score,
            categoryId: 'quick',
            categoryName: '快速評分',
            reason: reason,
            timestamp: new Date(),
        }

        student.scores.push(newScore)
        _updateStudentStats(student)
        saveToStorage()
    }

    const resetClassTotals = (classId: string) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData) return false

        classData.students.forEach((student) => {
            student.scores = []
            _updateStudentStats(student)
        })

        if (Array.isArray(classData.groups)) {
            classData.groups.forEach((group) => {
                group.totalScore = 0
                group.averageScore = 0
                group.stars = 0
                group.invincibleStarQueue = 0
                group.isInvincible = false
                group.invincibleUntil = null
                group.totalCollectedStars = 0
                _updateGroupStats(group, classData.students)
            })
        }

        groupingBaseScores.value[classId] = {}
        groupingSessionScores.value[classId] = {}

        classData.updatedAt = new Date()
        saveToStorage()
        return true
    }

    // Private helpers
    // 處理現有星星數，當設定變更時檢查是否需要觸發無敵
    const _processExistingStars = (classData: ClassInfo, settings: RewardSettings) => {
        if (!classData.groups || !settings.enabled) return

        classData.groups.forEach((group) => {
            const currentStars = group.stars || 0
            if (group.totalCollectedStars == null) {
                group.totalCollectedStars = currentStars
            }
            if (currentStars >= settings.starsToInvincible) {
                // 計算可以觸發多少次無敵
                let availableStars = currentStars
                while (availableStars >= settings.starsToInvincible) {
                    group.stars = (group.stars || 0) - settings.starsToInvincible
                    availableStars -= settings.starsToInvincible

                    if (group.isInvincible) {
                        // 如果已經在無敵中，加入佇列
                        group.invincibleStarQueue = (group.invincibleStarQueue || 0) + 1
                    } else {
                        // 啟動無敵狀態
                        group.isInvincible = true
                        group.invincibleUntil =
                            Date.now() + settings.invincibleDurationSeconds * 1000
                    }
                }
            }
        })
    }

    const _updateStudentStats = (student: Student) => {
        const scores = student.scores.map((s) => s.value)
        student.totalScore = scores.reduce((sum, score) => sum + score, 0)
        student.averageScore = scores.length > 0 ? student.totalScore / scores.length : 0
    }

    const _updateGroupStats = (group: Group, allStudents: Student[]) => {
        const memberIds = group.members.map((m) => m.id)
        const groupStudents = allStudents.filter((s) => memberIds.includes(s.id))

        const totalScores = groupStudents.reduce((sum, student) => sum + student.totalScore, 0)
        group.totalScore = totalScores
        group.averageScore = groupStudents.length > 0 ? totalScores / groupStudents.length : 0
    }

    const parseStudentsInput = (input: string): Student[] => {
        const trimmedInput = input.trim()

        // 如果是純數字，生成對應數量的學生
        if (/^\d+$/.test(trimmedInput)) {
            const count = parseInt(trimmedInput)
            return Array.from({ length: count }, (_, i) => ({
                id: String(i + 1),
                name: `${i + 1}號`,
                scores: [],
                totalScore: 0,
                averageScore: 0,
                group: null,
                grade: null,
                createdAt: new Date(),
                isPresent: true,
            }))
        }

        // 否則解析為「座號 姓名」格式
        return trimmedInput
            .split('\n')
            .map((line) => {
                const parts = line.trim().split(/\s+/)
                if (parts.length >= 1 && parts[0]) {
                    return {
                        id: parts[0],
                        name: parts.slice(1).join(' ') || `${parts[0]}號`,
                        scores: [],
                        totalScore: 0,
                        averageScore: 0,
                        group: null,
                        grade: null,
                        createdAt: new Date(),
                        isPresent: true,
                    }
                }
                return null
            })
            .filter(Boolean) as Student[]
    }

    const saveToStorage = () => {
        if (!process.client) return
        try {
            const data = {
                classes: classes.value,
                currentClassId: currentClassId.value,
                groupingBaseScores: groupingBaseScores.value,
                groupingSessionScores: groupingSessionScores.value,
                groupingActivityNames: groupingActivityNames.value,
                groupingSessionGroupScores: groupingSessionGroupScores.value,
                groupingSessionIndividualScores: groupingSessionIndividualScores.value,
                lastSaved: new Date().toISOString(),
            }
            localStorage.setItem('classes-data', JSON.stringify(data))
        } catch (error) {
            console.error('儲存班級資料失敗:', error)
        }
    }

    const loadFromStorage = () => {
        if (!process.client) return
        try {
            const saved = localStorage.getItem('classes-data')
            if (saved) {
                const data = JSON.parse(saved)
                classes.value = sanitizeClassesPayload(
                    Array.isArray(data.classes) ? data.classes : [],
                )
                currentClassId.value = data.currentClassId || null
                groupingBaseScores.value = data.groupingBaseScores || {}
                groupingSessionScores.value = data.groupingSessionScores || {}
                groupingActivityNames.value = data.groupingActivityNames || {}
                groupingSessionGroupScores.value = data.groupingSessionGroupScores || {}
                groupingSessionIndividualScores.value = data.groupingSessionIndividualScores || {}
            }
        } catch (error) {
            console.error('載入班級資料失敗:', error)
        } finally {
            isLoaded.value = true // 確保無論成功或失敗都標記為已載入
        }
    }

    const buildBackupPayload = () => {
        const homeworkStore = useHomeworkStore()
        const rewardsStore = useRewardsStore()
        // 確保最新的作業資料已載入
        homeworkStore.fetchAllHomework?.()

        return {
            version: BACKUP_SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            classes: classes.value,
            currentClassId: currentClassId.value,
            groupingBaseScores: groupingBaseScores.value,
            groupingSessionScores: groupingSessionScores.value,
            groupingActivityNames: groupingActivityNames.value,
            groupingSessionGroupScores: groupingSessionGroupScores.value,
            groupingSessionIndividualScores: groupingSessionIndividualScores.value,
            homeworks: homeworkStore.homeworkList,
            rewardTemplates: rewardsStore.rewardTemplates,
        }
    }

    const extractHomeworkPayload = (data: any) => {
        if (Array.isArray(data?.homeworks)) return data.homeworks
        if (Array.isArray(data?.homeworkList)) return data.homeworkList
        return []
    }

    const isPlainObject = (value: unknown): value is Record<string, any> => {
        return value !== null && typeof value === 'object' && !Array.isArray(value)
    }

    const parseDate = (value: any) => {
        const date = new Date(value)
        return isNaN(date.getTime()) ? new Date() : date
    }

    const sanitizeClassesPayload = (incoming: any[]): ClassInfo[] => {
        const rewardsStore = useRewardsStore()
        const defaultTemplateId = rewardsStore.defaultTemplate?.id || null

        return incoming.map((cls) => {
            const resolveRewardMode = (): ClassInfo['rewardSettingsMode'] => {
                const mode = cls.rewardSettingsMode
                // 轉換任何 custom 模式為 disabled（向後相容性）
                if (mode === 'custom') {
                    return 'disabled'
                }
                if (mode === 'disabled' || mode === 'template') {
                    return mode
                }
                // 如果舊版本班級沒有 rewardSettingsMode 屬性，預設為停用
                // 讓老師主動選擇要套用哪個範本，而不是自動套用
                return 'disabled'
            }

            const normalizeTemplateId = (templateId: unknown): string | null => {
                if (typeof templateId !== 'string' || !templateId.trim()) return null
                return templateId
            }

            const normalizedRewardMode = resolveRewardMode()
            let normalizedTemplateId = normalizeTemplateId(cls.appliedRewardTemplateId)

            if (normalizedRewardMode === 'template') {
                if (!normalizedTemplateId || !rewardsStore.getTemplateById(normalizedTemplateId)) {
                    normalizedTemplateId = defaultTemplateId
                }
                if (!normalizedTemplateId) {
                    // 如果仍然找不到可用範本，降級為關閉模式
                    normalizedTemplateId = null
                }
            }

            const normalizedStudents = Array.isArray(cls.students)
                ? cls.students.map((student: any) => ({
                      ...student,
                      scores: Array.isArray(student?.scores)
                          ? student.scores.map((score: any) => ({
                                ...score,
                                timestamp: parseDate(score?.timestamp),
                            }))
                          : [],
                      totalScore: typeof student?.totalScore === 'number' ? student.totalScore : 0,
                      averageScore:
                          typeof student?.averageScore === 'number' ? student.averageScore : 0,
                      isPresent: typeof student?.isPresent === 'boolean' ? student.isPresent : true,
                      createdAt: parseDate(student?.createdAt),
                  }))
                : []

            const normalizedHomeworkSettings = Array.isArray(cls.homeworkSettings)
                ? cls.homeworkSettings
                      .filter(
                          (setting: any) =>
                              setting &&
                              typeof setting.homeworkId === 'string' &&
                              setting.homeworkId.trim(),
                      )
                      .map((setting: any) => ({
                          homeworkId: setting.homeworkId,
                          releaseDate: setting.releaseDate ?? setting.startDate ?? undefined,
                          dueDate: setting.dueDate ?? setting.endDate ?? undefined,
                          studentStatus: isPlainObject(setting.studentStatus)
                              ? setting.studentStatus
                              : {},
                      }))
                : []

            const normalizedGroups = Array.isArray(cls.groups)
                ? cls.groups.map((group: any) => {
                      const invincibleUntilRaw = group?.invincibleUntil
                      const normalizedInvincibleUntil =
                          typeof invincibleUntilRaw === 'number'
                              ? invincibleUntilRaw
                              : typeof invincibleUntilRaw === 'string'
                                ? Number(invincibleUntilRaw) || null
                                : null

                      return {
                          ...group,
                          members: Array.isArray(group?.members)
                              ? group.members.map((member: any) => ({
                                    ...member,
                                    totalScore:
                                        typeof member?.totalScore === 'number'
                                            ? member.totalScore
                                            : 0,
                                    averageScore:
                                        typeof member?.averageScore === 'number'
                                            ? member.averageScore
                                            : 0,
                                    scores: Array.isArray(member?.scores)
                                        ? member.scores.map((score: any) => ({
                                              ...score,
                                              timestamp: parseDate(score?.timestamp),
                                          }))
                                        : [],
                                    isPresent:
                                        typeof member?.isPresent === 'boolean'
                                            ? member.isPresent
                                            : true,
                                    createdAt: parseDate(member?.createdAt),
                                }))
                              : [],
                          totalScore: typeof group?.totalScore === 'number' ? group.totalScore : 0,
                          averageScore:
                              typeof group?.averageScore === 'number' ? group.averageScore : 0,
                          createdAt: parseDate(group?.createdAt),
                          color: typeof group?.color === 'string' ? group.color : '#3b82f6',
                          // 填充獎勵機制屬性
                          stars: typeof group?.stars === 'number' ? group.stars : 0,
                          totalCollectedStars:
                              typeof group?.totalCollectedStars === 'number'
                                  ? group.totalCollectedStars
                                  : typeof group?.stars === 'number'
                                    ? group.stars
                                    : 0,
                          scorePool: typeof group?.scorePool === 'number' ? group.scorePool : 0,
                          isInvincible: Boolean(group?.isInvincible),
                          invincibleUntil: normalizedInvincibleUntil,
                          invincibleStarQueue:
                              typeof group?.invincibleStarQueue === 'number'
                                  ? group.invincibleStarQueue
                                  : 0,
                          classTotalInvincibleScore:
                              typeof group?.classTotalInvincibleScore === 'number'
                                  ? group.classTotalInvincibleScore
                                  : 0,
                      }
                  })
                : []

            const normalizedInvincibleEvents: InvincibleEventLog[] = Array.isArray(
                cls.invincibleEvents,
            )
                ? cls.invincibleEvents
                      .map((event: any, index: number) => {
                          if (!event) return null
                          const timestamp = parseDate(event.timestamp)
                          const id =
                              typeof event.id === 'string' && event.id.trim()
                                  ? event.id
                                  : `invincible_${timestamp.getTime()}_${index}`
                          const groupId =
                              typeof event.groupId === 'string' && event.groupId.trim()
                                  ? event.groupId
                                  : `group_${index}`
                          const groupName =
                              typeof event.groupName === 'string' && event.groupName.trim()
                                  ? event.groupName
                                  : '未命名組'
                          const points =
                              typeof event.points === 'number'
                                  ? event.points
                                  : Number(event.points) || 0

                          return {
                              id,
                              groupId,
                              groupName,
                              points,
                              timestamp,
                          }
                      })
                      .filter((event): event is InvincibleEventLog => Boolean(event))
                : []

            const normalized: ClassInfo = {
                ...cls,
                students: normalizedStudents,
                homeworkSettings: normalizedHomeworkSettings,
                groups: normalizedGroups,
                groupCount:
                    typeof cls.groupCount === 'number' && cls.groupCount > 0
                        ? cls.groupCount
                        : Math.max(2, normalizedGroups.length || 4),
                groupingActive: Boolean(cls.groupingActive),
                classTotalScore:
                    typeof cls.classTotalScore === 'number' ? cls.classTotalScore : 0,
                classTotalInvincibleCount:
                    typeof cls.classTotalInvincibleCount === 'number'
                        ? cls.classTotalInvincibleCount
                        : 0,
                classInvincibleUntil:
                    typeof cls.classInvincibleUntil === 'number'
                        ? cls.classInvincibleUntil
                        : typeof cls.classInvincibleUntil === 'string'
                          ? Number(cls.classInvincibleUntil) || null
                          : null,
                groupingStartedAt: cls.groupingStartedAt ? parseDate(cls.groupingStartedAt) : null,
                groupingEndedAt: cls.groupingEndedAt ? parseDate(cls.groupingEndedAt) : null,
                invincibleEvents: normalizedInvincibleEvents,
                createdAt: parseDate(cls.createdAt),
                updatedAt: parseDate(cls.updatedAt),
                // 填充獎勵機制設定
                rewardSettingsMode:
                    normalizedRewardMode === 'template' && !normalizedTemplateId
                        ? 'disabled'
                        : normalizedRewardMode,
                appliedRewardTemplateId:
                    normalizedRewardMode === 'template' ? normalizedTemplateId : null,
                customRewardSettings: null,
            }

            if (
                normalized.rewardSettingsMode === 'template' &&
                normalized.appliedRewardTemplateId &&
                !rewardsStore.getTemplateById(normalized.appliedRewardTemplateId)
            ) {
                if (defaultTemplateId && rewardsStore.getTemplateById(defaultTemplateId)) {
                    normalized.appliedRewardTemplateId = defaultTemplateId
                } else {
                    normalized.rewardSettingsMode = 'disabled'
                    normalized.appliedRewardTemplateId = null
                }
            }

            return normalized
        })
    }

    const applyLegacyMigrations = (version: string) => {
        // 目前主要確保 studentStatus 存在
        classes.value.forEach((cls) => {
            if (!Array.isArray(cls.homeworkSettings)) return
            cls.homeworkSettings.forEach((setting) => {
                if (!isPlainObject(setting.studentStatus)) {
                    setting.studentStatus = {}
                }
            })
        })
    }

    const syncClassHomeworkSettingsWithGlobal = () => {
        const homeworkStore = useHomeworkStore()
        const homeworkIds = new Set(homeworkStore.homeworkList.map((hw) => hw.id))

        classes.value.forEach((cls) => {
            if (!Array.isArray(cls.homeworkSettings)) {
                cls.homeworkSettings = []
                return
            }

            cls.homeworkSettings = cls.homeworkSettings.filter((setting) => {
                if (!setting || typeof setting.homeworkId !== 'string') return false
                if (!homeworkIds.has(setting.homeworkId)) return false
                if (!isPlainObject(setting.studentStatus)) {
                    setting.studentStatus = {}
                }
                return true
            })
        })
    }

    const ensureCurrentClassIsValid = () => {
        if (!currentClassId.value) return
        const exists = classes.value.some((cls) => cls.id === currentClassId.value)
        if (!exists) {
            currentClassId.value = classes.value[0]?.id ?? null
        }
    }

    const exportAllClasses = () => {
        const payload = buildBackupPayload()
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `class-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const importAllClasses = async (file: File): Promise<boolean> => {
        try {
            const text = await file.text()
            const data = JSON.parse(text)

            if (!Array.isArray(data.classes)) {
                console.error('匯入班級資料失敗: 缺少 classes 陣列')
                return false
            }

            const version = typeof data.version === 'string' ? data.version : '1.0.0'

            // 恢復獎勵範本 - 先重置到預設狀態，再恢復舊範本
            const rewardsStore = useRewardsStore()
            rewardsStore.resetToDefault() // 清空舊範本

            const templateIdMap = new Map<string, string>() // 舊 ID → 新 ID 的對應
            const defaultTemplateId = rewardsStore.rewardTemplates[0].id // 新的預設範本 ID

            // 比較範本設定是否與預設相同
            const isDefaultSettings = (template: any): boolean => {
                if (!template.settings) return true

                const settings = template.settings
                const defaults = rewardsStore.rewardTemplates[0].settings

                // 比較基本設定
                if (
                    settings.pointsPerStar !== defaults.pointsPerStar ||
                    settings.starsToInvincible !== defaults.starsToInvincible ||
                    settings.invincibleDurationSeconds !== defaults.invincibleDurationSeconds ||
                    settings.invinciblePointsPerClick !== defaults.invinciblePointsPerClick
                ) {
                    return false
                }

                // 比較 milestone 訊息
                if (
                    !Array.isArray(settings.milestoneMessages) ||
                    !Array.isArray(defaults.milestoneMessages) ||
                    settings.milestoneMessages.length !== defaults.milestoneMessages.length
                ) {
                    return false
                }

                return settings.milestoneMessages.every(
                    (msg, index) =>
                        msg.threshold === defaults.milestoneMessages[index]?.threshold &&
                        msg.message === defaults.milestoneMessages[index]?.message,
                )
            }

            if (Array.isArray(data.rewardTemplates) && data.rewardTemplates.length > 0) {
                data.rewardTemplates.forEach((template: any) => {
                    try {
                        // 跳過未被編輯過的預設範本 - 根據設定內容判斷
                        if (template.name === '預設獎勵規則' && isDefaultSettings(template)) {
                            // 映射舊的預設範本 ID 到新的預設範本 ID
                            templateIdMap.set(template.id, defaultTemplateId)
                            return
                        }

                        const sanitized = rewardsStore.normalizeRewardSettings(
                            template.settings || {},
                        )
                        // 使用 addTemplate 建立新範本，以避免 ID 不存在的錯誤
                        const newTemplate = rewardsStore.addTemplate(
                            template.name || '匯入的範本',
                            sanitized,
                        )
                        templateIdMap.set(template.id, newTemplate.id)

                        // 如果是預設範本，設為預設
                        if (template.isDefault) {
                            rewardsStore.setDefaultTemplate(newTemplate.id)
                        }
                    } catch (e) {
                        console.warn(`無法恢復範本 ${template.id}:`, e)
                        // 失敗時映射到預設範本
                        templateIdMap.set(template.id, defaultTemplateId)
                    }
                })
            }

            // 在 sanitizeClassesPayload 之前，先更新班級中的範本 ID
            const updateClassTemplateIds = (classes: any[]): any[] => {
                return classes.map((cls) => {
                    if (
                        cls.appliedRewardTemplateId &&
                        templateIdMap.has(cls.appliedRewardTemplateId)
                    ) {
                        return {
                            ...cls,
                            appliedRewardTemplateId: templateIdMap.get(cls.appliedRewardTemplateId),
                        }
                    }
                    return cls
                })
            }

            const classesWithUpdatedTemplateIds = updateClassTemplateIds(data.classes)
            const sanitizedClasses = sanitizeClassesPayload(classesWithUpdatedTemplateIds)
            classes.value = sanitizedClasses

            groupingBaseScores.value = isPlainObject(data.groupingBaseScores)
                ? data.groupingBaseScores
                : {}
            groupingSessionScores.value = isPlainObject(data.groupingSessionScores)
                ? data.groupingSessionScores
                : {}
            groupingActivityNames.value = isPlainObject(data.groupingActivityNames)
                ? data.groupingActivityNames
                : {}
            groupingSessionGroupScores.value = isPlainObject(data.groupingSessionGroupScores)
                ? data.groupingSessionGroupScores
                : {}
            groupingSessionIndividualScores.value = isPlainObject(
                data.groupingSessionIndividualScores,
            )
                ? data.groupingSessionIndividualScores
                : {}

            currentClassId.value =
                typeof data.currentClassId === 'string' ? data.currentClassId : null

            applyLegacyMigrations(version)

            const homeworkStore = useHomeworkStore()
            const homeworkPayload = extractHomeworkPayload(data)
            homeworkStore.replaceAll(homeworkPayload)

            syncClassHomeworkSettingsWithGlobal()
            ensureCurrentClassIsValid()
            saveToStorage()

            return true
        } catch (error) {
            console.error('匯入班級資料失敗:', error)
            return false
        }
    }

    const exportDashboardSummary = () => {
        if (!process.client) return
        const { exportToExcel } = useExcelExport()

        const today = new Date()
        const dateString = today.toISOString().split('T')[0]

        const summaryData = classes.value.map((cls) => {
            const studentCount = cls.students.length
            const totalScore = cls.students.reduce((sum, s) => sum + (s.totalScore ?? 0), 0)
            const averageScore = studentCount > 0 ? (totalScore / studentCount).toFixed(2) : 0
            return {
                班級名稱: cls.name,
                學生人數: studentCount,
                班級總分: totalScore,
                班級平均分: averageScore,
            }
        })

        if (summaryData.length === 0) {
            console.warn('沒有班級資料可匯出。')
            return
        }

        const sheetData = {
            sheetName: '班級總覽報告',
            data: summaryData,
            columnWidths: [
                { wch: 25 }, // 班級名稱
                { wch: 12 }, // 學生人數
                { wch: 12 }, // 班級總分
                { wch: 15 }, // 班級平均分
            ],
        }

        const fileName = `班級總覽報告-${dateString}`
        exportToExcel([sheetData], fileName)
    }

    // 初始化，這個動作應該由 app.vue 或 plugin 觸發
    // onMounted(() => {
    //     loadFromStorage()
    // })

    return {
        // State
        classes, // 暫時移除 readonly，但建議在組件中透過 action 修改
        currentClassId, // 暫時移除 readonly，但建議在組件中透過 action 修改
        isLoaded, // 導出旗標
        groupingBaseScores,
        groupingSessionScores,
        groupingActivityNames,
        groupingSessionGroupScores,
        groupingSessionIndividualScores,

        // Computed
        currentClass,
        totalClasses,

        // Actions
        createClass,
        updateClass,
        deleteClass,
        selectClass,
        addStudentToClass,
        updateStudent,
        removeStudentFromClass,
        updateClassHomeworkSettings,
        updateStudentHomeworkStatus,
        startClassGrouping,
        endClassGrouping,
        updateGroups,
        updateGroupCount,
        calculateClassTotalScore, // 新增：計算全班總分
        checkAndTriggerClassTotalInvincible, // 新增：檢查並觸發全班無敵
        addScoreToGroup,
        checkInvincibleStatus,
        addIndividualScoreInGroup,
        addScoreToStudent,
        resetClassTotals,
        setGroupingActivityName,
        setGroupingBaseScores,
        getGroupingBaseScores,
        setGroupingSessionScores,
        getGroupingSessionScores,
        clearGroupingScores,
        applyTemplateToClass,
        setRewardSettingsMode,
        applyTemplateToMultipleClasses,
        resetAllClassesToDefault,
        saveToStorage,
        loadFromStorage,
        exportAllClasses,
        importAllClasses,
        exportDashboardSummary,
    }
})
