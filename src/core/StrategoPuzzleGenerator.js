class StrategoPuzzleGenerator {
    static SETTINGS_BY_BOARD_SIZE = {
        8: {
            moveRange: [9, 11],
            seedSize: 3,
            seedPatterns: [
                'CENTER_SQUARE',
                'CENTER_CROSS',
                'CENTER_DIAMOND',
                'OFFSET_BLOCK',
                'DOUBLE_CORE'
            ]
        },
        12: {
            moveRange: [14, 18],
            seedSize: 3,
            seedPatterns: [
                'CENTER_SQUARE',
                'CENTER_CROSS',
                'CENTER_DIAMOND',
                'WIDE_OFFSET_BLOCK',
                'TWIN_BRIDGES'
            ]
        },
        14: {
            moveRange: [20, 24],
            seedSize: 3,
            seedPatterns: [
                'CENTER_SQUARE',
                'CENTER_CROSS',
                'CENTER_DIAMOND',
                'FORTRESS_RING',
                'TRIDENT_CORE'
            ]
        }
    };

    static getSettings(boardSize) {
        return this.SETTINGS_BY_BOARD_SIZE[boardSize] || this.SETTINGS_BY_BOARD_SIZE[8];
    }

    static getSeedPatternIds(boardSize) {
        return [...(this.getSettings(boardSize).seedPatterns || ['CENTER_SQUARE'])];
    }

    static generate(boardSize, options = {}) {
        const size = [8, 12, 14].includes(boardSize) ? boardSize : 8;
        const settings = this.getSettings(size);
        const targetMoves = Phaser.Math.Between(settings.moveRange[0], settings.moveRange[1]);
        const forcedPatternId = options?.seedPatternId || null;

        for (let attempt = 0; attempt < 260; attempt++) {
            const puzzle = this.generateAttempt(size, settings, targetMoves, forcedPatternId);
            if (puzzle) {
                return puzzle;
            }
        }

        return this.generateFallback(size, settings, forcedPatternId);
    }

    static generateAttempt(boardSize, settings, targetMoves, forcedPatternId = null) {
        const grid = this.createEmptyGrid(boardSize);
        const seedPatternId = this.applySeed(grid, settings.seedSize, forcedPatternId);

        const initialGrid = this.cloneGrid(grid);
        const solutionMoves = [];
        const totalCells = boardSize * boardSize;

        while (this.countRedTiles(grid) < totalCells && solutionMoves.length < targetMoves) {
            const validMoves = this.collectValidMoves(grid);
            if (!validMoves.length) {
                return null;
            }

            const remainingGreyTiles = totalCells - this.countRedTiles(grid);
            const remainingMoves = targetMoves - solutionMoves.length;
            const targetGain = Math.max(1, Math.ceil(remainingGreyTiles / Math.max(1, remainingMoves)));
            const rankedMoves = validMoves
                .map((move) => ({
                    ...move,
                    weight: Math.abs(move.convertedCount - targetGain) + (move.nearSeed ? 0 : 0.75)
                }))
                .sort((left, right) => left.weight - right.weight);
            const candidatePool = rankedMoves.slice(0, Math.min(4, rankedMoves.length));
            const selectedMove = Phaser.Utils.Array.GetRandom(candidatePool);
            const convertedPositions = this.applyMove(grid, selectedMove.row, selectedMove.col);

            solutionMoves.push({
                row: selectedMove.row,
                col: selectedMove.col,
                convertedPositions
            });
        }

        if (this.countRedTiles(grid) !== totalCells || solutionMoves.length !== targetMoves) {
            return null;
        }

        return {
            boardSize,
            seedPatternId,
            initialGrid,
            moveLimit: solutionMoves.length,
            solutionMoves
        };
    }

    static generateFallback(boardSize, settings, forcedPatternId = null) {
        const grid = this.createEmptyGrid(boardSize);
        const seedPatternId = this.applySeed(grid, settings.seedSize, forcedPatternId);
        const initialGrid = this.cloneGrid(grid);
        const solutionMoves = [];
        const totalCells = boardSize * boardSize;
        const maxMoves = settings.moveRange[1];

        while (this.countRedTiles(grid) < totalCells && solutionMoves.length < maxMoves) {
            const validMoves = this.collectValidMoves(grid).sort((left, right) => right.convertedCount - left.convertedCount);
            if (!validMoves.length) {
                break;
            }

            const selectedMove = validMoves[0];
            const convertedPositions = this.applyMove(grid, selectedMove.row, selectedMove.col);
            solutionMoves.push({
                row: selectedMove.row,
                col: selectedMove.col,
                convertedPositions
            });
        }

        return {
            boardSize,
            seedPatternId,
            initialGrid,
            moveLimit: solutionMoves.length,
            solutionMoves
        };
    }

    static createEmptyGrid(boardSize) {
        const grid = [];
        for (let row = 0; row < boardSize; row++) {
            grid[row] = [];
            for (let col = 0; col < boardSize; col++) {
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
        return grid;
    }

    static applySeed(grid, seedSize, forcedPatternId = null) {
        const boardSize = grid.length;
        const settings = this.getSettings(boardSize);
        const availablePatterns = settings.seedPatterns || ['CENTER_SQUARE'];
        const patternId = forcedPatternId && availablePatterns.includes(forcedPatternId)
            ? forcedPatternId
            : Phaser.Utils.Array.GetRandom(availablePatterns);
        const seedPositions = this.buildSeedPattern(boardSize, seedSize, patternId);

        seedPositions.forEach(({ row, col }) => {
            if (grid[row]?.[col]) {
                grid[row][col].color = 'ROUGE';
            }
        });

        return patternId;
    }

    static buildSeedPattern(boardSize, seedSize, patternId) {
        const center = Math.floor(boardSize / 2);
        const centerStart = Math.floor((boardSize - seedSize) / 2);
        const patternBuilders = {
            CENTER_SQUARE: () => {
                const positions = [];
                for (let row = 0; row < seedSize; row++) {
                    for (let col = 0; col < seedSize; col++) {
                        positions.push({ row: centerStart + row, col: centerStart + col });
                    }
                }
                return positions;
            },
            CENTER_CROSS: () => ([
                { row: center, col: center },
                { row: center - 1, col: center },
                { row: center + 1, col: center },
                { row: center, col: center - 1 },
                { row: center, col: center + 1 }
            ]),
            CENTER_DIAMOND: () => ([
                { row: center, col: center },
                { row: center - 1, col: center },
                { row: center + 1, col: center },
                { row: center, col: center - 1 },
                { row: center, col: center + 1 },
                { row: center - 1, col: center - 1 },
                { row: center + 1, col: center + 1 }
            ]),
            OFFSET_BLOCK: () => {
                const startRow = Math.max(1, centerStart - 1);
                const startCol = Math.min(boardSize - seedSize - 1, centerStart + 1);
                const positions = [];
                for (let row = 0; row < seedSize; row++) {
                    for (let col = 0; col < seedSize; col++) {
                        positions.push({ row: startRow + row, col: startCol + col });
                    }
                }
                return positions;
            },
            DOUBLE_CORE: () => ([
                { row: center - 1, col: center - 1 },
                { row: center - 1, col: center },
                { row: center, col: center - 1 },
                { row: center, col: center },
                { row: center - 1, col: center + 2 },
                { row: center, col: center + 2 }
            ]),
            WIDE_OFFSET_BLOCK: () => {
                const startRow = Math.max(2, centerStart - 1);
                const startCol = Math.min(boardSize - seedSize - 2, centerStart + 1);
                const positions = [];
                for (let row = 0; row < seedSize; row++) {
                    for (let col = 0; col < seedSize; col++) {
                        positions.push({ row: startRow + row, col: startCol + col });
                    }
                }
                positions.push({ row: startRow + 1, col: startCol - 1 });
                positions.push({ row: startRow + 1, col: startCol + seedSize });
                return positions;
            },
            TWIN_BRIDGES: () => ([
                { row: center - 1, col: center - 2 },
                { row: center - 1, col: center - 1 },
                { row: center - 1, col: center + 1 },
                { row: center - 1, col: center + 2 },
                { row: center, col: center - 1 },
                { row: center, col: center },
                { row: center, col: center + 1 },
                { row: center + 1, col: center - 2 },
                { row: center + 1, col: center - 1 },
                { row: center + 1, col: center + 1 },
                { row: center + 1, col: center + 2 }
            ]),
            FORTRESS_RING: () => ([
                { row: center - 2, col: center - 1 },
                { row: center - 2, col: center },
                { row: center - 1, col: center - 2 },
                { row: center - 1, col: center + 1 },
                { row: center, col: center - 2 },
                { row: center, col: center + 1 },
                { row: center + 1, col: center - 1 },
                { row: center + 1, col: center },
                { row: center - 1, col: center - 1 },
                { row: center - 1, col: center },
                { row: center, col: center - 1 },
                { row: center, col: center }
            ]),
            TRIDENT_CORE: () => ([
                { row: center - 2, col: center },
                { row: center - 1, col: center },
                { row: center, col: center },
                { row: center + 1, col: center },
                { row: center - 1, col: center - 2 },
                { row: center - 1, col: center - 1 },
                { row: center - 1, col: center + 1 },
                { row: center - 1, col: center + 2 },
                { row: center + 1, col: center - 1 },
                { row: center + 1, col: center + 1 }
            ])
        };
        const buildPattern = patternBuilders[patternId] || patternBuilders.CENTER_SQUARE;

        return buildPattern()
            .filter(({ row, col }) => row >= 0 && row < boardSize && col >= 0 && col < boardSize)
            .filter((position, index, positions) =>
                positions.findIndex((candidate) => candidate.row === position.row && candidate.col === position.col) === index
            );
    }

    static cloneGrid(grid) {
        return grid.map((row) => row.map((cell) => ({ ...cell })));
    }

    static countRedTiles(grid) {
        let count = 0;
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                if (grid[row][col].color === 'ROUGE') {
                    count += 1;
                }
            }
        }
        return count;
    }

    static collectValidMoves(grid) {
        const moves = [];
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                if (!this.canCapturePion(grid, row, col)) {
                    continue;
                }

                moves.push({
                    row,
                    col,
                    convertedCount: this.countMoveGain(grid, row, col),
                    nearSeed: this.hasRedTileNearby(grid, row, col, 2)
                });
            }
        }
        return moves;
    }

    static hasRedTileNearby(grid, row, col, radius = 2) {
        for (let dr = -radius; dr <= radius; dr++) {
            for (let dc = -radius; dc <= radius; dc++) {
                const nextRow = row + dr;
                const nextCol = col + dc;
                if (!grid[nextRow]?.[nextCol]) {
                    continue;
                }

                if (grid[nextRow][nextCol].color === 'ROUGE') {
                    return true;
                }
            }
        }

        return false;
    }

    static canCapturePion(grid, row, col) {
        if (grid[row][col].color === 'ROUGE') {
            return false;
        }

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) {
                    continue;
                }

                const nextRow = row + dr;
                const nextCol = col + dc;
                if (!grid[nextRow]?.[nextCol]) {
                    continue;
                }

                if (grid[nextRow][nextCol].color === 'ROUGE') {
                    return true;
                }
            }
        }

        return false;
    }

    static countMoveGain(grid, row, col) {
        let convertedCount = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nextRow = row + dr;
                const nextCol = col + dc;
                if (!grid[nextRow]?.[nextCol]) {
                    continue;
                }

                if (grid[nextRow][nextCol].color !== 'ROUGE') {
                    convertedCount += 1;
                }
            }
        }
        return convertedCount;
    }

    static applyMove(grid, row, col) {
        const convertedPositions = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nextRow = row + dr;
                const nextCol = col + dc;
                if (!grid[nextRow]?.[nextCol]) {
                    continue;
                }

                const cell = grid[nextRow][nextCol];
                if (cell.color !== 'ROUGE') {
                    cell.color = 'ROUGE';
                    convertedPositions.push({ row: nextRow, col: nextCol });
                }
            }
        }
        return convertedPositions;
    }
}
