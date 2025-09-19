<!--
  @file Main application layout
  @author sherryhsieh
-->
<template>
    <div id="app" class="min-h-screen bg-base-100">
        <!-- 手機版提示 -->
        <MobileBlocker v-if="ui.isMobile" />

        <!-- 載入指示器 -->
        <div
            v-if="ui.isLoading"
            class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        >
            <div class="loading loading-spinner loading-lg text-primary"></div>
        </div>

        <!-- Toast 通知 -->
        <div class="toast toast-top toast-end z-40">
            <div
                v-for="toast in ui.visibleToasts"
                :key="toast.id"
                :class="[
                    'alert',
                    {
                        'alert-success': toast.type === 'success',
                        'alert-error': toast.type === 'error',
                        'alert-warning': toast.type === 'warning',
                        'alert-info': toast.type === 'info',
                    },
                ]"
                class="animate-fade-in-up"
            >
                <LucideIcon :name="getToastIcon(toast.type)" class="w-5 h-5" />
                <div>
                    <div class="font-semibold">{{ toast.title || toast.message }}</div>
                    <div v-if="toast.title && toast.message" class="text-sm opacity-80">
                        {{ toast.message }}
                    </div>
                </div>
                <button @click="ui.removeToast(toast.id)" class="btn btn-ghost btn-sm btn-circle">
                    <LucideIcon name="X" class="w-4 h-4" />
                </button>
            </div>
        </div>

        <!-- 主要應用程式佈局 -->
        <div class="flex h-screen">
            <!-- 側邊欄 -->
            <aside
                :class="[
                    'bg-base-200 border-r border-base-300 transition-all duration-300 z-30 overflow-hidden flex flex-col h-full',
                    ui.isSidebarOpen ? 'w-64' : 'w-16',
                    ui.isMobile && ui.isSidebarOpen && 'fixed inset-y-0 left-0',
                ]"
            >
                <!-- Logo/Header -->
                <div class="p-4 border-b border-base-300">
                    <div v-if="ui.isSidebarOpen" class="flex items-center space-x-3">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center"
                        >
                            <LucideIcon name="GraduationCap" class="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 class="font-bold text-lg text-gradient">課堂評分工具</h1>
                            <p class="text-sm text-base-content/60">v2.0</p>
                        </div>
                    </div>
                    <div v-else class="flex justify-center">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center"
                        >
                            <LucideIcon name="GraduationCap" class="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                <!-- 導航選單 -->
                <nav class="p-2">
                    <ul class="space-y-1">
                        <li v-for="tab in ui.tabs" :key="tab.id">
                            <NuxtLink
                                :to="tabRoute(tab.id)"
                                @click.prevent="goTab(tab.id)"
                                :class="[
                                    'w-full flex items-center p-3 rounded-lg transition-colors duration-200',
                                    ui.currentTab === tab.id
                                        ? 'bg-primary text-primary-content'
                                        : 'hover:bg-base-300 text-base-content',
                                ]"
                                :title="!ui.isSidebarOpen ? tab.label : ''"
                            >
                                <LucideIcon :name="tab.icon" class="w-5 h-5 shrink-0" />
                                <span
                                    v-if="ui.isSidebarOpen"
                                    class="ml-3 font-medium whitespace-nowrap"
                                >
                                    {{ tab.label }}
                                </span>
                            </NuxtLink>
                        </li>

                        <li><div class="divider my-2"></div></li>

                        <!-- 課堂工具 -->
                        <li>
                            <button
                                @click="ui.toggleTimer()"
                                class="w-full flex items-center p-3 rounded-lg transition-colors duration-200 hover:bg-base-300 text-base-content"
                                :title="!ui.isSidebarOpen ? '課堂計時器' : ''"
                            >
                                <LucideIcon name="Hourglass" class="w-5 h-5 shrink-0" />
                                <span
                                    v-if="ui.isSidebarOpen"
                                    class="ml-3 font-medium whitespace-nowrap"
                                    >課堂計時器</span
                                >
                            </button>
                        </li>
                        <li>
                            <button
                                @click="ui.openPicker()"
                                :disabled="!classesStore.currentClass"
                                class="w-full flex items-center p-3 rounded-lg transition-colors duration-200 text-base-content"
                                :class="{
                                    'hover:bg-base-300': !!classesStore.currentClass,
                                    'opacity-50 cursor-not-allowed': !classesStore.currentClass,
                                }"
                                :title="
                                    !ui.isSidebarOpen
                                        ? !classesStore.currentClass
                                            ? '請先進入班級'
                                            : '隨機抽籤'
                                        : ''
                                "
                            >
                                <LucideIcon name="Dices" class="w-5 h-5 shrink-0" />
                                <span
                                    v-if="ui.isSidebarOpen"
                                    class="ml-3 font-medium whitespace-nowrap"
                                    >隨機抽籤</span
                                >
                            </button>
                        </li>
                    </ul>
                </nav>

                <!-- 底部工具 -->
                <div class="mt-auto mb-4 px-2 w-full">
                    <div class="space-y-2 flex flex-col items-start">
                        <!-- 主題切換 -->
                        <button
                            @click="ui.toggleTheme()"
                            class="flex items-center p-3 rounded-lg hover:bg-base-300 text-base-content transition-colors"
                            :class="ui.isSidebarOpen ? 'w-full' : 'w-auto'"
                            :title="!ui.isSidebarOpen ? '切換主題' : ''"
                        >
                            <LucideIcon
                                :name="ui.isDarkMode ? 'Sun' : 'Moon'"
                                class="w-5 h-5 shrink-0"
                            />
                            <span
                                v-if="ui.isSidebarOpen"
                                class="ml-3 font-medium whitespace-nowrap"
                            >
                                切換主題
                            </span>
                        </button>

                        <!-- 側邊欄切換 -->
                        <button
                            @click="ui.toggleSidebar()"
                            class="flex items-center p-3 rounded-lg hover:bg-base-300 text-base-content transition-colors"
                            :class="ui.isSidebarOpen ? 'w-full' : 'w-auto'"
                            :title="!ui.isSidebarOpen ? '展開選單' : '收合選單'"
                        >
                            <LucideIcon
                                :name="ui.isSidebarOpen ? 'ChevronLeft' : 'ChevronRight'"
                                class="w-5 h-5 shrink-0"
                            />
                            <span
                                v-if="ui.isSidebarOpen"
                                class="ml-3 font-medium whitespace-nowrap"
                            >
                                收合選單
                            </span>
                        </button>
                    </div>
                </div>
            </aside>

            <!-- 主要內容區域 -->
            <main class="flex-1 overflow-hidden">
                <!-- 頂部工具列 -->
                <header class="bg-base-100 border-b border-base-300 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <button
                                v-if="ui.isMobile"
                                @click="ui.toggleSidebar()"
                                class="btn btn-ghost btn-sm"
                            >
                                <LucideIcon name="Menu" class="w-5 h-5" />
                            </button>

                            <div>
                                <h2 class="text-xl font-semibold text-base-content">
                                    {{
                                        ui.currentTabInfo.label ||
                                        classesStore.currentClass?.name ||
                                        '班級'
                                    }}
                                </h2>
                                <p class="text-sm text-base-content/60">管理多個班級的評分與分組</p>
                            </div>
                        </div>

                        <div class="flex items-center space-x-3">
                            <!-- 狀態指示器 -->
                            <div class="flex items-center space-x-2">
                                <div class="text-sm text-base-content/60">
                                    {{
                                        new Date().toLocaleDateString('zh-TW', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            weekday: 'long',
                                        })
                                    }}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- 頁面內容 -->
                <div class="h-[calc(100vh-5rem)] overflow-auto custom-scrollbar">
                    <NuxtPage />
                </div>
            </main>
        </div>

        <!-- Mobile 側邊欄遮罩 -->
        <div
            v-if="ui.isMobile && ui.isSidebarOpen"
            @click="ui.toggleSidebar()"
            class="fixed inset-0 bg-black/50 z-20"
        ></div>

        <!-- 全域工具組件 -->
        <TimerWidget v-if="ui.isTimerVisible" />
        <StudentPickerModal v-if="ui.isPickerVisible" />
    </div>
