class GameSceneFlow {
    constructor(scene) {
        this.scene = scene;
        this.progressPotions = new ProgressPotionFlow(this);
        this.enemyIntent = new EnemyIntentFlow(this);
        this.bonuses = new BonusFlow(this);
        this.turnResolution = new TurnResolutionFlow(this);
    }

    update(time) {
        this.handleAITurn(time);
        this.handleCascadeAnimation(time);
    }

    handleAITurn(time) {
        const currentPlayer = this.scene.gameState.currentPlayer;
        const aiController = this.scene.aiControllers[currentPlayer];

        if (!aiController ||
            this.scene.gameState.gameOver ||
            this.scene.gameState.cascadeActive ||
            this.scene.gameState.selectingStartingPlayer ||
            this.scene.gameState.specialActionInProgress ||
            this.scene.gameBoard.isThoughtSequenceActive()) {
            return;
        }

        if (this.turnResolution.shouldSkipBerserkCurrentAction(currentPlayer)) {
            this.scene.gameState.berserkSkipCurrentAction = false;
            this.scene.gameState.specialActionInProgress = true;
            this.scene.gameBoard.startThinking(currentPlayer);
            this.updateUI();
            this.scene.time.delayedCall(520, () => {
                if (this.scene.gameState.gameOver) return;
                if (this.scene.gameState.currentPlayer !== currentPlayer) return;

                const missEmoji = this.turnResolution.getBerserkMissedActionEmoji();
                this.scene.gameState.specialActionInProgress = false;
                this.scene.gameState.berserkMissedExtraActionCue = false;
                this.scene.gameState.berserkMissedActionEmoji = null;
                this.scene.gameBoard.revealThoughtWithEmoji(currentPlayer, missEmoji, () => {
                    this.scene.cameras.main.shake(180, 0.01);
                    this.finalizeTurn({
                        skipExtraBossAction: true,
                        skipBerserkMissCue: true
                    });
                });
            });
            return;
        }

        if (!aiController.isThinking && !aiController.isQueued) {
            const preferredAction = this.scene.gameState.aiIntentPreviewActions?.[currentPlayer] || null;
            aiController.queueTurn(this.scene, this.scene.gameState.grid, currentPlayer, preferredAction);
            aiController.startTurn();
            this.scene.gameBoard.startThinking(currentPlayer);
            this.updateUI();

            aiController.clearThinkTimer();
            aiController.thinkTimer = this.scene.time.delayedCall(aiController.thinkDuration, () => {
                aiController.thinkTimer = null;

                if (this.scene.gameState.gameOver) return;
                if (this.scene.gameState.currentPlayer !== currentPlayer || !aiController.isThinking) {
                    aiController.reset();
                    this.scene.gameBoard.stopThinking(currentPlayer);
                    return;
                }

                this.revealAIThought(() => {
                    const action = aiController.takeQueuedAction();
                    this.handleAIAction(action);
                });
            });
            this.updateUI();
        }
    }

    handleAIAction(action) {
        if (!action) return;

        switch (action.type) {
            case 'move':
                this.scene.gameState.specialActionInProgress = true;
                this.scene.gameBoard.previewSelectedPion(
                    this.scene.gameState.grid,
                    action.pion.row,
                    action.pion.col,
                    () => this.executeMove(action.pion.row, action.pion.col),
                    150
                );
                break;
            case 'place_bonus':
                this.scene.gameState.specialActionInProgress = true;
                this.scene.gameBoard.previewSelectedPion(
                    this.scene.gameState.grid,
                    action.row,
                    action.col,
                    () => this.previewAIBombPlacement(action.row, action.col, this.scene.gameState.currentPlayer),
                    150
                );
                break;
            case 'trigger_bonus':
                this.scene.gameState.specialActionInProgress = true;
                this.consumeRandomBonus(this.scene.gameState.currentPlayer, action.bonusType);
                break;
            case 'no_move':
                this.finalizeTurn({ skipExtraBossAction: true });
                break;
        }
    }

    getNextPlayer(currentPlayer) {
        return this.turnResolution.getNextPlayer(currentPlayer);
    }

    handleCascadeAnimation(time) {
        if (!this.scene.gameState.cascadeActive) return;

        const cascadeResult = this.scene.cascadeAnimation.update(this.scene, time);

        switch (cascadeResult.type) {
            case 'wave_processed':
                break;
            case 'finished':
                this.scene.gameState.cascadeActive = false;
                if (this.scene.gameState.currentPlayer === 'ROUGE' && this.scene.gameState.playerStats) {
                    this.scene.gameState.playerStats.totalCapturedTiles += cascadeResult.convertedCount || 0;
                }
                if (!this.scene.isStrategoMode && !this.scene.isFightMode) {
                    this.scene.trophies.markCascadeResult(this.scene.gameState.currentPlayer, cascadeResult);
                }
                this.applyLightningCharge(
                    this.scene.gameState.currentPlayer,
                    cascadeResult.convertedCount,
                    cascadeResult.specialActivationCount || 0
                );
                this.finalizeTurn({ cascadeResult });
                break;
        }
    }

