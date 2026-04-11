class StoryEventWetBeaverInn {
    static getDefinition() {
        return {
            id: 'wet_beaver_inn',
            titleKey: 'event.wet_beaver_inn.title',
            introKey: 'event.wet_beaver_inn.intro',
            choices: [
                {
                    id: 'stay',
                    labelKey: 'event.wet_beaver_inn.choice_stay'
                },
                {
                    id: 'leave',
                    labelKey: 'event.wet_beaver_inn.choice_leave'
                }
            ]
        };
    }

    static resolve(scene, choiceId, storyState) {
        if (choiceId === 'stay') {
            return this.resolveStay(scene, storyState);
        }

        return this.resolveLeave(scene, storyState);
    }

    static resolveStay(scene, storyState) {
        const goldLoss = Phaser.Math.Between(20, 35);
        return this.resolveGoldOrFragmentPenalty(storyState, goldLoss, 'event.wet_beaver_inn.outcome_stay');
    }

    static resolveLeave(scene, storyState) {
        const goldLoss = Phaser.Math.Between(20, 35);
        return this.resolveGoldOrFragmentPenalty(storyState, goldLoss, 'event.wet_beaver_inn.outcome_leave');
    }

    static resolveGoldOrFragmentPenalty(storyState, goldLoss, goldOutcomeKey) {
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

        const ownedFragments = StoryFragmentInventory.getOwnedFragments(storyState, null, Infinity);
        const lostFragment = ownedFragments.length > 0
            ? Phaser.Utils.Array.GetRandom(ownedFragments)
            : null;

        if (lostFragment) {
            return {
                gold: currentGold,
                fragments: StoryFragmentInventory.decrementCount(currentFragments, lostFragment.id),
                unlockedPotionIds,
                resultText: TranslationManager.t('event.wet_beaver_inn.outcome_no_gold_fragment', {
                    fragment: TranslationManager.t(lostFragment.titleKey)
                })
            };
        }

        if (unlockedPotionIds.length > 0) {
            const lostPotionId = Phaser.Utils.Array.GetRandom(unlockedPotionIds);
            return {
                gold: currentGold,
                fragments: currentFragments,
                unlockedPotionIds: unlockedPotionIds.filter((potionId) => potionId !== lostPotionId),
                resultText: TranslationManager.t('event.wet_beaver_inn.outcome_no_gold_potion', {
                    potion: TranslationManager.t(`potion.${lostPotionId.toLowerCase()}.title`)
                })
            };
        }

        return {
            gold: currentGold,
            fragments: currentFragments,
            unlockedPotionIds,
            resultText: TranslationManager.t('event.wet_beaver_inn.outcome_no_gold_empty')
        };
    }
}
