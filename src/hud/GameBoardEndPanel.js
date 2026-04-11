class GameBoardEndPanel {
    constructor(hud) {
        this.hud = hud;
        this.board = hud.board;
        this.scene = hud.scene;
        this.statsView = new GameBoardEndStatsView(this);
        this.trophiesView = new GameBoardEndTrophiesView(this);
    }

    showGameOver(winData) {
        const winner = winData.leader;
        if (winner.color !== 'ROUGE') {
            this.showDefeat(winner.color);
            return;
        }

        const winThreshold = this.scene.getGoalGaugeThreshold?.()
            || GameLogic.getWinThreshold(this.board.GRID_SIZE, this.scene.gameState.playerOrder.length);
        this.hud.animateGoalGaugeTo(winThreshold, () => {
            this.hud.playEnemyDeathAnimations();
            this.board.playWinnerFocusIris('ROUGE', () => {
                this.board.animateWinningTerritory('ROUGE', () => {
                    this.showEndPanel('victory');
                });
            });
        });
    }

    showDefeat(winnerColor = null) {
        this.board.playWinnerFocusIris(winnerColor, () => {
            this.board.animateWinningTerritory(winnerColor, () => {
                this.hud.playHeroDefeatAnimation();
                this.showEndPanel('defeat');
            });
        });
    }

    showEndPanel(resultType) {
        this.board.showEndScreenMonochrome();

        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;
        const isNarrowViewport = this.scene.scale.width < 500;
        const viewportWidth = this.scene.scale.width;
        const viewportHeight = this.scene.scale.height;
        const parchmentMaxWidth = isNarrowViewport
            ? viewportWidth - 22
            : Math.min(viewportWidth - 88, this.board.GAUGE_WIDTH + 90);
        const parchmentMaxHeight = isNarrowViewport
            ? viewportHeight - 28
            : Math.min(viewportHeight - 72, viewportHeight * 0.78);
        const parchmentScale = Math.min(
            parchmentMaxWidth / 320,
            parchmentMaxHeight / 480
        ) * (isNarrowViewport ? 1 : 0.85);
        const parchmentWidth = 320 * parchmentScale;
        const parchmentHeight = 480 * parchmentScale;
        const parchmentTopY = centerY - parchmentHeight / 2;
        const parchmentBottomY = centerY + parchmentHeight / 2;
        const parchmentTextWidth = Math.max(180, parchmentWidth - (isNarrowViewport ? 54 : 74));
        const contentVerticalShift = isNarrowViewport ? -54 : -46;
        const parchment = this.scene.add.image(centerX, centerY, 'ui-parchment')
            .setOrigin(0.5)
            .setScale(parchmentScale)
            .setAngle(90)
            .setDepth(40);

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
        if (storyStarsReward > 0 || ogreConversionStars > 0) {
            MetaProgression.addStars(storyStarsReward + ogreConversionStars);
        }
        const goldRewardAnimationDuration = Math.min(1800, Math.max(700, storyGoldReward * 35));
        const hasBossVictoryMessage = Boolean(bossVictoryMessage);
        const messageY = hasBossVictoryMessage
            ? centerY - (isNarrowViewport ? 104 : 122)
            : centerY - (isNarrowViewport ? 72 : 82);
        const footerY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 18 : 8)
            : centerY - (isNarrowViewport ? 22 : 28);
        const goldRewardTextY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 26 : 20)
            : centerY - (isNarrowViewport ? 22 : 28);
        const goldRewardDisplayY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 58 : 64)
            : centerY + (isNarrowViewport ? 12 : 16);
        const rewardTitleY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 92 : 104)
            : centerY + (isNarrowViewport ? 44 : 52);
        const rewardDisplayY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 138 : 154)
            : centerY + (isNarrowViewport ? 90 : 104);
        const conversionTextY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 92 : 104)
            : centerY + (isNarrowViewport ? 44 : 52);
        const starDisplayY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 128 : 144)
            : centerY + (isNarrowViewport ? 86 : 98);
        const rewardSummaryY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 26 : 20)
            : centerY - (isNarrowViewport ? 22 : 28);
        const countersRowY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 58 : 64)
            : centerY + (isNarrowViewport ? 12 : 16);
        const shouldLowerDefeatRewardSummary =
            resultType === 'defeat' &&
            !hasBossVictoryMessage;
        const adjustedRewardSummaryY = shouldLowerDefeatRewardSummary
            ? rewardSummaryY + (isNarrowViewport ? 38 : 44)
            : rewardSummaryY;
        const adjustedCountersRowY = shouldLowerDefeatRewardSummary
            ? countersRowY + (isNarrowViewport ? 38 : 44)
            : countersRowY;
        const ogreConversionSpacing = shouldConvertGoldToStars
            ? (isNarrowViewport ? 42 : 50)
            : 0;
        const fightBossUnlockSpacing = shouldShowFightBossUnlockMessage
            ? (isNarrowViewport ? 34 : 42)
            : 0;
        const strategoVictorySpacing = strategoVictoryFollowup
            ? (isNarrowViewport ? 32 : 40)
            : 0;
        const bossRushVictorySpacing = bossRushVictoryFollowup
            ? (isNarrowViewport ? 26 : 32)
            : 0;
        const adjustedRewardTitleY = rewardTitleY + fightBossUnlockSpacing;
        const adjustedRewardDisplayY = rewardDisplayY + fightBossUnlockSpacing;
        const fightBossUnlockTextY = Math.round((adjustedCountersRowY + adjustedRewardTitleY) / 2) + 8;
        const bossRushNextPotionsTitleY = rewardTitleY;
        const bossRushNextPotionsDisplayY = rewardDisplayY + (isNarrowViewport ? 8 : 12);

        const messageText = this.scene.add.text(centerX, messageY + contentVerticalShift, titleMessage, {
            fontSize: isNarrowViewport ? '19px' : '24px',
            fill: '#3b2419',
            fontFamily: 'Vollkorn',
            align: 'center',
            wordWrap: { width: parchmentTextWidth }
        }).setOrigin(0.5).setDepth(41);

        const footerText = this.scene.add.text(centerX, footerY + contentVerticalShift, footerMessage, {
            fontSize: isNarrowViewport ? '15px' : '18px',
            fill: '#5d3b2b',
            fontFamily: 'Vollkorn',
            fontStyle: 'italic',
            align: 'center'
        }).setOrigin(0.5).setDepth(41).setVisible(Boolean(footerMessage));
        const strategoVictoryText = this.scene.add.text(centerX, footerY + contentVerticalShift, strategoVictoryFollowup, {
            fontSize: isNarrowViewport ? '15px' : '18px',
            fill: '#5d3b2b',
            fontFamily: 'Vollkorn',
            fontStyle: 'italic',
            align: 'center',
            wordWrap: { width: parchmentTextWidth }
        }).setOrigin(0.5).setDepth(41).setVisible(Boolean(strategoVictoryFollowup));
        const bossRushVictoryText = this.scene.add.text(centerX, footerY + contentVerticalShift, bossRushVictoryFollowup, {
            fontSize: isNarrowViewport ? '15px' : '18px',
            fill: '#5d3b2b',
            fontFamily: 'Vollkorn',
            fontStyle: 'italic',
            align: 'center',
            wordWrap: { width: parchmentTextWidth }
        }).setOrigin(0.5).setDepth(41).setVisible(Boolean(bossRushVictoryFollowup));
        const rewardSummaryText = this.scene.add.text(
            centerX,
            adjustedRewardSummaryY + strategoVictorySpacing + bossRushVictorySpacing + contentVerticalShift,
            rewardSummaryTextValue,
            {
                fontSize: isNarrowViewport ? '14px' : '17px',
                fill: '#5d3b2b',
                fontFamily: 'Vollkorn',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(41).setVisible(false);
        const goldRewardDisplay = this.createStoryGoldRewardDisplay(
            shouldConvertGoldToStars
                ? centerX
                : centerX - (isNarrowViewport ? 48 : 56),
            adjustedCountersRowY + strategoVictorySpacing + bossRushVictorySpacing + contentVerticalShift,
            isNarrowViewport,
            storyGoldReward,
            baseGold
        );
        const conversionText = this.scene.add.text(
            centerX,
            conversionTextY + ogreConversionSpacing + contentVerticalShift,
            TranslationManager.t('story.convert_gold_to_stars'),
            {
                fontSize: isNarrowViewport ? '14px' : '17px',
                fill: '#5d3b2b',
                fontFamily: 'Vollkorn',
                align: 'center',
                wordWrap: { width: parchmentTextWidth }
            }
        ).setOrigin(0.5).setDepth(41).setVisible(false);
        const postConversionText = this.scene.add.text(
            centerX,
            starDisplayY + ogreConversionSpacing + contentVerticalShift + (isNarrowViewport ? 46 : 56),
            ogrePostConversionMessage,
            {
                fontSize: isNarrowViewport ? '18px' : '22px',
                fill: '#5d3b2b',
                fontFamily: 'Vollkorn',
                align: 'center',
                wordWrap: { width: parchmentTextWidth }
            }
        ).setOrigin(0.5).setDepth(41).setVisible(false);
        const starRewardDisplay = this.createStoryStarRewardDisplay(
            shouldConvertGoldToStars
                ? centerX
                : centerX + (storyGoldReward > 0 ? (isNarrowViewport ? 48 : 56) : 0),
            shouldConvertGoldToStars
                ? starDisplayY + ogreConversionSpacing + contentVerticalShift
                : adjustedCountersRowY + strategoVictorySpacing + bossRushVictorySpacing + contentVerticalShift,
            isNarrowViewport,
            baseStars
        );
        const fightBossUnlockText = this.scene.add.text(
            centerX,
            fightBossUnlockTextY + contentVerticalShift,
            TranslationManager.t('story.fight_boss_unlocked'),
            {
                fontSize: isNarrowViewport ? '14px' : '17px',
                fill: '#5d3b2b',
                fontFamily: 'Vollkorn',
                align: 'center',
                wordWrap: { width: parchmentTextWidth }
            }
        ).setOrigin(0.5).setDepth(41).setVisible(false);
        const potionUnlockText = this.scene.add.text(
            centerX,
            adjustedRewardTitleY + contentVerticalShift,
            TranslationManager.t(rewardedStoryFragment ? 'story.fragment_unlocked' : 'story.potion_unlocked'),
            {
                fontSize: isNarrowViewport ? '14px' : '17px',
                fill: '#5d3b2b',
                fontFamily: 'Vollkorn',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(41).setVisible(Boolean(canReturnToStoryMap && (unlockedStoryPotion || rewardedStoryFragment)));
        const potionUnlockDisplay = this.createStoryRewardDisplay(
            centerX,
            adjustedRewardDisplayY + contentVerticalShift,
            parchmentTextWidth,
            isNarrowViewport,
            unlockedStoryPotion,
            rewardedStoryFragment
        );
        const bossRushNextPotionsText = this.scene.add.text(
            centerX,
            bossRushNextPotionsTitleY + contentVerticalShift,
            TranslationManager.t('boss_rush.next_combat_potions'),
            {
                fontSize: isNarrowViewport ? '14px' : '17px',
                fill: '#5d3b2b',
                fontFamily: 'Vollkorn',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(41).setVisible(false);
        const bossRushNextPotionsDisplay = this.createBossRushPotionPreview(
            centerX,
            bossRushNextPotionsDisplayY + contentVerticalShift,
            isNarrowViewport,
            bossRushNextPotions
        );

        const statsText = this.scene.add.text(centerX, parchmentTopY + (isNarrowViewport ? 28 : 34), this.buildEndStatsText(), {
            fontSize: isNarrowViewport ? '16px' : '19px',
            fill: '#4a2d20',
            fontFamily: 'Vollkorn',
            align: 'center',
            lineSpacing: 8,
            wordWrap: { width: parchmentTextWidth }
        }).setOrigin(0.5, 0).setDepth(41).setVisible(false);
        const potionStatsRow = this.createPotionStatsRow(
            centerX,
            parchmentTopY + (isNarrowViewport ? 156 : 174),
            isNarrowViewport
        );
        potionStatsRow.container.setVisible(false);
        const trophyList = this.createTrophyScrollArea(
            centerX,
            parchmentTopY + (isNarrowViewport ? 26 : 32),
            parchmentTextWidth,
            parchmentHeight - (isNarrowViewport ? 150 : 170),
            isNarrowViewport
        );
        trophyList.setVisible(false);

        const statsButton = this.createStyledMenuButton(
            centerX,
            parchmentBottomY - (isNarrowViewport ? 116 : 128),
            isNarrowViewport ? 158 : 198,
            42,
            TranslationManager.t('hud.statistics')
        );
        const trophiesButton = this.createStyledMenuButton(
            centerX,
            parchmentBottomY - (isNarrowViewport ? 74 : 82),
            isNarrowViewport ? 158 : 198,
            42,
            TranslationManager.t('hud.trophies'),
            isNarrowViewport ? '14px' : '15px'
        );
        const phoenixButton = this.createStyledMenuButton(
            centerX,
            parchmentBottomY - (isNarrowViewport ? 158 : 174),
            isNarrowViewport ? 188 : 232,
            42,
            TranslationManager.t('hud.phoenix_retry'),
            isNarrowViewport ? '14px' : '16px',
            { fillTint: 0x9e2a2b, fillTintOn: 0xbb3e3f }
        );
        phoenixButton.container.setVisible(Boolean(canUsePhoenixRetry));
        const retryButton = this.createStyledMenuButton(
            centerX,
            parchmentBottomY - (isNarrowViewport ? 158 : 174),
            isNarrowViewport ? 188 : 232,
            42,
            TranslationManager.t('hud.retry'),
            isNarrowViewport ? '14px' : '16px'
            ,
            { fillTint: 0x9e2a2b, fillTintOn: 0xbb3e3f }
        );
        retryButton.container.setVisible(Boolean(canUseStrategoRetry));
        const trophiesDot = this.scene.add.circle(
            (isNarrowViewport ? 158 : 198) / 2 - 12,
            -10,
            5,
            0xe03131,
            1
        ).setVisible(Boolean(this.scene.gameState.playerStats?.trophyTracker?.newlyUnlockedTrophies?.length));
        trophiesButton.container.add(trophiesDot);
        const menuButton = this.createStyledMenuButton(
            centerX,
            parchmentBottomY - (isNarrowViewport ? 32 : 36),
            isNarrowViewport ? 188 : 228,
            42,
            canReturnToStoryMap
                ? TranslationManager.t('hud.return_to_map')
                : (canContinueBossRush
                    ? TranslationManager.t('boss_rush.next_battle')
                    : (shouldReturnToMainMenu
                        ? TranslationManager.t('hud.back_to_menu')
                        : TranslationManager.t('hud.selection_menu'))),
            isNarrowViewport ? '14px' : '16px'
        );
        let rewardSequencePlayed = false;
        let ogreConversionCompleted = !shouldConvertGoldToStars;
        let activeView = 'main';
        let canStartRewardSequence = false;

        if (shouldConvertGoldToStars) {
            menuButton.hitArea.disableInteractive();
            menuButton.container.setAlpha(0.7);
        }

        const revealRewardSequence = () => {
            if (!canStartRewardSequence || (!hasRewardSummary && !canReturnToStoryMap && !shouldConvertGoldToStars && !hasBossRushNextPotions) || rewardSequencePlayed) {
                return;
            }

            rewardSequencePlayed = true;

            messageText.setVisible(true);
            footerText.setVisible(resultType === 'defeat' && Boolean(footerMessage));
            rewardSummaryText.setVisible(false);
            goldRewardDisplay.setVisible(false);
            conversionText.setVisible(false);
            postConversionText.setVisible(false);
            strategoVictoryText.setVisible(false);
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
                            this.revealEndPanelTarget(strategoVictoryText);
                        }
                        if (bossRushVictoryFollowup) {
                            this.revealEndPanelTarget(bossRushVictoryText);
                        }
                    }
                },
                {
                    delay: 350,
                    run: () => {
                        if (hasRewardSummary) {
                            this.revealEndPanelTarget(rewardSummaryText);
                        }
                    }
                },
                {
                    delay: 450,
                    run: () => {
                        if (storyGoldReward > 0 || storyStarsReward > 0) {
                            if (storyGoldReward > 0) {
                                this.revealEndPanelTarget(goldRewardDisplay.container, 0, () => {
                                    goldRewardDisplay.setVisible(true);
                                });
                            }
                            if (!shouldConvertGoldToStars) {
                                if (storyStarsReward > 0) {
                                    this.revealEndPanelTarget(starRewardDisplay.container, 0, () => {
                                        starRewardDisplay.setVisible(true);
                                    });
                                }
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
                            this.revealEndPanelTarget(bossRushNextPotionsText);
                        }
                    }
                },
                {
                    delay: hasBossRushNextPotions ? 320 : 0,
                    run: () => {
                        if (hasBossRushNextPotions) {
                            this.revealEndPanelTarget(bossRushNextPotionsDisplay.container, 0, () => {
                                bossRushNextPotionsDisplay.setVisible(true);
                            });
                        }
                    }
                },
                {
                    delay: shouldShowFightBossUnlockMessage ? 360 : 0,
                    run: () => {
                        if (shouldShowFightBossUnlockMessage) {
                            this.revealEndPanelTarget(fightBossUnlockText, 0, () => {
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
                                this.revealEndPanelTarget(conversionText);
                            }
                        },
                        {
                            delay: 250,
                            run: () => {
                                if (storyGoldReward > 0) {
                                    goldRewardDisplay.setVisible(true);
                                }
                                this.revealEndPanelTarget(starRewardDisplay.container, 0, () => {
                                    starRewardDisplay.setVisible(true);
                                });
                                this.animateGoldToStarsConversion(
                                    goldRewardDisplay,
                                    starRewardDisplay,
                                    baseGold + storyGoldReward,
                                    baseStars + storyStarsReward,
                                    () => {
                                        ogreConversionCompleted = true;
                                        if (ogrePostConversionMessage) {
                                            this.revealEndPanelTarget(postConversionText);
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
                                    this.revealEndPanelTarget(potionUnlockText);
                                }
                            }
                        },
                        {
                            delay: 420,
                            run: () => {
                                if (unlockedStoryPotion || rewardedStoryFragment) {
                                    this.revealEndPanelTarget(potionUnlockDisplay.container, 0, () => {
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
                    if (!this.scene.scene.isActive() || activeView !== 'main') {
                        return;
                    }
                    step.run();
                });
            });
        };

        const setView = (view) => {
            activeView = view;
            const isMain = view === 'main';
            const isStats = view === 'stats';
            const isTrophies = view === 'trophies';

            if (isMain && canReturnToStoryMap) {
                messageText.setVisible(true);
                footerText.setVisible(false);
                strategoVictoryText.setVisible(false);
                rewardSummaryText.setVisible(rewardSequencePlayed && hasRewardSummary);
                goldRewardDisplay.setVisible(rewardSequencePlayed && storyGoldReward > 0);
                conversionText.setVisible(false);
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
                footerText.setVisible(isMain && Boolean(footerMessage));
                strategoVictoryText.setVisible(false);
                bossRushVictoryText.setVisible(isMain && Boolean(bossRushVictoryFollowup));
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
                footerText.setVisible(isMain && Boolean(footerMessage));
                strategoVictoryText.setVisible(false);
                bossRushVictoryText.setVisible(isMain && Boolean(bossRushVictoryFollowup));
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
        };

        phoenixButton.hitArea.on('pointerdown', () => {
            phoenixButton.setState(true);
            const fragment = StoryFragmentCatalog.getById('PHOENIX');
            this.hud.showFragmentActivationNotification(
                fragment,
                TranslationManager.t('fragment.phoenix.start_message'),
                TranslationManager.t('fragment.activation.confirm'),
                () => {
                    const storyState = this.scene.storyContext?.storyState || {};
                    const refreshedStoryContext = {
                        ...this.scene.storyContext,
                        storyState: {
                            ...storyState,
                            fragments: StoryFragmentInventory.decrementCount(storyState.fragments || {}, 'PHOENIX'),
                            activeFragmentId: null,
                            activeFragmentIds: [],
                            activeBossBlessingId: null,
                            fragmentChosenForBattle: false,
                            bossBlessingChosenForBattle: false,
                            confusedEnemyColor: null
                        }
                    };
                    this.scene.scene.start('BriefingScene', {
                        aiCount: this.scene.aiCount,
                        boardSize: this.scene.boardSize,
                        difficulty: this.scene.difficulty,
                        language: TranslationManager.getLanguage(),
                        enemyAssignments: this.scene.preselectedEnemyAssignments,
                        progressPotions: this.scene.preselectedProgressPotions,
                        storyNodeType: this.scene.storyNodeType,
                        storyContext: refreshedStoryContext,
                        storyGoldReward: this.scene.storyGoldReward
                    });
                }
            );
        });
        phoenixButton.hitArea.on('pointerover', () => phoenixButton.setState(true));
        phoenixButton.hitArea.on('pointerout', () => phoenixButton.setState(false));

        retryButton.hitArea.on('pointerdown', () => {
            retryButton.setState(true);
            this.scene.scene.start('GameScene', {
                aiCount: 0,
                boardSize: this.scene.boardSize,
                difficulty: this.scene.difficulty,
                language: TranslationManager.getLanguage(),
                arcadeKingdomId: this.scene.arcadeKingdomId || 'VERDOMBRE',
                strategoConfig: this.scene.strategoConfig
            });
        });
        retryButton.hitArea.on('pointerover', () => retryButton.setState(true));
        retryButton.hitArea.on('pointerout', () => retryButton.setState(false));

        statsButton.hitArea.on('pointerdown', () => {
            setView('stats');
        });
        statsButton.hitArea.on('pointerover', () => statsButton.setState(true));
        statsButton.hitArea.on('pointerout', () => statsButton.setState(false));

        trophiesButton.hitArea.on('pointerdown', () => {
            setView('trophies');
        });
        trophiesButton.hitArea.on('pointerover', () => trophiesButton.setState(true));
        trophiesButton.hitArea.on('pointerout', () => trophiesButton.setState(false));

        menuButton.hitArea.on('pointerdown', () => {
            menuButton.setState(true);
            if (canReturnToStoryMap) {
                this.scene.scene.start('StoryModePlaceholderScene', {
                    language: TranslationManager.getLanguage(),
                    storyState: this.scene.buildAdvancedStoryState()
                });
                return;
            }

            if (canContinueBossRush) {
                this.scene.continueBossRush();
                return;
            }

            if (this.scene.isBossRushMode) {
                this.scene.returnToBossRushMenu();
                return;
            }

            this.scene.scene.start('MainMenuScene', { language: TranslationManager.getLanguage() });
        });
        menuButton.hitArea.on('pointerover', () => menuButton.setState(true));
        menuButton.hitArea.on('pointerout', () => menuButton.setState(false));

        setView('main');

        const introButtons = [phoenixButton, retryButton, statsButton, trophiesButton, menuButton];
        const introContentTargets = [
            messageText,
            rewardSummaryText,
            goldRewardDisplay.container,
            starRewardDisplay.container,
            fightBossUnlockText,
            conversionText,
            postConversionText,
            bossRushNextPotionsText,
            bossRushNextPotionsDisplay.container,
            footerText,
            strategoVictoryText,
            bossRushVictoryText,
            potionUnlockText,
            potionUnlockDisplay.container
        ];

        introContentTargets.forEach((target) => this.prepareEndPanelRevealTarget(target));
        introButtons.forEach((button) => {
            this.prepareEndPanelRevealTarget(button.container);
            button.hitArea.disableInteractive();
        });

        this.playParchmentReveal(parchment, centerX, parchmentTopY, parchmentWidth, parchmentHeight, () => {
            this.revealEndPanelTarget(messageText, 0);
            if (footerText.visible) {
                this.revealEndPanelTarget(footerText, 120);
            }
            if (strategoVictoryText.visible) {
                this.revealEndPanelTarget(strategoVictoryText, 120);
            }
            if (bossRushVictoryText.visible) {
                this.revealEndPanelTarget(bossRushVictoryText, 120);
            }

            this.scene.time.delayedCall(230, () => {
                canStartRewardSequence = true;
                revealRewardSequence();
            });

            const buttonsToReveal = introButtons.filter((button) => {
                if (button === phoenixButton) {
                    return Boolean(canUsePhoenixRetry);
                }

                if (button === retryButton) {
                    return Boolean(canUseStrategoRetry);
                }

                if (button === statsButton || button === trophiesButton) {
                    return !shouldConvertGoldToStars && (button !== statsButton || !hideStatsButton);
                }

                return true;
            });

            const buttonRevealDelay = 1100;
            buttonsToReveal.forEach((button, index) => {
                this.revealEndPanelTarget(button.container, buttonRevealDelay + index * 90, () => {
                    const shouldEnableMenuButton = !shouldConvertGoldToStars || ogreConversionCompleted;
                    if (
                        button === menuButton
                            ? shouldEnableMenuButton
                            : button.container.visible
                    ) {
                        button.hitArea.setInteractive({ useHandCursor: true });
                    }
                });
            });
        });
    }

    playParchmentReveal(parchment, centerX, topY, width, height, onComplete = null) {
        const maskGraphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        const mask = maskGraphics.createGeometryMask();
        parchment.setMask(mask);

        const progress = { value: 0 };
        this.scene.tweens.add({
            targets: progress,
            value: height,
            duration: 360,
            ease: 'Cubic.Out',
            onUpdate: () => {
                maskGraphics.clear();
                maskGraphics.fillStyle(0xffffff, 1);
                maskGraphics.fillRect(centerX - width / 2, topY, width, progress.value);
            },
            onComplete: () => {
                parchment.clearMask();
                maskGraphics.destroy();
                if (onComplete) {
                    onComplete();
                }
            }
        });
    }

    prepareEndPanelRevealTarget(target) {
        if (!target) {
            return;
        }
        target.setData('endPanelRevealBaseY', target.y);
        target.setAlpha(0);
        target.setVisible(false);
        target.y += 10;
    }

    revealEndPanelTarget(target, delay = 0, onComplete = null) {
        if (!target) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        this.scene.time.delayedCall(delay, () => {
            target.setVisible(true);
            this.scene.tweens.add({
                targets: target,
                alpha: 1,
                y: target.getData('endPanelRevealBaseY') ?? target.y,
                duration: 180,
                ease: 'Quad.Out',
                onComplete: () => {
                    if (onComplete) {
                        onComplete();
                    }
                }
            });
        });
    }

    createStoryGoldRewardDisplay(centerX, y, isNarrowViewport, reward, initialValue = 0) {
        const container = this.scene.add.container(centerX, y).setDepth(41);
        const iconSize = isNarrowViewport ? 24 : 28;
        const icon = this.scene.add.image(-(isNarrowViewport ? 20 : 24), 0, 'story-gold')
            .setOrigin(0.5)
            .setDisplaySize(iconSize, iconSize);
        const amountText = this.scene.add.text(isNarrowViewport ? 0 : 4, 0, `${initialValue}`, {
            fontSize: isNarrowViewport ? '18px' : '22px',
            fill: '#3b2419',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        container.add([icon, amountText]);
        container.setVisible(false);
        let animationStarted = false;
        let currentValue = initialValue;

        return {
            container,
            setValue: (value) => {
                currentValue = Math.max(0, Math.round(value));
                amountText.setText(`${currentValue}`);
            },
            getValue: () => currentValue,
            setVisible: (visible) => {
                container.setVisible(visible);
                if (visible && reward > 0 && !animationStarted) {
                    animationStarted = true;
                    amountText.setText(`${initialValue}`);
                    this.scene.tweens.addCounter({
                        from: initialValue,
                        to: initialValue + reward,
                        duration: Math.min(1800, Math.max(700, reward * 35)),
                        ease: 'Sine.easeOut',
                        onUpdate: (tween) => {
                            currentValue = Math.round(tween.getValue());
                            amountText.setText(`${currentValue}`);
                        }
                    });
                }
            }
        };
    }

    createStoryStarRewardDisplay(centerX, y, isNarrowViewport, initialValue = 0) {
        const container = this.scene.add.container(centerX, y).setDepth(41);
        const iconSize = isNarrowViewport ? 24 : 28;
        const icon = this.scene.add.image(-(isNarrowViewport ? 20 : 24), 0, 'meta-star')
            .setOrigin(0.5)
            .setDisplaySize(iconSize, iconSize);
        const amountText = this.scene.add.text(isNarrowViewport ? 0 : 4, 0, `${initialValue}`, {
            fontSize: isNarrowViewport ? '18px' : '22px',
            fill: '#3b2419',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        container.add([icon, amountText]);
        container.setVisible(false);
        let currentValue = initialValue;
        let animationStarted = false;

        return {
            container,
            setVisible: (visible) => {
                container.setVisible(visible);
            },
            setValue: (value) => {
                currentValue = Math.max(0, Math.round(value));
                amountText.setText(`${currentValue}`);
            },
            getValue: () => currentValue,
            animateReward: (fromValue, toValue) => {
                if (animationStarted) {
                    return;
                }
                animationStarted = true;
                this.scene.tweens.addCounter({
                    from: fromValue,
                    to: toValue,
                    duration: Math.min(1800, Math.max(700, Math.abs(toValue - fromValue) * 120)),
                    ease: 'Sine.easeOut',
                    onUpdate: (tween) => {
                        currentValue = Math.round(tween.getValue());
                        amountText.setText(`${currentValue}`);
                    }
                });
            }
        };
    }

    animateGoldToStarsConversion(goldDisplay, starDisplay, totalGold, baseStars, onComplete = null) {
        const safeTotalGold = Math.max(0, Math.floor(totalGold || 0));
        const awardedStars = safeTotalGold > 0 ? Math.ceil(safeTotalGold / 10) : 0;

        goldDisplay.setValue(safeTotalGold);
        starDisplay.setValue(baseStars);

        if (safeTotalGold <= 0) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        const duration = Math.min(2600, Math.max(1000, safeTotalGold * 18));
        this.scene.tweens.addCounter({
            from: safeTotalGold,
            to: 0,
            duration,
            ease: 'Sine.easeOut',
            onUpdate: (tween) => {
                const currentGold = Math.max(0, Math.round(tween.getValue()));
                const convertedGold = safeTotalGold - currentGold;
                let gainedStars = Math.floor(convertedGold / 10);

                if (currentGold === 0 && safeTotalGold % 10 !== 0) {
                    gainedStars += 1;
                }

                goldDisplay.setValue(currentGold);
                starDisplay.setValue(baseStars + gainedStars);
            },
            onComplete: () => {
                goldDisplay.setValue(0);
                starDisplay.setValue(baseStars + awardedStars);
                if (onComplete) {
                    onComplete();
                }
            }
        });
    }

    createStoryRewardDisplay(centerX, y, maxWidth, isNarrowViewport, potionDefinition, fragmentDefinition = null) {
        const container = this.scene.add.container(centerX, y).setDepth(41);
        container.setVisible(false);

        const rewardDefinition = potionDefinition || fragmentDefinition;
        if (!rewardDefinition) {
            return {
                container,
                setVisible: (visible) => {
                    container.setVisible(false);
                }
            };
        }

        const iconSize = isNarrowViewport ? 28 : 34;
        const icon = this.scene.add.image(-(maxWidth / 2) + (isNarrowViewport ? 22 : 30), 0, rewardDefinition.textureKey)
            .setOrigin(0.5)
            .setDisplaySize(iconSize, iconSize);
        const title = this.scene.add.text(
            -(maxWidth / 2) + (isNarrowViewport ? 44 : 56),
            -12,
            potionDefinition
                ? TranslationManager.t(`potion.${potionDefinition.id.toLowerCase()}.title`)
                : TranslationManager.t(fragmentDefinition.titleKey),
            {
                fontSize: isNarrowViewport ? '14px' : '17px',
                fill: '#3b2419',
                fontFamily: 'Vollkorn',
                fontStyle: 'bold',
                wordWrap: { width: maxWidth - (isNarrowViewport ? 54 : 70) }
            }
        ).setOrigin(0, 0.5);
        const desc = this.scene.add.text(
            -(maxWidth / 2) + (isNarrowViewport ? 44 : 56),
            12,
            potionDefinition
                ? TranslationManager.t(`potion.${potionDefinition.id.toLowerCase()}.desc`)
                : TranslationManager.t(fragmentDefinition.descKey),
            {
                fontSize: isNarrowViewport ? '12px' : '14px',
                fill: '#5d3b2b',
                fontFamily: 'Vollkorn',
                wordWrap: { width: maxWidth - (isNarrowViewport ? 54 : 70) }
            }
        ).setOrigin(0, 0.5);

        container.add([icon, title, desc]);

        return {
            container,
            setVisible: (visible) => {
                container.setVisible(visible);
            }
        };
    }

    createBossRushPotionPreview(centerX, y, isNarrowViewport, potions = []) {
        const container = this.scene.add.container(centerX, y).setDepth(41);
        container.setVisible(false);
        const spacing = isNarrowViewport ? 84 : 104;
        const iconSize = isNarrowViewport ? 38 : 46;

        (potions || []).slice(0, 3).forEach((potion, index) => {
            const x = (index - 1) * spacing;
            const icon = this.scene.add.image(x, -10, potion.textureKey)
                .setOrigin(0.5)
                .setDisplaySize(iconSize, iconSize);
            const label = this.scene.add.text(x, isNarrowViewport ? 18 : 24, TranslationManager.t(`potion.${potion.id.toLowerCase()}.title`), {
                fontSize: isNarrowViewport ? '11px' : '13px',
                fill: '#5d3b2b',
                fontFamily: 'Vollkorn',
                align: 'center',
                wordWrap: { width: isNarrowViewport ? 76 : 92 }
            }).setOrigin(0.5, 0);
            container.add([icon, label]);
        });

        return {
            container,
            setVisible: (visible) => {
                container.setVisible(visible);
            }
        };
    }

    buildEndStatsText() {
        return this.statsView.buildEndStatsText();
    }

    createPotionStatsRow(centerX, y, isNarrowViewport) {
        return this.statsView.createPotionStatsRow(centerX, y, isNarrowViewport);
    }

    createStyledMenuButton(x, y, width, height, label, fontSize = '15px', options = {}) {
        const leftWidth = 18;
        const rightWidth = 18;
        const fillWidth = Math.max(8, width - leftWidth - rightWidth);
        const fillTint = options.fillTint || null;
        const fillTintOn = options.fillTintOn || fillTint;
        const container = this.scene.add.container(x, y).setDepth(42);
        const left = this.scene.add.image(-width / 2 + leftWidth / 2, 0, 'ui-button-left-off')
            .setDisplaySize(leftWidth, height)
            .setOrigin(0.5);
        const fill = this.scene.add.image(0, 0, 'ui-button-fill-off')
            .setDisplaySize(fillWidth, height)
            .setOrigin(0.5);
        const right = this.scene.add.image(width / 2 - rightWidth / 2, 0, 'ui-button-right-off')
            .setDisplaySize(rightWidth, height)
            .setOrigin(0.5);
        const text = this.scene.add.text(0, 1, label, {
            fontSize,
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        const hitArea = this.scene.add.zone(0, 0, width, height)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        container.add([left, fill, right, text, hitArea]);

        const setState = (isOn) => {
            left.setTexture(isOn ? 'ui-button-left-on' : 'ui-button-left-off');
            fill.setTexture(isOn ? 'ui-button-fill-on' : 'ui-button-fill-off');
            right.setTexture(isOn ? 'ui-button-right-on' : 'ui-button-right-off');
            if (fillTint || fillTintOn) {
                const tintValue = isOn ? (fillTintOn || fillTint) : fillTint;
                [left, fill, right].forEach((part) => {
                    if (tintValue) {
                        part.setTint(tintValue);
                    } else {
                        part.clearTint();
                    }
                });
            }
            text.setColor(isOn ? '#fff8de' : '#f3e8d2');
        };

        setState(false);

        return { container, hitArea, setState };
    }

    createTrophyScrollArea(centerX, topY, width, height, isNarrowViewport) {
        return this.trophiesView.createTrophyScrollArea(centerX, topY, width, height, isNarrowViewport);
    }
}
