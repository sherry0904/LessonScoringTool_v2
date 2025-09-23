// ...保留唯一一份正確的 defineStore 區塊...
import { defineStore } from 'pinia'
import type { ClassInfo, Student, Homework, Group, StudentScore } from '~/types/class'
import { useExcelExport } from '~/composables/useExcelExport'
import { useHomeworkStore } from '~/stores/homework'

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
        const classId = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // 解析學生輸入
        const students = parseStudentsInput(studentsInput)

        const newClass: ClassInfo = {
            id: classId,
            name: name.trim(),
            students,
            homeworkSettings: [], // <--- 修正於此
            groups: [],
            groupCount: 4,
            groupingActive: false,
            createdAt: new Date(),
            updatedAt: new Date(),
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

            // 3. 啟動分組模式
            classData.groupingActive = true
            classData.updatedAt = new Date()
            saveToStorage()
        }
    }

    const endClassGrouping = (classId: string) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (classData) {
            classData.groupingActive = false
            classData.updatedAt = new Date()
            saveToStorage()
        }
    }

    const updateGroups = (classId: string, groups: Group[]) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (classData) {
            classData.groups = groups
            classData.updatedAt = new Date()
            saveToStorage()
        }
    }

    const addScoreToGroup = (classId: string, groupId: string, score: number) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData) return

        const group = classData.groups.find((g) => g.id === groupId)
        if (!group) return

        // 初始化 session scores 物件 (如果不存在)
        if (!groupingSessionScores.value[classId]) {
            groupingSessionScores.value[classId] = {}
        }

        // 1. 組別總分直接加分（獨立計算）
        group.totalScore += score

        // 2. 只為出席的組員加分
        group.members.forEach((member) => {
            const student = classData.students.find((s) => s.id === member.id)
            if (student && student.isPresent) {
                // 更新 session 分數
                if (!groupingSessionScores.value[classId][student.id]) {
                    groupingSessionScores.value[classId][student.id] = 0
                }
                groupingSessionScores.value[classId][student.id] += score

                // 更新學生個人總分 (這會將小組分數計入永久紀錄)
                const newScore: StudentScore = {
                    id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    value: score,
                    categoryId: 'group',
                    categoryName: '小組活動',
                    reason: `${group.name} 小組評分`,
                    timestamp: new Date(),
                }
                student.scores.push(newScore)
                _updateStudentStats(student)
            }
        })

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
                classes.value = data.classes || []
                currentClassId.value = data.currentClassId || null
                groupingBaseScores.value = data.groupingBaseScores || {}
                groupingSessionScores.value = data.groupingSessionScores || {}
                groupingActivityNames.value = data.groupingActivityNames || {}
            }
        } catch (error) {
            console.error('載入班級資料失敗:', error)
        } finally {
            isLoaded.value = true // 確保無論成功或失敗都標記為已載入
        }
    }

    const buildBackupPayload = () => {
        const homeworkStore = useHomeworkStore()
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
            homeworks: homeworkStore.homeworkList,
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
        return incoming.map((cls) => {
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
                      isPresent:
                          typeof student?.isPresent === 'boolean' ? student.isPresent : true,
                      createdAt: parseDate(student?.createdAt),
                  }))
                : []

            const normalizedHomeworkSettings = Array.isArray(cls.homeworkSettings)
                ? cls.homeworkSettings
                      .filter(
                          (setting: any) => setting && typeof setting.homeworkId === 'string' && setting.homeworkId.trim(),
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
                ? cls.groups.map((group: any) => ({
                      ...group,
                      members: Array.isArray(group?.members)
                          ? group.members.map((member: any) => ({
                                ...member,
                                totalScore:
                                    typeof member?.totalScore === 'number' ? member.totalScore : 0,
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
                                    typeof member?.isPresent === 'boolean' ? member.isPresent : true,
                                createdAt: parseDate(member?.createdAt),
                            }))
                          : [],
                      totalScore: typeof group?.totalScore === 'number' ? group.totalScore : 0,
                      averageScore:
                          typeof group?.averageScore === 'number' ? group.averageScore : 0,
                      createdAt: parseDate(group?.createdAt),
                      color: typeof group?.color === 'string' ? group.color : '#3b82f6',
                  }))
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
                createdAt: parseDate(cls.createdAt),
                updatedAt: parseDate(cls.updatedAt),
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

            const sanitizedClasses = sanitizeClassesPayload(data.classes)
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

            currentClassId.value = typeof data.currentClassId === 'string' ? data.currentClassId : null

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
        updateStudentHomeworkStatus, // 新增
        startClassGrouping,
        endClassGrouping,
        updateGroups,
        addScoreToGroup,
        addScoreToStudent,
        resetClassTotals,
        setGroupingActivityName,
        setGroupingBaseScores,
        getGroupingBaseScores,
        setGroupingSessionScores,
        getGroupingSessionScores,
        clearGroupingScores,
        saveToStorage,
        loadFromStorage,
        exportAllClasses,
        importAllClasses,
        exportDashboardSummary,
    }
})
