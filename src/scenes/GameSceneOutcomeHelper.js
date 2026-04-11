class GameSceneOutcomeHelper {
    constructor(scene) {
        this.scene = scene;
    }

    buildAdvancedStoryState() {
        const storyState = this.scene.storyContext?.storyState;
        const selectedNodeId = this.scene.storyContext?.selectedNodeId;

        if (!storyState || !selectedNodeId) {
            return null;
        }

        const nodeById = {};
        const rows = (storyState.rows || []).map((rowNodes) =>
            rowNodes.map((node) => {
                const clonedNode = {
                    id: node.id,
                    row: node.row,
                    lane: node.lane,
                    type: node.type,
                    eventId: node.eventId || null,
                    nextIds: [...(node.nextIds || [])],
                    previousIds: [...(node.previousIds || [])]
                };
                nodeById[clonedNode.id] = clonedNode;
                return clonedNode;
            })
        );
        const selectedNode = nodeById[selectedNodeId];
        if (!selectedNode) {
            return null;
        }

        const completedNodeIds = Array.from(new Set([
            ...((storyState.completedNodeIds || [])),
            selectedNodeId
        ]));
        const unlockedPotionId = this.getStoryUnlockedPotionId();
        const unlockedPotionIds = Array.from(new Set([
            ...(storyState.unlockedPotionIds || []),
            ...(unlockedPotionId ? [unlockedPotionId] : [])
        ]));
        const rewardedFragmentId = this.getStoryRewardFragmentId();
        const nextFragments = rewardedFragmentId
            ? StoryFragmentInventory.incrementCount(storyState.fragments || {}, rewardedFragmentId, 1)
            : StoryFragmentInventory.normalizeCounts(storyState.fragments || {});
        const completedBossFight = selectedNode.type === 'boss';
        const currentPathIndex = StoryMapState.getPathIndex(storyState.currentPathIndex || 0);
        const nextPathIndex = StoryMapState.getPathIndex(currentPathIndex + 1);
        const hasNextStoryPath = completedBossFight && currentPathIndex < StoryMapState.getPathCount() - 1;
        const nextBossSequenceIndex = completedBossFight
            ? Math.min((storyState.bossSequenceIndex || 0) + 1, StoryEncounterFactory.BOSS_TYPE_KEYS.length - 1)
            : Math.max(0, Math.floor(storyState.bossSequenceIndex || 0));

        const advancedState = {
            unlockedPotionIds,
            completedEventIds: [...(storyState.completedEventIds || [])],
            gold: (storyState.gold || 0) + (this.scene.storyGoldReward || 0),
            fragments: nextFragments,
            activeFragmentIds: [],
            briefingFragmentIds: [...(storyState.briefingFragmentIds || [])],
            forcedBossTypeKey: storyState.forcedBossTypeKey || null
        };

        if (hasNextStoryPath) {
            return StoryMapState.buildPathState({
                ...advancedState,
                bossSequenceIndex: nextBossSequenceIndex,
                currentPathIndex: nextPathIndex
            }, nextPathIndex);
        }

        if (completedBossFight) {
            return null;
        }

        return {
            rows,
            currentNodeIds: [...selectedNode.nextIds],
            completedNodeIds,
            completedEventIds: [...(storyState.completedEventIds || [])],
            unlockedPotionIds,
            gold: advancedState.gold,
            fragments: nextFragments,
            activeFragmentId: null,
            activeFragmentIds: [],
            activeBossBlessingId: null,
            briefingFragmentIds: [...(storyState.briefingFragmentIds || [])],
            bossBlessingChosenForBattle: false,
            confusedEnemyColor: null,
            forcedBossTypeKey: storyState.forcedBossTypeKey || null,
            bossSequenceIndex: nextBossSequenceIndex,
            currentPathIndex
        };
    }

    canReturnToStoryMapAfterVictory() {
        if (this.scene.storyContext?.source !== 'story') {
            return false;
        }

        if (this.scene.storyNodeType !== 'boss') {
            return true;
        }

        const currentPathIndex = StoryMapState.getPathIndex(this.scene.storyContext?.storyState?.currentPathIndex || 0);
        return currentPathIndex < StoryMapState.getPathCount() - 1;
    }

    getCurrentBossTypeKey() {
        if (this.scene.storyNodeType !== 'boss') {
            return null;
        }

        const enemyColor = ['BLEU', 'VERT', 'JAUNE'].find((color) => this.scene.preselectedEnemyAssignments?.[color]);
        return this.scene.preselectedEnemyAssignments?.[enemyColor]?.key || null;
    }

    getStoryBossVictoryMessage() {
        if (this.scene.storyContext?.source !== 'story' || this.scene.storyNodeType !== 'boss') {
            return null;
        }

        const messageKeysByBoss = {
            SALAMANDER: 'story.boss_victory.salamander',
            GOLEM: 'story.boss_victory.golem',
            OGRE: 'story.boss_victory.ogre'
        };

        const messageKey = messageKeysByBoss[this.getCurrentBossTypeKey()];
        return messageKey ? TranslationManager.t(messageKey) : null;
    }

    shouldShowFightBossUnlockMessage() {
        if (this.scene.storyContext?.source !== 'story' || this.scene.storyNodeType !== 'boss') {
            return false;
        }

        const bossKey = this.getCurrentBossTypeKey();
        if (!bossKey) {
            return false;
        }

        return !MetaProgression.hasSeenFightBossUnlockMessage(bossKey);
    }

    markFightBossUnlockMessageSeen() {
        const bossKey = this.getCurrentBossTypeKey();
        if (!bossKey) {
            return;
        }

        MetaProgression.markFightBossUnlockMessageSeen(bossKey);
    }

    shouldReturnToMainMenuAfterVictory() {
        if (this.scene.isBossRushMode) {
            return false;
        }

        return this.scene.storyContext?.source === 'story'
            && this.scene.storyNodeType === 'boss'
            && !this.canReturnToStoryMapAfterVictory();
    }

    canContinueBossRushAfterVictory() {
        if (!this.scene.isBossRushMode || !this.scene.bossRushConfig) {
            return false;
        }

        const currentIndex = Math.max(0, Math.floor(this.scene.bossRushConfig.currentIndex || 0));
        return currentIndex < (this.scene.bossRushConfig.sequence?.length || 0) - 1;
    }

    getBossRushNextPotions() {
        if (!this.scene.isBossRushMode) {
            return [];
        }

        return (this.scene.bossRushConfig?.nextProgressPotions || []).map((potion) => ({ ...potion }));
    }

    getBossRushContinuationMessage() {
        if (!this.scene.isBossRushMode) {
            return '';
        }

        if (!this.canContinueBossRushAfterVictory()) {
            const modeId = String(this.scene.bossRushConfig?.modeId || '').toUpperCase();
            return modeId === 'ULTIME'
                ? ''
                : TranslationManager.t('boss_rush.complete_series');
        }

        const nextIndex = Math.max(0, Math.floor(this.scene.bossRushConfig?.currentIndex || 0)) + 1;
        const nextEncounter = this.scene.bossRushConfig?.sequence?.[nextIndex];
        const difficulty = String(nextEncounter?.difficulty || this.scene.bossRushConfig?.modeId || '').toLowerCase();
        const messageKey = `boss_rush.continue.${difficulty}`;
        return TranslationManager.t(messageKey);
    }

    continueBossRush() {
        if (!this.canContinueBossRushAfterVictory()) {
            this.scene.returnToBossRushMenu();
            return;
        }

        const nextIndex = Math.max(0, Math.floor(this.scene.bossRushConfig.currentIndex || 0)) + 1;
        const nextEncounter = this.scene.bossRushConfig.sequence[nextIndex];
        const nextPotions = this.getBossRushNextPotions();
        const followingPotions = nextIndex < this.scene.bossRushConfig.sequence.length - 1
            ? ProgressPotionCatalog.selectFromPool()
            : [];

        this.scene.scene.start('GameScene', {
            aiCount: 1,
            boardSize: 12,
            difficulty: nextEncounter?.difficulty || 'NORMAL',
            language: TranslationManager.getLanguage(),
            arcadeKingdomId: this.scene.arcadeKingdomId || 'VERDOMBRE',
            enemyAssignments: EnemyDefinitions.createAssignmentsFromTypeKeys(['ROUGE', 'BLEU'], [nextEncounter?.bossTypeKey || 'SALAMANDER']),
            progressPotions: nextPotions,
            storyNodeType: 'boss',
            bossRushConfig: {
                ...this.scene.bossRushConfig,
                currentIndex: nextIndex,
                nextProgressPotions: followingPotions
            }
        });
    }

    getEndStarsReward(resultType) {
        if (this.scene.isStrategoMode) {
            if (this.scene.endStarsRewardByResult[resultType] !== undefined) {
                return this.scene.endStarsRewardByResult[resultType];
            }

            const rewardsByBoardSize = {
                8: 5,
                12: 8,
                14: 11
            };
            const reward = resultType === 'victory'
                ? (rewardsByBoardSize[this.scene.boardSize] || 5)
                : 0;
            this.scene.endStarsRewardByResult[resultType] = reward;
            return reward;
        }

        if (this.scene.isFightMode) {
            if (this.scene.endStarsRewardByResult[resultType] !== undefined) {
                return this.scene.endStarsRewardByResult[resultType];
            }

            const reward = resultType === 'victory' ? 5 : 0;
            this.scene.endStarsRewardByResult[resultType] = reward;
            return reward;
        }

        if (this.scene.isBossRushMode) {
            if (this.scene.endStarsRewardByResult[resultType] !== undefined) {
                return this.scene.endStarsRewardByResult[resultType];
            }

            if (resultType !== 'victory' || this.canContinueBossRushAfterVictory()) {
                this.scene.endStarsRewardByResult[resultType] = 0;
                return 0;
            }

            const rewardsByMode = {
                EASY: 20,
                NORMAL: 35,
                HARD: 50,
                ULTIME: 120
            };
            const reward = rewardsByMode[this.scene.bossRushConfig?.modeId] || 20;
            this.scene.endStarsRewardByResult[resultType] = reward;
            return reward;
        }

        if (this.scene.endStarsRewardByResult[resultType] !== undefined) {
            return this.scene.endStarsRewardByResult[resultType];
        }

        const currentBossTypeKey = this.getCurrentBossTypeKey();
        const bossBonusStars =
            this.scene.storyContext?.source === 'story' &&
            this.scene.storyNodeType === 'boss' &&
            (currentBossTypeKey === 'SALAMANDER' || currentBossTypeKey === 'GOLEM')
                ? 5
                : 0;
        let reward = 0;
        if (resultType === 'victory') {
            if (currentBossTypeKey === 'OGRE') {
                this.scene.endStarsRewardByResult[resultType] = 0;
                return 0;
            }
            const rangesByDifficulty = {
                EASY: [5, 7],
                NORMAL: [8, 10],
                HARD: [11, 13]
            };
            const [minValue, maxValue] = rangesByDifficulty[this.scene.difficulty] || rangesByDifficulty.NORMAL;
            reward = Phaser.Math.Between(minValue, maxValue);
        } else if (resultType === 'defeat') {
            const valuesByDifficulty = {
                EASY: 1,
                NORMAL: 2,
                HARD: 3
            };
            reward = valuesByDifficulty[this.scene.difficulty] || 2;
        }

        reward += bossBonusStars;
        this.scene.endStarsRewardByResult[resultType] = reward;
        return reward;
    }

    getOgreGoldConversionStars() {
        if (this.scene.isStrategoMode) {
            return 0;
        }

        if (this.getCurrentBossTypeKey() !== 'OGRE') {
            return 0;
        }

        const baseGold = this.scene.storyContext?.storyState?.gold || 0;
        const totalGold = Math.max(0, baseGold + (this.scene.storyGoldReward || 0));
        return totalGold > 0 ? Math.ceil(totalGold / 10) : 0;
    }

    getStoryUnlockedPotionId() {
        if (this.scene.storyUnlockedPotionId !== null) {
            return this.scene.storyUnlockedPotionId;
        }

        if (this.scene.storyContext?.source !== 'story') {
            return null;
        }

        const allPotionIds = ['ROSE', 'ORANGE', 'MENTHE', 'MARRON', 'BLANCHE', 'CYAN'];
        const unlockedPotionIds = new Set(this.scene.storyContext?.storyState?.unlockedPotionIds || []);
        const availableUnlocks = allPotionIds.filter((potionId) => !unlockedPotionIds.has(potionId));

        this.scene.storyUnlockedPotionId = availableUnlocks.length > 0
            ? Phaser.Utils.Array.GetRandom(availableUnlocks)
            : null;

        return this.scene.storyUnlockedPotionId;
    }

    getStoryUnlockedPotionDefinition() {
        const unlockedPotionId = this.getStoryUnlockedPotionId();
        if (!unlockedPotionId) {
            return null;
        }

        return this.scene.setup.getProgressPotionDefinitions().find((entry) => entry.id === unlockedPotionId) || null;
    }

    getStoryRewardFragmentId() {
        if (this.scene.storyRewardFragmentId !== null) {
            return this.scene.storyRewardFragmentId;
        }

        if (this.scene.storyContext?.source !== 'story') {
            return null;
        }

        if (this.getStoryUnlockedPotionId()) {
            this.scene.storyRewardFragmentId = null;
            return this.scene.storyRewardFragmentId;
        }

        const fragmentIds = StoryFragmentCatalog.getAll().map((fragment) => fragment.id);
        this.scene.storyRewardFragmentId = fragmentIds.length > 0
            ? Phaser.Utils.Array.GetRandom(fragmentIds)
            : null;
        return this.scene.storyRewardFragmentId;
    }

    getStoryRewardFragmentDefinition() {
        const fragmentId = this.getStoryRewardFragmentId();
        if (!fragmentId) {
            return null;
        }

        return StoryFragmentCatalog.getById(fragmentId);
    }
}
