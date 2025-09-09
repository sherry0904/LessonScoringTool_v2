import { defineStore } from 'pinia'
import type {
    Student,
    Group,
    ClassSession,
    StudentScore,
    ScoreCategory,
    ClassSettings,
    StudentStats,
    ClassStats,
    ScoreUpdateEvent,
    GroupingEvent,
} from '~/types'

export const useClassStore = defineStore('class', () => {
    // State
    const currentSession = ref<ClassSession | null>(null)
    const students = ref<Student[]>([])
    const groups = ref<Group[]>([])
    const isGroupingActive = ref(false)
    const groupingStartTime = ref<Date | null>(null)
    const groupingEndTime = ref<Date | null>(null)
    const settings = ref<ClassSettings>({
        maxScore: 10,
        minScore: 0,
        scoreCategories: [
            {
                id: 'participation',
                name: '參與度',
                color: '#3b82f6',
                icon: 'hand-raised',
                weight: 1,
            },
            { id: 'homework', name: '作業', color: '#10b981', icon: 'book-open', weight: 1 },
            { id: 'behavior', name: '行為表現', color: '#f59e0b', icon: 'heart', weight: 1 },
            { id: 'creativity', name: '創意思考', color: '#8b5cf6', icon: 'lightbulb', weight: 1 },
        ],
        enableGrouping: true,
        enableSound: true,
        theme: 'light',
    })

    // Computed
    const studentsInGroups = computed(() => {
        return students.value.filter((student) =>
            groups.value.some((group) => group.members.some((member) => member.id === student.id)),
        )
    })

    const ungroupedStudents = computed(() => {
        return students.value.filter(
            (student) =>
                !groups.value.some((group) =>
                    group.members.some((member) => member.id === student.id),
                ),
        )
    })

    const totalStudents = computed(() => students.value.length)
    const totalGroups = computed(() => groups.value.length)
    const presentStudents = computed(() => students.value.filter((s) => s.isPresent))

    // Actions
    const initializeClass = (className: string) => {
        currentSession.value = {
            id: `session_${Date.now()}`,
            className,
            date: new Date(),
            startTime: new Date(),
            endTime: null,
            notes: '',
        }
        saveToStorage()
    }

    const addStudent = (name: string) => {
        const newStudent: Student = {
            id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            scores: [],
            totalScore: 0,
            averageScore: 0,
            createdAt: new Date(),
            isPresent: true,
        }
        students.value.push(newStudent)
        saveToStorage()
        return newStudent
    }

    const removeStudent = (studentId: string) => {
        const index = students.value.findIndex((s) => s.id === studentId)
        if (index > -1) {
            students.value.splice(index, 1)
            // 從所有群組中移除此學生
            groups.value.forEach((group) => {
                group.members = group.members.filter((member) => member.id !== studentId)
            })
            saveToStorage()
        }
    }

    const addScore = (studentId: string, score: number, categoryId?: string, reason?: string) => {
        const student = students.value.find((s) => s.id === studentId)
        if (!student) return

        const category =
            settings.value.scoreCategories.find((c) => c.id === categoryId) ||
            settings.value.scoreCategories[0]

        const newScore: StudentScore = {
            id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            value: score,
            categoryId: category.id,
            categoryName: category.name,
            reason: reason || '',
            timestamp: new Date(),
            sessionId: currentSession.value?.id || null,
        }

        student.scores.push(newScore)
        updateStudentStats(student)
        saveToStorage()

        return newScore
    }

    const updateStudentStats = (student: Student) => {
        const scores = student.scores.map((s) => s.value)
        student.totalScore = scores.reduce((sum, score) => sum + score, 0)
        student.averageScore = scores.length > 0 ? student.totalScore / scores.length : 0
    }

    const createGroup = (name: string) => {
        const newGroup: Group = {
            id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            members: [],
            totalScore: 0,
            averageScore: 0,
            createdAt: new Date(),
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        }
        groups.value.push(newGroup)
        saveToStorage()
        return newGroup
    }

    const removeGroup = (groupId: string) => {
        const index = groups.value.findIndex((g) => g.id === groupId)
        if (index > -1) {
            groups.value.splice(index, 1)
            saveToStorage()
        }
    }

    const addStudentToGroup = (studentId: string, groupId: string) => {
        const student = students.value.find((s) => s.id === studentId)
        const group = groups.value.find((g) => g.id === groupId)

        if (!student || !group) return false

        // 從其他群組移除該學生
        groups.value.forEach((g) => {
            g.members = g.members.filter((member) => member.id !== studentId)
        })

        // 加入新群組
        group.members.push({ ...student })
        updateGroupStats(group)
        saveToStorage()
        return true
    }

    const removeStudentFromGroup = (studentId: string, groupId: string) => {
        const group = groups.value.find((g) => g.id === groupId)
        if (group) {
            group.members = group.members.filter((member) => member.id !== studentId)
            updateGroupStats(group)
            saveToStorage()
        }
    }

    const updateGroupStats = (group: Group) => {
        const memberIds = group.members.map((m) => m.id)
        const groupStudents = students.value.filter((s) => memberIds.includes(s.id))

        const totalScores = groupStudents.reduce((sum, student) => sum + student.totalScore, 0)
        group.totalScore = totalScores
        group.averageScore = groupStudents.length > 0 ? totalScores / groupStudents.length : 0
    }

    const startGrouping = () => {
        isGroupingActive.value = true
        groupingStartTime.value = new Date()
        groupingEndTime.value = null
        saveToStorage()
    }

    const endGrouping = () => {
        if (isGroupingActive.value) {
            isGroupingActive.value = false
            groupingEndTime.value = new Date()
            saveToStorage()
        }
    }

    const randomAssignGroups = (groupCount: number) => {
        if (groupCount <= 0 || students.value.length === 0) return

        // 清空現有群組
        groups.value = []

        // 創建指定數量的群組
        for (let i = 1; i <= groupCount; i++) {
            createGroup(`第 ${i} 組`)
        }

        // 隨機分配學生
        const shuffledStudents = [...students.value].sort(() => Math.random() - 0.5)
        shuffledStudents.forEach((student, index) => {
            const groupIndex = index % groupCount
            addStudentToGroup(student.id, groups.value[groupIndex].id)
        })
    }

    const assignStudentToGroup = (studentId: string, groupId: string) => {
        return addStudentToGroup(studentId, groupId)
    }

    const getStudentStats = (studentId: string): StudentStats | null => {
        const student = students.value.find((s) => s.id === studentId)
        if (!student) return null

        const categoryStats = settings.value.scoreCategories.map((category) => {
            const categoryScores = student.scores.filter((s) => s.categoryId === category.id)
            const total = categoryScores.reduce((sum, score) => sum + score.value, 0)
            const average = categoryScores.length > 0 ? total / categoryScores.length : 0

            return {
                categoryId: category.id,
                categoryName: category.name,
                total,
                average,
                count: categoryScores.length,
            }
        })

        return {
            student,
            totalScore: student.totalScore,
            averageScore: student.averageScore,
            totalScoreCount: student.scores.length,
            categoryStats,
            trend: calculateTrend(student.scores),
            ranking: calculateRanking(studentId),
        }
    }

    const getClassStats = (): ClassStats => {
        const allScores = students.value.flatMap((s) => s.scores.map((score) => score.value))
        const averageScore =
            allScores.length > 0
                ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length
                : 0

        const topStudents = [...students.value]
            .sort((a, b) => b.averageScore - a.averageScore)
            .slice(0, 5)

        const categoryStats = settings.value.scoreCategories.map((category) => {
            const categoryScores = students.value.flatMap((s) =>
                s.scores
                    .filter((score) => score.categoryId === category.id)
                    .map((score) => score.value),
            )
            const total = categoryScores.reduce((sum, score) => sum + score, 0)
            const average = categoryScores.length > 0 ? total / categoryScores.length : 0

            return {
                categoryId: category.id,
                categoryName: category.name,
                total,
                average,
                count: categoryScores.length,
            }
        })

        return {
            totalStudents: students.value.length,
            totalGroups: groups.value.length,
            averageScore,
            totalScores: allScores.length,
            topStudents,
            categoryStats,
            isGroupingActive: isGroupingActive.value,
            groupingDuration:
                groupingStartTime.value && groupingEndTime.value
                    ? groupingEndTime.value.getTime() - groupingStartTime.value.getTime()
                    : null,
        }
    }

    const calculateTrend = (scores: StudentScore[]) => {
        if (scores.length < 2) return 'stable'

        const recentScores = scores.slice(-5).map((s) => s.value)
        const firstHalf = recentScores.slice(0, Math.ceil(recentScores.length / 2))
        const secondHalf = recentScores.slice(Math.ceil(recentScores.length / 2))

        const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length

        if (secondAvg > firstAvg + 0.5) return 'improving'
        if (secondAvg < firstAvg - 0.5) return 'declining'
        return 'stable'
    }

    const calculateRanking = (studentId: string) => {
        const sortedStudents = [...students.value].sort((a, b) => b.averageScore - a.averageScore)
        return sortedStudents.findIndex((s) => s.id === studentId) + 1
    }

    const saveToStorage = () => {
        try {
            const data = {
                currentSession: currentSession.value,
                students: students.value,
                groups: groups.value,
                isGroupingActive: isGroupingActive.value,
                groupingStartTime: groupingStartTime.value,
                groupingEndTime: groupingEndTime.value,
                settings: settings.value,
                lastSaved: new Date().toISOString(),
            }
            localStorage.setItem('class-management-data', JSON.stringify(data))
        } catch (error) {
            console.error('儲存資料失敗:', error)
        }
    }

    const loadFromStorage = () => {
        try {
            const saved = localStorage.getItem('class-management-data')
            if (saved) {
                const data = JSON.parse(saved)
                currentSession.value = data.currentSession
                students.value = data.students || []
                groups.value = data.groups || []
                isGroupingActive.value = data.isGroupingActive || false
                groupingStartTime.value = data.groupingStartTime
                    ? new Date(data.groupingStartTime)
                    : null
                groupingEndTime.value = data.groupingEndTime ? new Date(data.groupingEndTime) : null

                if (data.settings) {
                    settings.value = { ...settings.value, ...data.settings }
                }
            }
        } catch (error) {
            console.error('載入資料失敗:', error)
        }
    }

    const clearAllData = () => {
        currentSession.value = null
        students.value = []
        groups.value = []
        isGroupingActive.value = false
        groupingStartTime.value = null
        groupingEndTime.value = null
        localStorage.removeItem('class-management-data')
    }

    const exportData = () => {
        const data = {
            currentSession: currentSession.value,
            students: students.value,
            groups: groups.value,
            settings: settings.value,
            exportedAt: new Date().toISOString(),
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `class-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const importData = async (file: File): Promise<boolean> => {
        try {
            const text = await file.text()
            const data = JSON.parse(text)

            if (data.students && Array.isArray(data.students)) {
                students.value = data.students
            }
            if (data.groups && Array.isArray(data.groups)) {
                groups.value = data.groups
            }
            if (data.settings) {
                settings.value = { ...settings.value, ...data.settings }
            }

            saveToStorage()
            return true
        } catch (error) {
            console.error('匯入資料失敗:', error)
            return false
        }
    }

    // 初始化
    onMounted(() => {
        loadFromStorage()
    })

    return {
        // State
        currentSession: readonly(currentSession),
        students: readonly(students),
        groups: readonly(groups),
        isGroupingActive: readonly(isGroupingActive),
        groupingStartTime: readonly(groupingStartTime),
        groupingEndTime: readonly(groupingEndTime),
        settings,

        // Computed
        studentsInGroups,
        ungroupedStudents,
        totalStudents,
        totalGroups,
        presentStudents,

        // Actions
        initializeClass,
        addStudent,
        removeStudent,
        addScore,
        createGroup,
        removeGroup,
        addStudentToGroup,
        removeStudentFromGroup,
        startGrouping,
        endGrouping,
        assignStudentToGroup,
        randomAssignGroups,
        getStudentStats,
        getClassStats,
        saveToStorage,
        loadFromStorage,
        clearAllData,
        exportData,
        importData,
    }
})
