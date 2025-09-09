import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { ToastType, ToastMessage, ViewModeType, UserPreferences, Tab } from '~/types/class'

export const useUIStore = defineStore('ui', () => {
    // State
    const currentTab = ref<string>('dashboard')
    const viewMode = ref<ViewModeType>('table')
    const toasts = ref<ToastMessage[]>([])
    const modals = ref<Map<string, boolean>>(new Map())
    const isLoading = ref(false)
    const isSidebarOpen = ref(false)
    const searchQuery = ref('')
    const selectedStudents = ref<Set<string>>(new Set())
    const userPreferences = ref<UserPreferences>({
        theme: 'light',
        language: 'zh-TW',
        enableAnimations: true,
        enableSounds: false,
        autoSave: true,
        showTutorials: true,
    })
    const isMobile = ref(false)
    const isTablet = ref(false)
    const windowWidth = ref(0)

    // Computed
    const isDarkMode = computed(() => userPreferences.value.theme === 'dark')

    const currentTabInfo = computed(() => {
        const tabMap: Record<string, Tab> = {
            dashboard: { id: 'dashboard', label: '總覽', icon: 'BarChart3', color: 'primary' },
            students: { id: 'students', label: '學生管理', icon: 'Users', color: 'info' },
            groups: { id: 'groups', label: '分組', icon: 'UserCheck', color: 'success' },
            settings: { id: 'settings', label: '設定', icon: 'Settings', color: 'warning' },
        }
        return tabMap[currentTab.value] || tabMap.dashboard
    })

    const visibleToasts = computed(() => {
        return toasts.value.slice(0, 5) // 只顯示最新的 5 個
    })

    const openModals = computed(() => {
        return Array.from(modals.value.entries())
            .filter(([_, isOpen]) => isOpen)
            .map(([id, _]) => id)
    })

    const tabs = computed(() => {
        return [
            { id: 'dashboard', label: '總覽', icon: 'BarChart3', color: 'primary' },
            { id: 'students', label: '學生管理', icon: 'Users', color: 'info' },
            { id: 'groups', label: '分組', icon: 'UserCheck', color: 'success' },
            { id: 'settings', label: '設定', icon: 'Settings', color: 'warning' },
        ]
    })

    // Actions
    const setCurrentTab = (tab: string) => {
        currentTab.value = tab
    }

    const setViewMode = (mode: ViewModeType) => {
        viewMode.value = mode
    }

    const toggleSidebar = () => {
        isSidebarOpen.value = !isSidebarOpen.value
    }

    const setSidebarOpen = (open: boolean) => {
        isSidebarOpen.value = open
    }

    const setSearchQuery = (query: string) => {
        searchQuery.value = query
    }

    // Toast methods
    const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
        const toast: ToastMessage = {
            id: Date.now().toString(),
            message,
            type,
            timestamp: new Date(),
            duration,
        }

        toasts.value.unshift(toast)

        // 自動移除
        if (duration > 0) {
            setTimeout(() => {
                removeToast(toast.id)
            }, duration)
        }
    }

    const removeToast = (id: string) => {
        const index = toasts.value.findIndex((toast) => toast.id === id)
        if (index > -1) {
            toasts.value.splice(index, 1)
        }
    }

    const clearAllToasts = () => {
        toasts.value = []
    }

    const showSuccess = (message: string) => showToast(message, 'success')
    const showError = (message: string) => showToast(message, 'error', 5000)
    const showWarning = (message: string) => showToast(message, 'warning', 4000)
    const showInfo = (message: string) => showToast(message, 'info')

    // Modal methods
    const openModal = (id: string) => {
        modals.value.set(id, true)
    }

    const closeModal = (id: string) => {
        modals.value.set(id, false)
    }

    const closeAllModals = () => {
        for (const key of modals.value.keys()) {
            modals.value.set(key, false)
        }
    }

    // Loading methods
    const setLoading = (loading: boolean) => {
        isLoading.value = loading
    }

    const setLoadingState = (loading: boolean) => {
        isLoading.value = loading
    }

    const withLoading = async <T>(promise: Promise<T>): Promise<T> => {
        setLoading(true)
        try {
            return await promise
        } finally {
            setLoading(false)
        }
    }

    // Theme methods
    const setTheme = (theme: 'light' | 'dark') => {
        userPreferences.value.theme = theme
        if (process.client) {
            document.documentElement.setAttribute('data-theme', theme)
            localStorage.setItem('theme', theme)
        }
    }

    const toggleTheme = () => {
        const newTheme = userPreferences.value.theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
    }

    const initializeTheme = () => {
        if (process.client) {
            const savedTheme = localStorage.getItem('theme')
            if (savedTheme) {
                userPreferences.value.theme = savedTheme as 'light' | 'dark'
            } else {
                // 檢測系統主題偏好
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                userPreferences.value.theme = prefersDark ? 'dark' : 'light'
            }

            // 應用主題
            document.documentElement.setAttribute('data-theme', userPreferences.value.theme)
            localStorage.setItem('theme', userPreferences.value.theme)
        }
    }

    // Student selection methods
    const toggleStudentSelection = (studentId: string) => {
        if (selectedStudents.value.has(studentId)) {
            selectedStudents.value.delete(studentId)
        } else {
            selectedStudents.value.add(studentId)
        }
    }

    const clearStudentSelection = () => {
        selectedStudents.value.clear()
    }

    const selectAllStudents = (studentIds: string[]) => {
        selectedStudents.value = new Set(studentIds)
    }

    // Preferences methods
    const updatePreferences = (updates: Partial<UserPreferences>) => {
        userPreferences.value = { ...userPreferences.value, ...updates }
        if (process.client) {
            localStorage.setItem('userPreferences', JSON.stringify(userPreferences.value))
        }
    }

    const resetPreferences = () => {
        userPreferences.value = {
            theme: 'light',
            language: 'zh-TW',
            enableAnimations: true,
            enableSounds: false,
            autoSave: true,
            showTutorials: true,
        }
        if (process.client) {
            localStorage.removeItem('userPreferences')
        }
    }

    // Responsive methods
    const updateScreenSize = () => {
        if (process.client) {
            windowWidth.value = window.innerWidth
            isMobile.value = window.innerWidth < 768
            isTablet.value = window.innerWidth >= 768 && window.innerWidth < 1024
        }
    }

    const handleKeyboard = (event: KeyboardEvent) => {
        // ESC 關閉所有 modal
        if (event.key === 'Escape') {
            closeAllModals()
        }
    }

    // Lifecycle methods
    const initialize = () => {
        if (process.client) {
            // 初始化主題
            initializeTheme()

            // 載入用戶偏好
            const savedPreferences = localStorage.getItem('userPreferences')
            if (savedPreferences) {
                try {
                    userPreferences.value = {
                        ...userPreferences.value,
                        ...JSON.parse(savedPreferences),
                    }
                } catch (error) {
                    console.warn('Failed to parse user preferences:', error)
                }
            }

            // 初始化響應式
            updateScreenSize()
            window.addEventListener('resize', updateScreenSize)
            window.addEventListener('keydown', handleKeyboard)
        }
    }

    const cleanup = () => {
        if (process.client) {
            window.removeEventListener('resize', updateScreenSize)
            window.removeEventListener('keydown', handleKeyboard)
        }
    }

    return {
        // State
        currentTab: readonly(currentTab),
        viewMode: readonly(viewMode),
        toasts: readonly(toasts),
        modals: readonly(modals),
        isLoading: readonly(isLoading),
        isSidebarOpen: readonly(isSidebarOpen),
        searchQuery: readonly(searchQuery),
        selectedStudents: readonly(selectedStudents),
        userPreferences: readonly(userPreferences),
        isMobile: readonly(isMobile),
        isTablet: readonly(isTablet),
        windowWidth: readonly(windowWidth),

        // Computed
        isDarkMode,
        currentTabInfo,
        visibleToasts,
        openModals,
        tabs,

        // Actions
        setCurrentTab,
        setViewMode,
        toggleSidebar,
        setSidebarOpen,
        setSearchQuery,
        clearStudentSelection,

        // Toast methods
        showToast,
        removeToast,
        clearAllToasts,
        showSuccess,
        showError,
        showWarning,
        showInfo,

        // Modal methods
        openModal,
        closeModal,
        closeAllModals,

        // Loading methods
        setLoading,
        setLoadingState,
        withLoading,

        // Theme methods
        setTheme,
        toggleTheme,
        initializeTheme,

        // Student selection methods
        toggleStudentSelection,
        selectAllStudents,

        // Preferences methods
        updatePreferences,
        resetPreferences,

        // Lifecycle
        initialize,
        cleanup,
    }
})
