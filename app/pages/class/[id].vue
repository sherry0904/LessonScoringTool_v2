<template>
    <div v-if="currentClass" class="min-h-screen bg-base-200">
        <!-- 頂部導航 -->
        <div class="bg-base-100 shadow-sm sticky top-0 z-10">
            <div class="container mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <button @click="backToDashboard" class="btn btn-ghost btn-sm gap-2">
                            <LucideIcon name="ArrowLeft" class="w-4 h-4" />
                            返回總覽
                        </button>
                        <div>
                            <h1 class="text-2xl font-bold text-base-content">
                                {{ currentClass.name }}
                            </h1>
                            <p class="text-sm text-base-content/70">
                                {{ currentClass.students.length }} 位學生
                            </p>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        <button @click="addStudent" class="btn btn-primary btn-sm gap-2">
                            <LucideIcon name="UserPlus" class="w-4 h-4" />
                            新增學生
                        </button>
                    </div>
                </div>

                <!-- 功能分頁 -->
                <div class="tabs tabs-bordered mt-4">
                    <NuxtLink
                        v-for="tab in tabs"
                        :key="tab.id"
                        :to="tab.path"
                        class="tab tab-lg"
                        active-class="tab-active"
                    >
                        <LucideIcon :name="tab.icon" class="w-4 h-4 mr-2" />
                        {{ tab.label }}
                    </NuxtLink>
                </div>
            </div>
        </div>

        <!-- 內容區域 -->
        <div class="container mx-auto px-4 py-6">
            <NuxtPage />
        </div>

        <!-- 學生編輯模態 -->
        <dialog ref="studentModal" class="modal">
            <div class="modal-box">
                <h3 class="text-lg font-bold mb-4">
                    {{ editingStudentId ? '編輯學生' : '新增學生' }}
                </h3>

                <form @submit.prevent="saveStudent" class="space-y-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">座號</span>
                        </label>
                        <input
                            v-model="studentForm.id"
                            type="text"
                            placeholder="例如：01"
                            class="input input-bordered"
                            :disabled="!!editingStudentId"
                            required
                        />
                    </div>

                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">姓名</span>
                        </label>
                        <input
                            v-model="studentForm.name"
                            type="text"
                            placeholder="例如：王小明"
                            class="input input-bordered"
                            required
                        />
                    </div>

                    <div class="modal-action">
                        <button
                            v-if="editingStudentId"
                            type="button"
                            @click="deleteStudent"
                            class="btn btn-error"
                        >
                            刪除學生
                        </button>
                        <button type="button" @click="closeStudentModal" class="btn btn-ghost">
                            取消
                        </button>
                        <button type="submit" class="btn btn-primary">
                            {{ editingStudentId ? '更新' : '新增' }}
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="closeStudentModal">close</button>
            </form>
        </dialog>
    </div>

    <!-- 未選擇班級 -->
    <div v-else class="min-h-screen flex items-center justify-center">
        <div class="text-center">
            <LucideIcon name="AlertCircle" class="w-16 h-16 mx-auto text-warning mb-4" />
            <h2 class="text-xl font-semibold mb-2">找不到班級</h2>
            <p class="text-base-content/70 mb-4">請確認網址是否正確，或返回總覽頁面</p>
            <button @click="backToDashboard" class="btn btn-primary">返回班級總覽</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useClassesStore } from '~/stores/classes'

const classesStore = useClassesStore()
const route = useRoute()

// 從路由參數獲取班級 ID
const classId = computed(() => route.params.id as string)

// 根據 ID 從 store 尋找班級資料
const currentClass = computed(() => classesStore.classes.find((c) => c.id === classId.value))

// 當直接訪問此頁面時，確保 store 中的 currentClassId 也被設置
watchEffect(() => {
    if (classId.value && classesStore.currentClassId !== classId.value) {
        classesStore.selectClass(classId.value)
    }
})

// Modal refs
const studentModal = ref<HTMLDialogElement>()

// State
const editingStudentId = ref<string | null>(null)

const studentForm = reactive({
    id: '',
    name: '',
})

// 更新的頁籤陣列，包含路由路徑
const tabs = computed(() => [
    { id: 'scoring', label: '個人計分', icon: 'Star', path: `/class/${classId.value}` },
    // { id: 'homework', label: '作業訂正', icon: 'BookOpen', path: `/class/${classId.value}/homework` },
    { id: 'grouping', label: '分組模式', icon: 'Users', path: `/class/${classId.value}/grouping` },
    { id: 'grades', label: '成績結算', icon: 'BarChart3', path: `/class/${classId.value}/grades` },
])

// Methods
const backToDashboard = () => {
    navigateTo('/')
}

const addStudent = () => {
    editingStudentId.value = null
    studentForm.id = ''
    studentForm.name = ''
    studentModal.value?.showModal()
}

const editStudent = (studentId: string) => {
    const student = currentClass.value?.students.find((s) => s.id === studentId)
    if (!student) return

    editingStudentId.value = studentId
    studentForm.id = student.id
    studentForm.name = student.name
    studentModal.value?.showModal()
}

const saveStudent = () => {
    if (!studentForm.id.trim() || !studentForm.name.trim()) {
        alert('座號和姓名不能為空！')
        return
    }

    if (!currentClass.value) return

    if (editingStudentId.value) {
        // 更新學生
        classesStore.updateStudent(currentClass.value.id, editingStudentId.value, {
            name: studentForm.name,
        })
    } else {
        // 檢查座號是否重複
        const exists = currentClass.value.students.some((s) => s.id === studentForm.id)
        if (exists) {
            alert('座號已存在！')
            return
        }

        // 新增學生
        classesStore.addStudentToClass(currentClass.value.id, studentForm.name, studentForm.id)
    }

    closeStudentModal()
}

const deleteStudent = () => {
    if (!editingStudentId.value || !currentClass.value) return

    if (confirm('確定要刪除此學生嗎？')) {
        classesStore.removeStudentFromClass(currentClass.value.id, editingStudentId.value)
        closeStudentModal()
    }
}

const closeStudentModal = () => {
    studentModal.value?.close()
    editingStudentId.value = null
}

// 頁面標題
useHead({
    title: computed(() =>
        currentClass.value
            ? `${currentClass.value.name} - 班級經營動力站`
            : '班級管理 - 班級經營動力站',
    ),
})

// 提供給子組件的方法
provide('editStudent', editStudent)
</script>
