class GameBoardEndPanelState {
    constructor(endPanel) {
        this.endPanel = endPanel;
        this.scene = endPanel.scene;
    }

    build(resultType) {
        const defeatMessages = [
            TranslationManager.t('hud.defeat_message_1'),
            TranslationManager.t('hud.defeat_message_2'),
            TranslationManager.t('hud.defeat_message_3')
        ];
        const strategoVictoryMessages = [
            TranslationManager.t('stratego.victory_message_1'),
            TranslationManager.t('stratego.victory_message_2'),
            TranslationManager.t('stratego.victory_message_3')
        ];
        const strategoDefeatMessages = [
            TranslationManager.t('stratego.defeat_message_1'),
            TranslationManager.t('stratego.defeat_message_2'),
            TranslationManager.t('stratego.defeat_message_3')
        ];
        const fighterVictoryMessages = [
            TranslationManager.t('fighter.victory_message_1'),
            TranslationManager.t('fighter.victory_message_2'),
            TranslationManager.t('fighter.victory_message_3')
        ];
        const fighterDefeatMessages = [
            TranslationManager.t('fighter.defeat_message_1'),
            TranslationManager.t('fighter.defeat_message_2'),
            TranslationManager.t('fighter.defeat_message_3')
        ];
        const bossRushVictoryMessages = [
            TranslationManager.t('boss_rush.victory_message_1'),
            TranslationManager.t('boss_rush.victory_message_2'),
            TranslationManager.t('boss_rush.victory_message_3')
        ];
        const bossRushDefeatMessages = [
            TranslationManager.t('boss_rush.defeat_message_1'),
            TranslationManager.t('boss_rush.defeat_message_2'),
            TranslationManager.t('boss_rush.defeat_message_3')
        ];
        const bossVictoryMessage =
            resultType === 'victory' && typeof this.scene.getStoryBossVictoryMessage === 'function'
                ? this.scene.getStoryBossVictoryMessage()
                : null;
        const footerMessage = resultType === 'defeat' ? TranslationManager.t('hud.try_again') : '';
        const strategoVictoryFollowup =
            resultType === 'victory' && this.scene.isStrategoMode
                ? TranslationManager.t('stratego.victory_followup')
                : '';
        const bossRushVictoryFollowup =
            resultType === 'victory' && this.scene.isBossRushMode && typeof this.scene.getBossRushContinuationMessage === 'function'
                ? this.scene.getBossRushContinuationMessage()
                : '';
        const canReturnToStoryMap =
            resultType === 'victory' &&
            typeof this.scene.canReturnToStoryMapAfterVictory === 'function' &&
            this.scene.canReturnToStoryMapAfterVictory();
        const shouldReturnToMainMenu =
            resultType === 'victory' &&
            typeof this.scene.shouldReturnToMainMenuAfterVictory === 'function' &&
            this.scene.shouldReturnToMainMenuAfterVictory();
        const shouldConvertGoldToStars = shouldReturnToMainMenu && this.scene.getCurrentBossTypeKey?.() === 'OGRE';
        const ogreVictoryMessageParts =
            bossVictoryMessage && shouldConvertGoldToStars
                ? bossVictoryMessage.split('\n').filter(Boolean)
                : [];
        const ogreMainVictoryMessage = ogreVictoryMessageParts.length > 0
            ? ogreVictoryMessageParts[0]
            : bossVictoryMessage;
        const ogrePostConversionMessage = ogreVictoryMessageParts.length > 1
            ? ogreVictoryMessageParts.slice(1).join('\n')
            : '';
        const titleMessage = this.scene.isStrategoMode
            ? Phaser.Utils.Array.GetRandom(
                resultType === 'victory' ? strategoVictoryMessages : strategoDefeatMessages
            )
            : this.scene.isBossRushMode
            ? Phaser.Utils.Array.GetRandom(
                resultType === 'victory' ? bossRushVictoryMessages : bossRushDefeatMessages
            )
            : this.scene.isFightMode
            ? Phaser.Utils.Array.GetRandom(
                resultType === 'victory' ? fighterVictoryMessages : fighterDefeatMessages
            )
            : resultType === 'victory'
            ? ((shouldConvertGoldToStars ? ogreMainVictoryMessage : bossVictoryMessage) || TranslationManager.t('hud.victory_message'))
            : Phaser.Utils.Array.GetRandom(defeatMessages);
        const isStoryBattle = this.scene.storyContext?.source === 'story';
        const canUsePhoenixRetry =
            resultType === 'defeat' &&
            isStoryBattle &&
            Boolean(this.scene.storyNodeType) &&
            Boolean(this.scene.storyContext?.storyState) &&
            StoryFragmentInventory.getCount(this.scene.storyContext?.storyState, 'PHOENIX') > 0;
        const canUseStrategoRetry =
            resultType === 'defeat' &&
            Boolean(this.scene.isStrategoMode) &&
            Boolean(this.scene.strategoConfig);
        const canContinueBossRush =
            resultType === 'victory' &&
            Boolean(this.scene.isBossRushMode) &&
            typeof this.scene.canContinueBossRushAfterVictory === 'function' &&
            this.scene.canContinueBossRushAfterVictory();
        const bossRushNextPotions = canContinueBossRush && typeof this.scene.getBossRushNextPotions === 'function'
            ? this.scene.getBossRushNextPotions()
            : [];
        const hasBossRushNextPotions = bossRushNextPotions.length > 0;
        const hideStatsButton = Boolean(this.scene.isStrategoMode || this.scene.isFightMode || this.scene.isBossRushMode);
        const hasStoryVictoryRewards = canReturnToStoryMap || shouldConvertGoldToStars;
        const storyGoldReward = hasStoryVictoryRewards ? (this.scene.storyGoldReward || 0) : 0;
        const storyStarsReward = typeof this.scene.getEndStarsReward === 'function'
            ? this.scene.getEndStarsReward(resultType)
            : 0;
        const ogreConversionStars = shouldConvertGoldToStars && typeof this.scene.getOgreGoldConversionStars === 'function'
            ? this.scene.getOgreGoldConversionStars()
            : 0;
        const unlockedStoryPotion = canReturnToStoryMap ? this.scene.getStoryUnlockedPotionDefinition() : null;
        const rewardedStoryFragment = canReturnToStoryMap && !unlockedStoryPotion
            ? this.scene.getStoryRewardFragmentDefinition()
            : null;
        const shouldShowFightBossUnlockMessage =
            resultType === 'victory' &&
            typeof this.scene.shouldShowFightBossUnlockMessage === 'function' &&
            this.scene.shouldShowFightBossUnlockMessage();
        const baseGold = this.scene.storyContext?.storyState?.gold || 0;
        const baseStars = MetaProgression.getStars();
        const rewardSummaryTextValue = shouldConvertGoldToStars
            ? TranslationManager.t('story.gold_reward', { value: storyGoldReward })
            : storyGoldReward > 0
            ? TranslationManager.t('story.gold_and_stars_reward', {
                gold: storyGoldReward,
                stars: storyStarsReward
            })
            : TranslationManager.t(
                resultType === 'defeat' ? 'story.stars_reward_defeat' : 'story.stars_reward',
                { value: storyStarsReward }
            );
        const hasRewardSummary = storyGoldReward > 0 || storyStarsReward > 0;
        const goldRewardAnimationDuration = Math.min(1800, Math.max(700, storyGoldReward * 35));
        const hasBossVictoryMessage = Boolean(bossVictoryMessage);

        return {
            baseGold,
            baseStars,
            bossRushNextPotions,
            bossRushVictoryFollowup,
            bossVictoryMessage,
            canContinueBossRush,
            canReturnToStoryMap,
            canUsePhoenixRetry,
            canUseStrategoRetry,
            footerMessage,
            goldRewardAnimationDuration,
            hasBossRushNextPotions,
            hasBossVictoryMessage,
            hasRewardSummary,
            hideStatsButton,
            ogreConversionStars,
            ogrePostConversionMessage,
            resultType,
            rewardedStoryFragment,
            rewardSummaryTextValue,
            shouldConvertGoldToStars,
            shouldReturnToMainMenu,
            shouldShowFightBossUnlockMessage,
            storyGoldReward,
            storyStarsReward,
            strategoVictoryFollowup,
            titleMessage,
            unlockedStoryPotion
        };
    }
}
