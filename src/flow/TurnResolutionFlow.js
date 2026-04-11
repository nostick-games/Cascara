class TurnResolutionFlow {
    constructor(flow) {
        this.flow = flow;
        this.scene = flow.scene;
        this.battleRoyale = new BattleRoyaleFlow(this);
        this.fight = new FightTurnFlow(this);
    }

    getNextPlayer(currentPlayer) {
        const activePlayers = this.scene.gameState.playerOrder;
        if (!activePlayers.length) return null;

        const currentIndex = activePlayers.indexOf(currentPlayer);
        if (currentIndex === -1) return activePlayers[0];

        return activePlayers[(currentIndex + 1) % activePlayers.length];
    }

    finalizeTurn(options = {}) {
        if (this.scene.isStrategoMode) {
            this.finalizeStrategoTurn(options);
            return;
        }

        if (this.scene.isFightMode) {
            this.fight.finalizeTurn(options);
            return;
        }

        const endingPlayer = this.scene.gameState.currentPlayer;
        const keepProgressPotionMode =
            endingPlayer === 'ROUGE' &&
            this.scene.gameState.pendingProgressPotion === 'MARRON' &&
            (this.scene.gameState.extraTurnCount || 0) > 0;
        this.scene.gameState.pendingPlacementBonus = null;
        this.scene.gameState.pendingProgressPotion = null;
        this.scene.gameState.pendingProgressPotionTarget = null;
        this.scene.gameState.specialActionInProgress = false;
        this.flow.clearAIIntentPreviewTimer();
        this.scene.gameBoard.clearAIIntentPreviews();
        if (this.scene.gameState.aiIntentPreviewActions && endingPlayer !== 'ROUGE') {
            delete this.scene.gameState.aiIntentPreviewActions[endingPlayer];
        }
        this.flow.updateBonusHoldState(endingPlayer);
        this.updateFrozenCells(endingPlayer);
        const scoreData = this.scene.gameLogic.getScoreData(this.scene.gameState.grid);
        const humanTileCount = scoreData.counts.ROUGE || 0;

        if (humanTileCount <= 0) {
            this.scene.gameState.gameOver = true;
            this.scene.trophies.finalizeGame('defeat');
            const leader = this.scene.gameLogic.getLeadingPlayer(scoreData);
            this.scene.gameBoard.showDefeat(leader?.color || null);
            return;
        }

        this.removeEliminatedAIPlayers(scoreData);

        const remainingEnemyColors = this.scene.gameState.playerOrder.filter((color) => color !== 'ROUGE');
        if (remainingEnemyColors.length === 0) {
            this.scene.gameState.gameOver = true;
            this.scene.trophies.finalizeGame('victory');
            this.scene.gameBoard.showGameOver({
                gameOver: true,
                winThreshold: GameLogic.getWinThreshold(
                    this.scene.gameLogic.GRID_SIZE,
                    this.scene.gameLogic.playerColors.length
                ),
                leader: {
                    color: 'ROUGE',
                    count: scoreData.counts?.ROUGE || 0,
                    percentage: scoreData.percentages?.ROUGE || 0
                },
                counts: scoreData.counts,
                percentages: scoreData.percentages
            });
            return;
        }

        let winData = this.scene.gameLogic.checkWinCondition(this.scene.gameState.grid);
        const objectiveBonus = this.scene.gameState.objectiveProgressBonusPercent || 0;
        const effectiveHumanProgress = (scoreData.percentages?.ROUGE || 0) + objectiveBonus;
        if (!winData.gameOver && effectiveHumanProgress >= winData.winThreshold) {
            winData = {
                ...winData,
                gameOver: true,
                leader: {
                    color: 'ROUGE',
                    count: scoreData.counts?.ROUGE || 0,
                    percentage: effectiveHumanProgress
                }
            };
        }
        if (winData.gameOver) {
            this.scene.gameState.gameOver = true;
            const playerWon = winData.leader?.color === 'ROUGE';
            this.scene.trophies.finalizeGame(playerWon ? 'victory' : 'defeat');
            if (playerWon) {
                this.scene.gameBoard.showGameOver(winData);
            } else {
                this.scene.gameBoard.showDefeat(winData?.leader?.color || null);
            }
            return;
        }

        const canContinueBerserkTurn =
            !options.skipExtraBossAction &&
            this.isBerserkBoss(endingPlayer) &&
            (this.scene.gameState.berserkExtraActionsRemaining || 0) > 0;

        if (canContinueBerserkTurn) {
            this.scene.gameState.berserkExtraActionsRemaining -= 1;
            this.resetAIControllers();
            this.scene.gameState.currentPlayer = endingPlayer;
            this.updateUI();
            this.scheduleThinkingForCurrentPlayer(endingPlayer);
            return;
        }

        if (this.shouldApplyIncendiaryBossBurn(endingPlayer, options)) {
            this.applyIncendiaryBossBurn(endingPlayer, options.cascadeResult, () => {
                if (this.shouldShowBerserkMissedActionCue(endingPlayer, options)) {
                    const missEmoji = this.getBerserkMissedActionEmoji();
                    this.scene.gameState.berserkMissedExtraActionCue = false;
                    this.scene.gameState.berserkMissedActionEmoji = null;
                    this.scene.gameBoard.revealThoughtWithEmoji(endingPlayer, missEmoji, () => {
                        this.scene.cameras.main.shake(180, 0.01);
                        this.completeTurnTransition(endingPlayer, keepProgressPotionMode);
                    });
                    return;
                }

                this.completeTurnTransition(endingPlayer, keepProgressPotionMode);
            });
            return;
        }

        if (this.shouldShowBerserkMissedActionCue(endingPlayer, options)) {
            const missEmoji = this.getBerserkMissedActionEmoji();
            this.scene.gameState.berserkMissedExtraActionCue = false;
            this.scene.gameState.berserkMissedActionEmoji = null;
            this.scene.gameBoard.revealThoughtWithEmoji(endingPlayer, missEmoji, () => {
                this.scene.cameras.main.shake(180, 0.01);
                this.completeTurnTransition(endingPlayer, keepProgressPotionMode);
            });
            return;
        }

        this.completeTurnTransition(endingPlayer, keepProgressPotionMode);
    }

    refreshProgressPotionsForDifficulty(endingPlayer) {
        if (endingPlayer !== 'ROUGE') {
            return;
        }

        this.scene.gameState.playerTurnCount = (this.scene.gameState.playerTurnCount || 0) + 1;

        const progressPotions = this.scene.gameState.progressPotions || [];
        progressPotions.forEach((potion) => {
            if (!potion.consumed) {
                return;
            }

            const remaining = Math.max(0, (potion.cooldownTurnsRemaining || 0) - 1);
            potion.cooldownTurnsRemaining = remaining;
            if (remaining > 0) {
                return;
            }

            potion.consumed = false;
            potion.active = false;
        });
    }

    getProgressPotionRefreshInterval() {
        const intervalByDifficulty = {
            EASY: 5,
            NORMAL: 10,
            HARD: 15
        };
        return intervalByDifficulty[this.scene.difficulty] || 0;
    }

    scheduleThinkingForCurrentPlayer(color, onShown = null) {
        if (this.scene.gameState.gameOver) return;
        if (this.scene.gameState.currentPlayer !== color) return;
        this.scene.gameBoard.queueThinking(color, onShown);
    }

    removeEliminatedAIPlayers(scoreData) {
        this.scene.gameState.playerOrder = this.scene.gameState.playerOrder.filter((color) => {
            if (color === 'ROUGE') return true;
            return (scoreData.counts[color] || 0) > 0;
        });
    }

    resetAIControllers() {
        Object.entries(this.scene.aiControllers).forEach(([color, aiController]) => {
            aiController.reset();
            this.scene.gameBoard.stopThinking(color);
        });
    }

    updateUI() {
        const scoreData = this.scene.gameLogic.getScoreData(this.scene.gameState.grid);
        const objectiveBonus = this.scene.gameState.objectiveProgressBonusPercent || 0;
        if (!this.scene.isFightMode) {
            this.scene.trophies.markPlayerControl(scoreData);
        }
        if (this.scene.gameState.playerStats) {
            this.scene.gameState.playerStats.maxProgressPercent = Math.max(
                this.scene.gameState.playerStats.maxProgressPercent || 0,
                scoreData.percentages?.ROUGE || 0
            );
            this.scene.gameState.playerStats.maxObjectiveProgressPercent = Math.max(
                this.scene.gameState.playerStats.maxObjectiveProgressPercent || 0,
                (scoreData.percentages?.ROUGE || 0) + objectiveBonus
            );
        }
        this.scene.gameBoard.updateUI(this.scene.gameState, scoreData);
    }

    startRandomFirstPlayerSelection() {
        if (this.scene.isStrategoMode) {
            this.scene.gameState.currentPlayer = 'ROUGE';
            this.scene.gameState.selectingStartingPlayer = false;
            this.updateUI();
            return;
        }

        const storyState = this.scene.storyContext?.storyState || {};
        const selectedFragmentIds = Array.isArray(storyState.activeFragmentIds) && storyState.activeFragmentIds.length > 0
            ? [...storyState.activeFragmentIds]
            : [storyState.activeFragmentId].filter(Boolean);
        let shouldStartWithRed = false;

        const finishStartingPlayerSelection = () => {
            this.updateUI();

            if (shouldStartWithRed) {
                this.scene.gameState.currentPlayer = 'ROUGE';
                this.scene.gameState.selectingStartingPlayer = false;
                this.prepareTurnStateForCurrentPlayer('ROUGE');
                this.updateUI();
                this.flow.refreshAIIntentPreviews();
                this.scheduleThinkingForCurrentPlayer('ROUGE');
                return;
            }

            this.scene.gameBoard.animateStartingPlayerSelection(this.scene.playerOrder, (selectedPlayer) => {
                this.scene.gameState.currentPlayer = selectedPlayer;
                this.scene.gameState.selectingStartingPlayer = false;
                this.prepareTurnStateForCurrentPlayer(selectedPlayer);
                this.updateUI();
                if (selectedPlayer === 'ROUGE') {
                    this.flow.refreshAIIntentPreviews();
                    this.scheduleThinkingForCurrentPlayer(selectedPlayer);
                }
            });
        };

        const activateFragmentById = (fragmentId, onComplete) => {
            if (!fragmentId || fragmentId === 'LOST') {
                onComplete();
                return;
            }

            if (fragmentId === 'INITIATIVE') {
                this.updateUI();
                const fragment = StoryFragmentCatalog.getById('INITIATIVE');
                this.scene.gameBoard.showFragmentActivationNotification(
                    fragment,
                    TranslationManager.t('fragment.initiative.start_message'),
                    TranslationManager.t('fragment.activation.confirm'),
                    () => {
                        shouldStartWithRed = true;
                        onComplete();
                    }
                );
                return;
            }

            if (fragmentId === 'AMBITION') {
                this.updateUI();
                const rawProgress = this.scene.gameLogic.getScoreData(this.scene.gameState.grid).percentages?.ROUGE || 0;
                const objectiveBonusPercent = this.scene.gameState.pendingObjectiveProgressBonusPercent ||
                    Phaser.Math.Between(10, 20);
                this.scene.gameState.pendingObjectiveProgressBonusPercent = objectiveBonusPercent;
                const fragment = StoryFragmentCatalog.getById('AMBITION');
                this.scene.gameBoard.showFragmentActivationNotification(
                    fragment,
                    TranslationManager.t('fragment.ambition.start_message', {
                        value: objectiveBonusPercent
                    }),
                    TranslationManager.t('fragment.activation.confirm'),
                    () => {
                        this.scene.gameState.objectiveProgressBonusPercent = objectiveBonusPercent;
                        this.scene.gameState.pendingObjectiveProgressBonusPercent = 0;
                        this.scene.gameBoard.animateObjectiveBonusGain(
                            rawProgress,
                            rawProgress + objectiveBonusPercent,
                            () => {
                                this.updateUI();
                                onComplete();
                            }
                        );
                    }
                );
                return;
            }

            if (fragmentId === 'ALCHEMIST') {
                this.updateUI();
                const fragment = StoryFragmentCatalog.getById('ALCHEMIST');
                this.scene.gameBoard.showFragmentActivationNotification(
                    fragment,
                    TranslationManager.t('fragment.alchemist.start_message'),
                    TranslationManager.t('fragment.activation.confirm'),
                    () => {
                        this.scene.gameBoard.animateFirstPotionUnlockAdvance(4, onComplete);
                    }
                );
                return;
            }

            if (fragmentId === 'RUNE') {
                this.updateUI();
                const fragment = StoryFragmentCatalog.getById('RUNE');
                this.scene.gameBoard.showFragmentActivationNotification(
                    fragment,
                    TranslationManager.t('fragment.rune.start_message'),
                    TranslationManager.t('fragment.activation.confirm'),
                    () => {
                        const oneStepCharge = this.scene.gameLogic.getLightningChargeIncrement(1);
                        const targetCharge = Math.max(0, Math.min(99, 100 - oneStepCharge));
                        this.scene.gameState.lightningCharge.ROUGE = targetCharge;
                        this.scene.gameBoard.animateLightningGauge('ROUGE', targetCharge, onComplete);
                    }
                );
                return;
            }

            if (fragmentId === 'GUARDIAN') {
                this.updateUI();
                const fragment = StoryFragmentCatalog.getById('GUARDIAN');
                this.scene.gameBoard.showFragmentActivationNotification(
                    fragment,
                    TranslationManager.t('fragment.guardian.start_message'),
                    TranslationManager.t('fragment.activation.confirm'),
                    () => {
                        this.animateGuardianFragmentProtection(onComplete);
                    }
                );
                return;
            }

            if (fragmentId === 'FIRE') {
                this.updateUI();
                const fragment = StoryFragmentCatalog.getById('FIRE');
                this.scene.gameBoard.showFragmentActivationNotification(
                    fragment,
                    TranslationManager.t('fragment.fire.start_message'),
                    TranslationManager.t('fragment.activation.confirm'),
                    () => {
                        this.animateFireFragmentTiles(onComplete);
                    }
                );
                return;
            }

            onComplete();
        };

        const processFragmentsSequentially = (index = 0) => {
            if (index >= selectedFragmentIds.length) {
                finishStartingPlayerSelection();
                return;
            }

            activateFragmentById(selectedFragmentIds[index], () => {
                processFragmentsSequentially(index + 1);
            });
        };

        processFragmentsSequentially(0);
    }

    finalizeStrategoTurn(options = {}) {
        this.scene.gameState.pendingPlacementBonus = null;
        this.scene.gameState.pendingProgressPotion = null;
        this.scene.gameState.pendingProgressPotionTarget = null;
        this.scene.gameState.specialActionInProgress = false;
        this.flow.clearAIIntentPreviewTimer();
        this.scene.gameBoard.clearAIIntentPreviews();

        const scoreData = this.scene.gameLogic.getScoreData(this.scene.gameState.grid);
        const playerProgress = scoreData.percentages?.ROUGE || 0;
        const allRed = playerProgress >= 100;

        if (allRed) {
            this.scene.gameState.gameOver = true;
            const moveLimit = Math.max(0, Math.floor(this.scene.strategoConfig?.moveLimit || 0));
            const movesRemaining = Math.max(0, Math.floor(this.scene.gameState.strategoMovesRemaining || 0));
            const moveCountUsed = Math.max(0, moveLimit - movesRemaining);
            MetaProgression.markStrategoPatternSolvedWithMoveCount(
                this.scene.boardSize,
                this.scene.strategoConfig?.seedPatternId || null,
                moveCountUsed
            );
            this.scene.trophies.finalizeGame('victory');
            this.scene.gameBoard.showGameOver({
                gameOver: true,
                winThreshold: 100,
                leader: {
                    color: 'ROUGE',
                    count: scoreData.counts?.ROUGE || 0,
                    percentage: playerProgress
                },
                counts: scoreData.counts,
                percentages: scoreData.percentages
            });
            return;
        }

        this.scene.gameState.strategoMovesRemaining = Math.max(
            0,
            (this.scene.gameState.strategoMovesRemaining || 0) - 1
        );
        this.updateUI();

        if ((this.scene.gameState.strategoMovesRemaining || 0) <= 0) {
            this.scene.gameState.gameOver = true;
            this.scene.trophies.finalizeGame('defeat');
            this.scene.gameBoard.showDefeat(null);
            return;
        }

        this.scene.gameState.currentPlayer = 'ROUGE';
    }

    isBerserkBoss(color) {
        const enemyProfile = this.scene.enemyAssignments?.[color];
        return enemyProfile?.behaviorKey === 'BERSERK';
    }

    isIncendiaryBoss(color) {
        const enemyProfile = this.scene.enemyAssignments?.[color];
        return enemyProfile?.behaviorKey === 'INCENDIARY';
    }

    shouldShowBerserkMissedActionCue(color, options = {}) {
        return !options.skipExtraBossAction &&
            !options.skipBerserkMissCue &&
            this.isBerserkBoss(color) &&
            this.scene.gameState.berserkMissedExtraActionCue === true;
    }

    shouldSkipBerserkCurrentAction(color) {
        return this.isBerserkBoss(color) && this.scene.gameState.berserkSkipCurrentAction === true;
    }

    getBerserkMissedActionEmoji() {
        return this.scene.gameState.berserkMissedActionEmoji || '❌';
    }

    getBerserkSuccessfulActionCount() {
        const roll = Math.random();
        const plansByDifficulty = {
            HYPER_EASY: [
                { max: 0.25, actions: 0 },
                { max: 0.70, actions: 1 },
                { max: 1, actions: 2 }
            ],
            EASY: [
                { max: 0.10, actions: 0 },
                { max: 0.45, actions: 1 },
                { max: 1, actions: 2 }
            ],
            NORMAL: [
                { max: 0.20, actions: 1 },
                { max: 1, actions: 2 }
            ],
            HARD: [
                { max: 1, actions: 2 }
            ]
        };
        const plan = plansByDifficulty[this.scene.difficulty] || plansByDifficulty.NORMAL;
        return plan.find((entry) => roll <= entry.max)?.actions ?? 2;
    }

    prepareTurnStateForCurrentPlayer(color) {
        if (this.scene.isFightMode) {
            this.fight.prepareTurnStateForCurrentPlayer(color);
        }

        if (!this.isBerserkBoss(color)) {
            this.scene.gameState.berserkExtraActionsRemaining = 0;
            this.scene.gameState.berserkSkipCurrentAction = false;
            this.scene.gameState.berserkMissedExtraActionCue = false;
            this.scene.gameState.berserkMissedActionEmoji = null;
            return;
        }

        const successfulActionCount = this.getBerserkSuccessfulActionCount();
        this.scene.gameState.berserkSkipCurrentAction = successfulActionCount === 0;
        this.scene.gameState.berserkExtraActionsRemaining = successfulActionCount >= 2 ? 1 : 0;
        this.scene.gameState.berserkMissedExtraActionCue = successfulActionCount <= 1;
        this.scene.gameState.berserkMissedActionEmoji = successfulActionCount === 0 ? '❌❌' : '❌';
    }

    completeTurnTransition(endingPlayer, keepProgressPotionMode) {
        this.resetAIControllers();
        if (keepProgressPotionMode) {
            this.scene.gameState.extraTurnCount -= 1;
            this.scene.gameState.currentPlayer = 'ROUGE';
        } else {
            this.scene.gameState.currentPlayer = this.getNextPlayer(this.scene.gameState.currentPlayer);
        }
        this.prepareTurnStateForCurrentPlayer(this.scene.gameState.currentPlayer);
        this.refreshProgressPotionsForDifficulty(endingPlayer);
        if (this.scene.isFightMode) {
            this.fight.handlePostTransition();
            return;
        }
        if (this.battleRoyale.applyClosureIfNeeded(endingPlayer, () => {
            this.updateUI();
            if (this.scene.gameState.currentPlayer === 'ROUGE') {
                this.flow.refreshAIIntentPreviews();
                this.scheduleThinkingForCurrentPlayer(this.scene.gameState.currentPlayer);
            }
        })) {
            return;
        }
        this.updateUI();
        if (this.scene.gameState.currentPlayer === 'ROUGE') {
            this.flow.refreshAIIntentPreviews();
            this.scheduleThinkingForCurrentPlayer(this.scene.gameState.currentPlayer);
        }
    }

    updateFrozenCells(endingPlayer = null) {
        let updatedFrozenState = false;

        for (let row = 0; row < this.scene.config.gridSize; row++) {
            for (let col = 0; col < this.scene.config.gridSize; col++) {
                const pion = this.scene.gameState.grid[row][col];
                if (pion.isFrozen && endingPlayer === 'ROUGE') {
                    pion.frozenTurns -= 1;
                    updatedFrozenState = true;
                    if (pion.frozenTurns <= 0) {
                        pion.isFrozen = false;
                        pion.frozenTurns = 0;
                        pion.frozenSourceRow = null;
                        pion.frozenSourceCol = null;
                        pion.thawing = true;
                        this.scene.gameBoard.animateThaw(this.scene.gameState.grid, row, col);
                    }
                }

                if (pion.isSwamp && endingPlayer === 'ROUGE') {
                    pion.swampTurns -= 1;
                    updatedFrozenState = true;
                    if (pion.swampTurns <= 0) {
                        pion.isSwamp = false;
                        pion.swampTurns = 0;
                        pion.swampSourceRow = null;
                        pion.swampSourceCol = null;
                        pion.specialType = null;
                        pion.color = 'GRIS';
                    }
                }

                if (pion.isShielded && endingPlayer === 'ROUGE') {
                    pion.shieldTurns -= 1;
                    updatedFrozenState = true;
                    if (pion.shieldTurns <= 0) {
                        pion.isShielded = false;
                        pion.shieldTurns = 0;
                        pion.shieldOwnerColor = null;
                    }
                }

                if (pion.isBurning && endingPlayer === 'ROUGE') {
                    pion.burningTurns -= 1;
                    updatedFrozenState = true;
                    if (pion.burningTurns <= 0) {
                        pion.isBurning = false;
                        pion.burningTurns = 0;
                        pion.burningOwnerColor = null;
                        pion.color = 'GRIS';
                    }
                }
            }
        }

        if (updatedFrozenState) {
            this.scene.gameBoard.drawBoard(this.scene.gameState.grid);
        }

    }

    shouldApplyIncendiaryBossBurn(endingPlayer, options = {}) {
        return this.isIncendiaryBoss(endingPlayer) &&
            Array.isArray(options?.cascadeResult?.convertedPositions) &&
            options.cascadeResult.convertedPositions.length > 0;
    }

    applyIncendiaryBossBurn(endingPlayer, cascadeResult, onComplete) {
        const targets = this.getIncendiaryBurnTargets(endingPlayer, cascadeResult?.convertedPositions || []);
        if (!targets.length) {
            if (onComplete) onComplete();
            return;
        }

        this.scene.gameState.specialActionInProgress = true;
        // Make the fire sequence read as a boss effect, not as a second "idea" action.
        this.scene.gameBoard.clearThoughts();

        const burnNext = (index) => {
            this.scene.gameBoard.clearThoughts();

            if (index >= targets.length) {
                this.scene.gameBoard.clearThoughts();
                this.scene.gameState.specialActionInProgress = false;
                this.updateUI();
                if (onComplete) onComplete();
                return;
            }

            const { row, col } = targets[index];
            const pion = this.scene.gameState.grid[row]?.[col];
            if (!pion) {
                burnNext(index + 1);
                return;
            }

            pion.isBurning = true;
            // The counter is decremented at the end of each red turn.
            // Starting at 3 keeps the tile blocked for 2 full red turns,
            // then extinguishes it on the 3rd one.
            pion.burningTurns = Math.max(pion.burningTurns || 0, 3);
            pion.burningOwnerColor = endingPlayer;
            this.scene.gameBoard.clearThoughts();
            this.scene.gameBoard.drawPion(this.scene.gameState.grid, row, col);

            const blinkSteps = [true, false, true, false, true];
            blinkSteps.forEach((isBlinking, blinkIndex) => {
                this.scene.time.delayedCall(blinkIndex * 80, () => {
                    if (!this.scene.gameState.grid[row]?.[col]) {
                        return;
                    }

                    if (isBlinking) {
                        this.scene.gameBoard.blinkPion(this.scene.gameState.grid, row, col, true);
                    } else {
                        this.scene.gameBoard.resetBlinkPion(this.scene.gameState.grid, row, col);
                    }
                });
            });

            this.scene.time.delayedCall(blinkSteps.length * 80 + 20, () => {
                this.scene.gameBoard.clearThoughts();
                this.scene.gameBoard.resetBlinkPion(this.scene.gameState.grid, row, col);
                this.scene.gameBoard.drawPion(this.scene.gameState.grid, row, col);
                burnNext(index + 1);
            });
        };

        burnNext(0);
    }

    getIncendiaryBurnTargets(endingPlayer, convertedPositions) {
        const uniquePositions = [];
        const seen = new Set();
        convertedPositions.forEach(({ row, col }) => {
            const key = `${row},${col}`;
            if (seen.has(key)) {
                return;
            }
            seen.add(key);
            uniquePositions.push({ row, col });
        });

        const validTargets = uniquePositions.filter(({ row, col }) => {
            const pion = this.scene.gameState.grid[row]?.[col];
            return pion && pion.color === endingPlayer;
        });

        if (!validTargets.length) {
            return [];
        }

        const scoredTargets = validTargets
            .map((position) => ({
                ...position,
                score: this.scoreIncendiaryBurnTarget(position.row, position.col)
            }))
            .sort((left, right) => right.score - left.score);

        const targetCount = this.getIncendiaryBurnTargetCount();
        return scoredTargets.slice(0, targetCount);
    }

    scoreIncendiaryBurnTarget(row, col) {
        const center = (this.scene.config.gridSize - 1) / 2;
        const distanceFromCenter = Math.abs(row - center) + Math.abs(col - center);
        let adjacentRedCount = 0;

        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                if (rowOffset === 0 && colOffset === 0) {
                    continue;
                }

                const nextRow = row + rowOffset;
                const nextCol = col + colOffset;
                if (
                    nextRow < 0 ||
                    nextRow >= this.scene.config.gridSize ||
                    nextCol < 0 ||
                    nextCol >= this.scene.config.gridSize
                ) {
                    continue;
                }

                if (this.scene.gameState.grid[nextRow][nextCol].color === 'ROUGE') {
                    adjacentRedCount += 1;
                }
            }
        }

        return adjacentRedCount * 6 - distanceFromCenter;
    }

    getIncendiaryBurnTargetCount() {
        const plansByDifficulty = {
            HYPER_EASY: 1,
            EASY: 2,
            NORMAL: 3,
            HARD: 4
        };
        return plansByDifficulty[this.scene.difficulty] ?? 2;
    }

    animateFireFragmentTiles(onComplete = null) {
        const bonusCells = this.getFireFragmentTargets();
        if (!bonusCells.length) {
            if (onComplete) onComplete();
            return;
        }

        const revealNext = (index) => {
            if (index >= bonusCells.length) {
                this.updateUI();
                if (onComplete) onComplete();
                return;
            }

            const { row, col } = bonusCells[index];
            const pion = this.scene.gameState.grid[row]?.[col];
            if (!pion) {
                revealNext(index + 1);
                return;
            }

            pion.color = 'ROUGE';
            this.scene.gameBoard.drawBoard(this.scene.gameState.grid);

            const blinkSteps = [true, false, true, false, true];
            blinkSteps.forEach((isBlinking, blinkIndex) => {
                this.scene.time.delayedCall(blinkIndex * 90, () => {
                    if (!this.scene.gameState.grid[row]?.[col]) {
                        return;
                    }

                    if (isBlinking) {
                        this.scene.gameBoard.blinkPion(this.scene.gameState.grid, row, col, true);
                    } else {
                        this.scene.gameBoard.resetBlinkPion(this.scene.gameState.grid, row, col);
                    }
                });
            });

            this.scene.time.delayedCall(blinkSteps.length * 90 + 20, () => {
                this.scene.gameBoard.resetBlinkPion(this.scene.gameState.grid, row, col);
                this.scene.gameBoard.drawBoard(this.scene.gameState.grid);
                revealNext(index + 1);
            });
        };

        revealNext(0);
    }

    getFireFragmentTargets() {
        const targetCountByGridSize = {
            8: 2,
            12: 3,
            14: 4
        };
        const targetCount = targetCountByGridSize[this.scene.config.gridSize] || 3;
        const grid = this.scene.gameState.grid;
        const candidates = [];

        for (let row = 0; row < this.scene.config.gridSize; row++) {
            for (let col = 0; col < this.scene.config.gridSize; col++) {
                const pion = grid[row]?.[col];
                if (!pion || pion.color !== 'GRIS' || pion.specialType || pion.isFrozen || pion.isSwamp) {
                    continue;
                }

                const adjacentRed = this.countAdjacentColor(grid, row, col, 'ROUGE');
                const distanceToClosestRed = this.getDistanceToClosestColor(grid, row, col, 'ROUGE');
                candidates.push({
                    row,
                    col,
                    adjacentRed,
                    distanceToClosestRed
                });
            }
        }

        candidates.sort((left, right) => {
            if (left.adjacentRed !== right.adjacentRed) {
                return left.adjacentRed - right.adjacentRed;
            }

            if (right.distanceToClosestRed !== left.distanceToClosestRed) {
                return right.distanceToClosestRed - left.distanceToClosestRed;
            }

            return Math.random() - 0.5;
        });

        const selected = [];
        for (const candidate of candidates) {
            if (selected.length >= targetCount) {
                break;
            }

            const tooCloseToAnotherSelected = selected.some((entry) =>
                Math.abs(entry.row - candidate.row) <= 1 && Math.abs(entry.col - candidate.col) <= 1
            );

            if (tooCloseToAnotherSelected && candidates.length > targetCount) {
                continue;
            }

            selected.push(candidate);
        }

        if (selected.length < targetCount) {
            const selectedKeys = new Set(selected.map((entry) => `${entry.row},${entry.col}`));
            for (const candidate of candidates) {
                if (selected.length >= targetCount) {
                    break;
                }

                const key = `${candidate.row},${candidate.col}`;
                if (selectedKeys.has(key)) {
                    continue;
                }

                selected.push(candidate);
                selectedKeys.add(key);
            }
        }

        return selected.slice(0, targetCount);
    }

    countAdjacentColor(grid, row, col, color) {
        let count = 0;
        const directions = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]
        ];

        directions.forEach(([dr, dc]) => {
            const neighbor = grid[row + dr]?.[col + dc];
            if (neighbor?.color === color) {
                count += 1;
            }
        });

        return count;
    }

    getDistanceToClosestColor(grid, startRow, startCol, color) {
        let bestDistance = Number.POSITIVE_INFINITY;

        for (let row = 0; row < this.scene.config.gridSize; row++) {
            for (let col = 0; col < this.scene.config.gridSize; col++) {
                if (grid[row]?.[col]?.color !== color) {
                    continue;
                }

                const distance = Math.abs(row - startRow) + Math.abs(col - startCol);
                if (distance < bestDistance) {
                    bestDistance = distance;
                }
            }
        }

        return Number.isFinite(bestDistance) ? bestDistance : 999;
    }

    animateGuardianFragmentProtection(onComplete = null) {
        const targets = this.getGuardianFragmentTargets();
        if (!targets.length) {
            if (onComplete) onComplete();
            return;
        }

        const applyToNext = (index) => {
            if (index >= targets.length) {
                this.scene.gameBoard.drawBoard(this.scene.gameState.grid);
                if (onComplete) onComplete();
                return;
            }

            const { row, col } = targets[index];
            const pion = this.scene.gameState.grid[row]?.[col];
            if (!pion || pion.color !== 'ROUGE') {
                applyToNext(index + 1);
                return;
            }

            pion.isShielded = true;
            pion.shieldOwnerColor = 'ROUGE';
            pion.shieldTurns = Math.max(pion.shieldTurns || 0, 3);
            this.scene.gameBoard.drawPion(this.scene.gameState.grid, row, col);

            const blinkPattern = [false, true, false, true, false, true];
            blinkPattern.forEach((showShield, blinkIndex) => {
                this.scene.time.delayedCall(blinkIndex * 95, () => {
                    const targetPion = this.scene.gameState.grid[row]?.[col];
                    if (!targetPion) {
                        return;
                    }

                    targetPion.isShielded = showShield;
                    this.scene.gameBoard.drawPion(this.scene.gameState.grid, row, col);
                });
            });

            this.scene.time.delayedCall(blinkPattern.length * 95 + 20, () => {
                const targetPion = this.scene.gameState.grid[row]?.[col];
                if (targetPion) {
                    targetPion.isShielded = true;
                    targetPion.shieldOwnerColor = 'ROUGE';
                    targetPion.shieldTurns = Math.max(targetPion.shieldTurns || 0, 3);
                    this.scene.gameBoard.drawPion(this.scene.gameState.grid, row, col);
                }
                applyToNext(index + 1);
            });
        };

        applyToNext(0);
    }

    getGuardianFragmentTargets() {
        const redTiles = [];

        for (let row = 0; row < this.scene.config.gridSize; row++) {
            for (let col = 0; col < this.scene.config.gridSize; col++) {
                const pion = this.scene.gameState.grid[row]?.[col];
                if (pion?.color === 'ROUGE') {
                    redTiles.push({
                        row,
                        col,
                        adjacentRed: this.countSurroundingColor(this.scene.gameState.grid, row, col, 'ROUGE'),
                        adjacentEnemies: this.countSurroundingNonColor(this.scene.gameState.grid, row, col, 'ROUGE')
                    });
                }
            }
        }

        if (!redTiles.length) {
            return [];
        }

        const targetCount = Math.max(1, Math.ceil(redTiles.length / 3));
        return redTiles
            .slice()
            .sort((left, right) => {
                if (left.adjacentRed !== right.adjacentRed) {
                    return left.adjacentRed - right.adjacentRed;
                }

                if (right.adjacentEnemies !== left.adjacentEnemies) {
                    return right.adjacentEnemies - left.adjacentEnemies;
                }

                return Math.random() - 0.5;
            })
            .slice(0, targetCount)
            .map(({ row, col }) => ({ row, col }));
    }

    countSurroundingColor(grid, row, col, color) {
        let count = 0;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) {
                    continue;
                }

                const neighbor = grid[row + dr]?.[col + dc];
                if (neighbor?.color === color) {
                    count += 1;
                }
            }
        }

        return count;
    }

    countSurroundingNonColor(grid, row, col, color) {
        let count = 0;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) {
                    continue;
                }

                const neighbor = grid[row + dr]?.[col + dc];
                if (neighbor && neighbor.color !== color && neighbor.color !== 'GRIS') {
                    count += 1;
                }
            }
        }

        return count;
    }
}
