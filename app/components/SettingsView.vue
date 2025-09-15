<template>
    <div class="space-y-6">
        <!-- 基本設定 -->
        <div class="glass-card p-6 rounded-xl">
            <h2 class="text-xl font-bold text-base-content mb-6">基本設定</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">最高分數</span>
                    </label>
                    <input
                        v-model.number="settings.maxScore"
                        type="number"
                        min="1"
                        max="100"
                        class="input input-bordered"
                    />
                </div>

                <div class="form-control">
                    <label class="label">
                        <span class="label-text">最低分數</span>
                    </label>
                    <input
                        v-model.number="settings.minScore"
                        type="number"
                        min="0"
                        :max="settings.maxScore - 1"
                        class="input input-bordered"
                    />
                </div>
            </div>

            <div class="form-control mt-4">
                <label class="cursor-pointer label justify-start space-x-3">
                    <input
                        v-model="settings.enableGrouping"
                        type="checkbox"
                        class="checkbox checkbox-primary"
                    />
                    <span class="label-text">啟用分組功能</span>
                </label>
            </div>

            <div class="form-control">
                <label class="cursor-pointer label justify-start space-x-3">
                    <input
                        v-model="settings.enableSound"
                        type="checkbox"
                        class="checkbox checkbox-primary"
                    />
                    <span class="label-text">啟用音效提示</span>
                </label>
            </div>
        </div>

        <!-- 評分類別管理 -->
        <div class="glass-card p-6 rounded-xl">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-base-content">評分類別管理</h2>
                <button @click="openAddCategoryModal" class="btn btn-primary btn-sm">
                    <LucideIcon name="Plus" class="w-4 h-4 mr-2" />
                    新增類別
                </button>
            </div>

            <div class="space-y-3">
                <div
                    v-for="category in settings.scoreCategories"
                    :key="category.id"
                    class="flex items-center justify-between p-4 bg-base-200 rounded-lg"
                >
                    <div class="flex items-center space-x-4">
                        <div
                            class="w-4 h-4 rounded-full"
                            :style="{ backgroundColor: category.color }"
                        ></div>
                        <div>
                            <div class="font-medium">{{ category.name }}</div>
                            <div class="text-sm text-base-content/60">
                                權重: {{ category.weight }}
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center space-x-2">
                        <button @click="editCategory(category)" class="btn btn-ghost btn-sm">
                            <LucideIcon name="Edit" class="w-4 h-4" />
                        </button>
                        <button
                            @click="deleteCategory(category.id)"
                            class="btn btn-ghost btn-sm text-error"
                            :disabled="settings.scoreCategories.length <= 1"
                        >
                            <LucideIcon name="Trash2" class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 外觀設定 -->
        <div class="glass-card p-6 rounded-xl">
            <h2 class="text-xl font-bold text-base-content mb-6">外觀設定</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">主題</span>
                    </label>
                    <select
                        :value="ui.userPreferences.theme"
                        @change="
                            ui.updatePreferences({
                                theme: ($event.target as HTMLSelectElement).value as
                                    | 'light'
                                    | 'dark'
                                    | 'auto',
                            })
                        "
                        class="select select-bordered"
                    >
                        <option value="light">淺色主題</option>
                        <option value="dark">深色主題</option>
                        <option value="auto">跟隨系統</option>
                    </select>
                </div>

                <div class="form-control">
                    <label class="label">
                        <span class="label-text">預設檢視模式</span>
                    </label>
                    <select
                        :value="ui.userPreferences.defaultView"
                        @change="
                            ui.updatePreferences({
                                defaultView: ($event.target as HTMLSelectElement).value as
                                    | 'grid'
                                    | 'list',
                            })
                        "
                        class="select select-bordered"
                    >
                        <option value="grid">網格檢視</option>
                        <option value="list">列表檢視</option>
                    </select>
                </div>
            </div>

            <div class="space-y-4 mt-4">
                <div class="form-control">
                    <label class="cursor-pointer label justify-start space-x-3">
                        <input
                            :checked="ui.userPreferences.enableAnimations"
                            @change="
                                ui.updatePreferences({
                                    enableAnimations: ($event.target as HTMLInputElement).checked,
                                })
                            "
                            type="checkbox"
                            class="checkbox checkbox-primary"
                        />
                        <span class="label-text">啟用動畫效果</span>
                    </label>
                </div>

                <div class="form-control">
                    <label class="cursor-pointer label justify-start space-x-3">
                        <input
                            :checked="ui.userPreferences.compactMode"
                            @change="
                                ui.updatePreferences({
                                    compactMode: ($event.target as HTMLInputElement).checked,
                                })
                            "
                            type="checkbox"
                            class="checkbox checkbox-primary"
                        />
                        <span class="label-text">緊湊模式</span>
                    </label>
                </div>

                <div class="form-control">
                    <label class="cursor-pointer label justify-start space-x-3">
                        <input
                            :checked="ui.userPreferences.autoSave"
                            @change="
                                ui.updatePreferences({
                                    autoSave: ($event.target as HTMLInputElement).checked,
                                })
                            "
                            type="checkbox"
                            class="checkbox checkbox-primary"
                        />
                        <span class="label-text">自動儲存</span>
                    </label>
                </div>
            </div>
        </div>

        <!-- 資料管理 -->
        <div class="glass-card p-6 rounded-xl">
            <h2 class="text-xl font-bold text-base-content mb-6">資料管理</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button @click="exportData" class="btn btn-outline btn-primary">
                    <LucideIcon name="Download" class="w-4 h-4 mr-2" />
                    匯出資料
                </button>

                <button @click="openImportModal" class="btn btn-outline btn-secondary">
                    <LucideIcon name="Upload" class="w-4 h-4 mr-2" />
                    匯入資料
                </button>

                <button @click="openBackupModal" class="btn btn-outline btn-info">
                    <LucideIcon name="Database" class="w-4 h-4 mr-2" />
                    備份資料
                </button>

                <button @click="clearAllData" class="btn btn-outline btn-error">
                    <LucideIcon name="Trash2" class="w-4 h-4 mr-2" />
                    清除所有資料
                </button>
            </div>
        </div>

        <!-- 關於資訊 -->
        <div class="glass-card p-6 rounded-xl">
            <h2 class="text-xl font-bold text-base-content mb-6">關於</h2>

            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <span class="text-base-content/70">版本</span>
                    <span class="font-medium">v2.0.0</span>
                </div>

                <div class="flex items-center justify-between">
                    <span class="text-base-content/70">最後更新</span>
                    <span class="font-medium">{{ lastSavedTime }}</span>
                </div>

                <div class="flex items-center justify-between">
                    <span class="text-base-content/70">資料筆數</span>
                    <span class="font-medium">{{ totalDataCount }} 筆</span>
                </div>
            </div>
        </div>
    </div>

    <!-- 新增/編輯評分類別 Modal -->
    <div v-if="showCategoryModal" class="modal modal-open">
        <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">
                {{ editingCategory ? '編輯評分類別' : '新增評分類別' }}
            </h3>

            <form @submit.prevent="saveCategory" class="space-y-4">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">類別名稱 *</span>
                    </label>
                    <input
                        v-model="categoryForm.name"
                        type="text"
                        placeholder="請輸入類別名稱"
                        class="input input-bordered"
                        required
                    />
                </div>

                <div class="form-control">
                    <label class="label">
                        <span class="label-text">顏色</span>
                    </label>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="color in categoryColors"
                            :key="color"
                            type="button"
                            @click="categoryForm.color = color"
                            :class="[
                                'w-8 h-8 rounded-full border-2',
                                categoryForm.color === color
                                    ? 'border-gray-800'
                                    : 'border-gray-300',
                            ]"
                            :style="{ backgroundColor: color }"
                        ></button>
                    </div>
                </div>

                <div class="form-control">
                    <label class="label">
                        <span class="label-text">權重</span>
                    </label>
                    <input
                        v-model.number="categoryForm.weight"
                        type="number"
                        min="0.1"
                        max="5"
                        step="0.1"
                        class="input input-bordered"
                    />
                </div>

                <div class="modal-action">
                    <button type="button" @click="closeCategoryModal" class="btn btn-ghost">
                        取消
                    </button>
                    <button type="submit" class="btn btn-primary" :disabled="!categoryForm.name">
                        {{ editingCategory ? '更新' : '新增' }}
                    </button>
                </div>
            </form>
        </div>
        <div class="modal-backdrop" @click="closeCategoryModal"></div>
    </div>

    <!-- 匯入資料 Modal -->
    <div v-if="showImportModal" class="modal modal-open">
        <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">匯入資料</h3>

            <div class="space-y-4">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">選擇檔案</span>
                    </label>
                    <input
                        ref="fileInput"
                        type="file"
                        accept=".json"
                        @change="handleFileSelect"
                        class="file-input file-input-bordered w-full"
                    />
                </div>

                <div class="form-control">
                    <label class="cursor-pointer label justify-start space-x-3">
                        <input
                            v-model="importOptions.overwriteExisting"
                            type="checkbox"
                            class="checkbox checkbox-primary"
                        />
                        <span class="label-text">覆蓋現有資料</span>
                    </label>
                </div>
            </div>

            <div class="modal-action">
                <button @click="closeImportModal" class="btn btn-ghost">取消</button>
                <button @click="performImport" class="btn btn-primary" :disabled="!selectedFile">
                    匯入
                </button>
            </div>
        </div>
        <div class="modal-backdrop" @click="closeImportModal"></div>
    </div>
