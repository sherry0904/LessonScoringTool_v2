import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { ToastType, ToastMessage, ViewModeType, UserPreferences, Tab } from '~/types/class'

// Helper function to apply theme to the DOM
const applyThemeToDOM = (theme: 'light' | 'dark' | 'auto') => {
    if (process.client) {
        let actualTheme = theme
        if (theme === 'auto') {
            actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        document.documentElement.setAttribute('data-theme', actualTheme)
    }
}

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
        theme: 'auto',
        language: 'zh-TW',
        enableAnimations: true,
        enableSounds: false,
        autoSave: true,
        showTutorials: true,
        defaultView: 'grid',
        compactMode: false,
    })
    const isMobile = ref(false)
    const isTablet = ref(false)
    const windowWidth = ref(0)

    // Computed
    const isDarkMode = computed(() => {
        if (userPreferences.value.theme === 'auto') {
            if (process.client) {
                return window.matchMedia('(prefers-color-scheme: dark)').matches
            }
            return false
        }
        return userPreferences.value.theme === 'dark'
    })

    const currentTabInfo = computed(() => {
        const tabMap: Record<string, Tab> = {
            dashboard: { id: 'dashboard', label: '總覽', icon: 'School', color: 'primary' },
            students: { id: 'students', label: '學生管理', icon: 'Users', color: 'info' },
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
            { id: 'dashboard', label: '總覽', icon: 'School', color: 'primary' },
            { id: 'students', label: '學生管理', icon: 'Users', color: 'info' },
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

    // Preferences methods
    const updatePreferences = (updates: Partial<UserPreferences>) => {
        userPreferences.value = { ...userPreferences.value, ...updates }
        if (process.client) {
            localStorage.setItem('userPreferences', JSON.stringify(userPreferences.value))
            // If theme is updated, apply it to the DOM
            if (updates.theme) {
                applyThemeToDOM(updates.theme)
            }
        }
    }
    
    const toggleTheme = () => {
        const currentTheme = userPreferences.value.theme
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        updatePreferences({ theme: newTheme })
    }

    const resetPreferences = () => {
        const defaultPrefs: UserPreferences = {
            theme: 'auto',
            language: 'zh-TW',
            enableAnimations: true,
            enableSounds: false,
            autoSave: true,
            showTutorials: true,
            defaultView: 'grid',
            compactMode: false,
        }
        userPreferences.value = defaultPrefs
        if (process.client) {
            localStorage.setItem('userPreferences', JSON.stringify(defaultPrefs))
            applyThemeToDOM(defaultPrefs.theme)
        }
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
        if (duration > 0) {
            setTimeout(() => removeToast(toast.id), duration)
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

    const withLoading = async <T>(promise: Promise<T>): Promise<T> => {
        setLoading(true)
        try {
            return await promise
        } finally {
            setLoading(false)
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

    // Responsive methods
    const updateScreenSize = () => {
        if (process.client) {
            windowWidth.value = window.innerWidth
            isMobile.value = window.innerWidth < 768
            isTablet.value = window.innerWidth >= 768 && window.innerWidth < 1024
        }
    }

    const handleKeyboard = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            closeAllModals()
        }
    }

    // Lifecycle methods
    const initialize = () => {
        if (process.client) {
            // Load user preferences
            const savedPreferences = localStorage.getItem('userPreferences')
            if (savedPreferences) {
                try {
                    const parsedPrefs = JSON.parse(savedPreferences)
                    // Merge with defaults to avoid missing properties on update
                    userPreferences.value = { ...userPreferences.value, ...parsedPrefs }
                } catch (error) {
                    console.warn('Failed to parse user preferences:', error)
                }
            }
            
            // Apply initial theme
            applyThemeToDOM(userPreferences.value.theme)

            // Init responsive listeners
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
        currentTab,
        viewMode,
        toasts,
        modals,
        isLoading,
        isSidebarOpen,
        searchQuery,
        selectedStudents,
        userPreferences,
        isMobile,
        isTablet,
        windowWidth,

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
        toggleTheme,
        updatePreferences,
        resetPreferences,

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
        withLoading,

        // Student selection methods
        toggleStudentSelection,
        selectAllStudents,

        // Lifecycle
        initialize,
        cleanup,
    }
})