</template>

<script setup lang="ts">
import { useUIStore } from '~/stores/ui'
import { useClassesStore } from '~/stores/classes'
import TimerWidget from '~/components/TimerWidget.vue'
import StudentPickerModal from '~/components/StudentPickerModal.vue'
import MobileBlocker from '~/components/MobileBlocker.vue'
import { watchEffect } from 'vue' // Import watchEffect

const ui = useUIStore()
const classesStore = useClassesStore()
const route = useRoute()
const router = useRouter()

// 對應 tab id 與路徑
const tabRoute = (id: string) => {
    const map: Record<string, string> = {
        dashboard: '/',
        homework: '/homework',
        students: '/students',
        groups: '/groups',
        settings: '/settings',
    }
    return map[id] || '/'
}

// 點擊導覽
const goTab = (id: string) => {
    ui.setCurrentTab(id)
    const target = tabRoute(id)
    if (route.path !== target) router.push(target)
}

// 監聽路由和班級列表載入狀態，同步 UI
watchEffect(() => {
    // 增加保護，確保在 store 從 localStorage 載入完畢後才執行
    if (!classesStore.isLoaded) {
        return
    }

    const path = route.path
    const params = route.params

    // 如果班級列表為空，則無法根據路由選擇班級
    if (classesStore.classes.length === 0) {
        classesStore.selectClass(null) // 確保沒有班級被選中
        // 根據非班級頁面的路徑設定分頁
        if (path.startsWith('/homework')) {
            ui.setCurrentTab('homework')
        } else if (path.startsWith('/students')) {
            ui.setCurrentTab('students')
        } else if (path.startsWith('/groups')) {
            ui.setCurrentTab('groups')
        } else if (path.startsWith('/settings')) {
            ui.setCurrentTab('settings')
        } else {
            ui.setCurrentTab('dashboard')
        }
        return
    }

    // 如果班級已載入，則根據路由選擇班級
    if (path.startsWith('/class/') && params.id) {
        const classId = params.id as string
        classesStore.selectClass(classId)
        ui.setCurrentTab('') // 在班級頁面中，清除主導航選擇
        return
    }

    // 如果不是班級頁面，確保沒有班級被選中並設定主分頁
    classesStore.selectClass(null)
    if (path.startsWith('/homework')) {
        ui.setCurrentTab('homework')
    } else if (path.startsWith('/students')) {
        ui.setCurrentTab('students')
    } else if (path.startsWith('/groups')) {
        ui.setCurrentTab('groups')
    } else if (path.startsWith('/settings')) {
        ui.setCurrentTab('settings')
    } else {
        ui.setCurrentTab('dashboard')
    }
})

