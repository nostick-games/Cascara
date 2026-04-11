class GameBoardEndPanelRewards {
    constructor(endPanel) {
        this.endPanel = endPanel;
        this.scene = endPanel.scene;
        this.reveal = endPanel.reveal;
    }

    playSequence(context) {
        const {
            canStartRewardSequence,
            hasRewardSummary,
            canReturnToStoryMap,
            shouldConvertGoldToStars,
            hasBossRushNextPotions,
            rewardSequencePlayed,
            resultType,
            footerMessage,
            messageText,
            footerText,
            rewardSummaryText,
            goldRewardDisplay,
            conversionText,
            postConversionText,
            strategoVictoryText,
            bossRushVictoryText,
            starRewardDisplay,
            fightBossUnlockText,
            potionUnlockText,
            potionUnlockDisplay,
            bossRushNextPotionsText,
            bossRushNextPotionsDisplay,
            strategoVictoryFollowup,
            bossRushVictoryFollowup,
            storyGoldReward,
            storyStarsReward,
            baseGold,
            baseStars,
            shouldShowFightBossUnlockMessage,
            goldRewardAnimationDuration,
            ogrePostConversionMessage,
            unlockedStoryPotion,
            rewardedStoryFragment,
            menuButton,
            activeView,
            onRewardSequenceStart,
            onOgreConversionComplete
        } = context;

        if (!canStartRewardSequence || (!hasRewardSummary && !canReturnToStoryMap && !shouldConvertGoldToStars && !hasBossRushNextPotions) || rewardSequencePlayed) {
            return false;
        }

        if (onRewardSequenceStart) {
            onRewardSequenceStart();
        }

        messageText.setVisible(true);
        footerText.setVisible(resultType === 'defeat' && Boolean(footerMessage));
        rewardSummaryText.setVisible(false);
        goldRewardDisplay.setVisible(false);
        conversionText.setVisible(false);
        postConversionText.setVisible(false);
        strategoVictoryText.setVisible(false);
        bossRushVictoryText.setVisible(false);
        starRewardDisplay.setVisible(false);
        fightBossUnlockText.setVisible(false);
        potionUnlockText.setVisible(false);
        potionUnlockDisplay.setVisible(false);
        bossRushNextPotionsText.setVisible(false);
        bossRushNextPotionsDisplay.setVisible(false);

        const steps = [
            {
                delay: (strategoVictoryFollowup || bossRushVictoryFollowup) ? 180 : 0,
                run: () => {
                    if (strategoVictoryFollowup) {
                        this.reveal.revealTarget(strategoVictoryText);
                    }
                    if (bossRushVictoryFollowup) {
                        this.reveal.revealTarget(bossRushVictoryText);
                    }
                }
            },
            {
                delay: 350,
                run: () => {
                    if (hasRewardSummary) {
                        this.reveal.revealTarget(rewardSummaryText);
                    }
                }
            },
            {
                delay: 450,
                run: () => {
                    if (storyGoldReward > 0 || storyStarsReward > 0) {
                        if (storyGoldReward > 0) {
                            this.reveal.revealTarget(goldRewardDisplay.container, 0, () => {
                                goldRewardDisplay.setVisible(true);
                            });
                        }
                        if (!shouldConvertGoldToStars && storyStarsReward > 0) {
                            this.reveal.revealTarget(starRewardDisplay.container, 0, () => {
                                starRewardDisplay.setVisible(true);
                            });
                        }
                    }
                }
            },
            {
                delay: 450,
                run: () => {
                    if (storyStarsReward > 0 && !shouldConvertGoldToStars) {
                        starRewardDisplay.animateReward(baseStars, baseStars + storyStarsReward);
                    }
                }
            },
            {
                delay: hasBossRushNextPotions ? 700 : 0,
                run: () => {
                    if (hasBossRushNextPotions) {
                        this.reveal.revealTarget(bossRushNextPotionsText);
                    }
                }
            },
            {
                delay: hasBossRushNextPotions ? 320 : 0,
                run: () => {
                    if (hasBossRushNextPotions) {
                        this.reveal.revealTarget(bossRushNextPotionsDisplay.container, 0, () => {
                            bossRushNextPotionsDisplay.setVisible(true);
                        });
                    }
                }
            },
            {
                delay: shouldShowFightBossUnlockMessage ? 360 : 0,
                run: () => {
                    if (shouldShowFightBossUnlockMessage) {
                        this.reveal.revealTarget(fightBossUnlockText, 0, () => {
                            if (typeof this.scene.markFightBossUnlockMessageSeen === 'function') {
                                this.scene.markFightBossUnlockMessageSeen();
                            }
                        });
                    }
                }
            },
            ...(shouldConvertGoldToStars
                ? [
                    {
                        delay: goldRewardAnimationDuration + 180,
                        run: () => {
                            this.reveal.revealTarget(conversionText);
                        }
                    },
                    {
                        delay: 250,
                        run: () => {
                            if (storyGoldReward > 0) {
                                goldRewardDisplay.setVisible(true);
                            }
                            this.reveal.revealTarget(starRewardDisplay.container, 0, () => {
                                starRewardDisplay.setVisible(true);
                            });
                            this.endPanel.animateGoldToStarsConversion(
                                goldRewardDisplay,
                                starRewardDisplay,
                                baseGold + storyGoldReward,
                                baseStars + storyStarsReward,
                                () => {
                                    if (onOgreConversionComplete) {
                                        onOgreConversionComplete();
                                    }
                                    if (ogrePostConversionMessage) {
                                        this.reveal.revealTarget(postConversionText);
                                    }
                                    menuButton.hitArea.setInteractive({ useHandCursor: true });
                                    menuButton.container.setAlpha(1);
                                }
                            );
                        }
                    }
                ]
                : [
                    {
                        delay: 800,
                        run: () => {
                            if (unlockedStoryPotion || rewardedStoryFragment) {
                                this.reveal.revealTarget(potionUnlockText);
                            }
                        }
                    },
                    {
                        delay: 420,
                        run: () => {
                            if (unlockedStoryPotion || rewardedStoryFragment) {
                                this.reveal.revealTarget(potionUnlockDisplay.container, 0, () => {
                                    potionUnlockDisplay.setVisible(true);
                                });
                            }
                        }
                    }
                ])
        ];

        let cumulativeDelay = 0;
        steps.forEach((step) => {
            cumulativeDelay += step.delay;
            this.scene.time.delayedCall(cumulativeDelay, () => {
                if (!this.scene.scene.isActive() || activeView() !== 'main') {
                    return;
                }
                step.run();
            });
        });

        return true;
    }
}
