class StoryEventRewardHelper {
    static applyPositiveGoldBonus(amount) {
        const safeAmount = Math.max(0, Math.floor(amount || 0));
        if (!MetaProgression.hasAstrolabePurchase('LUCKY_STAR')) {
            return safeAmount;
        }
        return Math.max(0, Math.round(safeAmount * 1.1));
    }

    static shouldShowLuckyStarIntro() {
        return MetaProgression.shouldShowLuckyStarEventIntro();
    }
}
