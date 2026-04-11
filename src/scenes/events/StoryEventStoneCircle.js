class StoryEventStoneCircle {
    static getDefinition() {
        return {
            id: 'stone_circle',
            titleKey: 'event.stone_circle.title',
            introKey: 'event.stone_circle.intro',
            choices: [
                {
                    id: 'avoid',
                    labelKey: 'event.stone_circle.choice_avoid'
                },
                {
                    id: 'enter',
                    labelKey: 'event.stone_circle.choice_enter'
                }
            ]
        };
    }

    static resolve(scene, choiceId, storyState) {
        if (choiceId === 'enter') {
            return this.resolveEnter(storyState);
        }

        return this.resolveAvoid(storyState);
    }

    static resolveAvoid(storyState) {
        return {
            gold: storyState.gold || 0,
            fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {}),
            unlockedPotionIds: [...(storyState.unlockedPotionIds || [])],
            resultText: TranslationManager.t('event.stone_circle.outcome_avoid')
        };
    }

    static resolveEnter(storyState) {
        const goldGain = StoryEventRewardHelper.applyPositiveGoldBonus(Phaser.Math.Between(20, 35));
        return {
            gold: (storyState.gold || 0) + goldGain,
            fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {}),
            unlockedPotionIds: [...(storyState.unlockedPotionIds || [])],
            showLuckyStarIntro: StoryEventRewardHelper.shouldShowLuckyStarIntro(),
            resultText: TranslationManager.t('event.stone_circle.outcome_enter', {
                gold: goldGain
            })
        };
    }
}
