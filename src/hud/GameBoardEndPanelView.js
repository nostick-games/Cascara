class GameBoardEndPanelView {
    constructor(endPanel) {
        this.endPanel = endPanel;
        this.scene = endPanel.scene;
    }

    applyView(view, context) {
        const {
            centerX,
            parchmentBottomY,
            isNarrowViewport,
            rewardSequencePlayed,
            hasRewardSummary,
            storyGoldReward,
            storyStarsReward,
            hasBossRushNextPotions,
            shouldShowFightBossUnlockMessage,
            unlockedStoryPotion,
            rewardedStoryFragment,
            canReturnToStoryMap,
            shouldConvertGoldToStars,
            ogreConversionCompleted,
            ogrePostConversionMessage,
            footerMessage,
            bossRushVictoryFollowup,
            canUsePhoenixRetry,
            canUseStrategoRetry,
            hideStatsButton,
            revealRewardSequence,
            messageText,
            footerText,
            strategoVictoryText,
            bossRushVictoryText,
            rewardSummaryText,
            goldRewardDisplay,
            conversionText,
            postConversionText,
            starRewardDisplay,
            bossRushNextPotionsText,
            bossRushNextPotionsDisplay,
            fightBossUnlockText,
            potionUnlockText,
            potionUnlockDisplay,
            statsText,
            potionStatsRow,
            trophyList,
            phoenixButton,
            retryButton,
            statsButton,
            trophiesButton,
            menuButton,
            trophiesDot
        } = context;

        const isMain = view === 'main';
        const isStats = view === 'stats';
        const isTrophies = view === 'trophies';

        if (isMain && canReturnToStoryMap) {
            messageText.setVisible(true);
            footerText.setVisible(false);
            strategoVictoryText.setVisible(false);
            bossRushVictoryText.setVisible(false);
            rewardSummaryText.setVisible(rewardSequencePlayed && hasRewardSummary);
            goldRewardDisplay.setVisible(rewardSequencePlayed && storyGoldReward > 0);
            conversionText.setVisible(false);
            postConversionText.setVisible(false);
            starRewardDisplay.setVisible(rewardSequencePlayed && storyStarsReward > 0);
            bossRushNextPotionsText.setVisible(rewardSequencePlayed && hasBossRushNextPotions);
            bossRushNextPotionsDisplay.setVisible(rewardSequencePlayed && hasBossRushNextPotions);
            fightBossUnlockText.setVisible(rewardSequencePlayed && shouldShowFightBossUnlockMessage);
            potionUnlockText.setVisible(rewardSequencePlayed && Boolean(unlockedStoryPotion || rewardedStoryFragment));
            potionUnlockDisplay.setVisible(rewardSequencePlayed && Boolean(unlockedStoryPotion || rewardedStoryFragment));
            if (!rewardSequencePlayed) {
                revealRewardSequence();
            }
        } else if (isMain && shouldConvertGoldToStars) {
            messageText.setVisible(true);
            footerText.setVisible(false);
            strategoVictoryText.setVisible(false);
            bossRushVictoryText.setVisible(false);
            rewardSummaryText.setVisible(rewardSequencePlayed && hasRewardSummary);
            goldRewardDisplay.setVisible(rewardSequencePlayed && storyGoldReward > 0);
            conversionText.setVisible(rewardSequencePlayed);
            postConversionText.setVisible(rewardSequencePlayed && ogreConversionCompleted && Boolean(ogrePostConversionMessage));
            starRewardDisplay.setVisible(rewardSequencePlayed);
            bossRushNextPotionsText.setVisible(false);
            bossRushNextPotionsDisplay.setVisible(false);
            fightBossUnlockText.setVisible(rewardSequencePlayed && shouldShowFightBossUnlockMessage);
            potionUnlockText.setVisible(false);
            potionUnlockDisplay.setVisible(false);
            if (!rewardSequencePlayed) {
                revealRewardSequence();
            }
        } else if (isMain && hasRewardSummary) {
            messageText.setVisible(true);
            footerText.setVisible(Boolean(footerMessage));
            strategoVictoryText.setVisible(false);
            bossRushVictoryText.setVisible(Boolean(bossRushVictoryFollowup));
            rewardSummaryText.setVisible(rewardSequencePlayed);
            goldRewardDisplay.setVisible(rewardSequencePlayed && storyGoldReward > 0);
            conversionText.setVisible(false);
            postConversionText.setVisible(false);
            starRewardDisplay.setVisible(rewardSequencePlayed && storyStarsReward > 0);
            bossRushNextPotionsText.setVisible(rewardSequencePlayed && hasBossRushNextPotions);
            bossRushNextPotionsDisplay.setVisible(rewardSequencePlayed && hasBossRushNextPotions);
            fightBossUnlockText.setVisible(rewardSequencePlayed && shouldShowFightBossUnlockMessage);
            potionUnlockText.setVisible(false);
            potionUnlockDisplay.setVisible(false);
            if (!rewardSequencePlayed) {
                revealRewardSequence();
            }
        } else if (isMain && hasBossRushNextPotions) {
            messageText.setVisible(true);
            footerText.setVisible(Boolean(footerMessage));
            strategoVictoryText.setVisible(false);
            bossRushVictoryText.setVisible(Boolean(bossRushVictoryFollowup));
            rewardSummaryText.setVisible(false);
            goldRewardDisplay.setVisible(false);
            conversionText.setVisible(false);
            postConversionText.setVisible(false);
            starRewardDisplay.setVisible(false);
            bossRushNextPotionsText.setVisible(rewardSequencePlayed);
            bossRushNextPotionsDisplay.setVisible(rewardSequencePlayed);
            fightBossUnlockText.setVisible(false);
            potionUnlockText.setVisible(false);
            potionUnlockDisplay.setVisible(false);
            if (!rewardSequencePlayed) {
                revealRewardSequence();
            }
        } else {
            messageText.setVisible(isMain);
            footerText.setVisible(isMain && Boolean(footerMessage) && !canReturnToStoryMap);
            strategoVictoryText.setVisible(false);
            bossRushVictoryText.setVisible(false);
            rewardSummaryText.setVisible(false);
            goldRewardDisplay.setVisible(false);
            conversionText.setVisible(false);
            postConversionText.setVisible(false);
            starRewardDisplay.setVisible(false);
            bossRushNextPotionsText.setVisible(false);
            bossRushNextPotionsDisplay.setVisible(false);
            fightBossUnlockText.setVisible(false);
            potionUnlockText.setVisible(false);
            potionUnlockDisplay.setVisible(false);
        }

        statsText.setVisible(isStats);
        potionStatsRow.container.setVisible(isStats);
        trophyList.setVisible(isTrophies);

        phoenixButton.container.setVisible(Boolean(canUsePhoenixRetry));
        retryButton.container.setVisible(Boolean(canUseStrategoRetry));
        const canSwitchSecondaryView = !shouldConvertGoldToStars || ogreConversionCompleted;
        statsButton.container.setVisible(!hideStatsButton && (isMain || isTrophies) && canSwitchSecondaryView);
        trophiesButton.container.setVisible((isMain || isStats) && canSwitchSecondaryView);
        menuButton.container.setVisible(true);
        if (shouldConvertGoldToStars) {
            menuButton.container.setAlpha(ogreConversionCompleted ? 1 : 0.7);
        }

        if (isTrophies) {
            this.scene.trophies.markViewed();
            trophiesDot.setVisible(false);
        }

        if (isTrophies) {
            phoenixButton.container.setPosition(centerX, parchmentBottomY - (isNarrowViewport ? 116 : 128));
            retryButton.container.setPosition(centerX, parchmentBottomY - (isNarrowViewport ? 74 : 82));
            statsButton.container.setPosition(centerX, parchmentBottomY - (isNarrowViewport ? 74 : 82));
            menuButton.container.setPosition(centerX, parchmentBottomY - (isNarrowViewport ? 32 : 36));
        } else if (isStats) {
            phoenixButton.container.setPosition(centerX, parchmentBottomY - (isNarrowViewport ? 116 : 128));
            retryButton.container.setPosition(centerX, parchmentBottomY - (isNarrowViewport ? 74 : 82));
            trophiesButton.container.setPosition(centerX, parchmentBottomY - (isNarrowViewport ? 74 : 82));
            menuButton.container.setPosition(centerX, parchmentBottomY - (isNarrowViewport ? 32 : 36));
        } else {
            phoenixButton.container.setPosition(centerX, parchmentBottomY - (isNarrowViewport ? 158 : 174));
            retryButton.container.setPosition(centerX, parchmentBottomY - (isNarrowViewport ? 158 : 174));
            if (!hideStatsButton) {
                statsButton.container.setPosition(centerX, parchmentBottomY - (isNarrowViewport ? 116 : 128));
            }
            menuButton.container.setPosition(centerX, parchmentBottomY - (isNarrowViewport ? 32 : 36));
        }
    }
}
