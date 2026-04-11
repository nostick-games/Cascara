class AIPlayer {
    constructor(gameLogic, enemyProfile = null, difficulty = 'NORMAL', debugLogs = false) {
        this.gameLogic = gameLogic;
        this.enemyProfile = enemyProfile;
        this.difficulty = difficulty;
        this.debugLogs = debugLogs;
        this.behavior = AIBehaviors.create(
            enemyProfile?.behaviorKey ||
            enemyProfile?.style ||
            'OPPORTUNIST'
        );
        this.isThinking = false;
        this.isQueued = false;
        this.thinkDuration = 0;
        this.thinkTimer = null;
        this.candidates = [];
        this.pendingSpecialAction = null;
        this.queuedAction = null;
    }

    queueTurn(scene, grid, currentPlayer, preferredAction = null) {
        if (this.isThinking || this.isQueued) return;

        const difficultyProfile = this.getDifficultyProfile();
        const diagnostics = {
            difficulty: this.difficulty,
            style: this.behavior.getDebugStyle()
        };
        this.isQueued = true;
        this.candidates = AICandidateBuilder.buildCaptureCandidates(this, scene, grid, currentPlayer);
        diagnostics.bestCaptureScore = this.candidates[0]?.score ?? null;
        diagnostics.captureCandidateCount = this.candidates.length;

        this.pendingSpecialAction = this.findSpecialAction(scene, grid, currentPlayer, diagnostics);
        this.queuedAction = this.chooseQueuedAction(scene, grid, currentPlayer, preferredAction);

        if (this.queuedAction?.type === 'move') {
            diagnostics.chosenAction = 'move';
            diagnostics.chosenScore = this.queuedAction.pion?.score ?? null;
            diagnostics.target = this.queuedAction.pion
                ? `${this.queuedAction.pion.row},${this.queuedAction.pion.col}`
                : null;
        } else if (this.queuedAction?.type === 'place_bonus') {
            diagnostics.chosenAction = 'place_bonus';
            diagnostics.target = `${this.queuedAction.row},${this.queuedAction.col}`;
        } else if (this.queuedAction?.type === 'trigger_bonus') {
            diagnostics.chosenAction = `trigger_${this.queuedAction.bonusType}`;
        } else {
            diagnostics.chosenAction = this.queuedAction?.type || 'none';
        }

        this.thinkDuration = Phaser.Math.Between(
            difficultyProfile.thinkTimeMin,
            difficultyProfile.thinkTimeMax
        );
        diagnostics.thinkDuration = this.thinkDuration;
        this.debugDecision(currentPlayer, diagnostics);
    }

    predictActionForPreview(scene, grid, currentPlayer) {
        const previousState = {
            candidates: this.candidates,
            pendingSpecialAction: this.pendingSpecialAction,
            queuedAction: this.queuedAction
        };

        this.candidates = AICandidateBuilder.buildCaptureCandidates(this, scene, grid, currentPlayer);
        const predictedSpecialAction = this.findSpecialAction(scene, grid, currentPlayer);
        let action = predictedSpecialAction;

        if (!action) {
            action = this.candidates.length > 0
                ? { type: 'move', pion: this.candidates[0] }
                : { type: 'no_move' };
        } else if (action.type === 'place_bonus') {
            const bombCandidates = AICandidateBuilder.buildBombPlacementCandidates(this, scene, grid, currentPlayer);
            if (bombCandidates.length > 0) {
                action = {
                    ...action,
                    row: bombCandidates[0].row,
                    col: bombCandidates[0].col
                };
            }
        }

        this.candidates = previousState.candidates;
        this.pendingSpecialAction = previousState.pendingSpecialAction;
        this.queuedAction = previousState.queuedAction;
        return action;
    }

    chooseQueuedAction(scene, grid, currentPlayer, preferredAction = null) {
        const preferredResolved = this.resolvePreferredAction(scene, grid, currentPlayer, preferredAction);
        if (preferredResolved) {
            return preferredResolved;
        }

        if (this.pendingSpecialAction) {
            return this.pendingSpecialAction;
        }

        return this.candidates.length > 0
            ? { type: 'move', pion: this.chooseCandidate() }
            : { type: 'no_move' };
    }

    resolvePreferredAction(scene, grid, currentPlayer, preferredAction) {
        if (!preferredAction || preferredAction.type === 'no_move') {
            return null;
        }

        if (preferredAction.type === 'move' && preferredAction.pion) {
            const nearbyCandidate = this.findNearbyCaptureCandidate(preferredAction.pion.row, preferredAction.pion.col);
            if (nearbyCandidate) {
                return { type: 'move', pion: nearbyCandidate };
            }
            return null;
        }

        if (preferredAction.type === 'place_bonus') {
            if (scene.gameState.availableBonuses?.[currentPlayer] !== 'PLACE_BOMB') {
                return null;
            }

            const bombCandidates = AICandidateBuilder.buildBombPlacementCandidates(this, scene, grid, currentPlayer);
            const nearbyBomb = this.findNearbyBombCandidate(bombCandidates, preferredAction.row, preferredAction.col);
            if (nearbyBomb) {
                return {
                    type: 'place_bonus',
                    bonusType: 'PLACE_BOMB',
                    row: nearbyBomb.row,
                    col: nearbyBomb.col
                };
            }
            return null;
        }

        if (preferredAction.type === 'trigger_bonus') {
            return scene.gameState.availableBonuses?.[currentPlayer] === preferredAction.bonusType
                ? { type: 'trigger_bonus', bonusType: preferredAction.bonusType }
                : null;
        }

        return null;
    }

    findNearbyCaptureCandidate(row, col) {
        if (!this.candidates.length) {
            return null;
        }

        const candidatesByRadius = [1, 2];
        for (const radius of candidatesByRadius) {
            const nearbyCandidates = this.candidates.filter((candidate) =>
                Math.max(Math.abs(candidate.row - row), Math.abs(candidate.col - col)) <= radius
            );
            if (nearbyCandidates.length > 0) {
                return nearbyCandidates[0];
            }
        }

        return null;
    }

    findNearbyBombCandidate(candidates, row, col) {
        if (!candidates.length) {
            return null;
        }

        const candidatesByRadius = [1, 2];
        for (const radius of candidatesByRadius) {
            const nearbyCandidates = candidates.filter((candidate) =>
                Math.max(Math.abs(candidate.row - row), Math.abs(candidate.col - col)) <= radius
            );
            if (nearbyCandidates.length > 0) {
                return nearbyCandidates[0];
            }
        }

        return null;
    }

    startTurn() {
        if (!this.isQueued || this.isThinking) return;

        this.isQueued = false;
        this.isThinking = true;
    }

    takeQueuedAction() {
        const action = this.queuedAction;
        this.clearThinkTimer();
        this.isThinking = false;
        this.isQueued = false;
        this.queuedAction = null;
        this.pendingSpecialAction = null;
        return action;
    }

    findSpecialAction(scene, grid, currentPlayer, diagnostics = null) {
        const availableBonus = scene.gameState.availableBonuses?.[currentPlayer];
        if (!availableBonus) return null;

        const bestCaptureScore = this.candidates[0]?.score ?? -Infinity;
        const holdTurns = scene.gameState.bonusHoldTurns?.[currentPlayer] || 0;
        const useThreshold = scene.gameState.bonusUseThresholds?.[currentPlayer] || 0;
        const forceUse = useThreshold > 0 && holdTurns >= useThreshold;

        if (diagnostics) {
            diagnostics.availableBonus = availableBonus;
            diagnostics.holdTurns = holdTurns;
            diagnostics.useThreshold = useThreshold;
            diagnostics.forceUse = forceUse;
        }

        if (availableBonus === 'PLACE_BOMB') {
            const bombCandidates = AICandidateBuilder.buildBombPlacementCandidates(this, scene, grid, currentPlayer);
            if (diagnostics) {
                diagnostics.bestBombScore = bombCandidates[0]?.score ?? null;
            }
            if (bombCandidates.length === 0) return null;

            const bestBomb = bombCandidates[0];
            if (!forceUse && !this.shouldUseSpecial('PLACE_BOMB', bestBomb.score, bestCaptureScore, this.candidates.length > 0)) {
                return null;
            }

            const chosenBomb = this.chooseWeightedOption(bombCandidates, 4, 4);
            return {
                type: 'place_bonus',
                bonusType: availableBonus,
                row: chosenBomb.row,
                col: chosenBomb.col
            };
        }

        const randomBonusScore = this.evaluateRandomBonus(scene, grid, currentPlayer, availableBonus);
        if (diagnostics) {
            diagnostics.randomBonusScore = randomBonusScore;
        }
        if (!forceUse && !this.shouldUseSpecial(availableBonus, randomBonusScore, bestCaptureScore, this.candidates.length > 0)) {
            return null;
        }

        return { type: 'trigger_bonus', bonusType: availableBonus };
    }

    shouldUseSpecial(bonusType, specialScore, bestCaptureScore, hasCapture) {
        return this.behavior.shouldUseSpecial(this, bonusType, specialScore, bestCaptureScore, hasCapture);
    }

    scoreBombPlacement(scene, grid, row, col, currentPlayer, leader) {
        return this.behavior.scoreBombPlacement(this, scene, grid, row, col, currentPlayer, leader);
    }

    analyzeBombPlacement(grid, row, col, currentPlayer, leaderColor = null) {
        let adjacentAllies = 0;
        let orthogonalAllies = 0;
        let frontierEnemyCount = 0;
        let adjacentSpecials = 0;
        let adjacentRed = 0;
        let adjacentLeader = 0;
        let nearbyOwnMass = 0;
        let nearbyEnemyMass = 0;

        for (let rowOffset = -2; rowOffset <= 2; rowOffset++) {
            for (let colOffset = -2; colOffset <= 2; colOffset++) {
                if (rowOffset === 0 && colOffset === 0) continue;
                const nextRow = row + rowOffset;
                const nextCol = col + colOffset;
                if (!this.isInsideGrid(nextRow, nextCol)) continue;

                const neighbor = grid[nextRow][nextCol];
                const isAdjacent = Math.abs(rowOffset) <= 1 && Math.abs(colOffset) <= 1;
                const distanceWeight = isAdjacent ? 1 : 0.6;

                if (neighbor.color === currentPlayer) {
                    nearbyOwnMass += distanceWeight;
                    if (isAdjacent) {
                        adjacentAllies++;
                        if (rowOffset === 0 || colOffset === 0) {
                            orthogonalAllies++;
                        }
                    }
                } else {
                    nearbyEnemyMass += distanceWeight;
                    if (isAdjacent) {
                        frontierEnemyCount++;
                        if (neighbor.color === 'ROUGE') adjacentRed++;
                        if (leaderColor && neighbor.color === leaderColor) adjacentLeader++;
                    }
                }

                if (isAdjacent && neighbor.specialType) adjacentSpecials++;
            }
        }

        const isolatedPenalty = adjacentAllies <= 1 ? 1 : 0;
        return {
            adjacentAllies,
            orthogonalAllies,
            frontierEnemyCount,
            adjacentSpecials,
            adjacentRed,
            adjacentLeader,
            nearbyOwnMass,
            nearbyEnemyMass,
            isolatedPenalty
        };
    }

    evaluateRandomBonus(scene, grid, currentPlayer, bonusType) {
        return this.behavior.evaluateRandomBonus(this, scene, grid, currentPlayer, bonusType);
    }

    countBoardSpecials(grid) {
        let count = 0;
        for (let row = 0; row < this.gameLogic.GRID_SIZE; row++) {
            for (let col = 0; col < this.gameLogic.GRID_SIZE; col++) {
                if (grid[row][col].specialType) count++;
            }
        }
        return count;
    }

    chooseWeightedOption(candidates, margin = 5, maxPoolSize = 5) {
        if (candidates.length === 0) return null;

        const difficultyProfile = this.getDifficultyProfile();
        const bestScore = candidates[0].score;
        const adjustedMargin = Math.max(1, margin + difficultyProfile.candidateMarginBias);
        const adjustedMaxPoolSize = Math.max(2, maxPoolSize + difficultyProfile.maxPoolSizeBias);
        const candidatePool = candidates
            .filter((candidate) => candidate.score >= bestScore - adjustedMargin)
            .slice(0, adjustedMaxPoolSize);

        const weightedPool = candidatePool.map((candidate) => ({
            candidate,
            weight: Math.pow(
                Math.max(1, candidate.score - (bestScore - (adjustedMargin + 1))),
                difficultyProfile.weightPower
            )
        }));

        const totalWeight = weightedPool.reduce((sum, entry) => sum + entry.weight, 0);
        let randomValue = Math.random() * totalWeight;

        for (const entry of weightedPool) {
            randomValue -= entry.weight;
            if (randomValue <= 0) {
                return entry.candidate;
            }
        }

        return weightedPool[weightedPool.length - 1].candidate;
    }

    chooseCandidate() {
        if (this.candidates.length === 0) return null;

        if (typeof this.behavior.chooseCandidate === 'function') {
            const behaviorChoice = this.behavior.chooseCandidate(this, this.candidates);
            if (behaviorChoice) {
                return behaviorChoice;
            }
        }

        const weightedSelection = this.chooseWeightedOption(this.candidates, 5, 5);
        if (!weightedSelection) return null;

        const difficultyProfile = this.getDifficultyProfile();
        if (weightedSelection.specialType === 'SUPER_BOMB') {
            return Math.random() < difficultyProfile.superBombBestMoveChance && this.candidates[0]
                ? this.candidates[0]
                : weightedSelection;
        }

        return weightedSelection;
    }

    scoreMove(scene, grid, row, col, currentPlayer) {
        return this.behavior.scoreMove(this, scene, grid, row, col, currentPlayer);
    }

    getDifficultyProfile() {
        const profiles = {
            HYPER_EASY: {
                thinkTimeMin: 1300,
                thinkTimeMax: 2400,
                candidateMarginBias: 9,
                maxPoolSizeBias: 5,
                weightPower: 0.45,
                specialMinScoreBias: 6,
                specialDeltaBias: 4,
                randomBonusScoreBias: -7,
                superBombBestMoveChance: 0.08,
                aggressiveTargetBias: -6,
                aggressiveLeaderBias: -4,
                perturbatorSpecialBias: -4,
                perturbatorPressureBias: -2.5
            },
            EASY: {
                thinkTimeMin: 950,
                thinkTimeMax: 1850,
                candidateMarginBias: 5,
                maxPoolSizeBias: 3,
                weightPower: 0.65,
                specialMinScoreBias: 3.5,
                specialDeltaBias: 2.5,
                randomBonusScoreBias: -4,
                superBombBestMoveChance: 0.18,
                aggressiveTargetBias: -4,
                aggressiveLeaderBias: -2.5,
                perturbatorSpecialBias: -2.5,
                perturbatorPressureBias: -1.5
            },
            NORMAL: {
                thinkTimeMin: 500,
                thinkTimeMax: 1300,
                candidateMarginBias: 0,
                maxPoolSizeBias: 0,
                weightPower: 1,
                specialMinScoreBias: 0,
                specialDeltaBias: 0,
                randomBonusScoreBias: 0,
                superBombBestMoveChance: 0.55,
                aggressiveTargetBias: -2,
                aggressiveLeaderBias: -1.5,
                perturbatorSpecialBias: 0,
                perturbatorPressureBias: 0
            },
            HARD: {
                thinkTimeMin: 350,
                thinkTimeMax: 900,
                candidateMarginBias: -2,
                maxPoolSizeBias: -2,
                weightPower: 1.35,
                specialMinScoreBias: -1.5,
                specialDeltaBias: -1.5,
                randomBonusScoreBias: 2,
                superBombBestMoveChance: 0.8,
                aggressiveTargetBias: 0.5,
                aggressiveLeaderBias: 0.5,
                perturbatorSpecialBias: 2,
                perturbatorPressureBias: 1
            }
        };

        return profiles[this.difficulty] || profiles.NORMAL;
    }

    debugDecision(currentPlayer, diagnostics) {
        if (!this.debugLogs) return;

        console.log(
            `[AI DEBUG] ${currentPlayer} diff=${diagnostics.difficulty} style=${diagnostics.style}` +
            ` captureBest=${diagnostics.bestCaptureScore ?? 'none'}` +
            ` captureCount=${diagnostics.captureCandidateCount ?? 0}` +
            ` bombBest=${diagnostics.bestBombScore ?? 'n/a'}` +
            ` randomBonus=${diagnostics.randomBonusScore ?? 'n/a'}` +
            ` bonus=${diagnostics.availableBonus ?? 'none'}` +
            ` hold=${diagnostics.holdTurns ?? 0}/${diagnostics.useThreshold ?? 0}` +
            ` forced=${diagnostics.forceUse ? 'yes' : 'no'}` +
            ` chosen=${diagnostics.chosenAction}` +
            `${diagnostics.target ? ` target=${diagnostics.target}` : ''}` +
            `${diagnostics.chosenScore != null ? ` score=${diagnostics.chosenScore}` : ''}` +
            ` think=${diagnostics.thinkDuration}ms`
        );
    }

    isInsideGrid(row, col) {
        return row >= 0 && row < this.gameLogic.GRID_SIZE && col >= 0 && col < this.gameLogic.GRID_SIZE;
    }

    update() {
        return null;
    }

    clearThinkTimer() {
        if (!this.thinkTimer) return;

        this.thinkTimer.remove(false);
        this.thinkTimer = null;
    }

    reset() {
        this.clearThinkTimer();
        this.isThinking = false;
        this.isQueued = false;
        this.thinkDuration = 0;
        this.candidates = [];
        this.pendingSpecialAction = null;
        this.queuedAction = null;
    }
}