</template>

<script setup lang="ts">
import type { ScoreCategory } from '~/types'

const classStore = useClassStore()
const ui = useUIStore()

// 設定狀態 (響應式副本)
const settings = reactive({ ...classStore.settings })

// Modal 狀態
const showCategoryModal = ref(false)
const showImportModal = ref(false)
const editingCategory = ref<ScoreCategory | null>(null)
const selectedFile = ref<File | null>(null)

// 表單
const categoryForm = ref({
    name: '',
    color: '#3b82f6',
    weight: 1,
})

const importOptions = ref({
    overwriteExisting: false,
    mergeGroups: true,
    preserveTimestamps: true,
})

const categoryColors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
]

// 計算屬性
const lastSavedTime = computed(() => {
    // 從 localStorage 獲取最後儲存時間
    try {
        const saved = localStorage.getItem('class-management-data')
        if (saved) {
            const data = JSON.parse(saved)
            if (data.lastSaved) {
                return new Date(data.lastSaved).toLocaleString('zh-TW')
            }
        }
    } catch (error) {
        // ignore
    }
    return '無'
})

const totalDataCount = computed(() => {
    return (
        classStore.students.reduce((total, student) => total + student.scores.length, 0) +
        classStore.students.length +
        classStore.groups.length
    )
})