// 初始化
onMounted(() => {
    ui.setLoading(true)
    classesStore.loadFromStorage()
    ui.initialize()
    // A short delay to prevent flash of loading screen on fast loads
    setTimeout(() => ui.setLoading(false), 200)
})

onUnmounted(() => {
    ui.cleanup()
})

// Toast 圖示映射
const getToastIcon = (type: string) => {
    const icons = {
        success: 'CheckCircle2',
        error: 'XCircle',
        warning: 'AlertTriangle',
        info: 'Info',
    }
    return icons[type as keyof typeof icons] || 'Info'
}

// SEO
useHead({
    title: '課堂評分工具 v2.0',
    meta: [
        {
            name: 'description',
            content: '現代化的課堂管理與學生評分工具，支援多班級管理、分組模式、即時統計和數據匯出',
        },
    ],
})
</script>

<style scoped>
/* 自定義滾動條樣式 */
.custom-scrollbar {
    scrollbar-color: theme('colors.base-300') theme('colors.base-200');
    scrollbar-width: thin;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: theme('colors.base-200');
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: theme('colors.base-300');
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: theme('colors.base-content/30');
}

/* 漸層文字效果 */
.text-gradient {
    background: linear-gradient(135deg, theme('colors.primary'), theme('colors.secondary'));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* 動畫效果 */
.animate-fade-in-up {
    animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 側邊欄動畫 */
aside {
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 響應式調整 */
@media (max-width: 768px) {
    aside {
        transform: translateX(-100%);
    }

    aside.fixed {
        transform: translateX(0);
    }
}
</style>
