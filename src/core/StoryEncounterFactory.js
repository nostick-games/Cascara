class StoryEncounterFactory {
    static DEFAULT_UNLOCKED_POTIONS = ['ROSE'];
    static BOSS_TYPE_KEYS = ['SALAMANDER', 'GOLEM', 'OGRE'];

    static createEncounter(nodeType, unlockedPotionIds = [], options = {}) {
        if (nodeType === 'boss') {
            return this.createBossEncounter(unlockedPotionIds, options);
        }
        if (nodeType === 'elite') {
            return this.createEliteEncounter(unlockedPotionIds, options);
        }
        return this.createNormalEncounter(unlockedPotionIds, options);
    }

    static createNormalEncounter(unlockedPotionIds = [], options = {}) {
        const availablePotionIds = this.normalizeUnlockedPotionIds(unlockedPotionIds);
        const pathDifficulty = StoryMapState.getPathDifficulty(options?.currentPathIndex || 0);

        return {
            nodeType: 'fight',
            aiCount: this.pickWeighted([
                { value: 1, weight: 78 },
                { value: 2, weight: 22 }
            ]),
            boardSize: this.pickWeighted([
                { value: 8, weight: 76 },
                { value: 12, weight: 24 }
            ]),
            difficulty: pathDifficulty,
            goldReward: this.pickWeighted([
                { value: 20, weight: 20 },
                { value: 22, weight: 22 },
                { value: 25, weight: 30 },
                { value: 28, weight: 18 },
                { value: 30, weight: 10 }
            ]),
            availablePotionIds
        };
    }

    static createEliteEncounter(unlockedPotionIds = [], options = {}) {
        const availablePotionIds = this.normalizeUnlockedPotionIds(unlockedPotionIds);
        const pathDifficulty = StoryMapState.getPathDifficulty(options?.currentPathIndex || 0);

        return {
            nodeType: 'elite',
            aiCount: this.pickWeighted([
                { value: 2, weight: 74 },
                { value: 3, weight: 26 }
            ]),
            boardSize: this.pickWeighted([
                { value: 12, weight: 72 },
                { value: 14, weight: 28 }
            ]),
            difficulty: pathDifficulty,
            goldReward: this.pickWeighted([
                { value: 40, weight: 18 },
                { value: 45, weight: 24 },
                { value: 50, weight: 30 },
                { value: 55, weight: 18 },
                { value: 60, weight: 10 }
            ]),
            availablePotionIds
        };
    }

    static createBossEncounter(unlockedPotionIds = [], options = {}) {
        const availablePotionIds = this.normalizeUnlockedPotionIds(unlockedPotionIds);
        const forcedBossTypeKey = this.BOSS_TYPE_KEYS.includes(options?.forcedBossTypeKey)
            ? options.forcedBossTypeKey
            : null;
        const currentPathIndex = StoryMapState.getPathIndex(options?.currentPathIndex || 0);
        const bossSequenceIndex = Math.max(0, Math.floor(options?.bossSequenceIndex || currentPathIndex));
        const pathConfig = StoryMapState.getPathConfig(currentPathIndex);
        const bossTypeKey = forcedBossTypeKey || pathConfig.bossTypeKey || this.getBossTypeKeyForSequence(bossSequenceIndex);

        return {
            nodeType: 'boss',
            aiCount: 1,
            boardSize: 12,
            difficulty: pathConfig.difficulty,
            goldReward: bossTypeKey === 'OGRE' ? 200 : 100,
            availablePotionIds,
            enemyTypeKeys: [bossTypeKey]
        };
    }

    static getBossTypeKeyForSequence(index = 0) {
        return this.BOSS_TYPE_KEYS[Math.min(index, this.BOSS_TYPE_KEYS.length - 1)] || this.BOSS_TYPE_KEYS[0];
    }

    static normalizeUnlockedPotionIds(unlockedPotionIds = []) {
        const validIds = ['ROSE', 'ORANGE', 'MENTHE', 'MARRON', 'BLANCHE', 'CYAN'];
        const filtered = (unlockedPotionIds || []).filter((id) => validIds.includes(id));
        return filtered.length > 0 ? filtered : this.DEFAULT_UNLOCKED_POTIONS.slice();
    }

    static pickWeighted(entries) {
        const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
        let randomValue = Math.random() * totalWeight;

        for (const entry of entries) {
            randomValue -= entry.weight;
            if (randomValue <= 0) {
                return entry.value;
            }
        }

        return entries[entries.length - 1].value;
    }
}
