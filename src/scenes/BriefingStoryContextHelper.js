class BriefingStoryContextHelper {
    static getMaxFragmentSelections(storyState = {}) {
        const pathIndex = Math.max(0, Math.floor(storyState.currentPathIndex || 0));
        return Math.min(3, pathIndex + 1);
    }

    static getSelectedFragmentIds(storyState = {}) {
        if (Array.isArray(storyState.activeFragmentIds) && storyState.activeFragmentIds.length > 0) {
            return [...storyState.activeFragmentIds];
        }
        return storyState.activeFragmentId ? [storyState.activeFragmentId] : [];
    }

    static buildForGame(storyContext) {
        if (!storyContext) {
            return null;
        }

        const storyState = storyContext.storyState || {};
        if (storyState.fragmentChosenForBattle || this.getSelectedFragmentIds(storyState).length > 0) {
            return {
                ...storyContext,
                storyState: {
                    ...storyState,
                    fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {}),
                    activeFragmentIds: this.getSelectedFragmentIds(storyState),
                    activeBossBlessingId: storyState.activeBossBlessingId || null,
                    bossBlessingChosenForBattle: Boolean(storyState.bossBlessingChosenForBattle),
                    confusedEnemyColor: storyState.confusedEnemyColor || null
                }
            };
        }

        return {
            ...storyContext,
            storyState: {
                ...storyState,
                fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {}),
                fragmentChosenForBattle: false,
                activeFragmentId: null,
                activeFragmentIds: [],
                activeBossBlessingId: storyState.activeBossBlessingId || null,
                bossBlessingChosenForBattle: Boolean(storyState.bossBlessingChosenForBattle),
                confusedEnemyColor: null
            }
        };
    }

    static buildForSelectedFragment(storyContext, selectedFragment) {
        if (!storyContext || !selectedFragment) {
            return this.buildForGame(storyContext);
        }

        const storyState = storyContext.storyState || {};
        const selectedFragmentIds = this.getSelectedFragmentIds(storyState);
        const nextActiveFragmentIds = [...selectedFragmentIds, selectedFragment.id];
        return {
            ...storyContext,
            storyState: {
                ...storyState,
                fragments: StoryFragmentInventory.decrementCount(storyState.fragments || {}, selectedFragment.id),
                fragmentChosenForBattle: true,
                activeFragmentId: nextActiveFragmentIds[0] || selectedFragment.id,
                activeFragmentIds: nextActiveFragmentIds,
                activeBossBlessingId: storyState.activeBossBlessingId || null,
                bossBlessingChosenForBattle: Boolean(storyState.bossBlessingChosenForBattle),
                confusedEnemyColor: storyState.confusedEnemyColor || null
            }
        };
    }

    static buildForSelectedBossBlessing(storyContext, selectedBlessing) {
        if (!storyContext || !selectedBlessing) {
            return this.buildForGame(storyContext);
        }

        const storyState = storyContext.storyState || {};
        return {
            ...storyContext,
            storyState: {
                ...storyState,
                fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {}),
                activeBossBlessingId: selectedBlessing.id,
                bossBlessingChosenForBattle: true,
                confusedEnemyColor: storyState.confusedEnemyColor || null
            }
        };
    }

    static buildForLostTarget(storyContext, color) {
        if (!storyContext) {
            return storyContext;
        }

        const storyState = storyContext.storyState || {};
        return {
            ...storyContext,
            storyState: {
                ...storyState,
                activeBossBlessingId: storyState.activeBossBlessingId || null,
                bossBlessingChosenForBattle: Boolean(storyState.bossBlessingChosenForBattle),
                confusedEnemyColor: color
            }
        };
    }
}