// 監聽設定變更
watch(
    settings,
    (newSettings) => {
        Object.assign(classStore.settings, newSettings)
        classStore.saveToStorage()
    },
    { deep: true },
)

// 方法
const openAddCategoryModal = () => {
    editingCategory.value = null
    categoryForm.value = {
        name: '',
        color: categoryColors[Math.floor(Math.random() * categoryColors.length)],
        weight: 1,
    }
    showCategoryModal.value = true
}

const closeCategoryModal = () => {
    showCategoryModal.value = false
    editingCategory.value = null
}

const editCategory = (category: ScoreCategory) => {
    editingCategory.value = category
    categoryForm.value = {
        name: category.name,
        color: category.color,
        weight: category.weight,
    }
    showCategoryModal.value = true
}

const saveCategory = () => {
    if (editingCategory.value) {
        // 更新類別
        const index = settings.scoreCategories.findIndex((c) => c.id === editingCategory.value?.id)
        if (index > -1) {
            settings.scoreCategories[index] = {
                ...editingCategory.value,
                ...categoryForm.value,
            }
            ui.showSuccess('類別已更新', `${categoryForm.value.name} 已更新`)
        }
    } else {
        // 新增類別
        const newCategory: ScoreCategory = {
            id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...categoryForm.value,
            icon: 'star',
        }
        settings.scoreCategories.push(newCategory)
        ui.showSuccess('類別已新增', `${categoryForm.value.name} 已新增`)
    }

    closeCategoryModal()
}

const deleteCategory = (categoryId: string) => {
    const category = settings.scoreCategories.find((c) => c.id === categoryId)
    if (
        category &&
        confirm(`確定要刪除評分類別「${category.name}」嗎？相關的評分記錄將會受到影響。`)
    ) {
        const index = settings.scoreCategories.findIndex((c) => c.id === categoryId)
        if (index > -1) {
            settings.scoreCategories.splice(index, 1)
            ui.showSuccess('類別已刪除', `${category.name} 已刪除`)
        }
    }
}

const exportData = () => {
    classStore.exportData()
    ui.showSuccess('匯出成功', '資料已下載至您的裝置')
}

const openImportModal = () => {
    selectedFile.value = null
    importOptions.value = {
        overwriteExisting: false,
        mergeGroups: true,
        preserveTimestamps: true,
    }
    showImportModal.value = true
}

const closeImportModal = () => {
    showImportModal.value = false
    selectedFile.value = null
}

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
        selectedFile.value = target.files[0]
    }
}

const performImport = async () => {
    if (!selectedFile.value) return

    try {
        const success = await classStore.importData(selectedFile.value)
        if (success) {
            ui.showSuccess('匯入成功', '資料已成功匯入')
            closeImportModal()
        } else {
            ui.showError('匯入失敗', '檔案格式不正確或資料損壞')
        }
    } catch (error) {
        ui.showError('匯入失敗', '發生未知錯誤')
    }
}

const openBackupModal = () => {
    // 簡單的備份就是匯出
    exportData()
}

const clearAllData = () => {
    if (confirm('確定要清除所有資料嗎？此操作無法復原！')) {
        classStore.clearAllData()
        ui.showSuccess('資料已清除', '所有資料已被清除')
    }
}

// 初始化時同步設定
onMounted(() => {
    Object.assign(settings, classStore.settings)
})
</script>
