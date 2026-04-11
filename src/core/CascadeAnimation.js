class CascadeAnimation {
    constructor(gridSize = 20) {
        this.GRID_SIZE = gridSize;
        this.isActive = false;
        this.queue = [];
        this.timer = 0;
        this.delay = 150; // 150ms entre chaque vague
        this.convertedCount = 0;
        this.convertedPositions = [];
        this.convertedByOriginalColor = {};
        this.triggeredSpecialCells = new Set();
        this.specialActivationCount = 0;
        this.specialEvents = [];
    }

    startCascade(scene, grid, row, col, currentPlayer) {
        this.isActive = true;
        this.queue = [];
        this.convertedCount = 0;
        this.convertedPositions = [];
        this.convertedByOriginalColor = {};
        this.triggeredSpecialCells.clear();
        this.specialActivationCount = 0;
        this.specialEvents = [];

        const initialCapture = this.capturePion(scene, grid, row, col, currentPlayer);
        if (initialCapture.wasEnemy) {
            this.convertedCount = 1;
            this.convertedPositions.push({ row, col });
            this.recordConvertedOriginalColor(initialCapture.originalColor);
        }

        if (initialCapture.activatedLightning) {
            this.enqueueWave(this.getLightningPositions(row, col), currentPlayer);
        } else if (initialCapture.activatedIce) {
            this.freezePositions(scene, this.getIcePositions(row, col), row, col);
        } else if (initialCapture.activatedSwamp) {
            this.swampPositions(scene, this.getIcePositions(row, col), row, col);
        } else if (initialCapture.activatedSuperBomb) {
            this.enqueueWave(this.getSuperBombPositions(row, col), initialCapture.specialPropagationColor || currentPlayer);
        } else {
            this.enqueueWave(this.getAdjacentPositions(row, col), currentPlayer);
        }
        
        // Démarrer le timer
        this.timer = scene.time.now + this.delay;
    }

    update(scene, time) {
        if (!this.isActive || time <= this.timer) return { type: 'waiting' };

        if (this.queue.length === 0) {
            // Cascade terminée
            this.isActive = false;
            return {
                type: 'finished',
                convertedCount: this.convertedCount,
                convertedPositions: this.convertedPositions.slice(),
                convertedByOriginalColor: { ...this.convertedByOriginalColor },
                specialActivationCount: this.specialActivationCount,
                specialEvents: this.specialEvents.slice()
            };
        }
        
        // Traiter la prochaine vague
        const currentWave = this.queue.shift();
        const waveCaptureColor = currentWave.captureColor || scene.gameState.currentPlayer;
        const flashedPions = [];
        const nextSpecialWaves = [];
        const nextSuperBombWaves = [];
        const nextIceOrigins = [];
        const nextSwampOrigins = [];
        const nextLightningWaves = [];
        // Convertir tous les pions de la vague actuelle
        for (const position of currentWave.positions) {
            const { row, col } = position;
            
            const captureResult = this.capturePion(scene, scene.gameState.grid, row, col, waveCaptureColor);
            flashedPions.push({ row, col });

            if (captureResult.preventedByFreeze) {
                continue;
            }
            
            // Compter seulement les pions qui ont vraiment changé de couleur
            if (captureResult.wasEnemy) {
                this.convertedCount++;
                this.convertedPositions.push({ row, col });
                this.recordConvertedOriginalColor(captureResult.originalColor);
            }

            if (captureResult.triggeredSpecial) {
                nextSpecialWaves.push({
                    positions: this.getAdjacentPositions(row, col),
                    captureColor: waveCaptureColor
                });
            }

            if (captureResult.activatedSuperBomb) {
                this.specialActivationCount++;
                nextSuperBombWaves.push({
                    positions: this.getSuperBombPositions(row, col),
                    captureColor: captureResult.specialPropagationColor || waveCaptureColor
                });
            }

            if (captureResult.activatedIce) {
                this.specialActivationCount++;
                nextIceOrigins.push({ row, col });
            }

            if (captureResult.activatedSwamp) {
                this.specialActivationCount++;
                nextSwampOrigins.push({ row, col });
            }

            if (captureResult.activatedLightning) {
                this.specialActivationCount++;
                nextLightningWaves.push({
                    positions: this.getLightningPositions(row, col),
                    captureColor: waveCaptureColor
                });
            }
        }

        nextSpecialWaves.forEach((wave) => this.enqueueWave(wave.positions, wave.captureColor));
        nextSuperBombWaves.forEach((wave) => this.enqueueWave(wave.positions, wave.captureColor));

        if (nextIceOrigins.length > 0) {
            nextIceOrigins.forEach(({ row, col }) => {
                this.freezePositions(scene, this.getIcePositions(row, col), row, col);
            });
        }

        if (nextSwampOrigins.length > 0) {
            nextSwampOrigins.forEach(({ row, col }) => {
                this.swampPositions(scene, this.getIcePositions(row, col), row, col);
            });
        }

        nextLightningWaves.forEach((wave) => this.enqueueWave(wave.positions, wave.captureColor));
        
        // Programmer la fin de la cascade
        this.timer = time + this.delay;
        
        return { 
            type: 'wave_processed', 
            flashedPions, 
            convertedCount: this.convertedCount 
        };
    }

    capturePion(scene, grid, row, col, currentPlayer) {
        const pion = grid[row][col];
        if (pion.isLocked) {
            return {
                wasEnemy: false,
                preventedByFreeze: true,
                preventedByBurn: false,
                triggeredSpecial: false,
                activatedSuperBomb: false,
                activatedIce: false,
                activatedSwamp: false,
                activatedLightning: false,
                respawnedSpecialCell: null
            };
        }
        if (pion.isFrozen) {
            return {
                wasEnemy: false,
                preventedByFreeze: true,
                preventedByBurn: false,
                triggeredSpecial: false,
                activatedSuperBomb: false,
                activatedIce: false,
                activatedSwamp: false,
                activatedLightning: false,
                respawnedSpecialCell: null
            };
        }
        if (pion.isSwamp) {
            return {
                wasEnemy: false,
                preventedByFreeze: true,
                preventedByBurn: false,
                triggeredSpecial: false,
                activatedSuperBomb: false,
                activatedIce: false,
                activatedSwamp: false,
                activatedLightning: false,
                respawnedSpecialCell: null
            };
        }
        if (pion.isShielded && pion.shieldOwnerColor && pion.shieldOwnerColor !== currentPlayer) {
            return {
                wasEnemy: false,
                preventedByFreeze: true,
                preventedByBurn: false,
                triggeredSpecial: false,
                activatedSuperBomb: false,
                activatedIce: false,
                activatedSwamp: false,
                activatedLightning: false,
                respawnedSpecialCell: null
            };
        }
        if (pion.isBurning) {
            return {
                wasEnemy: false,
                preventedByFreeze: false,
                preventedByBurn: true,
                triggeredSpecial: false,
                activatedSuperBomb: false,
                activatedIce: false,
                activatedSwamp: false,
                activatedLightning: false,
                respawnedSpecialCell: null
            };
        }

        const originalColor = pion.color;
        const wasEnemy = pion.color !== currentPlayer;
        const specialCellKey = `${row},${col}`;
        const isBomb = pion.specialType === 'BOMB';
        const isSuperBomb = pion.specialType === 'SUPER_BOMB';
        const isIce = pion.specialType === 'ICE';
        const isSwamp = pion.specialType === 'SWAMP';
        const isLightning = pion.specialType === 'LIGHTNING';
        const triggeredSpecial = isBomb && !this.triggeredSpecialCells.has(specialCellKey);
        const activatedSuperBomb = isSuperBomb;
        const activatedIce = isIce;
        const activatedSwamp = isSwamp;
        const activatedLightning = isLightning;
        const specialPropagationColor = isSuperBomb ? (pion.specialOwnerColor || originalColor) : currentPlayer;

        pion.color = currentPlayer;

        if (wasEnemy) {
            scene.gameBoard.startCaptureAnimation(grid, row, col, originalColor, currentPlayer);
        } else {
            scene.gameBoard.drawPion(grid, row, col);
        }

        if (triggeredSpecial) {
            this.triggeredSpecialCells.add(specialCellKey);
            this.specialEvents.push({
                type: 'BOMB',
                ownerColor: pion.specialOwnerColor || originalColor,
                triggeredBy: currentPlayer,
                row,
                col
            });
            pion.specialType = null;
            pion.specialOwnerColor = null;
            scene.gameBoard.drawPion(grid, row, col);
        }

        if (activatedLightning) {
            pion.specialType = null;
            pion.specialOwnerColor = null;
            scene.gameBoard.drawPion(grid, row, col);
        }

        if (activatedSuperBomb) {
            this.specialEvents.push({
                type: 'SUPER_BOMB',
                ownerColor: pion.specialOwnerColor || originalColor,
                triggeredBy: currentPlayer,
                row,
                col
            });
            pion.specialType = null;
            pion.specialOwnerColor = null;
            scene.gameBoard.drawPion(grid, row, col);
        }

        if (activatedIce) {
            pion.specialType = null;
            pion.specialOwnerColor = null;
            scene.gameBoard.drawPion(grid, row, col);
        }

        if (activatedSwamp) {
            pion.specialType = null;
            pion.specialOwnerColor = null;
            scene.gameBoard.drawPion(grid, row, col);
        }

        return {
            wasEnemy,
            originalColor,
            preventedByFreeze: false,
            preventedByBurn: false,
            triggeredSpecial,
            activatedSuperBomb,
            activatedIce,
            activatedSwamp,
            activatedLightning,
            specialPropagationColor
        };
    }

    recordConvertedOriginalColor(color) {
        if (!color) {
            return;
        }

        this.convertedByOriginalColor[color] = (this.convertedByOriginalColor[color] || 0) + 1;
    }

    getAdjacentPositions(row, col) {
        const positions = [];

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;

                const newRow = row + dr;
                const newCol = col + dc;

                if (newRow >= 0 && newRow < this.GRID_SIZE && newCol >= 0 && newCol < this.GRID_SIZE) {
                    positions.push({ row: newRow, col: newCol });
                }
            }
        }

        return positions;
    }

    enqueueWave(positions, captureColor) {
        const uniquePositions = [];
        const seen = new Set();

        for (const position of positions) {
            const key = `${position.row},${position.col}`;
            if (seen.has(key)) continue;
            seen.add(key);
            uniquePositions.push(position);
        }

        if (uniquePositions.length > 0) {
            this.queue.push({ positions: uniquePositions, captureColor });
        }
    }

    getLightningPositions(row, col) {
        const positions = [];

        for (let index = 0; index < this.GRID_SIZE; index++) {
            if (index !== col) {
                positions.push({ row, col: index });
            }

            if (index !== row) {
                positions.push({ row: index, col });
            }
        }

        return positions;
    }

    getSuperBombPositions(row, col) {
        const positions = [];

        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                if (dr === 0 && dc === 0) continue;

                const newRow = row + dr;
                const newCol = col + dc;

                if (newRow >= 0 && newRow < this.GRID_SIZE && newCol >= 0 && newCol < this.GRID_SIZE) {
                    positions.push({ row: newRow, col: newCol });
                }
            }
        }

        return positions;
    }

    getIcePositions(row, col) {
        const positions = [];
        const zoneSize = this.getStatusZoneSize();
        const offsetBounds = this.getStatusZoneOffsetBounds(zoneSize);

        for (let dr = offsetBounds.min; dr <= offsetBounds.max; dr++) {
            for (let dc = offsetBounds.min; dc <= offsetBounds.max; dc++) {
                const newRow = row + dr;
                const newCol = col + dc;

                if (newRow >= 0 && newRow < this.GRID_SIZE && newCol >= 0 && newCol < this.GRID_SIZE) {
                    positions.push({ row: newRow, col: newCol });
                }
            }
        }

        return positions;
    }

    getStatusZoneSize() {
        if (this.GRID_SIZE >= 14) {
            return 6;
        }

        if (this.GRID_SIZE >= 12) {
            return 5;
        }

        return 3;
    }

    getStatusZoneOffsetBounds(zoneSize) {
        if (zoneSize % 2 === 1) {
            const radius = Math.floor(zoneSize / 2);
            return { min: -radius, max: radius };
        }

        const half = zoneSize / 2;
        return { min: -(half - 1), max: half };
    }

    freezePositions(scene, positions, sourceRow = null, sourceCol = null) {
        const uniquePositions = [];
        const seen = new Set();

        for (const position of positions) {
            const key = `${position.row},${position.col}`;
            if (seen.has(key)) continue;
            seen.add(key);
            uniquePositions.push(position);
        }

        uniquePositions.forEach(({ row, col }) => {
            const pion = scene.gameState.grid[row][col];
            pion.isFrozen = true;
            // `updateFrozenCells()` décrémente à chaque fin de tour, y compris
            // juste après le tour d'activation. On démarre donc à 3 pour garder
            // visuellement 2 tours complets de gel.
            pion.frozenTurns = Math.max(pion.frozenTurns, 3);
            pion.thawing = false;
            if (sourceRow !== null && sourceCol !== null) {
                pion.frozenSourceRow = sourceRow;
                pion.frozenSourceCol = sourceCol;
            }
            scene.gameBoard.drawPion(scene.gameState.grid, row, col);
        });

        scene.gameBoard.drawBoard(scene.gameState.grid);
    }

    swampPositions(scene, positions, sourceRow = null, sourceCol = null) {
        const uniquePositions = [];
        const seen = new Set();

        for (const position of positions) {
            const key = `${position.row},${position.col}`;
            if (seen.has(key)) continue;
            seen.add(key);
            uniquePositions.push(position);
        }

        uniquePositions.forEach(({ row, col }) => {
            const pion = scene.gameState.grid[row][col];
            pion.isSwamp = true;
            pion.swampTurns = Math.max(pion.swampTurns, 3);
            if (sourceRow !== null && sourceCol !== null) {
                pion.swampSourceRow = sourceRow;
                pion.swampSourceCol = sourceCol;
            }
            scene.gameBoard.drawPion(scene.gameState.grid, row, col);
        });

        scene.gameBoard.drawBoard(scene.gameState.grid);
    }

    reset() {
        this.isActive = false;
        this.queue = [];
        this.timer = 0;
        this.convertedCount = 0;
        this.convertedPositions = [];
        this.triggeredSpecialCells.clear();
        this.specialActivationCount = 0;
    }
}
