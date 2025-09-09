<template>
    <div class="p-6">
        <!-- 頂部操作區 -->
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-3xl font-bold text-base-content">班級經營動力站</h1>
                <p class="text-base-content/70 mt-2">管理您的所有班級</p>
            </div>
            <div class="flex gap-3">
                <button @click="importData" class="btn btn-ghost gap-2">
                    <LucideIcon name="Upload" class="w-4 h-4" />
                    載入
                </button>
                <button @click="exportData" class="btn btn-primary gap-2">
                    <LucideIcon name="Download" class="w-4 h-4" />
                    匯出
                </button>
            </div>
        </div>

        <!-- 班級網格 -->
        <div
            v-if="classesStore.totalClasses > 0"
            class="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
            <div
                v-for="classInfo in classesStore.classes"
                :key="classInfo.id"
                class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
                @click="openClass(classInfo.id)"
            >
                <div class="card-body">
                    <div class="flex justify-between items-start mb-4">
                        <h2 class="card-title text-lg">{{ classInfo.name }}</h2>
                        <div class="dropdown dropdown-end">
                            <div
                                tabindex="0"
                                role="button"
                                class="btn btn-ghost btn-sm btn-circle"
                                @click.stop
                            >
                                <LucideIcon name="MoreVertical" class="w-4 h-4" />
                            </div>
                            <ul
                                tabindex="0"
                                class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                            >
                                <li>
                                    <a @click.stop="editClass(classInfo.id)">
                                        <LucideIcon name="Edit" class="w-4 h-4" />
                                        編輯班級
                                    </a>
                                </li>
                                <li>
                                    <a @click.stop="deleteClass(classInfo.id)" class="text-error">
                                        <LucideIcon name="Trash2" class="w-4 h-4" />
                                        刪除班級
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- 班級統計 -->
                    <div class="stats stats-vertical shadow mb-4">
                        <div class="stat">
                            <div class="stat-title">學生人數</div>
                            <div class="stat-value text-primary">
                                {{ classInfo.students.length }}
                            </div>
                        </div>
                        <div class="stat">
                            <div class="stat-title">作業數量</div>
                            <div class="stat-value text-secondary">
                                {{ classInfo.homeworks.length }}
                            </div>
                        </div>
                    </div>

                    <!-- 狀態指示器 -->
                    <div class="flex flex-wrap gap-2 mb-4">
                        <div v-if="classInfo.groupingActive" class="badge badge-success gap-1">
                            <LucideIcon name="Users" class="w-3 h-3" />
                            分組進行中
                        </div>
                        <div class="badge badge-outline">
                            {{ formatDate(classInfo.updatedAt) }}
                        </div>
                    </div>

                    <!-- 進入按鈕 -->
                    <div class="card-actions justify-end">
                        <button class="btn btn-primary btn-sm gap-2">
                            <LucideIcon name="ArrowRight" class="w-4 h-4" />
                            進入班級
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 空狀態 -->
        <div v-else class="text-center py-16">
            <LucideIcon name="GraduationCap" class="w-24 h-24 mx-auto text-base-content/30 mb-6" />
            <h3 class="text-xl font-semibold text-base-content mb-2">還沒有班級</h3>
            <p class="text-base-content/70 mb-6">創建您的第一個班級來開始使用</p>
            <button @click="createNewClass" class="btn btn-primary gap-2">
                <LucideIcon name="Plus" class="w-4 h-4" />
                新增班級
            </button>
        </div>

        <!-- 新增班級按鈕（浮動） -->
        <div v-if="classesStore.totalClasses > 0" class="fixed bottom-6 right-6">
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
                        <button
                            v-if="editingClassId"
                            type="button"
                            @click="confirmDeleteClass"
                            class="btn btn-error"
                        >
                            刪除班級
                        </button>
                        <button type="button" @click="closeModal" class="btn btn-ghost">
                            取消
                        </button>
                        <button type="submit" class="btn btn-primary">
                            {{ editingClassId ? '更新' : '建立' }}
                        </button>
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
const ui = useUIStore()

// Modal refs
const classModal = ref<HTMLDialogElement>()
const deleteModal = ref<HTMLDialogElement>()
const fileInput = ref<HTMLInputElement>()

// Form state
const editingClassId = ref<string | null>(null)
const deletingClassId = ref<string | null>(null)
const deletingClassName = ref('')

const classForm = reactive({
    name: '',
    students: '',
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

const confirmDeleteClass = () => {
    if (editingClassId.value) {
        deleteClass(editingClassId.value)
        closeModal()
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
    navigateTo('/class')
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
