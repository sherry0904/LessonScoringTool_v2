import type { RewardSettings } from './class'

export interface RewardTemplate {
    id: string
    name: string
    isDefault?: boolean
    settings: RewardSettings
}
