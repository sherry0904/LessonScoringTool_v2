// ...保留唯一一份正確的 defineStore 區塊...
import { defineStore } from 'pinia'
import type { ClassInfo, Student, Homework, Group, StudentScore } from '~/types/class'

export const useClassesStore = defineStore('classes', () => {
    // State
    const classes = ref<ClassInfo[]>([])
    const currentClassId = ref<string | null>(null)

    // 分組活動狀態（每個 classId 一份）
    const groupingBaseScores = ref<Record<string, Record<string, number>>>({})
    const groupingSessionScores = ref<Record<string, Record<string, number>>>({})

    // Computed
    const currentClass = computed(() => {
        return classes.value.find((c) => c.id === currentClassId.value) || null
    })

    const totalClasses = computed(() => classes.value.length)

    // Actions
    const setGroupingBaseScores = (classId: string, scores: Record<string, number>) => {
        groupingBaseScores.value[classId] = scores;
        saveToStorage();
    };

    const getGroupingBaseScores = (classId: string): Record<string, number> | undefined => {
        return groupingBaseScores.value[classId];
    };

    const setGroupingSessionScores = (classId: string, scores: Record<string, number>) => {
        groupingSessionScores.value[classId] = scores;
        saveToStorage();
    };

    const getGroupingSessionScores = (classId: string): Record<string, number> | undefined => {
        return groupingSessionScores.value[classId];
    };

    const clearGroupingScores = (classId: string) => {
        delete groupingBaseScores.value[classId];
        delete groupingSessionScores.value[classId];
        saveToStorage();
    };

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
            homeworks: [],
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

    const selectClass = (classId: string) => {
        if (classes.value.find((c) => c.id === classId)) {
            currentClassId.value = classId
            saveToStorage()
        }
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

    const addHomework = (classId: string, title: string) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData) return null

        const newHomework: Homework = {
            id: `homework_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: title.trim(),
            createdAt: new Date(),
            studentStatus: classData.students.reduce(
                (acc, student) => {
                    acc[student.id] = 'pending'
                    return acc
                },
                {} as Record<string, 'pending' | 'submitted' | 'needs_correction' | 'completed'>,
            ),
        }

        classData.homeworks.push(newHomework)
        classData.updatedAt = new Date()
        saveToStorage()
        return newHomework
    }

    const updateHomeworkStatus = (
        classId: string,
        homeworkId: string,
        studentId: string,
        status: 'pending' | 'submitted' | 'needs_correction' | 'completed',
    ) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (!classData) return false

        const homework = classData.homeworks.find((h) => h.id === homeworkId)
        if (!homework) return false

        homework.studentStatus[studentId] = status
        classData.updatedAt = new Date()
        saveToStorage()
        return true
    }

    const startClassGrouping = (classId: string) => {
        const classData = classes.value.find((c) => c.id === classId)
        if (classData) {
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

        // 1. 組別總分直接加分（獨立計算）
        group.totalScore += score

        // 2. 只為出席的組員加分
        group.members.forEach((member) => {
            const student = classData.students.find((s) => s.id === member.id)
            if (student && student.isPresent) {
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
            }
        } catch (error) {
            console.error('載入班級資料失敗:', error)
        }
    }

    const exportAllClasses = () => {
        const data = {
            classes: classes.value,
            exportedAt: new Date().toISOString(),
            version: '2.0',
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `all-classes-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const importAllClasses = async (file: File): Promise<boolean> => {
        try {
            const text = await file.text()
            const data = JSON.parse(text)

            if (data.classes && Array.isArray(data.classes)) {
                classes.value = data.classes
                saveToStorage()
                return true
            }
            return false
        } catch (error) {
            console.error('匯入班級資料失敗:', error)
            return false
        }
    }

    // 初始化
    onMounted(() => {
        loadFromStorage()
    })

    return {
        // State
        classes: readonly(classes),
        currentClassId: readonly(currentClassId),
        groupingBaseScores,
        groupingSessionScores,

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
        addHomework,
        updateHomeworkStatus,
        startClassGrouping,
        endClassGrouping,
        updateGroups,
        addScoreToGroup,
        setGroupingBaseScores,
        getGroupingBaseScores,
        setGroupingSessionScores,
        getGroupingSessionScores,
        clearGroupingScores,
        saveToStorage,
        loadFromStorage,
        exportAllClasses,
        importAllClasses,
    }
})