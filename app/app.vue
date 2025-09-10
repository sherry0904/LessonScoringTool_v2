<template>
    <div id="app" class="min-h-screen bg-base-100">
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
                    'bg-base-200 border-r border-base-300 transition-all duration-300 z-30',
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
                    </ul>
                </nav>

                <!-- 底部工具 -->
                <div class="absolute bottom-4 left-2 right-2">
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
                                    {{ ui.currentTabInfo.label }}
                                </h2>
                                <p class="text-sm text-base-content/60">管理多個班級的評分與分組</p>
                            </div>
                        </div>

                        <div class="flex items-center space-x-3">
                            <!-- 搜尋 -->
                            <div class="relative">
                                <input
                                    v-model="ui.searchQuery"
                                    type="search"
                                    placeholder="搜尋班級或學生..."
                                    class="input input-bordered input-sm w-64 pl-10"
                                />
                                <LucideIcon
                                    name="Search"
                                    class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50"
                                />
                            </div>

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
    </div>
</template>

<script setup lang="ts">
import { useUIStore } from '~/stores/ui'

const ui = useUIStore()
const route = useRoute()
const router = useRouter()

// 對應 tab id 與路徑
const tabRoute = (id: string) => {
    const map: Record<string, string> = {
        dashboard: '/',
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

// 初始以路由決定 currentTab
const syncFromRoute = () => {
    const path = route.path
    if (path.startsWith('/students')) ui.setCurrentTab('students')
    else if (path.startsWith('/groups')) ui.setCurrentTab('groups')
    else if (path.startsWith('/settings')) ui.setCurrentTab('settings')
    else ui.setCurrentTab('dashboard')
}

// 初始化
onMounted(() => {
    ui.initialize()
    syncFromRoute()
})

onUnmounted(() => {
    ui.cleanup()
})

watch(
    () => route.path,
    () => {
        syncFromRoute()
    },
)

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
