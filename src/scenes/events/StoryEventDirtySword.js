class StoryEventDirtySword {
    static getDefinition() {
        return {
            id: 'dirty_sword',
            titleKey: 'event.dirty_sword.title',
            introKey: 'event.dirty_sword.intro',
            choices: [
                {
                    id: 'clean',
                    labelKey: 'event.dirty_sword.choice_clean'
                },
                {
                    id: 'leave',
                    labelKey: 'event.dirty_sword.choice_leave'
                }
            ]
        };
    }

    static resolve(scene, choiceId, storyState) {
        if (choiceId === 'clean') {
            return this.resolveClean(scene, storyState);
        }

        return this.resolveLeave(scene, storyState);
    }

    static resolveClean(scene, storyState) {
        const goldLoss = Phaser.Math.Between(20, 35);
        const currentGold = storyState.gold || 0;
        const actualGoldLoss = Math.min(currentGold, goldLoss);
        const nextGold = currentGold - actualGoldLoss;
        const ownedFragments = StoryFragmentInventory.getOwnedFragments(storyState, null, Infinity);
        const lostFragment = ownedFragments.length > 0
            ? Phaser.Utils.Array.GetRandom(ownedFragments)
            : null;
        const nextFragments = lostFragment
            ? StoryFragmentInventory.decrementCount(storyState.fragments || {}, lostFragment.id)
            : StoryFragmentInventory.normalizeCounts(storyState.fragments || {});
        const unlockedPotionIds = [...(storyState.unlockedPotionIds || [])];
        const canLosePotion = currentGold <= 0 && !lostFragment && unlockedPotionIds.length > 0;

        if (canLosePotion) {
            const lostPotionId = Phaser.Utils.Array.GetRandom(unlockedPotionIds);
            return {
                gold: nextGold,
                fragments: nextFragments,
                unlockedPotionIds: unlockedPotionIds.filter((potionId) => potionId !== lostPotionId),
                resultText: TranslationManager.t('event.dirty_sword.outcome_clean_no_resources', {
                    potion: TranslationManager.t(`potion.${lostPotionId.toLowerCase()}.title`)
                })
            };
        }

        return {
            gold: nextGold,
            fragments: nextFragments,
            unlockedPotionIds,
            resultText: lostFragment
                ? TranslationManager.t('event.dirty_sword.outcome_clean', {
                    gold: actualGoldLoss,
                    fragment: TranslationManager.t(lostFragment.titleKey)
                })
                : TranslationManager.t('event.dirty_sword.outcome_clean_no_fragment', {
                    gold: actualGoldLoss
                })
        };
    }

    static resolveLeave(scene, storyState) {
        const goldGain = StoryEventRewardHelper.applyPositiveGoldBonus(Phaser.Math.Between(20, 30));
        return {
            gold: (storyState.gold || 0) + goldGain,
            fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {}),
            unlockedPotionIds: [...(storyState.unlockedPotionIds || [])],
            showLuckyStarIntro: StoryEventRewardHelper.shouldShowLuckyStarIntro(),
            resultText: TranslationManager.t('event.dirty_sword.outcome_leave', {
                gold: goldGain
            })
        };
    }
}
