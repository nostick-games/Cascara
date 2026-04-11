class GameGridFactory {
    constructor(gameLogic) {
        this.gameLogic = gameLogic;
    }

    initializeGrid() {
        const grid = [];
        for (let row = 0; row < this.gameLogic.GRID_SIZE; row++) {
            grid[row] = [];
            for (let col = 0; col < this.gameLogic.GRID_SIZE; col++) {
                grid[row][col] = {
                    color: 'GRIS',
                    row,
                    col,
                    specialOwnerColor: null,
                    graphics: null,
                    emojiText: null,
                    blinking: false,
                    flashing: false,
                    selectionMarked: false,
                    specialType: null,
                    captureAnimation: null,
                    isFrozen: false,
                    frozenTurns: 0,
                    thawing: false,
                    frozenSourceRow: null,
                    frozenSourceCol: null,
                    isSwamp: false,
                    swampTurns: 0,
                    swampSourceRow: null,
                    swampSourceCol: null,
                    isBurning: false,
                    burningTurns: 0,
                    burningOwnerColor: null,
                    isShielded: false,
                    shieldTurns: 0,
                    shieldOwnerColor: null,
                    lockZoneId: null,
                    isLocked: false,
                    lockedOwnerColor: null
                };
            }
        }

        this.applyInitialCornerZones(grid);
        this.applyInitialScatteredSingles(grid);

        return grid;
    }

    applyInitialCornerZones(grid) {
        const targetSizes = this.getInitialCornerZoneSizes();
        const cornerOrigins = {
            ROUGE: { row: 0, col: 0 },
            BLEU: { row: 0, col: this.gameLogic.GRID_SIZE - 1 },
            VERT: { row: this.gameLogic.GRID_SIZE - 1, col: 0 },
            JAUNE: { row: this.gameLogic.GRID_SIZE - 1, col: this.gameLogic.GRID_SIZE - 1 }
        };

        this.gameLogic.playerColors.forEach((color) => {
            const origin = cornerOrigins[color];
            if (!origin) {
                return;
            }

            const zoneSize = targetSizes[color] || 1;
            const positions = this.buildCornerZone(origin.row, origin.col, zoneSize);
            positions.forEach(({ row, col }) => {
                if (grid[row]?.[col]) {
                    grid[row][col].color = color;
                }
            });
        });
    }

    applyInitialScatteredSingles(grid) {
        const targetCounts = this.getInitialScatteredSingleCounts();

        this.gameLogic.playerColors.forEach((color) => {
            let remaining = targetCounts[color] || 0;

            while (remaining > 0) {
                const placed = this.placeRandomScatteredSingle(grid, color);
                if (!placed) {
                    break;
                }
                remaining -= 1;
            }
        });
    }

    getInitialCornerZoneSizes() {
        const baseByGridSize = {
            8: 4,
            12: 8,
            14: 10
        };
        const redBonusByDifficulty = {
            EASY: 2,
            NORMAL: 0,
            HARD: -1
        };

        const baseSize = baseByGridSize[this.gameLogic.GRID_SIZE] || 6;
        const redSize = Math.max(3, baseSize + (redBonusByDifficulty[this.gameLogic.difficulty] || 0));
        const sizes = {};

        this.gameLogic.playerColors.forEach((color) => {
            sizes[color] = color === 'ROUGE' ? redSize : baseSize;
        });

        return sizes;
    }

    getInitialScatteredSingleCounts() {
        const baseByGridSize = {
            8: 1,
            12: 2,
            14: 2
        };
        const redBonusByDifficulty = {
            EASY: 1,
            NORMAL: 0,
            HARD: -1
        };

        const baseCount = baseByGridSize[this.gameLogic.GRID_SIZE] || 1;
        const redCount = Math.max(0, baseCount + (redBonusByDifficulty[this.gameLogic.difficulty] || 0));
        const counts = {};

        this.gameLogic.playerColors.forEach((color) => {
            counts[color] = color === 'ROUGE' ? redCount : baseCount;
        });

        return counts;
    }

    buildCornerZone(startRow, startCol, targetSize) {
        const zone = [];
        const zoneKeys = new Set();
        const frontier = [{ row: startRow, col: startCol }];
        const frontierKeys = new Set([`${startRow},${startCol}`]);

        while (zone.length < targetSize && frontier.length > 0) {
            const index = Math.floor(Math.random() * frontier.length);
            const current = frontier.splice(index, 1)[0];
            frontierKeys.delete(`${current.row},${current.col}`);

            const currentKey = `${current.row},${current.col}`;
            if (zoneKeys.has(currentKey)) {
                continue;
            }

            zone.push(current);
            zoneKeys.add(currentKey);

            this.getCornerGrowthNeighbors(current.row, current.col, startRow, startCol).forEach((neighbor) => {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (zoneKeys.has(neighborKey) || frontierKeys.has(neighborKey)) {
                    return;
                }

                frontier.push(neighbor);
                frontierKeys.add(neighborKey);
            });
        }

        return zone;
    }

    getCornerGrowthNeighbors(row, col, startRow, startCol) {
        const maxIndex = this.gameLogic.GRID_SIZE - 1;
        const rowDirection = startRow === 0 ? 1 : -1;
        const colDirection = startCol === 0 ? 1 : -1;
        const neighbors = [];

        const candidates = [
            { row: row + rowDirection, col },
            { row, col: col + colDirection },
            { row: row + rowDirection, col: col + colDirection },
            { row: row + rowDirection, col: col - colDirection },
            { row: row - rowDirection, col: col + colDirection }
        ];

        candidates.forEach((candidate) => {
            if (
                candidate.row < 0 ||
                candidate.row > maxIndex ||
                candidate.col < 0 ||
                candidate.col > maxIndex
            ) {
                return;
            }

            const distanceToCorner =
                Math.abs(candidate.row - startRow) +
                Math.abs(candidate.col - startCol);
            neighbors.push({
                ...candidate,
                distanceToCorner
            });
        });

        neighbors.sort((left, right) => left.distanceToCorner - right.distanceToCorner);
        return neighbors;
    }

    placeRandomScatteredSingle(grid, color) {
        const candidates = [];

        for (let row = 0; row < this.gameLogic.GRID_SIZE; row++) {
            for (let col = 0; col < this.gameLogic.GRID_SIZE; col++) {
                if (!this.canPlaceScatteredSingleAt(grid, row, col)) {
                    continue;
                }

                candidates.push({ row, col });
            }
        }

        if (!candidates.length) {
            return false;
        }

        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        grid[selected.row][selected.col].color = color;
        return true;
    }

    canPlaceScatteredSingleAt(grid, row, col) {
        const pion = grid[row]?.[col];
        if (!pion || pion.color !== 'GRIS') {
            return false;
        }

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const newRow = row + dr;
                const newCol = col + dc;
                const neighbor = grid[newRow]?.[newCol];

                if (!neighbor) {
                    continue;
                }

                if (dr === 0 && dc === 0) {
                    continue;
                }

                if (neighbor.color !== 'GRIS') {
                    return false;
                }
            }
        }

        return true;
    }

    buildInitialColorDistribution(totalPions) {
        const baseShare = totalPions / this.gameLogic.playerColors.length;
        const difficultyShift = GameRules.getDifficultyShift(this.gameLogic.GRID_SIZE, this.gameLogic.difficulty);
        const desiredCounts = {};

        for (const color of this.gameLogic.playerColors) {
            desiredCounts[color] = Math.floor(baseShare);
        }

        const extraForRed = Math.round(baseShare * difficultyShift);
        desiredCounts.ROUGE = Math.max(1, desiredCounts.ROUGE + extraForRed);

        if (extraForRed > 0) {
            this.redistributeFromOthers(desiredCounts, extraForRed);
        } else if (extraForRed < 0) {
            this.redistributeToOthers(desiredCounts, Math.abs(extraForRed));
        }

        let assignedCount = this.gameLogic.playerColors.reduce((sum, color) => sum + desiredCounts[color], 0);
        while (assignedCount < totalPions) {
            const color = this.gameLogic.playerColors[assignedCount % this.gameLogic.playerColors.length];
            desiredCounts[color]++;
            assignedCount++;
        }
        while (assignedCount > totalPions) {
            const color = this.gameLogic.playerColors.find((candidate) => desiredCounts[candidate] > 1) || 'ROUGE';
            desiredCounts[color]--;
            assignedCount--;
        }

        const colors = [];
        for (const color of this.gameLogic.playerColors) {
            for (let i = 0; i < desiredCounts[color]; i++) {
                colors.push(color);
            }
        }

        return colors;
    }

    redistributeFromOthers(desiredCounts, amount) {
        const otherColors = this.gameLogic.playerColors.filter((color) => color !== 'ROUGE');
        let remaining = amount;
        let index = 0;

        while (remaining > 0 && otherColors.length > 0) {
            const color = otherColors[index % otherColors.length];
            if (desiredCounts[color] > 1) {
                desiredCounts[color]--;
                remaining--;
            }
            index++;
        }
    }

    redistributeToOthers(desiredCounts, amount) {
        const otherColors = this.gameLogic.playerColors.filter((color) => color !== 'ROUGE');

        for (let i = 0; i < amount; i++) {
            const color = otherColors[i % otherColors.length] || 'ROUGE';
            desiredCounts[color]++;
        }
    }

    spawnSuperBombCell(grid, ownerColor = null) {
        return this.spawnSpecialCell(grid, 'SUPER_BOMB', null, null, ownerColor);
    }

    spawnLightningCell(grid, ownerColor = null) {
        return this.spawnSpecialCell(grid, 'LIGHTNING', null, null, ownerColor);
    }

    spawnIceCell(grid, ownerColor = null) {
        return this.spawnSpecialCell(grid, 'ICE', null, null, ownerColor);
    }

    spawnSwampCell(grid, ownerColor = null) {
        return this.spawnSpecialCell(grid, 'SWAMP', null, null, ownerColor);
    }

    spawnSpecialCell(grid, specialType, excludedRow = null, excludedCol = null, ownerColor = null) {
        const candidates = [];

        for (let row = 0; row < this.gameLogic.GRID_SIZE; row++) {
            for (let col = 0; col < this.gameLogic.GRID_SIZE; col++) {
                const isExcludedCell = row === excludedRow && col === excludedCol;
                const pion = grid[row][col];
                if (!pion.specialType &&
                    !pion.isLocked &&
                    !pion.isFrozen &&
                    !pion.isSwamp &&
                    !pion.isBurning &&
                    !isExcludedCell) {
                    candidates.push({ row, col });
                }
            }
        }

        if (candidates.length === 0) {
            return null;
        }

        const selectedCandidate = candidates[Math.floor(Math.random() * candidates.length)];
        grid[selectedCandidate.row][selectedCandidate.col].specialType = specialType;
        grid[selectedCandidate.row][selectedCandidate.col].specialOwnerColor = ownerColor;
        return selectedCandidate;
    }

    spawnOwnedSuperBombCell(grid, ownerColor) {
        const spawnedCell = this.spawnSpecialCell(grid, 'SUPER_BOMB', null, null, ownerColor);
        if (!spawnedCell) {
            return null;
        }

        return spawnedCell;
    }

    placeOwnedSuperBombCell(grid, row, col, ownerColor) {
        const pion = grid[row]?.[col];
        if (!pion ||
            pion.specialType ||
            pion.isLocked ||
            pion.isFrozen ||
            pion.isSwamp ||
            pion.isBurning ||
            pion.color !== ownerColor) {
            return null;
        }

        pion.specialType = 'SUPER_BOMB';
        pion.specialOwnerColor = ownerColor;
        return { row, col };
    }
}
