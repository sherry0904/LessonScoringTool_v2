<template>
    <div class="p-6 max-w-5xl mx-auto space-y-10">
        <div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                系統設定
            </h1>
            <p class="text-base-content/70 mt-2">調整偏好、外觀與資料</p>
        </div>

        <!-- 外觀 / 偏好 -->
        <div class="grid gap-6 md:grid-cols-2">
            <div class="card bg-base-100 border border-base-300 shadow-sm">
                <div class="card-body space-y-4">
                    <h2 class="card-title text-base flex items-center gap-2"><LucideIcon name="Palette" class="w-5 h-5" /> 外觀</h2>
                    <div class="form-control">
                        <label class="label"><span class="label-text">主題模式</span></label>
                        <div class="flex gap-2">
                            <button class="btn btn-sm" :class="ui.isDarkMode ? 'btn-outline' : 'btn-primary'" @click="setTheme('light')">亮色</button>
                            <button class="btn btn-sm" :class="ui.isDarkMode ? 'btn-primary' : 'btn-outline'" @click="setTheme('dark')">暗色</button>
                        </div>
                    </div>
                    <div class="form-control">
                        <label class="cursor-pointer label justify-start gap-3">
                            <input type="checkbox" class="toggle" v-model="prefs.enableAnimations" />
                            <span class="label-text">啟用動畫</span>
                        </label>
                    </div>
                    <div class="form-control">
                        <label class="cursor-pointer label justify-start gap-3">
                            <input type="checkbox" class="toggle" v-model="prefs.enableSounds" />
                            <span class="label-text">操作音效</span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="card bg-base-100 border border-base-300 shadow-sm">
                <div class="card-body space-y-4">
                    <h2 class="card-title text-base flex items-center gap-2"><LucideIcon name="Database" class="w-5 h-5" /> 資料管理</h2>
                    <div class="space-y-3">
                        <button class="btn btn-outline w-full gap-2" @click="exportAll">
                            <LucideIcon name="Download" class="w-4 h-4" /> 匯出全部資料
                        </button>
                        <button class="btn btn-outline w-full gap-2" @click="triggerImport">
                            <LucideIcon name="Upload" class="w-4 h-4" /> 匯入資料
                        </button>
                        <button class="btn btn-error btn-outline w-full gap-2" @click="clearData">
                            <LucideIcon name="Trash2" class="w-4 h-4" /> 清除所有班級 (慎用)
                        </button>
                    </div>
                    <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleImport" />
                </div>
            </div>
        </div>

        <!-- 偏好 JSON 預覽 -->
        <div class="card bg-base-100 border border-base-300 shadow-sm">
            <div class="card-body space-y-4">
                <h2 class="card-title text-base flex items-center gap-2"><LucideIcon name="Settings" class="w-5 h-5" /> 偏好資料</h2>
                <pre class="bg-base-200 p-4 rounded-lg text-xs overflow-auto max-h-64">{{ prefs }}</pre>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const ui = useUIStore()
const classesStore = useClassesStore()

const prefs = reactive({ ...ui.userPreferences })

watch(prefs, (v) => {
    ui.updatePreferences(v)
}, { deep: true })

const setTheme = (theme: 'light' | 'dark') => ui.setTheme(theme)

const exportAll = () => classesStore.exportAllClasses()

const fileInput = ref<HTMLInputElement>()
const triggerImport = () => fileInput.value?.click()
const handleImport = async (e: Event) => {
    const f = (e.target as HTMLInputElement).files?.[0]
    if (f) {
        const ok = await classesStore.importAllClasses(f)
        alert(ok ? '匯入完成' : '匯入失敗')
    }
}

const clearData = () => {
    if (confirm('確定要刪除所有班級資料？此操作無法復原')) {
        classesStore.classes.splice(0, classesStore.classes.length)
        classesStore.saveToStorage()
    }
}

useHead({ title: '系統設定 - 班級經營動力站' })
</script>
