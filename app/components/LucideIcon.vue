<template>
    <component :is="iconComponent" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
    ChevronLeft,
    ChevronRight,
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
    GraduationCap,
    CheckCircle,
    AlertCircle,
    Info,
    AlertTriangle,
    Sun,
    Moon,
    Database,
} from 'lucide-vue-next'

interface Props {
    name: string
}

const props = defineProps<Props>()

const iconMap = {
    Home: Home,
    Users: Users,
    BarChart3: BarChart3,
    Settings: Settings,
    Plus: Plus,
    Trash2: Trash2,
    Edit: Edit,
    Search: Search,
    Filter: Filter,
    Download: Download,
    Upload: Upload,
    Menu: Menu,
    X: X,
    ChevronDown: ChevronDown,
    ChevronUp: ChevronUp,
    ChevronLeft: ChevronLeft,
    ChevronRight: ChevronRight,
    Star: Star,
    Calendar: Calendar,
    Clock: Clock,
    Trophy: Trophy,
    Target: Target,
    Shuffle: Shuffle,
    Play: Play,
    Square: Square,
    UserCheck: UserCheck,
    Eye: Eye,
    EyeOff: EyeOff,
    GraduationCap: GraduationCap,
    CheckCircle: CheckCircle,
    AlertCircle: AlertCircle,
    Info: Info,
    AlertTriangle: AlertTriangle,
    Sun: Sun,
    Moon: Moon,
    Database: Database,
}

const iconComponent = computed(() => {
    return iconMap[props.name as keyof typeof iconMap] || X
})
</script>
