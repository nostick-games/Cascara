class StoryEventGnomeGambler {
    static CHOICES = ['rock', 'paper', 'scissors'];

    static WIN_MAP = {
        rock: 'scissors',
        paper: 'rock',
        scissors: 'paper'
    };

    static LOSE_MAP = {
        rock: 'paper',
        paper: 'scissors',
        scissors: 'rock'
    };

    static getDefinition() {
        return {
            id: 'gnome_gambler',
            titleKey: 'event.gnome_gambler.title',
            introKey: 'event.gnome_gambler.intro',
            choices: [
                { id: 'rock', labelKey: 'event.gnome_gambler.choice_rock' },
                { id: 'paper', labelKey: 'event.gnome_gambler.choice_paper' },
                { id: 'scissors', labelKey: 'event.gnome_gambler.choice_scissors' }
            ]
        };
    }

    static resolve(scene, choiceId, storyState) {
        const currentGold = storyState.gold || 0;
        const gnomeChoice = this.rollGnomeChoice(choiceId);
        const stake = Phaser.Math.Between(15, 30);

        if (this.WIN_MAP[choiceId] === gnomeChoice) {
            const goldGain = StoryEventRewardHelper.applyPositiveGoldBonus(stake);
            return {
                gold: currentGold + goldGain,
                fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {}),
                unlockedPotionIds: [...(storyState.unlockedPotionIds || [])],
                showLuckyStarIntro: StoryEventRewardHelper.shouldShowLuckyStarIntro(),
                resultText: TranslationManager.t(`event.gnome_gambler.outcome_win_${choiceId}`, {
                    gold: goldGain
                })
            };
        }

        if (currentGold <= 0) {
            return {
                gold: currentGold,
                fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {}),
                unlockedPotionIds: [...(storyState.unlockedPotionIds || [])],
                resultText: TranslationManager.t(`event.gnome_gambler.outcome_lose_${choiceId}_no_gold`)
            };
        }

        const actualGoldLoss = Math.min(currentGold, stake);
        return {
            gold: currentGold - actualGoldLoss,
            fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {}),
            unlockedPotionIds: [...(storyState.unlockedPotionIds || [])],
            resultText: TranslationManager.t(`event.gnome_gambler.outcome_lose_${choiceId}`, {
                gold: actualGoldLoss
            })
        };
    }

    static rollGnomeChoice(playerChoiceId) {
        const choices = this.CHOICES.filter((choiceId) => choiceId !== playerChoiceId);
        return Phaser.Utils.Array.GetRandom(choices);
    }
}
