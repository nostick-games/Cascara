class GameRules {
    constructor(gameLogic) {
        this.gameLogic = gameLogic;
    }

    static getWinThreshold(gridSize, playerCount) {
        return 51;
    }

    static getDifficultyShift(gridSize, difficulty) {
        const shifts = {
            8: { EASY: 0.18, NORMAL: 0, HARD: -0.10 },
            12: { EASY: 0.20, NORMAL: 0, HARD: -0.13 },
            14: { EASY: 0.22, NORMAL: 0, HARD: -0.15 }
        };

        const sizeShifts = shifts[gridSize] || shifts[14];
        return sizeShifts[difficulty] ?? 0;
    }

    canCapturePion(grid, row, col, currentPlayer) {
        const pion = grid[row][col];

        if (
            pion.isLocked ||
            pion.isFrozen ||
            pion.isSwamp ||
            pion.isBurning ||
            (pion.isShielded && pion.shieldOwnerColor && pion.shieldOwnerColor !== currentPlayer) ||
            pion.color === currentPlayer
        ) {
            return false;
        }

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;

                const newRow = row + dr;
                const newCol = col + dc;

                if (newRow >= 0 &&
                    newRow < this.gameLogic.GRID_SIZE &&
                    newCol >= 0 &&
                    newCol < this.gameLogic.GRID_SIZE &&
                    grid[newRow][newCol].color === currentPlayer) {
                    return true;
                }
            }
        }

        return false;
    }

    checkWinCondition(grid) {
        const scoreData = this.getScoreData(grid);
        const leader = this.getLeadingPlayer(scoreData);
        const winThreshold = GameRules.getWinThreshold(this.gameLogic.GRID_SIZE, this.gameLogic.playerColors.length);

        return {
            gameOver: leader ? leader.percentage >= winThreshold : false,
            winThreshold,
            leader,
            counts: scoreData.counts,
            percentages: scoreData.percentages
        };
    }

    getScoreData(grid) {
        const counts = {};

        for (const color of this.gameLogic.playerColors) {
            counts[color] = 0;
        }

        for (let row = 0; row < this.gameLogic.GRID_SIZE; row++) {
            for (let col = 0; col < this.gameLogic.GRID_SIZE; col++) {
                const color = grid[row][col].color;
                if (counts[color] !== undefined) {
                    counts[color]++;
                }
            }
        }

        let totalPions = 0;
        for (let row = 0; row < this.gameLogic.GRID_SIZE; row++) {
            for (let col = 0; col < this.gameLogic.GRID_SIZE; col++) {
                if (!grid[row][col].isLocked) {
                    totalPions += 1;
                }
            }
        }
        const percentages = {};
        for (const color of this.gameLogic.playerColors) {
            percentages[color] = totalPions > 0 ? (counts[color] / totalPions) * 100 : 0;
        }

        return { counts, percentages };
    }

    getLeadingPlayer(scoreData) {
        let leader = null;

        for (const color of this.gameLogic.playerColors) {
            const candidate = {
                color,
                count: scoreData.counts[color],
                percentage: scoreData.percentages[color]
            };

            if (!leader || candidate.count > leader.count) {
                leader = candidate;
            }
        }

        return leader;
    }

    getLightningChargeIncrement(convertedCount) {
        const perCellCharge = 100 / Math.max(
            1,
            Math.round(this.gameLogic.GRID_SIZE * this.gameLogic.GRID_SIZE * this.gameLogic.LIGHTNING_CHARGE_TARGET_RATIO)
        );
        return convertedCount * perCellCharge;
    }
}
