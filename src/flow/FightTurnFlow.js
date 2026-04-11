class FightTurnFlow {
    constructor(turnResolution) {
        this.turnResolution = turnResolution;
        this.flow = turnResolution.flow;
        this.scene = turnResolution.scene;
    }

    prepareTurnStateForCurrentPlayer() {
        const scoreData = this.scene.gameLogic.getScoreData(this.scene.gameState.grid);
        this.scene.gameState.fightTurnStartTileCounts = {
            ROUGE: scoreData.counts?.ROUGE || 0,
            BLEU: scoreData.counts?.BLEU || 0
        };
    }

    handlePostTransition() {
        this.turnResolution.updateUI();
        if (this.scene.gameState.currentPlayer === 'ROUGE') {
            this.flow.refreshAIIntentPreviews();
            this.turnResolution.scheduleThinkingForCurrentPlayer(this.scene.gameState.currentPlayer);
        }
    }

    finalizeTurn(options = {}) {
        const endingPlayer = this.scene.gameState.currentPlayer;
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
        this.turnResolution.updateFrozenCells(endingPlayer);

        const scoreData = this.scene.gameLogic.getScoreData(this.scene.gameState.grid);
        const beforeCounts = this.scene.gameState.fightTurnStartTileCounts || {
            ROUGE: scoreData.counts?.ROUGE || 0,
            BLEU: scoreData.counts?.BLEU || 0
        };
        const convertedByOriginalColor = options?.cascadeResult?.convertedByOriginalColor || null;

        ['ROUGE', 'BLEU'].forEach((color) => {
            const damageFromCascade = convertedByOriginalColor && Number.isFinite(convertedByOriginalColor[color])
                ? Math.max(0, Math.floor(convertedByOriginalColor[color]))
                : null;
            const damageFromNetCounts = Math.max(0, (beforeCounts[color] || 0) - (scoreData.counts?.[color] || 0));
            const damage = damageFromCascade !== null
                ? Math.max(damageFromCascade, damageFromNetCounts)
                : damageFromNetCounts;
            if (damage <= 0) {
                return;
            }

            this.scene.gameState.fightHealth[color] = Math.max(
                0,
                (this.scene.gameState.fightHealth[color] || 0) - damage
            );
            this.scene.gameBoard.animateFightDamage(color, damage);
        });

        this.turnResolution.updateUI();

        if ((this.scene.gameState.fightHealth.ROUGE || 0) <= 0 || (scoreData.counts?.ROUGE || 0) <= 0) {
            this.scene.gameState.gameOver = true;
            this.scene.trophies.finalizeGame('defeat');
            this.scene.gameBoard.showDefeat('BLEU');
            return;
        }

        if ((this.scene.gameState.fightHealth.BLEU || 0) <= 0 || (scoreData.counts?.BLEU || 0) <= 0) {
            this.scene.gameState.gameOver = true;
            this.scene.trophies.finalizeGame('victory');
            this.scene.gameBoard.showGameOver({
                gameOver: true,
                winThreshold: 100,
                leader: {
                    color: 'ROUGE',
                    count: scoreData.counts?.ROUGE || 0,
                    percentage: 100 - (this.scene.gameState.fightHealth.BLEU || 0)
                },
                counts: scoreData.counts,
                percentages: scoreData.percentages
            });
            return;
        }

        if (this.turnResolution.shouldApplyIncendiaryBossBurn(endingPlayer, options)) {
            this.turnResolution.applyIncendiaryBossBurn(endingPlayer, options.cascadeResult, () => {
                this.turnResolution.completeTurnTransition(endingPlayer, false);
            });
            return;
        }

        const canContinueBerserkTurn =
            !options.skipExtraBossAction &&
            this.turnResolution.isBerserkBoss(endingPlayer) &&
            (this.scene.gameState.berserkExtraActionsRemaining || 0) > 0;

        if (canContinueBerserkTurn) {
            this.scene.gameState.berserkExtraActionsRemaining -= 1;
            this.turnResolution.resetAIControllers();
            this.scene.gameState.currentPlayer = endingPlayer;
            this.turnResolution.updateUI();
            this.turnResolution.scheduleThinkingForCurrentPlayer(endingPlayer);
            return;
        }

        this.turnResolution.completeTurnTransition(endingPlayer, false);
    }
}
