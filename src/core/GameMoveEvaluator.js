class GameMoveEvaluator {
    constructor(gameLogic) {
        this.gameLogic = gameLogic;
    }

    evaluateMove(grid, row, col, currentPlayer) {
        let convertedCount = 1;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;

                const newRow = row + dr;
                const newCol = col + dc;

                if (newRow >= 0 &&
                    newRow < this.gameLogic.GRID_SIZE &&
                    newCol >= 0 &&
                    newCol < this.gameLogic.GRID_SIZE &&
                    grid[newRow][newCol].color !== currentPlayer) {
                    convertedCount++;
                }
            }
        }

        const centerStart = Math.floor(this.gameLogic.GRID_SIZE * 0.35);
        const centerEnd = Math.ceil(this.gameLogic.GRID_SIZE * 0.65) - 1;
        const centralBonus = (row >= centerStart && row <= centerEnd && col >= centerStart && col <= centerEnd) ? 2 : 0;
        const edgeMargin = Math.max(1, Math.floor(this.gameLogic.GRID_SIZE * 0.15));
        const edgeBonus = (
            row < edgeMargin ||
            row >= this.gameLogic.GRID_SIZE - edgeMargin ||
            col < edgeMargin ||
            col >= this.gameLogic.GRID_SIZE - edgeMargin
        ) ? 1 : 0;
        const adjacentSpecialBonus = this.countAdjacentBombCells(grid, row, col) * 5;
        const directBombPenalty = grid[row][col].specialType === 'BOMB' ? 8 : 0;
        const directSuperBombScore = grid[row][col].specialType === 'SUPER_BOMB'
            ? this.evaluateSuperBombMove(grid, row, col, currentPlayer)
            : 0;
        const iceBonus = grid[row][col].specialType === 'ICE'
            ? this.evaluateIceMove(grid, row, col, currentPlayer)
            : 0;
        const swampBonus = grid[row][col].specialType === 'SWAMP'
            ? this.evaluateSwampMove(grid, row, col, currentPlayer)
            : 0;
        const lightningBonus = grid[row][col].specialType === 'LIGHTNING'
            ? this.evaluateLightningMove(grid, row, col, currentPlayer)
            : 0;

        return convertedCount +
            centralBonus +
            edgeBonus +
            adjacentSpecialBonus +
            directSuperBombScore +
            iceBonus +
            swampBonus +
            lightningBonus -
            directBombPenalty;
    }

    countAdjacentBombCells(grid, row, col) {
        let specialCount = 0;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;

                const newRow = row + dr;
                const newCol = col + dc;

                if (newRow >= 0 &&
                    newRow < this.gameLogic.GRID_SIZE &&
                    newCol >= 0 &&
                    newCol < this.gameLogic.GRID_SIZE &&
                    (grid[newRow][newCol].specialType === 'BOMB' || grid[newRow][newCol].specialType === 'SUPER_BOMB')) {
                    specialCount++;
                }
            }
        }

        return specialCount;
    }

    evaluateSuperBombMove(grid, row, col, currentPlayer) {
        const ownerColor = grid[row][col].specialOwnerColor;
        let score = ownerColor === currentPlayer ? 8 : -18;

        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                if (dr === 0 && dc === 0) continue;

                const newRow = row + dr;
                const newCol = col + dc;

                if (newRow >= 0 &&
                    newRow < this.gameLogic.GRID_SIZE &&
                    newCol >= 0 &&
                    newCol < this.gameLogic.GRID_SIZE &&
                    grid[newRow][newCol].color !== currentPlayer) {
                    score += ownerColor === currentPlayer ? 1 : 0.2;
                }
            }
        }

        return score;
    }

    evaluateLightningMove(grid, row, col, currentPlayer) {
        let score = 10;

        for (let index = 0; index < this.gameLogic.GRID_SIZE; index++) {
            if (grid[row][index].color !== currentPlayer) {
                score++;
            }

            if (index !== row && grid[index][col].color !== currentPlayer) {
                score++;
            }
        }

        return score;
    }

    evaluateSwampMove(grid, row, col, currentPlayer) {
        let score = 8;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const newRow = row + dr;
                const newCol = col + dc;

                if (newRow < 0 ||
                    newRow >= this.gameLogic.GRID_SIZE ||
                    newCol < 0 ||
                    newCol >= this.gameLogic.GRID_SIZE) {
                    continue;
                }

                if (grid[newRow][newCol].color !== currentPlayer) {
                    score += 1.2;
                }
            }
        }

        return score;
    }

    evaluateIceMove(grid, row, col, currentPlayer) {
        let score = 6;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;

                const newRow = row + dr;
                const newCol = col + dc;

                if (newRow >= 0 &&
                    newRow < this.gameLogic.GRID_SIZE &&
                    newCol >= 0 &&
                    newCol < this.gameLogic.GRID_SIZE &&
                    grid[newRow][newCol].color !== currentPlayer) {
                    score++;
                }
            }
        }

        return score;
    }
}
