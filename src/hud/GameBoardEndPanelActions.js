class GameBoardEndPanelActions {
    constructor(endPanel) {
        this.endPanel = endPanel;
        this.scene = endPanel.scene;
        this.hud = endPanel.hud;
    }

    bindButtonHandlers({
        phoenixButton,
        retryButton,
        statsButton,
        trophiesButton,
        menuButton,
        setView,
        canReturnToStoryMap,
        canContinueBossRush
    }) {
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
    }

    getButtonsToReveal({
        introButtons,
        phoenixButton,
        retryButton,
        statsButton,
        trophiesButton,
        canUsePhoenixRetry,
        canUseStrategoRetry,
        shouldConvertGoldToStars,
        hideStatsButton
    }) {
        return introButtons.filter((button) => {
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
    }
}
