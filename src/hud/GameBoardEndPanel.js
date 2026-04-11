class GameBoardEndPanel {
    constructor(hud) {
        this.hud = hud;
        this.board = hud.board;
        this.scene = hud.scene;
        this.statsView = new GameBoardEndStatsView(this);
        this.trophiesView = new GameBoardEndTrophiesView(this);
        this.layout = new GameBoardEndPanelLayout(this);
        this.reveal = new GameBoardEndPanelReveal(this);
        this.rewards = new GameBoardEndPanelRewards(this);
        this.stateBuilder = new GameBoardEndPanelState(this);
        this.view = new GameBoardEndPanelView(this);
        this.actions = new GameBoardEndPanelActions(this);
        this.widgets = new GameBoardEndPanelWidgets(this);
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
        const parchmentLayout = this.layout.buildParchmentLayout({
            centerX,
            centerY,
            isNarrowViewport,
            viewportWidth,
            viewportHeight
        });
        const {
            parchmentWidth,
            parchmentHeight,
            parchmentTopY,
            parchmentBottomY,
            parchmentTextWidth
        } = parchmentLayout;
        const contentVerticalShift = isNarrowViewport ? -54 : -46;
        const parchment = this.scene.add.image(centerX, centerY, 'ui-parchment')
            .setOrigin(0.5)
            .setScale(parchmentLayout.parchmentScale)
            .setAngle(90)
            .setDepth(40);

        const endState = this.stateBuilder.build(resultType);
        const {
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
        } = endState;
        if (storyStarsReward > 0 || ogreConversionStars > 0) {
            MetaProgression.addStars(storyStarsReward + ogreConversionStars);
        }
        const contentLayout = this.layout.buildEndPanelContentLayout({
            centerY,
            isNarrowViewport,
            resultType,
            hasBossVictoryMessage,
            shouldConvertGoldToStars,
            shouldShowFightBossUnlockMessage,
            strategoVictoryFollowup,
            bossRushVictoryFollowup
        });
        const {
            messageY,
            footerY,
            goldRewardTextY,
            goldRewardDisplayY,
            rewardTitleY,
            rewardDisplayY,
            conversionTextY,
            starDisplayY,
            adjustedRewardSummaryY,
            adjustedCountersRowY,
            ogreConversionSpacing,
            fightBossUnlockSpacing,
            strategoVictorySpacing,
            bossRushVictorySpacing,
            adjustedRewardTitleY,
            adjustedRewardDisplayY,
            fightBossUnlockTextY,
            bossRushNextPotionsTitleY,
            bossRushNextPotionsDisplayY
        } = contentLayout;

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
            this.rewards.playSequence({
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
                activeView: () => activeView,
                onRewardSequenceStart: () => {
                    rewardSequencePlayed = true;
                },
                onOgreConversionComplete: () => {
                    ogreConversionCompleted = true;
                }
            });
        };

        const setView = (view) => {
            activeView = view;
            this.view.applyView(view, {
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
            });
        };

        this.actions.bindButtonHandlers({
            phoenixButton,
            retryButton,
            statsButton,
            trophiesButton,
            menuButton,
            setView,
            canReturnToStoryMap,
            canContinueBossRush
        });

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

        this.reveal.prepareTargets(introContentTargets);
        introButtons.forEach((button) => {
            this.reveal.prepareTarget(button.container);
            button.hitArea.disableInteractive();
        });

        this.reveal.revealIntro({
            parchment,
            centerX,
            parchmentTopY,
            parchmentWidth,
            parchmentHeight,
            messageText,
            footerText,
            strategoVictoryText,
            bossRushVictoryText,
            onRewardsReady: () => {
                canStartRewardSequence = true;
                revealRewardSequence();
            },
            introButtons,
            buttonsToReveal: this.actions.getButtonsToReveal({
                introButtons,
                phoenixButton,
                retryButton,
                statsButton,
                trophiesButton,
                canUsePhoenixRetry,
                canUseStrategoRetry,
                shouldConvertGoldToStars,
                hideStatsButton
            }),
            buttonRevealDelay: 1100,
            menuButton,
            shouldConvertGoldToStars,
            ogreConversionCompleted: () => ogreConversionCompleted
        });
    }

    createStoryGoldRewardDisplay(centerX, y, isNarrowViewport, reward, initialValue = 0) {
        return this.widgets.createStoryGoldRewardDisplay(centerX, y, isNarrowViewport, reward, initialValue);
    }

    createStoryStarRewardDisplay(centerX, y, isNarrowViewport, initialValue = 0) {
        return this.widgets.createStoryStarRewardDisplay(centerX, y, isNarrowViewport, initialValue);
    }

    animateGoldToStarsConversion(goldDisplay, starDisplay, totalGold, baseStars, onComplete = null) {
        return this.widgets.animateGoldToStarsConversion(goldDisplay, starDisplay, totalGold, baseStars, onComplete);
    }

    createStoryRewardDisplay(centerX, y, maxWidth, isNarrowViewport, potionDefinition, fragmentDefinition = null) {
        return this.widgets.createStoryRewardDisplay(centerX, y, maxWidth, isNarrowViewport, potionDefinition, fragmentDefinition);
    }

    createBossRushPotionPreview(centerX, y, isNarrowViewport, potions = []) {
        return this.widgets.createBossRushPotionPreview(centerX, y, isNarrowViewport, potions);
    }

    buildEndStatsText() {
        return this.statsView.buildEndStatsText();
    }

    createPotionStatsRow(centerX, y, isNarrowViewport) {
        return this.statsView.createPotionStatsRow(centerX, y, isNarrowViewport);
    }

    createStyledMenuButton(x, y, width, height, label, fontSize = '15px', options = {}) {
        return this.widgets.createStyledMenuButton(x, y, width, height, label, fontSize, options);
    }

    createTrophyScrollArea(centerX, topY, width, height, isNarrowViewport) {
        return this.trophiesView.createTrophyScrollArea(centerX, topY, width, height, isNarrowViewport);
    }
}
