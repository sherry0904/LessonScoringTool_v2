import { ref, onUnmounted, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { Group, RewardSettings, RewardMilestoneMessage } from '~/types/class'
import { buildDefaultMilestoneMessages } from '~/constants/rewards'

interface InvincibleCelebrationPayload {
    group: Group
    settings: RewardSettings | null
}

interface UiNotifier {
    showToast: (message: string, type?: string, duration?: number) => void
    triggerInvincibleCelebration?: (payload: InvincibleCelebrationPayload) => void
}

interface MilestoneBubble {
    message: string
}

interface TrackOptions {
    skipMilestoneAnimation?: boolean
}

export const useGroupingRewards = ({
    activeRewardSettings,
    timers,
    uiNotifier,
}: {
    activeRewardSettings: ComputedRef<RewardSettings | null>
    timers: Ref<Record<string, number>>
    uiNotifier: UiNotifier
}) => {
    const starGainAnimation = ref<Record<string, string | null>>({})
    const invincibleBurstActive = ref<Record<string, boolean>>({})
    const invincibleHighlight = ref<Record<string, boolean>>({})
    const milestoneBubbles = ref<Record<string, MilestoneBubble | null>>({})

    const previousGroupStars = ref<Record<string, number>>({})
    const previousMilestoneMessages = ref<Record<string, string | null>>({})

    const milestoneBubbleTimers = new Map<string, ReturnType<typeof setTimeout>>()
    const invincibleHighlightTimers = new Map<string, ReturnType<typeof setTimeout>>()

    const clearMilestoneBubble = (groupId: string) => {
        if (milestoneBubbleTimers.has(groupId)) {
            clearTimeout(milestoneBubbleTimers.get(groupId))
            milestoneBubbleTimers.delete(groupId)
        }
        milestoneBubbles.value[groupId] = null
    }

    const triggerMilestoneBubble = (groupId: string, message: string) => {
        milestoneBubbles.value[groupId] = { message }
        if (milestoneBubbleTimers.has(groupId)) {
            clearTimeout(milestoneBubbleTimers.get(groupId))
        }
        milestoneBubbleTimers.set(
            groupId,
            setTimeout(() => {
                milestoneBubbles.value[groupId] = null
                milestoneBubbleTimers.delete(groupId)
            }, 1800),
        )
    }

    const triggerStarGainAnimation = (groupId: string) => {
        const animationClass = 'animate-star-pop'
        starGainAnimation.value[groupId] = animationClass
        setTimeout(() => {
            if (starGainAnimation.value[groupId] === animationClass) {
                starGainAnimation.value[groupId] = null
            }
        }, 600)
    }

    const triggerInvincibleActivatedAnimation = (group: Group) => {
        const animationClass = 'animate-invincible-burst'
        starGainAnimation.value[group.id] = animationClass
        setTimeout(() => {
            if (starGainAnimation.value[group.id] === animationClass) {
                starGainAnimation.value[group.id] = null
            }
        }, 800)
        invincibleBurstActive.value[group.id] = true
        setTimeout(() => {
            invincibleBurstActive.value[group.id] = false
        }, 900)

        invincibleHighlight.value[group.id] = true
        if (invincibleHighlightTimers.has(group.id)) {
            clearTimeout(invincibleHighlightTimers.get(group.id))
        }
        invincibleHighlightTimers.set(
            group.id,
            setTimeout(() => {
                invincibleHighlight.value[group.id] = false
                invincibleHighlightTimers.delete(group.id)
            }, 1000),
        )

        const settings = activeRewardSettings.value
        if (uiNotifier.triggerInvincibleCelebration) {
            uiNotifier.triggerInvincibleCelebration({
                group,
                settings: settings ?? null,
            })
        } else {
            const celebrationMessage = settings?.enabled
                ? `🎉 ${group.name} 進入無敵星星模式！接下來 ${settings.invincibleDurationSeconds} 秒每次 +${settings.invinciblePointsPerClick} 分，快把握機會！`
                : `🎉 ${group.name} 進入無敵星星模式！`
            uiNotifier.showToast(celebrationMessage, 'success', 6000)
        }
    }

    const getTotalStarsForDisplay = (group: Group) => {
        if (typeof group.totalCollectedStars === 'number') {
            return group.totalCollectedStars
        }
        return group.stars || 0
    }

    const getStarProgress = (group: Group) => {
        const settings = activeRewardSettings.value
        if (!settings?.enabled || !settings.starsToInvincible) return 0
        const stars = group.stars || 0
        return Math.max(0, Math.min(1, stars / settings.starsToInvincible))
    }

    const resolveMilestoneMessages = (settings: RewardSettings): RewardMilestoneMessage[] => {
        if (Array.isArray(settings.milestoneMessages) && settings.milestoneMessages.length > 0) {
            return [...settings.milestoneMessages].sort((a, b) => a.threshold - b.threshold)
        }
        return buildDefaultMilestoneMessages(settings.starsToInvincible)
    }

    const getStarMessage = (group: Group) => {
        const settings = activeRewardSettings.value
        if (!settings?.enabled || !settings.starsToInvincible) {
            return null
        }

        const stars = group.stars || 0
        if (stars <= 0) {
            return null
        }

        const messages = resolveMilestoneMessages(settings)
        let matched: RewardMilestoneMessage | null = null

        messages.forEach((item) => {
            if (stars >= item.threshold) {
                matched = item
            }
        })

        return matched?.message ?? null
    }

    const shouldShowStarMessage = (group: Group) => {
        const settings = activeRewardSettings.value
        if (!settings?.enabled || !settings.starsToInvincible) return false
        return !!getStarMessage(group)
    }

    const isCountdownCritical = (groupId: string) => {
        const remaining = timers.value[groupId]
        return typeof remaining === 'number' && remaining <= 10
    }

    const prepareGroupData = (group: Group) => {
        if (group.totalCollectedStars == null) {
            group.totalCollectedStars = group.stars || 0
        }
        if (group.invincibleStarQueue == null) {
            group.invincibleStarQueue = 0
        }
        if (group.invincibleUntil == null) {
            group.invincibleUntil = null
        }
        if (group.isInvincible == null) {
            group.isInvincible = false
        }
        return group
    }

    const trackGroupUpdate = (group: Group, previousGroup?: Group, options: TrackOptions = {}) => {
        const currentStars = group.stars || 0
        const prevStars = previousGroupStars.value[group.id]

        // 處理星星增加的動畫與訊息泡泡
        if (typeof prevStars === 'number' && currentStars > prevStars) {
            triggerStarGainAnimation(group.id)
            const milestoneMessage = getStarMessage(group)
            if (
                milestoneMessage &&
                milestoneMessage !== previousMilestoneMessages.value[group.id] &&
                !options.skipMilestoneAnimation
            ) {
                triggerMilestoneBubble(group.id, milestoneMessage)
                previousMilestoneMessages.value[group.id] = milestoneMessage
            }
        }

        const wasInvincible = previousGroup?.isInvincible ?? false
        if (!wasInvincible && group.isInvincible) {
            triggerInvincibleActivatedAnimation(group)
        }

        // 如果星星數減少（例如：手動修改），則清除泡泡
        if (previousGroup && (previousGroup.stars || 0) > currentStars) {
            previousMilestoneMessages.value[group.id] = null
            clearMilestoneBubble(group.id)
        }

        // 更新星星數的歷史紀錄
        previousGroupStars.value[group.id] = currentStars
    }

    const cleanupForRemovedGroups = (groupIds: Set<string>) => {
        Object.keys(starGainAnimation.value).forEach((id) => {
            if (!groupIds.has(id)) {
                delete starGainAnimation.value[id]
            }
        })
        Object.keys(invincibleBurstActive.value).forEach((id) => {
            if (!groupIds.has(id)) {
                delete invincibleBurstActive.value[id]
            }
        })
        Object.keys(invincibleHighlight.value).forEach((id) => {
            if (!groupIds.has(id)) {
                delete invincibleHighlight.value[id]
            }
        })
        Object.keys(milestoneBubbles.value).forEach((id) => {
            if (!groupIds.has(id)) {
                clearMilestoneBubble(id)
                delete milestoneBubbles.value[id]
            }
        })
        Object.keys(previousGroupStars.value).forEach((id) => {
            if (!groupIds.has(id)) {
                delete previousGroupStars.value[id]
            }
        })
        Object.keys(previousMilestoneMessages.value).forEach((id) => {
            if (!groupIds.has(id)) {
                delete previousMilestoneMessages.value[id]
            }
        })
    }

    const cleanup = () => {
        milestoneBubbleTimers.forEach((timer) => clearTimeout(timer))
        milestoneBubbleTimers.clear()
        invincibleHighlightTimers.forEach((timer) => clearTimeout(timer))
        invincibleHighlightTimers.clear()
    }

    onUnmounted(() => {
        cleanup()
    })

    // Reset milestone歷史，避免設定更新後仍顯示舊訊息
    watch(
        activeRewardSettings,
        () => {
            previousMilestoneMessages.value = {}
            Object.keys(milestoneBubbles.value).forEach((id) => {
                milestoneBubbles.value[id] = null
            })
        },
        { immediate: true },
    )

    return {
        starGainAnimation,
        invincibleBurstActive,
        invincibleHighlight,
        milestoneBubbles,
        getTotalStarsForDisplay,
        getStarProgress,
        isCountdownCritical,
        trackGroupUpdate,
        prepareGroupData,
        cleanupForRemovedGroups,
        cleanupRewards: cleanup,
    }
}
