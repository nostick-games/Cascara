class StoryEventGoblinDie {
    static getDefinition() {
        return {
            id: 'goblin_die',
            titleKey: 'event.goblin_die.title',
            introKey: 'event.goblin_die.intro',
            choices: [
                {
                    id: 'play',
                    labelKey: 'event.goblin_die.choice_play'
                },
                {
                    id: 'sleep',
                    labelKey: 'event.goblin_die.choice_sleep'
                }
            ]
        };
    }

    static resolve(scene, choiceId, storyState) {
        if (choiceId === 'play') {
            return this.resolvePlay(storyState);
        }

        return this.resolveSleep(storyState);
    }

    static resolvePlay(storyState) {
        const playerRoll = Phaser.Math.Between(1, 6);
        const goblinRoll = Phaser.Math.Between(1, 6);
        const currentGold = storyState.gold || 0;
        const currentFragments = StoryFragmentInventory.normalizeCounts(storyState.fragments || {});
        const unlockedPotionIds = [...(storyState.unlockedPotionIds || [])];

        if (playerRoll > goblinRoll) {
            const goldGain = StoryEventRewardHelper.applyPositiveGoldBonus(Phaser.Math.Between(20, 35));
            return {
                gold: currentGold + goldGain,
                fragments: currentFragments,
                unlockedPotionIds,
                showLuckyStarIntro: StoryEventRewardHelper.shouldShowLuckyStarIntro(),
                resultText: TranslationManager.t('event.goblin_die.outcome_win', {
                    gold: goldGain
                })
            };
        }

        if (playerRoll === goblinRoll) {
            return {
                gold: currentGold,
                fragments: currentFragments,
                unlockedPotionIds,
                resultText: TranslationManager.t('event.goblin_die.outcome_tie')
            };
        }

        return this.resolveLoss(storyState, 'event.goblin_die.outcome_lose_gold', 'event.goblin_die.outcome_lose_potion', 'event.goblin_die.outcome_lose_empty');
    }

    static resolveSleep(storyState) {
        return this.resolveLoss(storyState, 'event.goblin_die.outcome_refuse_gold', 'event.goblin_die.outcome_refuse_potion', 'event.goblin_die.outcome_refuse_empty');
    }

    static resolveLoss(storyState, goldOutcomeKey, potionOutcomeKey, emptyOutcomeKey) {
        const goldLoss = Phaser.Math.Between(15, 30);
        const currentGold = storyState.gold || 0;
        const currentFragments = StoryFragmentInventory.normalizeCounts(storyState.fragments || {});
        const unlockedPotionIds = [...(storyState.unlockedPotionIds || [])];

        if (currentGold > 0) {
            const actualGoldLoss = Math.min(currentGold, goldLoss);
            return {
                gold: currentGold - actualGoldLoss,
                fragments: currentFragments,
                unlockedPotionIds,
                resultText: TranslationManager.t(goldOutcomeKey, {
                    gold: actualGoldLoss
                })
            };
        }

        if (unlockedPotionIds.length > 0) {
            const lostPotionId = Phaser.Utils.Array.GetRandom(unlockedPotionIds);
            return {
                gold: currentGold,
                fragments: currentFragments,
                unlockedPotionIds: unlockedPotionIds.filter((potionId) => potionId !== lostPotionId),
                resultText: TranslationManager.t(potionOutcomeKey, {
                    potion: TranslationManager.t(`potion.${lostPotionId.toLowerCase()}.title`)
                })
            };
        }

        return {
            gold: currentGold,
            fragments: currentFragments,
            unlockedPotionIds,
            resultText: TranslationManager.t(emptyOutcomeKey)
        };
    }
}
