class GameBoardInteraction {
    constructor(board) {
        this.board = board;
        this.scene = board.scene;
    }

    onPionHover(row, col, tileVisual, isHovering) {
        const isHumanTurn = !this.scene.gameState.gameOver &&
            this.scene.gameState.currentPlayer === 'ROUGE' &&
            !this.scene.gameState.cascadeActive;

        if (!isHumanTurn) {
            this.clearOrangePotionPreview();
            tileVisual.setScale(1);
            tileVisual.setAlpha(1);
            return;
        }

        const pion = this.scene.gameState.grid[row][col];
        const activeProgressPotion = this.scene.gameState.pendingProgressPotion;
        const isUsingTargetPotion =
            activeProgressPotion === 'ORANGE' ||
            activeProgressPotion === 'ROSE' ||
            activeProgressPotion === 'MENTHE' ||
            activeProgressPotion === 'CYAN';
        const isPlacingBomb = this.scene.gameState.pendingPlacementBonus === 'PLACE_BOMB';
        const placementColor = this.scene.gameState.currentPlayer;
        const canHoverCapture = this.scene.gameLogic.canCapturePion(
            this.scene.gameState.grid,
            row,
            col,
            this.scene.gameState.currentPlayer
        );
        const canHoverPlacement = isPlacingBomb &&
            pion.color === placementColor &&
            !pion.specialType &&
            !pion.isLocked &&
            !pion.isFrozen &&
            !pion.isBurning;

        if (isUsingTargetPotion) {
            if (isHovering) {
                if (activeProgressPotion === 'ORANGE') {
                    this.showOrangePotionPreview(row, col);
                } else if (activeProgressPotion === 'MENTHE') {
                    this.showCrossPotionPreview(row, col);
                } else if (activeProgressPotion === 'CYAN') {
                    this.showOrangePotionPreview(row, col);
                } else {
                    this.showSinglePotionPreview(row, col);
                }
            } else {
                this.clearOrangePotionPreview();
            }
            tileVisual.setScale(1);
            tileVisual.setAlpha(1);
            return;
        }

        if (canHoverCapture || canHoverPlacement) {
            tileVisual.setScale(isHovering ? 1.08 : 1);
            tileVisual.setAlpha(1);
            return;
        }

        tileVisual.setScale(1);
        tileVisual.setAlpha(1);
    }

    showPotionPreviewCells(cellKeys) {
        const nextKeys = new Set(cellKeys);

        if (
            nextKeys.size === this.board.orangePotionPreviewKeys.size &&
            [...nextKeys].every((key) => this.board.orangePotionPreviewKeys.has(key))
        ) {
            return;
        }

        this.clearOrangePotionPreview(true);
        this.board.orangePotionPreviewKeys = nextKeys;
        this.board.redrawPreviewCells(this.board.orangePotionPreviewKeys);
    }

    showOrangePotionPreview(centerRow, centerCol) {
        const nextKeys = new Set();
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const row = centerRow + dr;
                const col = centerCol + dc;
                if (row < 0 || row >= this.board.GRID_SIZE || col < 0 || col >= this.board.GRID_SIZE) {
                    continue;
                }
                nextKeys.add(`${row},${col}`);
            }
        }

        this.showPotionPreviewCells(nextKeys);
    }

    showSinglePotionPreview(row, col) {
        this.showPotionPreviewCells([`${row},${col}`]);
    }

    showCrossPotionPreview(centerRow, centerCol) {
        const nextKeys = new Set();
        const positions = [
            { row: centerRow, col: centerCol },
            { row: centerRow - 1, col: centerCol },
            { row: centerRow + 1, col: centerCol },
            { row: centerRow, col: centerCol - 1 },
            { row: centerRow, col: centerCol + 1 }
        ];

        positions.forEach(({ row, col }) => {
            if (row < 0 || row >= this.board.GRID_SIZE || col < 0 || col >= this.board.GRID_SIZE) {
                return;
            }
            nextKeys.add(`${row},${col}`);
        });

        this.showPotionPreviewCells(nextKeys);
    }

    clearOrangePotionPreview(redraw = true) {
        if (!this.board.orangePotionPreviewKeys.size) return;
        const previousKeys = new Set(this.board.orangePotionPreviewKeys);
        this.board.orangePotionPreviewKeys.clear();
        if (redraw) {
            this.board.redrawPreviewCells(previousKeys);
        }
    }

    previewSelectedPion(grid, row, col, onComplete, duration = 110) {
        const pion = grid?.[row]?.[col];
        if (!pion) {
            if (onComplete) onComplete();
            return;
        }

        pion.selectionMarked = true;
        this.board.drawPion(grid, row, col);

        this.scene.time.delayedCall(duration, () => {
            pion.selectionMarked = false;
            if (pion.selectionTween) {
                pion.selectionTween.stop();
                pion.selectionTween = null;
            }
            this.board.drawPion(grid, row, col);
            if (onComplete) onComplete();
        });
    }
}
