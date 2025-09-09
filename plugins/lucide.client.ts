import {
    Home,
    Users,
    BarChart3,
    Settings,
    Plus,
    Trash2,
    Edit,
    Search,
    Filter,
    Download,
    Upload,
    Menu,
    X,
    ChevronDown,
    ChevronUp,
    Star,
    Calendar,
    Clock,
    Trophy,
    Target,
    Shuffle,
    Play,
    Square,
    UserCheck,
    Eye,
    EyeOff,
} from 'lucide-vue-next'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.component('LucideHome', Home)
    nuxtApp.vueApp.component('LucideUsers', Users)
    nuxtApp.vueApp.component('LucideBarChart3', BarChart3)
    nuxtApp.vueApp.component('LucideSettings', Settings)
    nuxtApp.vueApp.component('LucidePlus', Plus)
    nuxtApp.vueApp.component('LucideTrash2', Trash2)
    nuxtApp.vueApp.component('LucideEdit', Edit)
    nuxtApp.vueApp.component('LucideSearch', Search)
    nuxtApp.vueApp.component('LucideFilter', Filter)
    nuxtApp.vueApp.component('LucideDownload', Download)
    nuxtApp.vueApp.component('LucideUpload', Upload)
    nuxtApp.vueApp.component('LucideMenu', Menu)
    nuxtApp.vueApp.component('LucideX', X)
    nuxtApp.vueApp.component('LucideChevronDown', ChevronDown)
    nuxtApp.vueApp.component('LucideChevronUp', ChevronUp)
    nuxtApp.vueApp.component('LucideStar', Star)
    nuxtApp.vueApp.component('LucideCalendar', Calendar)
    nuxtApp.vueApp.component('LucideClock', Clock)
    nuxtApp.vueApp.component('LucideTrophy', Trophy)
    nuxtApp.vueApp.component('LucideTarget', Target)
    nuxtApp.vueApp.component('LucideShuffle', Shuffle)
    nuxtApp.vueApp.component('LucidePlay', Play)
    nuxtApp.vueApp.component('LucideSquare', Square)
    nuxtApp.vueApp.component('LucideUserCheck', UserCheck)
    nuxtApp.vueApp.component('LucideEye', Eye)
    nuxtApp.vueApp.component('LucideEyeOff', EyeOff)
})
