class StoryEventAnnoyingMerchant {
    static ALL_POTION_IDS = ['ROSE', 'ORANGE', 'MENTHE', 'MARRON', 'BLANCHE', 'CYAN'];

    static getDefinition() {
        return {
            id: 'annoying_merchant',
            titleKey: 'event.annoying_merchant.title',
            introKey: 'event.annoying_merchant.intro',
            choices: [
                {
                    id: 'buy',
                    labelKey: 'event.annoying_merchant.choice_buy'
                },
                {
                    id: 'leave',
                    labelKey: 'event.annoying_merchant.choice_leave'
                }
            ]
        };
    }

    static resolve(scene, choiceId, storyState) {
        if (choiceId === 'buy') {
            return this.resolveBuy(scene, storyState);
        }

        return this.resolveLeave(scene, storyState);
    }

    static resolveBuy(scene, storyState) {
        const currentGold = storyState.gold || 0;
        const hadEnoughGold = currentGold >= 20;
        const reward = this.rollReward(storyState);
        const nextGold = hadEnoughGold ? currentGold - 20 : currentGold;

        return {
            gold: nextGold,
            fragments: reward.fragments,
            unlockedPotionIds: reward.unlockedPotionIds,
            resultText: TranslationManager.t(
                hadEnoughGold
                    ? 'event.annoying_merchant.outcome_buy_success'
                    : 'event.annoying_merchant.outcome_buy_no_gold',
                { reward: reward.label }
            )
        };
    }

    static resolveLeave(scene, storyState) {
        const currentGold = storyState.gold || 0;
        if (currentGold <= 0) {
            return {
                gold: currentGold,
                fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {}),
                unlockedPotionIds: [...(storyState.unlockedPotionIds || [])],
                resultText: TranslationManager.t('event.annoying_merchant.outcome_leave_no_gold')
            };
        }

        const goldLoss = Phaser.Math.Between(15, 30);
        const actualGoldLoss = Math.min(currentGold, goldLoss);
        return {
            gold: currentGold - actualGoldLoss,
            fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {}),
            unlockedPotionIds: [...(storyState.unlockedPotionIds || [])],
            resultText: TranslationManager.t('event.annoying_merchant.outcome_leave', {
                gold: actualGoldLoss
            })
        };
    }

    static rollReward(storyState) {
        const unlockedPotionIds = [...(storyState.unlockedPotionIds || [])];
        const availablePotionIds = this.ALL_POTION_IDS.filter((potionId) => !unlockedPotionIds.includes(potionId));

        if (availablePotionIds.length > 0) {
            const potionId = Phaser.Utils.Array.GetRandom(availablePotionIds);
            return {
                label: TranslationManager.t(`potion.${potionId.toLowerCase()}.title`),
                unlockedPotionIds: [...unlockedPotionIds, potionId],
                fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {})
            };
        }

        const fragment = Phaser.Utils.Array.GetRandom(StoryFragmentCatalog.getAll());
        return {
            label: TranslationManager.t(fragment.titleKey),
            unlockedPotionIds,
            fragments: StoryFragmentInventory.incrementCount(storyState.fragments || {}, fragment.id)
        };
    }
}
