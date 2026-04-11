class BattleRoyaleFlow {
    constructor(turnResolution) {
        this.turnResolution = turnResolution;
        this.flow = turnResolution.flow;
        this.scene = turnResolution.scene;
    }

    getConfig() {
        const boardSize = this.scene.boardSize;
        const aiCount = Math.max(1, Math.min(3, this.scene.aiCount || (this.scene.gameState?.playerOrder?.length || 2) - 1));
        const startTurnsByBoardAndAiCount = {
            8: { 1: 8, 2: 7, 3: 6 },
            12: { 1: 13, 2: 11, 3: 9 },
            14: { 1: 18, 2: 15, 3: 12 }
        };

        if (!startTurnsByBoardAndAiCount[boardSize]) {
            return null;
        }

        return {
            startTurn: startTurnsByBoardAndAiCount[boardSize][aiCount],
            intervalTurns: 5,
            finalLockedRatio: 0.5,
            stagnationWindowTurns: 5,
            maxTileSwing: 2
        };
    }

    applyClosureIfNeeded(endingPlayer, onComplete = null) {
        if (endingPlayer !== 'ROUGE' || this.scene.gameState.gameOver) {
            return false;
        }

        const config = this.getConfig();
        if (!config) {
            return false;
        }

        const playerTurnCount = this.scene.gameState.playerTurnCount || 0;
        if (playerTurnCount < config.startTurn) {
            return false;
        }

        const battleRoyaleState = this.scene.gameState.battleRoyale || {
            lockedRingCount: 0,
            lockedTileCount: 0,
            finalClosureReached: false,
            activationTurn: null,
            stagnationHistory: []
        };
        const scoreData = this.scene.gameLogic.getScoreData(this.scene.gameState.grid);
        this.scene.gameState.battleRoyale = battleRoyaleState;

        if (battleRoyaleState.finalClosureReached) {
            return false;
        }

        if (!battleRoyaleState.activationTurn) {
            this.recordStagnationSnapshot(battleRoyaleState, scoreData, playerTurnCount, config.stagnationWindowTurns);
            if (!this.shouldActivateFromStagnation(battleRoyaleState, config)) {
                return false;
            }
            battleRoyaleState.activationTurn = playerTurnCount;
        }

        const targetRingCount = 1 + Math.floor((playerTurnCount - battleRoyaleState.activationTurn) / config.intervalTurns);
        if (targetRingCount <= (battleRoyaleState.lockedRingCount || 0)) {
            return false;
        }

        this.scene.gameState.specialActionInProgress = true;
        const ringIndexesToApply = [];
        while ((battleRoyaleState.lockedRingCount || 0) < targetRingCount && !battleRoyaleState.finalClosureReached) {
            ringIndexesToApply.push(battleRoyaleState.lockedRingCount || 0);
            battleRoyaleState.lockedRingCount = (battleRoyaleState.lockedRingCount || 0) + 1;
        }

        this.playAlarm(() => {
            this.animateRings(ringIndexesToApply, config, battleRoyaleState, () => {
                const updatedScoreData = this.scene.gameLogic.getScoreData(this.scene.gameState.grid);
                const winData = this.scene.gameLogic.checkWinCondition(this.scene.gameState.grid);
                this.scene.gameState.specialActionInProgress = false;

                if (winData.gameOver) {
                    this.completeGameOver(winData);
                    return;
                }

                if (battleRoyaleState.finalClosureReached) {
                    const leader = this.scene.gameLogic.getLeadingPlayer(updatedScoreData);
                    if (leader) {
                        this.completeGameOver({
                            gameOver: true,
                            winThreshold: GameLogic.getWinThreshold(
                                this.scene.gameLogic.GRID_SIZE,
                                this.scene.gameLogic.playerColors.length
                            ),
                            leader,
                            counts: updatedScoreData.counts,
                            percentages: updatedScoreData.percentages
                        });
                        return;
                    }
                }

                if (onComplete) {
                    onComplete();
                }
            });
        });

        return true;
    }

    recordStagnationSnapshot(battleRoyaleState, scoreData, playerTurnCount, maxSnapshots) {
        const leader = this.scene.gameLogic.getLeadingPlayer(scoreData);
        battleRoyaleState.stagnationHistory = [
            ...(battleRoyaleState.stagnationHistory || []),
            {
                turn: playerTurnCount,
                leaderColor: leader?.color || null,
                leaderCount: leader?.count || 0,
                redCount: scoreData.counts?.ROUGE || 0
            }
        ].slice(-maxSnapshots);
    }

    shouldActivateFromStagnation(battleRoyaleState, config) {
        const history = battleRoyaleState.stagnationHistory || [];
        if (history.length < config.stagnationWindowTurns) {
            return false;
        }

        const leaderColor = history[0]?.leaderColor;
        if (!leaderColor || history.some((entry) => entry.leaderColor !== leaderColor)) {
            return false;
        }

        const leaderCounts = history.map((entry) => entry.leaderCount);
        const redCounts = history.map((entry) => entry.redCount);
        const leaderSwing = Math.max(...leaderCounts) - Math.min(...leaderCounts);
        const redSwing = Math.max(...redCounts) - Math.min(...redCounts);

        return leaderSwing <= config.maxTileSwing && redSwing <= config.maxTileSwing;
    }

    playAlarm(onComplete = null) {
        const flashSequence = [
            { delay: 0, duration: 180 },
            { delay: 230, duration: 180 },
            { delay: 460, duration: 220 }
        ];

        flashSequence.forEach(({ delay, duration }) => {
            this.scene.time.delayedCall(delay, () => {
                this.scene.cameras.main.flash(duration, 190, 35, 35, true);
            });
        });

        this.scene.time.delayedCall(760, () => {
            if (onComplete) {
                onComplete();
            }
        });
    }

    animateRings(ringIndexes, config, battleRoyaleState, onComplete = null) {
        const animateRingAtIndex = (index) => {
            if (index >= ringIndexes.length) {
                if (onComplete) {
                    onComplete();
                }
                return;
            }

            const ringIndex = ringIndexes[index];
            const lockedPositions = this.collectRingPositions(ringIndex);
            this.applyNextRing(config, battleRoyaleState, ringIndex, lockedPositions, () => {
                animateRingAtIndex(index + 1);
            });
        };

        animateRingAtIndex(0);
    }

    collectRingPositions(ringIndex) {
        const gridSize = this.scene.gameLogic.GRID_SIZE;
        const positions = [];

        for (let row = ringIndex; row < gridSize - ringIndex; row++) {
            for (let col = ringIndex; col < gridSize - ringIndex; col++) {
                const isBorderCell =
                    row === ringIndex ||
                    col === ringIndex ||
                    row === gridSize - 1 - ringIndex ||
                    col === gridSize - 1 - ringIndex;
                if (isBorderCell) {
                    positions.push({ row, col });
                }
            }
        }

        positions.sort((left, right) => {
            if (left.row !== right.row) {
                return left.row - right.row;
            }
            return left.col - right.col;
        });

        return positions;
    }

    applyNextRing(config, battleRoyaleState, ringIndex, lockedPositions = null, onComplete = null) {
        const grid = this.scene.gameState.grid;
        const gridSize = this.scene.gameLogic.GRID_SIZE;
        const maxRingIndex = Math.floor((gridSize - 1) / 2);
        if (ringIndex > maxRingIndex) {
            battleRoyaleState.finalClosureReached = true;
            if (onComplete) {
                onComplete();
            }
            return;
        }

        let lockedThisRing = 0;
        const positions = Array.isArray(lockedPositions) ? lockedPositions : this.collectRingPositions(ringIndex);

        const lockNext = (index) => {
            if (index >= positions.length) {
                battleRoyaleState.lockedTileCount = (battleRoyaleState.lockedTileCount || 0) + lockedThisRing;

                const totalTiles = gridSize * gridSize;
                const finalLockedThreshold = Math.ceil(totalTiles * config.finalLockedRatio);
                if (battleRoyaleState.lockedTileCount >= finalLockedThreshold) {
                    battleRoyaleState.finalClosureReached = true;
                }

                if (onComplete) {
                    onComplete();
                }
                return;
            }

            const { row, col } = positions[index];
            const pion = grid[row][col];
            if (!pion || pion.isLocked) {
                lockNext(index + 1);
                return;
            }

            pion.color = 'GRIS';
            pion.specialType = null;
            pion.specialOwnerColor = null;
            pion.isFrozen = false;
            pion.frozenTurns = 0;
            pion.frozenSourceRow = null;
            pion.frozenSourceCol = null;
            pion.thawing = false;
            pion.isSwamp = false;
            pion.swampTurns = 0;
            pion.swampSourceRow = null;
            pion.swampSourceCol = null;
            pion.isBurning = false;
            pion.burningTurns = 0;
            pion.burningOwnerColor = null;
            pion.isShielded = false;
            pion.shieldTurns = 0;
            pion.shieldOwnerColor = null;
            pion.isLocked = true;
            pion.lockZoneId = `battle-royale-ring-${ringIndex}`;
            lockedThisRing += 1;
            this.scene.gameBoard.drawPion(this.scene.gameState.grid, row, col);

            this.scene.time.delayedCall(28, () => {
                lockNext(index + 1);
            });
        };

        lockNext(0);
    }

    completeGameOver(winData) {
        this.scene.gameState.gameOver = true;
        const playerWon = winData?.leader?.color === 'ROUGE';
        this.scene.trophies.finalizeGame(playerWon ? 'victory' : 'defeat');
        if (playerWon) {
            this.scene.gameBoard.showGameOver(winData);
        } else {
            this.scene.gameBoard.showDefeat(winData?.leader?.color || null);
        }
        return true;
    }
}