    handlePionClick(row, col) {
        if (this.scene.gameState.gameOver ||
            this.scene.gameState.selectingStartingPlayer ||
            this.scene.gameState.currentPlayer !== 'ROUGE' ||
            this.scene.gameState.cascadeActive ||
            this.scene.gameState.specialActionInProgress) {
            return;
        }

        if (this.progressPotions.handlePionClick(row, col)) {
            this.clearAIIntentPreviewTimer();
            this.scene.gameBoard.clearAIIntentPreviews();
            return;
        }

        const pion = this.scene.gameState.grid[row][col];

        if (this.scene.gameState.pendingPlacementBonus === 'PLACE_BOMB') {
            if (pion.color === 'ROUGE' && !pion.specialType && !pion.isFrozen && !pion.isBurning) {
                this.clearAIIntentPreviewTimer();
                this.scene.gameBoard.clearAIIntentPreviews();
                this.scene.gameBoard.previewSelectedPion(this.scene.gameState.grid, row, col, () => {
                    this.scene.gameBoard.revealThought('ROUGE', () => {
                        this.consumePlaceBomb(row, col, 'ROUGE');
                    });
                }, 90);
            }
            return;
        }

        if (pion.color === this.scene.gameState.currentPlayer) return;

        if (this.scene.gameLogic.canCapturePion(this.scene.gameState.grid, row, col, this.scene.gameState.currentPlayer)) {
            this.clearAIIntentPreviewTimer();
            this.scene.gameBoard.clearAIIntentPreviews();
            this.scene.gameBoard.previewSelectedPion(this.scene.gameState.grid, row, col, () => {
                this.executeMove(row, col);
                this.scene.gameBoard.revealThought('ROUGE');
            }, 90);
        }
    }

    executeMove(row, col) {
        this.scene.gameState.cascadeActive = true;
        this.scene.cascadeAnimation.startCascade(
            this.scene,
            this.scene.gameState.grid,
            row,
            col,
            this.scene.gameState.currentPlayer
        );
        this.updateUI();
    }

    finalizeTurn(options = {}) {
        this.turnResolution.finalizeTurn(options);
    }

    refreshProgressPotionsForDifficulty(endingPlayer) {
        this.turnResolution.refreshProgressPotionsForDifficulty(endingPlayer);
    }

    getProgressPotionRefreshInterval() {
        return this.turnResolution.getProgressPotionRefreshInterval();
    }

    scheduleThinkingForCurrentPlayer(color, onShown = null) {
        this.turnResolution.scheduleThinkingForCurrentPlayer(color, onShown);
    }

    removeEliminatedAIPlayers(scoreData) {
        this.turnResolution.removeEliminatedAIPlayers(scoreData);
    }

    resetAIControllers() {
        this.turnResolution.resetAIControllers();
    }

    updateUI() {
        this.turnResolution.updateUI();
    }

    startRandomFirstPlayerSelection() {
        this.turnResolution.startRandomFirstPlayerSelection();
    }

    handleBonusClick(color) {
        this.bonuses.handleBonusClick(color);
    }

    handleProgressPotionClick(potionId) {
        this.progressPotions.handleProgressPotionClick(potionId);
    }

    activateProgressPotionMode(potionId, options = {}) {
        this.progressPotions.activateProgressPotionMode(potionId, options);
    }

    consumeOrangePotion(centerRow, centerCol) {
        return this.progressPotions.consumeOrangePotion(centerRow, centerCol);
    }

    consumeMarronPotion() {
        return this.progressPotions.consumeMarronPotion();
    }

    applyLightningCharge(playerColor, convertedCount, specialActivationCount = 0) {
        this.bonuses.applyLightningCharge(playerColor, convertedCount, specialActivationCount);
    }

    getRandomBonusType() {
        return this.bonuses.getRandomBonusType();
    }

    getRandomBonusUseThreshold() {
        return this.bonuses.getRandomBonusUseThreshold();
    }

    resetBonusHoldState(playerColor) {
        this.bonuses.resetBonusHoldState(playerColor);
    }

    updateBonusHoldState(playerColor) {
        this.bonuses.updateBonusHoldState(playerColor);
    }

    revealAIThought(onComplete) {
        this.scene.gameState.specialActionInProgress = true;
        this.scene.gameBoard.revealThought(this.scene.gameState.currentPlayer, () => {
            this.scene.gameState.specialActionInProgress = false;
            if (onComplete) onComplete();
        });
    }

    refreshAIIntentPreviews() {
        this.enemyIntent.refreshAIIntentPreviews();
    }

    handleEnemyIntentClick(color) {
        this.enemyIntent.handleEnemyIntentClick(color);
    }

    getAIIntentPreview(action, playerColor = null) {
        return this.enemyIntent.getAIIntentPreview(action, playerColor);
    }

    getAIIntentRadiusMultiplier() {
        return this.enemyIntent.getAIIntentRadiusMultiplier();
    }

    clearAIIntentPreviewTimer() {
        this.enemyIntent.clearAIIntentPreviewTimer();
    }

    getBestHumanThreatCell() {
        return this.enemyIntent.getBestHumanThreatCell();
    }

    previewAIBombPlacement(row, col, playerColor) {
        this.bonuses.previewAIBombPlacement(row, col, playerColor);
    }

    consumePlaceBomb(row, col, playerColor) {
        return this.bonuses.consumePlaceBomb(row, col, playerColor);
    }

    consumeRandomBonus(playerColor, bonusType) {
        return this.bonuses.consumeRandomBonus(playerColor, bonusType);
    }

    spawnBombBonusCells(ownerColor = null) {
        return this.bonuses.spawnBombBonusCells(ownerColor);
    }

    updateFrozenCells(endingPlayer = null) {
        this.turnResolution.updateFrozenCells(endingPlayer);
    }
}
