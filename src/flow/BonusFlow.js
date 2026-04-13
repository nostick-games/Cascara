class BonusFlow {
    constructor(flow) {
        this.flow = flow;
        this.scene = flow.scene;
    }

    handleBonusClick(color) {
        if (color !== 'ROUGE' ||
            this.scene.gameState.gameOver ||
            this.scene.gameState.selectingStartingPlayer ||
            this.scene.gameState.currentPlayer !== 'ROUGE' ||
            this.scene.gameState.cascadeActive ||
            this.scene.gameState.specialActionInProgress) {
            return;
        }

        const availableBonus = this.scene.gameState.availableBonuses?.[color];
        if (!availableBonus) return;

        if (availableBonus === 'PLACE_BOMB') {
            this.scene.gameState.pendingProgressPotion = null;
            this.scene.gameState.pendingPlacementBonus =
                this.scene.gameState.pendingPlacementBonus === 'PLACE_BOMB' ? null : 'PLACE_BOMB';
            this.flow.updateUI();
            return;
        }

        this.scene.gameBoard.revealThought('ROUGE', () => {
            this.consumeRandomBonus(color, availableBonus);
        });
    }

    playChaosGaugeDrain(playerColor, onComplete) {
        this.scene.gameState.specialActionInProgress = true;
        this.scene.gameBoard.animateChaosGaugeDrain(playerColor, () => {
            if (onComplete) onComplete();
        });
    }

    applyLightningCharge(playerColor, convertedCount, specialActivationCount = 0) {
        if (!playerColor || (convertedCount <= 0 && specialActivationCount <= 0)) return;

        if (this.shouldDisableChaosGauge(playerColor)) {
            this.scene.gameState.lightningCharge[playerColor] = 0;
            this.scene.gameState.availableBonuses[playerColor] = null;
            this.scene.gameState.bonusHoldTurns[playerColor] = 0;
            this.scene.gameState.bonusUseThresholds[playerColor] = 0;
            return;
        }

        if (this.scene.gameState.availableBonuses?.[playerColor]) {
            this.scene.gameState.lightningCharge[playerColor] = 0;
            return;
        }

        const chargeMultiplier = this.getChaosChargeMultiplier(playerColor);
        const increment = this.scene.gameLogic.getLightningChargeIncrement(convertedCount + specialActivationCount) * chargeMultiplier;
        const currentCharge = this.scene.gameState.lightningCharge[playerColor] || 0;
        const nextCharge = currentCharge + increment;

        if (nextCharge < 100) {
            this.scene.gameState.lightningCharge[playerColor] = nextCharge;
            return;
        }

        this.scene.gameState.lightningCharge[playerColor] = 0;
        if (this.scene.isFightMode) {
            this.scene.gameState.availableBonuses[playerColor] = 'PLACE_BOMB';
            this.resetBonusHoldState(playerColor);
            this.scene.gameState.nextBonusStage[playerColor] = 'PLACE_BOMB';
            return;
        }
        if (this.shouldForceBossBombBonus(playerColor)) {
            this.scene.gameState.availableBonuses[playerColor] = 'PLACE_BOMB';
            this.resetBonusHoldState(playerColor);
            this.scene.gameState.nextBonusStage[playerColor] = 'PLACE_BOMB';
            return;
        }

        const nextStage = this.scene.gameState.nextBonusStage[playerColor] || 'PLACE_BOMB';
        this.scene.gameState.availableBonuses[playerColor] = nextStage === 'PLACE_BOMB'
            ? 'PLACE_BOMB'
            : this.getRandomBonusType();
        this.resetBonusHoldState(playerColor);
        this.scene.gameState.nextBonusStage[playerColor] = nextStage === 'PLACE_BOMB'
            ? 'RANDOM_BONUS'
            : 'PLACE_BOMB';
    }

    getRandomBonusType() {
        const bonusTypes = ['LIGHTNING', 'ICE', 'SWAMP', 'BOMB'];
        return Phaser.Utils.Array.GetRandom(bonusTypes);
    }

    shouldForceBossBombBonus(playerColor) {
        return playerColor === 'ROUGE' && this.getActiveBossBlessingId() === 'PLAYER_BOMB_ONLY';
    }

    shouldDisableChaosGauge(playerColor) {
        return playerColor !== 'ROUGE' && this.getActiveBossBlessingId() === 'DISABLE_BOSS_CHAOS';
    }

    getChaosChargeMultiplier(playerColor) {
        if (this.scene.isFightMode) {
            return 0.45;
        }
        if (playerColor === 'ROUGE' && this.getActiveBossBlessingId() === 'PLAYER_FAST_CHAOS') {
            return 1.5;
        }
        return 1;
    }

    getActiveBossBlessingId() {
        return this.scene.storyContext?.storyState?.activeBossBlessingId || null;
    }

    getRandomBonusUseThreshold() {
        return Phaser.Math.Between(2, 3);
    }

    resetBonusHoldState(playerColor) {
        this.scene.gameState.bonusHoldTurns[playerColor] = 0;
        this.scene.gameState.bonusUseThresholds[playerColor] = this.getRandomBonusUseThreshold();
    }

    updateBonusHoldState(playerColor) {
        if (!playerColor) return;

        if (this.scene.gameState.availableBonuses[playerColor]) {
            this.scene.gameState.bonusHoldTurns[playerColor] =
                (this.scene.gameState.bonusHoldTurns[playerColor] || 0) + 1;
            if (!this.scene.gameState.bonusUseThresholds[playerColor]) {
                this.scene.gameState.bonusUseThresholds[playerColor] = this.getRandomBonusUseThreshold();
            }
            return;
        }

        this.scene.gameState.bonusHoldTurns[playerColor] = 0;
        this.scene.gameState.bonusUseThresholds[playerColor] = 0;
    }

    previewAIBombPlacement(row, col, playerColor) {
        this.scene.gameState.pendingPlacementBonus = 'PLACE_BOMB';
        this.scene.gameState.specialActionInProgress = true;
        this.flow.updateUI();

        this.scene.time.delayedCall(280, () => {
            if (this.scene.gameState.gameOver) return;
            this.scene.gameState.specialActionInProgress = false;
            this.consumePlaceBomb(row, col, playerColor);
        });
    }

    consumePlaceBomb(row, col, playerColor) {
        this.playChaosGaugeDrain(playerColor, () => {
            this.scene.gameBoard.animateChaosBonusTravel(playerColor, 'PLACE_BOMB', row, col, () => {
                this.consumePlaceBombNow(row, col, playerColor);
            });
        });
        return true;
    }

    consumePlaceBombNow(row, col, playerColor) {
        const placedCell = this.scene.gameLogic.placeOwnedSuperBombCell(
            this.scene.gameState.grid,
            row,
            col,
            playerColor
        );
        if (!placedCell) {
            this.scene.gameState.specialActionInProgress = false;
            this.flow.updateUI();
            return false;
        }

        if (playerColor === 'ROUGE') {
            this.scene.trophies.markGaugeBombUsed();
        }

        this.scene.gameState.availableBonuses[playerColor] = null;
        this.scene.gameState.pendingPlacementBonus = null;
        this.scene.gameState.bonusHoldTurns[playerColor] = 0;
        this.scene.gameState.bonusUseThresholds[playerColor] = 0;
        this.scene.gameBoard.drawPion(this.scene.gameState.grid, row, col);
        this.flow.finalizeTurn();
        return true;
    }

    consumeRandomBonus(playerColor, bonusType) {
        this.playChaosGaugeDrain(playerColor, () => {
            this.consumeRandomBonusNow(playerColor, bonusType);
        });
        return true;
    }

    consumeRandomBonusNow(playerColor, bonusType) {
        let didSpawn = false;

        switch (bonusType) {
            case 'LIGHTNING': {
                const spawnedLightningCell = this.scene.gameLogic.spawnLightningCell(this.scene.gameState.grid, playerColor);
                didSpawn = Boolean(spawnedLightningCell);
                if (spawnedLightningCell) {
                    this.scene.gameBoard.animateChaosBonusTravel(playerColor, bonusType, spawnedLightningCell.row, spawnedLightningCell.col, () => {
                        this.scene.gameBoard.animateLightningSpawn(this.scene.gameState.grid, spawnedLightningCell.row, spawnedLightningCell.col);
                    });
                }
                break;
            }
            case 'ICE': {
                const spawnedIceCell = this.scene.gameLogic.spawnIceCell(this.scene.gameState.grid, playerColor);
                didSpawn = Boolean(spawnedIceCell);
                if (spawnedIceCell) {
                    this.scene.gameBoard.animateChaosBonusTravel(playerColor, bonusType, spawnedIceCell.row, spawnedIceCell.col, () => {
                        this.scene.gameBoard.drawPion(this.scene.gameState.grid, spawnedIceCell.row, spawnedIceCell.col);
                    });
                }
                break;
            }
            case 'SWAMP': {
                const spawnedSwampCell = this.scene.gameLogic.spawnSwampCell(this.scene.gameState.grid, playerColor);
                didSpawn = Boolean(spawnedSwampCell);
                if (spawnedSwampCell) {
                    this.scene.gameBoard.animateChaosBonusTravel(playerColor, bonusType, spawnedSwampCell.row, spawnedSwampCell.col, () => {
                        this.scene.gameBoard.drawPion(this.scene.gameState.grid, spawnedSwampCell.row, spawnedSwampCell.col);
                    });
                }
                break;
            }
            case 'BOMB': {
                const spawnedBombCell = this.spawnBombBonusCells(playerColor);
                didSpawn = Boolean(spawnedBombCell);
                if (spawnedBombCell) {
                    this.scene.gameBoard.animateChaosBonusTravel(playerColor, bonusType, spawnedBombCell.row, spawnedBombCell.col, () => {
                        this.scene.gameBoard.drawPion(this.scene.gameState.grid, spawnedBombCell.row, spawnedBombCell.col);
                    });
                }
                break;
            }
            default:
                break;
        }

        if (!didSpawn) {
            this.scene.gameState.specialActionInProgress = false;
            this.flow.updateUI();
            return false;
        }

        if (playerColor === 'ROUGE') {
            this.scene.trophies.markChaosBonusUsed();
        }

        this.scene.gameState.availableBonuses[playerColor] = null;
        this.scene.gameState.pendingPlacementBonus = null;
        this.scene.gameState.bonusHoldTurns[playerColor] = 0;
        this.scene.gameState.bonusUseThresholds[playerColor] = 0;
        this.flow.finalizeTurn();
        return true;
    }

    spawnBombBonusCells(ownerColor = null) {
        const spawnCount = this.scene.config.bombBonusSpawnCount || 1;
        let firstSpawnedCell = null;

        for (let index = 0; index < spawnCount; index++) {
            const spawnedCell = this.scene.gameLogic.spawnSpecialCell(this.scene.gameState.grid, 'BOMB', null, null, ownerColor);
            if (spawnedCell) {
                if (!firstSpawnedCell) {
                    firstSpawnedCell = spawnedCell;
                } else {
                    this.scene.gameBoard.drawPion(this.scene.gameState.grid, spawnedCell.row, spawnedCell.col);
                }
            } else {
                break;
            }
        }

        return firstSpawnedCell;
    }
}
