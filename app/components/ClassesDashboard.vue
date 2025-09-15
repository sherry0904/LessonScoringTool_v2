<template>
    <div class="p-6 max-w-7xl mx-auto">
        <!-- 頂部標題區 -->
        <div class="mb-8">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1
                        class="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                    >
                        班級管理
                    </h1>
                    <p class="text-base-content/70 text-lg mt-2">
                        管理您的所有班級，開始精彩的教學旅程
                    </p>
                </div>

                <div class="flex items-center gap-3">
                    <!-- 搜尋框 -->
                    <div class="relative">
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="搜尋班級..."
                            class="input input-bordered pl-10 w-64"
                        />
                        <LucideIcon
                            name="Search"
                            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50"
                        />
                    </div>

                    <!-- 操作按鈕 -->
                    <div class="flex gap-2">
                        <button @click="importData" class="btn btn-outline gap-2">
                            <LucideIcon name="Upload" class="w-4 h-4" />
                            匯入資料
                        </button>
                        <button @click="exportData" class="btn btn-outline gap-2">
                            <LucideIcon name="Download" class="w-4 h-4" />
                            匯出資料
                        </button>
                        <button @click="createNewClass" class="btn btn-primary gap-2">
                            <LucideIcon name="Plus" class="w-4 h-4" />
                            新增班級
                        </button>
                    </div>
                </div>
            </div>

            <!-- 統計卡片 -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div class="stats shadow">
                    <div class="stat">
                        <div class="stat-figure text-primary">
                            <LucideIcon name="GraduationCap" class="w-8 h-8" />
                        </div>
                        <div class="stat-title">總班級數</div>
                        <div class="stat-value text-primary">
                            {{ classesStore?.totalClasses || 0 }}
                        </div>
                    </div>
                </div>

                <div class="stats shadow">
                    <div class="stat">
                        <div class="stat-figure text-secondary">
                            <LucideIcon name="Users" class="w-8 h-8" />
                        </div>
                        <div class="stat-title">總學生數</div>
                        <div class="stat-value text-secondary">{{ totalStudents }}</div>
                    </div>
                </div>

                <div class="stats shadow">
                    <div class="stat">
                        <div class="stat-figure text-accent">
                            <LucideIcon name="BookOpen" class="w-8 h-8" />
                        </div>
                        <div class="stat-title">活躍班級</div>
                        <div class="stat-value text-accent">{{ activeClasses }}</div>
                    </div>
                </div>

                <div class="stats shadow">
                    <div class="stat">
                        <div class="stat-figure text-success">
                            <LucideIcon name="TrendingUp" class="w-8 h-8" />
                        </div>
                        <div class="stat-title">本週活動</div>
                        <div class="stat-value text-success">{{ weeklyActivity }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 班級網格 -->
        <div v-if="filteredClasses && filteredClasses.length > 0" class="space-y-6">
            <h2 class="text-2xl font-semibold text-base-content">您的班級</h2>

            <div class="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div
                    v-for="classInfo in filteredClasses"
                    :key="classInfo.id"
                    class="group relative bg-gradient-to-br from-base-100 to-base-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-300"
                >
                    <!-- 班級內容 -->
                    <div @click="openClass(classInfo.id)" class="cursor-pointer">
                        <!-- 班級圖示 -->
                        <div
                            class="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                        >
                            <LucideIcon name="GraduationCap" class="w-8 h-8 text-white" />
                        </div>

                        <!-- 班級資訊 -->
                        <h3
                            class="text-xl font-bold text-base-content mb-2 group-hover:text-primary transition-colors"
                        >
                            {{ classInfo.name }}
                        </h3>

                        <div class="space-y-2 text-sm text-base-content/70">
                            <div class="flex items-center gap-2">
                                <LucideIcon name="Users" class="w-4 h-4" />
                                <span>{{ (classInfo.students || []).length }} 位學生</span>
                            </div>

                            <div class="flex items-center gap-2">
                                <LucideIcon name="Calendar" class="w-4 h-4" />
                                <span>{{ formatDate(classInfo.createdAt) }}</span>
                            </div>

                            <div class="flex items-center gap-2">
                                <LucideIcon name="Clock" class="w-4 h-4" />
                                <span>{{ formatDate(classInfo.updatedAt) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 快速操作按鈕 -->
                    <div
                        class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
                    >
                        <button
                            @click.stop="editClass(classInfo.id)"
                            class="btn btn-sm btn-ghost btn-circle bg-base-100/80 hover:bg-info hover:text-info-content"
                            title="編輯班級"
                        >
                            <LucideIcon name="Edit" class="w-4 h-4" />
                        </button>

                        <button
                            @click.stop="confirmDeleteClass(classInfo.id, classInfo.name)"
                            class="btn btn-sm btn-ghost btn-circle bg-base-100/80 hover:bg-error hover:text-error-content"
                            title="刪除班級"
                        >
                            <LucideIcon name="Trash2" class="w-4 h-4" />
                        </button>
                    </div>

                    <!-- 底部快速進入按鈕 -->
                    <div class="mt-6 pt-4 border-t border-base-300">
                        <button
                            @click="openClass(classInfo.id)"
                            class="w-full btn btn-primary btn-sm group-hover:btn-accent transition-all"
                        >
                            <LucideIcon name="LogIn" class="w-4 h-4 mr-2" />
                            進入班級
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 空狀態 -->
        <div v-else class="text-center py-20">
            <div
                class="bg-gradient-to-br from-base-200 to-base-300 rounded-3xl p-12 max-w-md mx-auto"
            >
                <div
                    class="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <LucideIcon name="GraduationCap" class="w-12 h-12 text-primary" />
                </div>
                <h3 class="text-2xl font-bold text-base-content mb-3">開始您的教學旅程</h3>
                <p class="text-base-content/70 mb-8 text-lg">
                    創建您的第一個班級，開啟現代化的班級管理體驗
                </p>
                <button
                    @click="createNewClass"
                    class="btn btn-primary btn-lg gap-3 hover:scale-105 transition-transform"
                >
                    <LucideIcon name="Plus" class="w-5 h-5" />
                    建立第一個班級
                </button>
            </div>
        </div>

        <!-- 新增班級按鈕（浮動） -->
        <div v-if="(classesStore?.totalClasses || 0) > 0" class="fixed bottom-6 right-6">
            <button
                @click="createNewClass"
                class="btn btn-primary btn-lg btn-circle shadow-lg"
                title="新增班級"
            >
                <LucideIcon name="Plus" class="w-6 h-6" />
            </button>
        </div>

        <!-- 班級編輯模態 -->
        <dialog ref="classModal" class="modal">
            <div class="modal-box w-11/12 max-w-2xl">
                <h3 class="text-lg font-bold mb-6">
                    {{ editingClassId ? '編輯班級' : '新增班級' }}
                </h3>

                <form @submit.prevent="saveClass" class="space-y-6">
                    <div class="form-control">
                        <label class="label mb-2">
                            <span class="label-text font-medium">班級名稱</span>
                        </label>
                        <input
                            v-model="classForm.name"
                            type="text"
                            placeholder="例如：一年一班"
                            class="input input-bordered w-full"
                            required
                        />
                    </div>

                    <div class="form-control">
                        <label class="label">
                            <span class="label-text font-medium">學生名單</span>
                            <span class="label-text-alt">可輸入人數或名單</span>
                        </label>
                        <textarea
                            v-model="classForm.students"
                            class="textarea textarea-bordered h-32 w-full mt-2"
                            placeholder="輸入班級總人數 (例如 28)&#10;或&#10;1 王小明&#10;2 陳大華&#10;..."
                            required
                        ></textarea>
                        <div class="label mt-2">
                            <span class="label-text-alt text-gray-500">
                                可以輸入純數字表示學生人數，或每行一個學生（格式：座號 姓名）
                            </span>
                        </div>
                    </div>

                    <div class="modal-action mt-8 pt-4 border-t border-base-200">
                        <div class="flex justify-between w-full">
                            <div>
                                <button
                                    v-if="editingClassId"
                                    type="button"
                                    @click="confirmDeleteFromModal"
                                    class="btn btn-error"
                                >
                                    刪除班級
                                </button>
                            </div>
                            <div class="flex gap-3">
                                <button type="button" @click="closeModal" class="btn btn-ghost">
                                    取消
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    {{ editingClassId ? '更新' : '建立' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="closeModal">close</button>
            </form>
        </dialog>

        <!-- 確認刪除模態 -->
        <dialog ref="deleteModal" class="modal">
            <div class="modal-box">
                <h3 class="text-lg font-bold">確認刪除</h3>
                <p class="py-4">您確定要刪除班級「{{ deletingClassName }}」嗎？此操作無法復原。</p>
                <div class="modal-action">
                    <button @click="closeDeleteModal" class="btn btn-ghost">取消</button>
                    <button @click="confirmDelete" class="btn btn-error">刪除</button>
                </div>
            </div>
        </dialog>

        <!-- 檔案輸入 -->
        <input
            ref="fileInput"
            type="file"
            accept=".json"
            style="display: none"
            @change="handleFileImport"
        />
    </div>
</template>

<script setup lang="ts">
const classesStore = useClassesStore()

// Modal refs
const classModal = ref<HTMLDialogElement>()
const deleteModal = ref<HTMLDialogElement>()
const fileInput = ref<HTMLInputElement>()

// Form state
const editingClassId = ref<string | null>(null)
const deletingClassId = ref<string | null>(null)
const deletingClassName = ref('')
const searchQuery = ref('')

const classForm = reactive({
    name: '',
    students: '',
})

// 計算屬性
const filteredClasses = computed(() => {
    if (!classesStore?.classes) return []

    if (!searchQuery.value) {
        return classesStore.classes
    }

    return classesStore.classes.filter((classInfo) =>
        classInfo.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
})

const totalStudents = computed(() => {
    if (!classesStore?.classes) return 0
    return classesStore.classes.reduce((total, classInfo) => {
        return total + (classInfo.students?.length || 0)
    }, 0)
})

const activeClasses = computed(() => {
    if (!classesStore?.classes) return 0
    return classesStore.classes.filter(
        (classInfo) => classInfo.students && classInfo.students.length > 0,
    ).length
})

const weeklyActivity = computed(() => {
    if (!classesStore?.classes) return 0
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    return classesStore.classes.filter((classInfo) => new Date(classInfo.updatedAt) > oneWeekAgo)
        .length
})

// Methods
const createNewClass = () => {
    editingClassId.value = null
    classForm.name = ''
    classForm.students = ''
    classModal.value?.showModal()
}

const editClass = (classId: string) => {
    const classInfo = classesStore.classes.find((c) => c.id === classId)
    if (!classInfo) return

    editingClassId.value = classId
    classForm.name = classInfo.name
    classForm.students = classInfo.students.map((s) => `${s.id} ${s.name}`).join('\n')

    classModal.value?.showModal()
}

const confirmDeleteClass = (classId: string, className: string) => {
    deletingClassId.value = classId
    deletingClassName.value = className
    deleteModal.value?.showModal()
}

const saveClass = () => {
    if (!classForm.name.trim() || !classForm.students.trim()) {
        alert('班級名稱和學生名單不能為空！')
        return
    }

    if (editingClassId.value) {
        // 更新現有班級
        const existingClass = classesStore.classes.find((c) => c.id === editingClassId.value)
        if (existingClass) {
            // 解析新的學生名單
            const newStudents = parseStudentsInput(classForm.students)

            // 合併新舊學生資料，保留現有學生的分數
            const mergedStudents = newStudents.map((newStudent) => {
                const existingStudent = existingClass.students.find((s) => s.id === newStudent.id)
                return existingStudent ? { ...existingStudent, name: newStudent.name } : newStudent
            })

            classesStore.updateClass(editingClassId.value, {
                name: classForm.name,
                students: mergedStudents,
            })
        }
    } else {
        // 創建新班級
        classesStore.createClass(classForm.name, classForm.students)
    }

    closeModal()
}

const deleteClass = (classId: string) => {
    const classInfo = classesStore.classes.find((c) => c.id === classId)
    if (!classInfo) return

    deletingClassId.value = classId
    deletingClassName.value = classInfo.name
    deleteModal.value?.showModal()
}

const confirmDeleteFromModal = () => {
    if (editingClassId.value) {
        const classInfo = classesStore.classes.find((c) => c.id === editingClassId.value)
        if (classInfo) {
            deletingClassId.value = editingClassId.value
            deletingClassName.value = classInfo.name
            closeModal()
            deleteModal.value?.showModal()
        }
    }
}

const confirmDelete = () => {
    if (deletingClassId.value) {
        classesStore.deleteClass(deletingClassId.value)
    }
    closeDeleteModal()
}

const closeModal = () => {
    classModal.value?.close()
    editingClassId.value = null
}

const closeDeleteModal = () => {
    deleteModal.value?.close()
    deletingClassId.value = null
    deletingClassName.value = ''
}

const openClass = (classId: string) => {
    classesStore.selectClass(classId)
    navigateTo(`/class/${classId}`)
}

const exportData = () => {
    classesStore.exportAllClasses()
}

const importData = () => {
    fileInput.value?.click()
}

const handleFileImport = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (file) {
        const success = await classesStore.importAllClasses(file)
        if (success) {
            alert('資料匯入成功！')
        } else {
            alert('資料匯入失敗，請檢查檔案格式。')
        }
        target.value = '' // 清空輸入
    }
}

const parseStudentsInput = (input: string) => {
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
        .filter(Boolean)
}

const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-TW', {
        month: 'short',
        day: 'numeric',
    })
}

// 頁面標題
useHead({
    title: '班級總覽 - 班級經營動力站',
})
</script>
