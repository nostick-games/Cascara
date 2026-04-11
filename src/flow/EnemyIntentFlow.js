class EnemyIntentFlow {
    constructor(flow) {
        this.flow = flow;
        this.scene = flow.scene;
        this.aiIntentPreviewTimer = null;
    }

    refreshAIIntentPreviews() {
        if (this.scene.gameState.gameOver || this.scene.gameState.currentPlayer !== 'ROUGE') {
            this.clearAIIntentPreviewTimer();
            this.scene.gameBoard.clearAIIntentPreviews();
            return;
        }

        this.scene.gameState.aiIntentPreviewActions = {};
        this.scene.gameState.aiIntentPreviewRevealed = {};
        this.scene.gameState.playerOrder.forEach((color) => {
            if (color === 'ROUGE') {
                return;
            }

            const aiController = this.scene.aiControllers[color];
            if (!aiController) {
                return;
            }

            const action = aiController.predictActionForPreview(this.scene, this.scene.gameState.grid, color);
            this.scene.gameState.aiIntentPreviewActions[color] = action;
        });
        this.clearAIIntentPreviewTimer();
        this.scene.gameBoard.clearAIIntentPreviews(false);
    }

    handleEnemyIntentClick(color) {
        if (!color || color === 'ROUGE') {
            return;
        }

        if (
            this.scene.gameState.gameOver ||
            this.scene.gameState.selectingStartingPlayer ||
            this.scene.gameState.currentPlayer !== 'ROUGE' ||
            this.scene.gameState.cascadeActive ||
            this.scene.gameState.specialActionInProgress
        ) {
            return;
        }

        if (!this.scene.gameState.playerOrder.includes(color)) {
            return;
        }

        if (this.scene.gameState.aiIntentPreviewRevealed?.[color]) {
            return;
        }

        const action = this.scene.gameState.aiIntentPreviewActions?.[color];
        const previews = this.getAIIntentPreviews(action, color);
        if (!previews.length) {
            return;
        }

        this.scene.gameState.aiIntentPreviewRevealed[color] = true;
        this.clearAIIntentPreviewTimer();
        this.scene.gameBoard.showAIIntentPreviews(previews);
        this.aiIntentPreviewTimer = this.scene.time.delayedCall(1200, () => {
            this.aiIntentPreviewTimer = null;
            this.scene.gameBoard.clearAIIntentPreviews(true);
        });
    }

    getAIIntentPreviews(action, playerColor = null) {
        if (!action || action.type === 'no_move') {
            return [];
        }

        const previewColor = playerColor === 'JAUNE'
            ? 0x5a2f6b
            : (this.scene.gameBoard.COLORS?.[playerColor] || 0xffffff);

        if (action.type === 'move' && action.pion) {
            return this.buildPreviewCluster(action.pion.row, action.pion.col, previewColor);
        }

        if (action.type === 'place_bonus') {
            return this.buildPreviewCluster(action.row, action.col, previewColor);
        }

        if (action.type === 'trigger_bonus') {
            const focusMove = this.getBestHumanThreatCell();
            return this.buildPreviewCluster(focusMove.row, focusMove.col, previewColor);
        }

        return [];
    }

    buildPreviewCluster(centerRow, centerCol, color) {
        const gridSize = this.scene.config.gridSize;
        const positions = [];

        for (let row = centerRow - 1; row <= centerRow + 1; row++) {
            for (let col = centerCol - 1; col <= centerCol + 1; col++) {
                if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) {
                    continue;
                }
                positions.push({ row, col, distance: Math.abs(row - centerRow) + Math.abs(col - centerCol) });
            }
        }

        positions.sort((left, right) => left.distance - right.distance);

        const maxPreviewCountByDifficulty = {
            EASY: 9,
            NORMAL: 7,
            HARD: 5
        };
        const maxPreviewCount = maxPreviewCountByDifficulty[this.scene.difficulty] || 7;

        return positions.slice(0, maxPreviewCount).map((position) => ({
            row: position.row,
            col: position.col,
            color
        }));
    }

    clearAIIntentPreviewTimer() {
        if (this.aiIntentPreviewTimer && !this.aiIntentPreviewTimer.hasDispatched) {
            this.aiIntentPreviewTimer.remove(false);
        }
        this.aiIntentPreviewTimer = null;
    }

    getBestHumanThreatCell() {
        let best = null;
        for (let row = 0; row < this.scene.config.gridSize; row++) {
            for (let col = 0; col < this.scene.config.gridSize; col++) {
                if (!this.scene.gameLogic.canCapturePion(this.scene.gameState.grid, row, col, 'ROUGE')) {
                    continue;
                }

                const score = this.scene.gameLogic.evaluateMove(this.scene.gameState.grid, row, col, 'ROUGE');
                if (!best || score > best.score) {
                    best = { row, col, score };
                }
            }
        }

        if (best) {
            return best;
        }

        return {
            row: Math.floor(this.scene.config.gridSize / 2),
            col: Math.floor(this.scene.config.gridSize / 2)
        };
    }
}
