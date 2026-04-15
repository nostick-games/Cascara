class ProgressPotionFlow {
    constructor(flow) {
        this.flow = flow;
        this.scene = flow.scene;
    }

    markPotionConsumed(potionId) {
        const potion = (this.scene.gameState.progressPotions || []).find(
            (entry) => entry.id === potionId && !entry.consumed
        );
        if (!potion) {
            return null;
        }

        potion.consumed = true;
        potion.active = false;
        potion.cooldownTurnsRemaining = this.flow.getProgressPotionRefreshInterval() || 0;
        if (this.scene.gameState.playerStats?.consumedPotions) {
            this.scene.gameState.playerStats.consumedPotions[potionId] =
                (this.scene.gameState.playerStats.consumedPotions[potionId] || 0) + 1;
        }
        this.scene.trophies.markPotionConsumed(potionId);
        return potion;
    }

    handlePionClick(row, col) {
        const pion = this.scene.gameState.grid[row][col];
        const currentPotion = this.scene.gameState.pendingProgressPotion;

        if (currentPotion === 'ORANGE' || currentPotion === 'ROSE' || currentPotion === 'MENTHE' || currentPotion === 'BLANCHE' || currentPotion === 'CYAN') {
            if (currentPotion === 'ORANGE' && !this.isValidOrangePotionTarget(row, col)) {
                return true;
            }
            if (currentPotion === 'BLANCHE' && !this.isValidBlanchePotionTarget(row, col)) {
                return true;
            }
            if (currentPotion === 'CYAN' && !this.isValidCyanPotionTarget(row, col)) {
                return true;
            }

            const currentTarget = this.scene.gameState.pendingProgressPotionTarget;
            const isSameTarget = currentTarget && currentTarget.row === row && currentTarget.col === col;

            if (!isSameTarget) {
                this.scene.gameState.pendingProgressPotionTarget = { row, col };
                if (currentPotion === 'ORANGE') {
                    this.scene.gameBoard.showOrangePotionPreview(row, col);
                } else if (currentPotion === 'ROSE') {
                    this.scene.gameBoard.showOrangePotionPreview(row, col);
                } else if (currentPotion === 'MENTHE') {
                    this.scene.gameBoard.showCrossPotionPreview(row, col);
                } else if (currentPotion === 'CYAN') {
                    this.scene.gameBoard.showOrangePotionPreview(row, col);
                } else {
                    this.scene.gameBoard.showSinglePotionPreview(row, col);
                }
                return true;
            }

            if (currentPotion === 'ORANGE') {
                this.consumeOrangePotion(row, col);
            } else if (currentPotion === 'MENTHE') {
                this.consumeMenthePotion(row, col);
            } else if (currentPotion === 'BLANCHE') {
                this.consumeBlanchePotion(row, col);
            } else if (currentPotion === 'CYAN') {
                this.consumeCyanPotion(row, col);
            } else {
                this.consumeRosePotion(row, col);
            }
            this.scene.gameBoard.revealThought('ROUGE');
            return true;
        }

        if (this.scene.gameState.pendingProgressPotion === 'MARRON') {
            if (pion.color === this.scene.gameState.currentPlayer) return true;

            if (this.scene.gameLogic.canCapturePion(this.scene.gameState.grid, row, col, this.scene.gameState.currentPlayer)) {
                this.scene.gameBoard.previewSelectedPion(this.scene.gameState.grid, row, col, () => {
                    this.consumeMarronPotion();
                    this.flow.executeMove(row, col);
                    this.scene.gameBoard.revealThought('ROUGE');
                }, 90);
            }
            return true;
        }

        return false;
    }

    handleProgressPotionClick(potionId) {
        if (this.scene.gameState.gameOver ||
            this.scene.gameState.selectingStartingPlayer ||
            this.scene.gameState.currentPlayer !== 'ROUGE' ||
            this.scene.gameState.cascadeActive ||
            this.scene.gameState.specialActionInProgress) {
            return;
        }

        const potion = (this.scene.gameState.progressPotions || []).find(
            (entry) => entry.id === potionId && !entry.consumed
        );

        if (!potion || !potion.active) {
            return;
        }

        switch (potion.id) {
            case 'MARRON':
                this.scene.gameState.pendingPlacementBonus = null;
                this.scene.gameState.pendingProgressPotionTarget = null;

                if (this.scene.gameState.pendingProgressPotion === 'MARRON') {
                    this.scene.gameState.pendingProgressPotion = null;
                    this.scene.gameState.extraTurnCount = 0;
                    this.flow.updateUI();
                    return;
                }

                this.scene.gameState.pendingProgressPotion = 'MARRON';
                this.scene.gameState.extraTurnCount = Math.max(1, this.scene.gameState.extraTurnCount || 0);
                this.flow.updateUI();
                break;
            case 'MENTHE':
            case 'ROSE':
            case 'ORANGE':
            case 'BLANCHE':
            case 'CYAN':
                this.activateProgressPotionMode(potion.id, { persistent: true });
                break;
        }
    }

    handleProgressPotionInfoClick(potionId) {
        if (this.scene.gameState.gameOver ||
            this.scene.gameState.selectingStartingPlayer ||
            this.scene.gameState.currentPlayer !== 'ROUGE' ||
            this.scene.gameState.cascadeActive ||
            this.scene.gameState.specialActionInProgress ||
            this.scene.gameState.pendingProgressPotion !== potionId ||
            this.scene.activeProgressPotionInfoModal) {
            return;
        }

        const potion = (this.scene.gameState.progressPotions || []).find(
            (entry) => entry.id === potionId && !entry.consumed && entry.active
        );
        if (!potion) {
            return;
        }

        const titleKey = `potion.${potion.id.toLowerCase()}.title`;
        const effectKey = `potion.${potion.id.toLowerCase()}.effect`;
        const title = TranslationManager.t(titleKey);
        const effect = TranslationManager.t(effectKey);

        this.scene.activeProgressPotionInfoModal = CenteredPromptModal.show(this.scene, {
            width: this.scene.scale.width < 500 ? 332 : 424,
            height: this.scene.scale.width < 500 ? 404 : 438,
            depth: 42,
            titleText: title,
            titleIconTextureKey: potion.textureKey,
            titleIconSize: this.scene.scale.width < 500 ? 28 : 32,
            bodyText: effect,
            contentBuilder: potion.id === 'ORANGE'
                ? (scene, context, refs) => ProgressPotionInfoDemos.buildOrangeDemo(scene, context, refs, {
                    potionTextureKey: potion.textureKey,
                    gameBoard: this.scene.gameBoard
                })
                : potion.id === 'MENTHE'
                    ? (scene, context, refs) => ProgressPotionInfoDemos.buildMentheDemo(scene, context, refs, {
                        potionTextureKey: potion.textureKey,
                        gameBoard: this.scene.gameBoard
                    })
                    : potion.id === 'ROSE'
                    ? (scene, context, refs) => ProgressPotionInfoDemos.buildRoseDemo(scene, context, refs, {
                        potionTextureKey: potion.textureKey,
                        gameBoard: this.scene.gameBoard
                    })
                    : potion.id === 'MARRON'
                        ? (scene, context, refs) => ProgressPotionInfoDemos.buildMarronDemo(scene, context, refs, {
                            potionTextureKey: potion.textureKey,
                            gameBoard: this.scene.gameBoard
                        })
                    : potion.id === 'BLANCHE'
                        ? (scene, context, refs) => ProgressPotionInfoDemos.buildBlancheDemo(scene, context, refs, {
                            potionTextureKey: potion.textureKey,
                            gameBoard: this.scene.gameBoard
                        })
                    : potion.id === 'CYAN'
                        ? (scene, context, refs) => ProgressPotionInfoDemos.buildCyanDemo(scene, context, refs, {
                            potionTextureKey: potion.textureKey,
                            gameBoard: this.scene.gameBoard
                        })
                    : null,
            buttonLabel: TranslationManager.t('potion.info.seen_button'),
            buttonWidth: this.scene.scale.width < 500 ? 126 : 140,
            onConfirm: () => {
                this.scene.activeProgressPotionInfoModal = null;
            }
        });
    }

    activateProgressPotionMode(potionId, options = {}) {
        const { persistent = false, duration = 220, onComplete = null } = options;

        this.scene.gameState.pendingPlacementBonus = null;
        this.scene.gameState.pendingProgressPotionTarget = null;

        if (persistent) {
            this.scene.gameState.pendingProgressPotion =
                this.scene.gameState.pendingProgressPotion === potionId ? null : potionId;
            if (this.scene.gameState.pendingProgressPotion !== potionId) {
                this.scene.gameBoard.clearOrangePotionPreview();
            }
            this.flow.updateUI();
            return;
        }

        this.scene.gameState.pendingProgressPotion = potionId;
        this.scene.gameState.specialActionInProgress = true;
        this.flow.updateUI();

        this.scene.time.delayedCall(duration, () => {
            if (this.scene.gameState.gameOver) return;
            if (onComplete) onComplete();
            this.scene.gameState.pendingProgressPotion = null;
            this.scene.gameState.specialActionInProgress = false;
            this.flow.updateUI();
        });
    }

    consumeOrangePotion(centerRow, centerCol) {
        const potion = (this.scene.gameState.progressPotions || []).find(
            (entry) => entry.id === 'ORANGE' && !entry.consumed
        );
        if (!potion) {
            return false;
        }

        let convertedCount = 0;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const row = centerRow + dr;
                const col = centerCol + dc;

                if (row < 0 || row >= this.scene.config.gridSize || col < 0 || col >= this.scene.config.gridSize) {
                    continue;
                }

                const pion = this.scene.gameState.grid[row][col];
                if (pion.isLocked) {
                    continue;
                }
                const originalColor = pion.color;
                pion.color = 'ROUGE';

                if (originalColor !== 'ROUGE') {
                    convertedCount += 1;
                    this.scene.gameBoard.startCaptureAnimation(this.scene.gameState.grid, row, col, originalColor, 'ROUGE');
                } else {
                    this.scene.gameBoard.drawPion(this.scene.gameState.grid, row, col);
                }
            }
        }

        if (convertedCount <= 0) {
            return false;
        }

        if (this.scene.gameState.playerStats) {
            this.scene.gameState.playerStats.totalCapturedTiles += convertedCount;
        }

        this.scene.gameBoard.playProgressPotionConsumeEffect('ORANGE');
        this.markPotionConsumed('ORANGE');
        this.scene.gameState.pendingProgressPotion = null;
        this.scene.gameState.pendingProgressPotionTarget = null;
        this.scene.gameBoard.clearOrangePotionPreview(false);
        this.flow.updateUI();
        this.flow.finalizeTurn();
        return true;
    }

    isValidOrangePotionTarget(centerRow, centerCol) {
        let hasConvertibleTile = false;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const row = centerRow + dr;
                const col = centerCol + dc;
                const pion = this.scene.gameState.grid?.[row]?.[col];
                if (!pion) {
                    continue;
                }

                if (!pion.isLocked && pion.color !== 'ROUGE') {
                    hasConvertibleTile = true;
                }
            }
        }

        return hasConvertibleTile;
    }

    consumeRosePotion(row, col) {
        const potion = (this.scene.gameState.progressPotions || []).find(
            (entry) => entry.id === 'ROSE' && !entry.consumed
        );
        if (!potion) {
            return false;
        }

        const pion = this.scene.gameState.grid?.[row]?.[col];
        if (!pion) {
            return false;
        }

        const originalCenterColor = pion.color;
        if (originalCenterColor === 'ROUGE' || pion.isLocked) {
            return false;
        }

        let convertedCount = 0;

        pion.color = 'ROUGE';
        convertedCount += 1;
        this.scene.gameBoard.startCaptureAnimation(this.scene.gameState.grid, row, col, originalCenterColor, 'ROUGE');

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) {
                    continue;
                }

                const targetRow = row + dr;
                const targetCol = col + dc;
                const targetPion = this.scene.gameState.grid?.[targetRow]?.[targetCol];
                if (!targetPion || targetPion.isLocked) {
                    continue;
                }

                const originalColor = targetPion.color;
                if (originalColor === 'GRIS') {
                    continue;
                }

                targetPion.color = 'GRIS';
                convertedCount += 1;
                this.scene.gameBoard.startCaptureAnimation(
                    this.scene.gameState.grid,
                    targetRow,
                    targetCol,
                    originalColor,
                    'GRIS'
                );
            }
        }

        if (this.scene.gameState.playerStats) {
            this.scene.gameState.playerStats.totalCapturedTiles += convertedCount;
        }

        this.scene.gameBoard.playProgressPotionConsumeEffect('ROSE');
        this.markPotionConsumed('ROSE');
        this.scene.gameState.pendingProgressPotion = null;
        this.scene.gameState.pendingProgressPotionTarget = null;
        this.scene.gameBoard.clearOrangePotionPreview(false);
        this.flow.updateUI();
        this.flow.finalizeTurn();
        return true;
    }

    consumeMarronPotion() {
        const potion = (this.scene.gameState.progressPotions || []).find(
            (entry) => entry.id === 'MARRON' && !entry.consumed
        );
        if (!potion) {
            return false;
        }

        this.scene.gameBoard.playProgressPotionConsumeEffect('MARRON');
        this.markPotionConsumed('MARRON');
        return true;
    }

    isValidBlanchePotionTarget(row, col) {
        const pion = this.scene.gameState.grid?.[row]?.[col];
        if (!pion || pion.isLocked || !pion.specialType) {
            return false;
        }

        return Boolean(pion.specialOwnerColor && pion.specialOwnerColor !== 'ROUGE');
    }

    consumeBlanchePotion(row, col) {
        const potion = (this.scene.gameState.progressPotions || []).find(
            (entry) => entry.id === 'BLANCHE' && !entry.consumed
        );
        if (!potion || !this.isValidBlanchePotionTarget(row, col)) {
            return false;
        }

        const pion = this.scene.gameState.grid[row][col];
        pion.specialType = null;
        pion.specialOwnerColor = null;

        this.scene.gameBoard.drawPion(this.scene.gameState.grid, row, col);
        this.scene.gameBoard.playProgressPotionConsumeEffect('BLANCHE');
        this.markPotionConsumed('BLANCHE');
        this.scene.gameState.pendingProgressPotion = null;
        this.scene.gameState.pendingProgressPotionTarget = null;
        this.scene.gameBoard.clearOrangePotionPreview(false);
        this.flow.updateUI();
        this.flow.finalizeTurn();
        return true;
    }

    isValidCyanPotionTarget(centerRow, centerCol) {
        let hasRedTile = false;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const row = centerRow + dr;
                const col = centerCol + dc;
                const pion = this.scene.gameState.grid?.[row]?.[col];
                if (!pion) {
                    continue;
                }

                if (!pion.isLocked && pion.color === 'ROUGE') {
                    hasRedTile = true;
                }
            }
        }

        return hasRedTile;
    }

    consumeCyanPotion(centerRow, centerCol) {
        const potion = (this.scene.gameState.progressPotions || []).find(
            (entry) => entry.id === 'CYAN' && !entry.consumed
        );
        if (!potion || !this.isValidCyanPotionTarget(centerRow, centerCol)) {
            return false;
        }

        let protectedCount = 0;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const row = centerRow + dr;
                const col = centerCol + dc;
                const pion = this.scene.gameState.grid?.[row]?.[col];
                if (!pion || pion.isLocked || pion.color !== 'ROUGE') {
                    continue;
                }

                pion.isShielded = true;
                pion.shieldOwnerColor = 'ROUGE';
                // décrément immédiate en fin de tour, donc 4 pour conserver 3 tours complets
                pion.shieldTurns = Math.max(pion.shieldTurns || 0, 4);
                this.scene.gameBoard.drawPion(this.scene.gameState.grid, row, col);
                protectedCount += 1;
            }
        }

        if (protectedCount <= 0) {
            return false;
        }

        this.scene.gameBoard.playProgressPotionConsumeEffect('CYAN');
        this.markPotionConsumed('CYAN');
        this.scene.gameState.pendingProgressPotion = null;
        this.scene.gameState.pendingProgressPotionTarget = null;
        this.scene.gameBoard.clearOrangePotionPreview(false);
        this.flow.updateUI();
        this.flow.finalizeTurn();
        return true;
    }

    consumeMenthePotion(centerRow, centerCol) {
        const potion = (this.scene.gameState.progressPotions || []).find(
            (entry) => entry.id === 'MENTHE' && !entry.consumed
        );
        if (!potion) {
            return false;
        }

        let convertedCount = 0;
        const positions = [
            { row: centerRow, col: centerCol },
            { row: centerRow - 1, col: centerCol },
            { row: centerRow + 1, col: centerCol },
            { row: centerRow, col: centerCol - 1 },
            { row: centerRow, col: centerCol + 1 }
        ];

        positions.forEach(({ row, col }) => {
            if (row < 0 || row >= this.scene.config.gridSize || col < 0 || col >= this.scene.config.gridSize) {
                return;
            }

            const pion = this.scene.gameState.grid[row][col];
            if (pion.isLocked) {
                return;
            }
            const originalColor = pion.color;
            pion.color = 'ROUGE';

            if (originalColor !== 'ROUGE') {
                convertedCount += 1;
                this.scene.gameBoard.startCaptureAnimation(this.scene.gameState.grid, row, col, originalColor, 'ROUGE');
            } else {
                this.scene.gameBoard.drawPion(this.scene.gameState.grid, row, col);
            }
        });

        if (convertedCount <= 0) {
            return false;
        }

        if (this.scene.gameState.playerStats) {
            this.scene.gameState.playerStats.totalCapturedTiles += convertedCount;
        }

        this.scene.gameBoard.playProgressPotionConsumeEffect('MENTHE');
        this.markPotionConsumed('MENTHE');
        this.scene.gameState.pendingProgressPotion = null;
        this.scene.gameState.pendingProgressPotionTarget = null;
        this.scene.gameBoard.clearOrangePotionPreview(false);
        this.flow.updateUI();
        this.flow.finalizeTurn();
        return true;
    }
}
