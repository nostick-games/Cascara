class BaseAIBehavior {
    constructor(key = 'OPPORTUNIST') {
        this.key = key;
    }

    getDebugStyle() {
        return this.key;
    }

    shouldUseSpecial(ai, bonusType, specialScore, bestCaptureScore, hasCapture) {
        if (!hasCapture) return true;

        const difficultyProfile = ai.getDifficultyProfile();
        const rule = this.getSpecialUseRule(bonusType);
        return specialScore >= (rule.minScore + difficultyProfile.specialMinScoreBias) &&
            specialScore >= bestCaptureScore + rule.delta + difficultyProfile.specialDeltaBias;
    }

    getSpecialUseRule(_bonusType) {
        return { minScore: 10, delta: 0 };
    }

    scoreBombPlacement(ai, scene, grid, row, col, currentPlayer, leader) {
        const analysis = ai.analyzeBombPlacement(grid, row, col, currentPlayer, leader?.color);
        return (
            analysis.frontierEnemyCount * 3 +
            analysis.adjacentSpecials * 3 +
            analysis.nearbyEnemyMass +
            analysis.adjacentAllies * 1.5 -
            analysis.isolatedPenalty * 2.5
        );
    }

    evaluateRandomBonus(ai, scene, grid, currentPlayer, bonusType) {
        const difficultyProfile = ai.getDifficultyProfile();
        const scoreData = scene.gameLogic.getScoreData(grid);
        const leader = scene.gameLogic.getLeadingPlayer(scoreData);
        const currentPercentage = scoreData.percentages[currentPlayer] || 0;
        const redPercentage = scoreData.percentages.ROUGE || 0;
        const averagePercentage = 100 / scene.gameState.playerOrder.length;
        const isLeader = leader?.color === currentPlayer;
        const redLeading = leader?.color === 'ROUGE';
        const boardSpecialCount = ai.countBoardSpecials(grid);

        let baseScore = {
            LIGHTNING: 14,
            ICE: 10,
            SWAMP: 11,
            BOMB: 11
        }[bonusType] || 10;

        baseScore += boardSpecialCount * 0.8;
        if (bonusType === 'LIGHTNING') baseScore += 1;
        if (bonusType === 'ICE') baseScore += 0.5;
        if (bonusType === 'SWAMP') baseScore += 1;

        return baseScore + difficultyProfile.randomBonusScoreBias;
    }

    scoreMove(ai, scene, grid, row, col, currentPlayer) {
        const baseScore = ai.gameLogic.evaluateMove(grid, row, col, currentPlayer);
        return baseScore + this.getMoveBonus(ai, scene, grid, row, col, currentPlayer);
    }

    getMoveBonus(_ai, _scene, _grid, _row, _col, _currentPlayer) {
        return 0;
    }
}

class BuilderAIBehavior extends BaseAIBehavior {
    constructor() {
        super('BUILDER');
    }

    getSpecialUseRule(bonusType) {
        return {
            PLACE_BOMB: { minScore: 12, delta: -1.5 },
            BOMB: { minScore: 11, delta: 1.5 },
            ICE: { minScore: 10, delta: 1.0 },
            LIGHTNING: { minScore: 14, delta: 0.5 }
        }[bonusType] || { minScore: 10, delta: 0 };
    }

    scoreBombPlacement(ai, scene, grid, row, col, currentPlayer, leader) {
        const analysis = ai.analyzeBombPlacement(grid, row, col, currentPlayer, leader?.color);
        return (
            analysis.adjacentAllies * 3 +
            analysis.orthogonalAllies * 2 +
            analysis.frontierEnemyCount * 2.5 +
            analysis.nearbyOwnMass * 0.8 -
            analysis.isolatedPenalty * 4 +
            analysis.adjacentSpecials * 0.8
        );
    }

    evaluateRandomBonus(ai, scene, grid, currentPlayer, bonusType) {
        const difficultyProfile = ai.getDifficultyProfile();
        const scoreData = scene.gameLogic.getScoreData(grid);
        const leader = scene.gameLogic.getLeadingPlayer(scoreData);
        const currentPercentage = scoreData.percentages[currentPlayer] || 0;
        const averagePercentage = 100 / scene.gameState.playerOrder.length;
        const isLeader = leader?.color === currentPlayer;

        let baseScore = {
            LIGHTNING: 14,
            ICE: 10,
            SWAMP: 11,
            BOMB: 11
        }[bonusType] || 10;

        if (currentPercentage >= averagePercentage) baseScore += 3;
        if (isLeader) baseScore += 2;
        if (bonusType === 'ICE') baseScore += 2;
        if (bonusType === 'SWAMP') baseScore += 1.5;
        if (bonusType === 'BOMB') baseScore -= 1;

        return baseScore + difficultyProfile.randomBonusScoreBias;
    }

    getMoveBonus(ai, _scene, grid, row, col, currentPlayer) {
        let orthogonalOwnNeighbors = 0;
        let diagonalOwnNeighbors = 0;

        const orthogonalOffsets = [
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 }
        ];

        orthogonalOffsets.forEach((offset) => {
            const nextRow = row + offset.row;
            const nextCol = col + offset.col;
            if (ai.isInsideGrid(nextRow, nextCol) && grid[nextRow][nextCol].color === currentPlayer) {
                orthogonalOwnNeighbors++;
            }
        });

        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                if (rowOffset === 0 && colOffset === 0) continue;
                if (rowOffset === 0 || colOffset === 0) continue;

                const nextRow = row + rowOffset;
                const nextCol = col + colOffset;
                if (ai.isInsideGrid(nextRow, nextCol) && grid[nextRow][nextCol].color === currentPlayer) {
                    diagonalOwnNeighbors++;
                }
            }
        }

        const specialPenalty = grid[row][col].specialType ? 2 : 0;
        const enclosureBonus = orthogonalOwnNeighbors >= 2 ? 5 : 0;
        return orthogonalOwnNeighbors * 4 + diagonalOwnNeighbors * 2 + enclosureBonus - specialPenalty;
    }
}

class OpportunistAIBehavior extends BaseAIBehavior {
    constructor() {
        super('OPPORTUNIST');
    }

    getSpecialUseRule(bonusType) {
        return {
            PLACE_BOMB: { minScore: 10, delta: -0.5 },
            BOMB: { minScore: 9, delta: -0.5 },
            ICE: { minScore: 8, delta: -1.0 },
            LIGHTNING: { minScore: 12, delta: -1.0 }
        }[bonusType] || { minScore: 10, delta: 0 };
    }

    getMoveBonus(ai, _scene, grid, row, col, currentPlayer) {
        let adjacentSpecials = 0;

        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                if (rowOffset === 0 && colOffset === 0) continue;

                const nextRow = row + rowOffset;
                const nextCol = col + colOffset;
                if (!ai.isInsideGrid(nextRow, nextCol)) continue;

                if (grid[nextRow][nextCol].specialType) {
                    adjacentSpecials++;
                }
            }
        }

        const directSpecialBonus = {
            BOMB: -2,
            SUPER_BOMB: grid[row][col].specialOwnerColor === currentPlayer ? 10 : -24,
            LIGHTNING: 12,
            ICE: 7
        };

        return adjacentSpecials * 6 + (directSpecialBonus[grid[row][col].specialType] || 0);
    }
}

class AggressiveAIBehavior extends BaseAIBehavior {
    constructor() {
        super('AGGRESSIVE');
    }

    getSpecialUseRule(bonusType) {
        return {
            PLACE_BOMB: { minScore: 10, delta: -1.0 },
            BOMB: { minScore: 9, delta: -1.5 },
            ICE: { minScore: 8, delta: -1.5 },
            LIGHTNING: { minScore: 10, delta: -2.0 }
        }[bonusType] || { minScore: 10, delta: 0 };
    }

    scoreBombPlacement(ai, scene, grid, row, col, currentPlayer, leader) {
        const analysis = ai.analyzeBombPlacement(grid, row, col, currentPlayer, leader?.color);
        const targetPressure = analysis.adjacentRed * 4 + analysis.adjacentLeader * 3 + analysis.frontierEnemyCount * 3;
        return (
            targetPressure +
            analysis.nearbyEnemyMass * 1.2 +
            analysis.adjacentSpecials * 2 -
            analysis.isolatedPenalty * 2
        );
    }

    evaluateRandomBonus(ai, scene, grid, currentPlayer, bonusType) {
        const difficultyProfile = ai.getDifficultyProfile();
        const scoreData = scene.gameLogic.getScoreData(grid);
        const leader = scene.gameLogic.getLeadingPlayer(scoreData);
        const redPercentage = scoreData.percentages.ROUGE || 0;
        const averagePercentage = 100 / scene.gameState.playerOrder.length;
        const redLeading = leader?.color === 'ROUGE';

        let baseScore = {
            LIGHTNING: 14,
            ICE: 10,
            SWAMP: 11,
            BOMB: 11
        }[bonusType] || 10;

        if (redLeading || redPercentage >= averagePercentage) baseScore += 4;
        if (bonusType === 'LIGHTNING') baseScore += 3;
        if (bonusType === 'SWAMP') baseScore += 1;
        if (bonusType === 'BOMB') baseScore += 2;

        return baseScore + difficultyProfile.randomBonusScoreBias;
    }

    getMoveBonus(ai, scene, grid, row, col, currentPlayer) {
        const difficultyProfile = ai.getDifficultyProfile();
        const scoreData = scene.gameLogic.getScoreData(grid);
        const leader = scene.gameLogic.getLeadingPlayer(scoreData);
        const targetColor = grid[row][col].color;
        let bonus = 0;

        if (targetColor === 'ROUGE') {
            bonus += 7 + difficultyProfile.aggressiveTargetBias;
        }

        if (leader && leader.color !== currentPlayer && targetColor === leader.color) {
            bonus += 5 + difficultyProfile.aggressiveLeaderBias;
        }

        let enemyClusterSize = 0;
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                if (rowOffset === 0 && colOffset === 0) continue;

                const nextRow = row + rowOffset;
                const nextCol = col + colOffset;
                if (ai.isInsideGrid(nextRow, nextCol) && grid[nextRow][nextCol].color === targetColor) {
                    enemyClusterSize++;
                }
            }
        }

        return bonus + enemyClusterSize * 2;
    }
}

class PerturbatorAIBehavior extends BaseAIBehavior {
    constructor() {
        super('PERTURBATOR');
    }

    getSpecialUseRule(bonusType) {
        return {
            PLACE_BOMB: { minScore: 11, delta: 0.5 },
            BOMB: { minScore: 10, delta: 0.5 },
            ICE: { minScore: 7, delta: -2.0 },
            SWAMP: { minScore: 7, delta: -2.0 },
            LIGHTNING: { minScore: 9, delta: -1.5 }
        }[bonusType] || { minScore: 10, delta: 0 };
    }

    scoreBombPlacement(ai, scene, grid, row, col, currentPlayer, leader) {
        const analysis = ai.analyzeBombPlacement(grid, row, col, currentPlayer, leader?.color);
        return (
            analysis.frontierEnemyCount * 2.5 +
            analysis.adjacentSpecials * 4 +
            analysis.nearbyEnemyMass * 0.9 +
            analysis.adjacentAllies * 0.8 -
            analysis.isolatedPenalty * 2.2
        );
    }

    evaluateRandomBonus(ai, scene, grid, currentPlayer, bonusType) {
        const difficultyProfile = ai.getDifficultyProfile();
        const scoreData = scene.gameLogic.getScoreData(grid);
        const leader = scene.gameLogic.getLeadingPlayer(scoreData);
        const redPercentage = scoreData.percentages.ROUGE || 0;
        const averagePercentage = 100 / scene.gameState.playerOrder.length;
        const redLeading = leader?.color === 'ROUGE';
        const boardSpecialCount = ai.countBoardSpecials(grid);

        let baseScore = {
            LIGHTNING: 15,
            ICE: 14,
            SWAMP: 15,
            BOMB: 10
        }[bonusType] || 10;

        baseScore += boardSpecialCount * 1.1;
        if (redLeading || redPercentage >= averagePercentage) baseScore += 2.5;
        if (bonusType === 'ICE') baseScore += 2;
        if (bonusType === 'SWAMP') baseScore += 2.5;
        if (bonusType === 'LIGHTNING') baseScore += 1.5;

        return baseScore + difficultyProfile.randomBonusScoreBias + (difficultyProfile.perturbatorSpecialBias || 0);
    }

    getMoveBonus(ai, _scene, grid, row, col, currentPlayer) {
        const difficultyProfile = ai.getDifficultyProfile();
        const targetColor = grid[row][col].color;
        let adjacentSpecials = 0;
        let adjacentEnemyTiles = 0;

        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                if (rowOffset === 0 && colOffset === 0) continue;

                const nextRow = row + rowOffset;
                const nextCol = col + colOffset;
                if (!ai.isInsideGrid(nextRow, nextCol)) continue;

                const neighbor = grid[nextRow][nextCol];
                if (neighbor.specialType) {
                    adjacentSpecials++;
                }
                if (neighbor.color !== currentPlayer && neighbor.color !== 'GRIS') {
                    adjacentEnemyTiles++;
                }
            }
        }

        const directSpecialBonus = {
            BOMB: 2,
            SUPER_BOMB: grid[row][col].specialOwnerColor === currentPlayer ? 7 : -10,
            LIGHTNING: 11,
            ICE: 12,
            SWAMP: 12
        };

        let pressureBonus = 0;
        if (targetColor === 'ROUGE') {
            pressureBonus += 2 + (difficultyProfile.perturbatorPressureBias || 0);
        }

        return (
            adjacentSpecials * (5 + (difficultyProfile.perturbatorSpecialBias || 0) * 0.35) +
            adjacentEnemyTiles * 1.5 +
            pressureBonus +
            (directSpecialBonus[grid[row][col].specialType] || 0)
        );
    }
}

class BerserkAIBehavior extends BaseAIBehavior {
    constructor() {
        super('BERSERK');
    }

    getSpecialUseRule(_bonusType) {
        return { minScore: 999, delta: 999 };
    }

    scoreBombPlacement(ai, scene, grid, row, col, currentPlayer, leader) {
        const analysis = ai.analyzeBombPlacement(grid, row, col, currentPlayer, leader?.color);
        return (
            analysis.frontierEnemyCount * 2 +
            analysis.adjacentSpecials * 1.5 +
            analysis.nearbyEnemyMass * 0.6 -
            analysis.isolatedPenalty * 1.5
        );
    }

    evaluateRandomBonus(_ai, _scene, _grid, _currentPlayer, _bonusType) {
        return -999;
    }

    chooseCandidate(_ai, candidates) {
        if (!candidates || candidates.length === 0) {
            return null;
        }

        const nonRedCandidates = candidates.filter((candidate) => candidate.targetColor !== 'ROUGE');
        if (nonRedCandidates.length > 0 && Math.random() < 0.5) {
            return Phaser.Utils.Array.GetRandom(nonRedCandidates);
        }

        return Phaser.Utils.Array.GetRandom(candidates);
    }
}

class IncendiaryAIBehavior extends BaseAIBehavior {
    constructor() {
        super('INCENDIARY');
    }

    getSpecialUseRule(bonusType) {
        return {
            PLACE_BOMB: { minScore: 12, delta: 0.5 },
            BOMB: { minScore: 10, delta: 0.5 },
            ICE: { minScore: 8, delta: -1.0 },
            SWAMP: { minScore: 8, delta: -1.0 },
            LIGHTNING: { minScore: 11, delta: 0.5 }
        }[bonusType] || { minScore: 10, delta: 0 };
    }

    scoreBombPlacement(ai, scene, grid, row, col, currentPlayer, leader) {
        const analysis = ai.analyzeBombPlacement(grid, row, col, currentPlayer, leader?.color);
        return (
            analysis.frontierEnemyCount * 2.8 +
            analysis.adjacentRed * 3 +
            analysis.nearbyEnemyMass * 0.9 +
            analysis.adjacentSpecials * 1.5 -
            analysis.isolatedPenalty * 2
        );
    }

    evaluateRandomBonus(ai, scene, grid, currentPlayer, bonusType) {
        const difficultyProfile = ai.getDifficultyProfile();
        const scoreData = scene.gameLogic.getScoreData(grid);
        const leader = scene.gameLogic.getLeadingPlayer(scoreData);
        const redPercentage = scoreData.percentages.ROUGE || 0;
        const averagePercentage = 100 / scene.gameState.playerOrder.length;
        const redLeading = leader?.color === 'ROUGE';

        let baseScore = {
            LIGHTNING: 12,
            ICE: 13,
            SWAMP: 14,
            BOMB: 10
        }[bonusType] || 10;

        if (redLeading || redPercentage >= averagePercentage) baseScore += 2;
        if (bonusType === 'ICE') baseScore += 1.5;
        if (bonusType === 'SWAMP') baseScore += 2;

        return baseScore + difficultyProfile.randomBonusScoreBias;
    }

    getMoveBonus(ai, scene, grid, row, col, currentPlayer) {
        const scoreData = scene.gameLogic.getScoreData(grid);
        const leader = scene.gameLogic.getLeadingPlayer(scoreData);
        const targetColor = grid[row][col].color;
        let adjacentEnemyTiles = 0;
        let adjacentRedTiles = 0;
        let adjacentSpecials = 0;

        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                if (rowOffset === 0 && colOffset === 0) continue;

                const nextRow = row + rowOffset;
                const nextCol = col + colOffset;
                if (!ai.isInsideGrid(nextRow, nextCol)) continue;

                const neighbor = grid[nextRow][nextCol];
                if (neighbor.color !== currentPlayer && neighbor.color !== 'GRIS') {
                    adjacentEnemyTiles++;
                    if (neighbor.color === 'ROUGE') {
                        adjacentRedTiles++;
                    }
                }
                if (neighbor.specialType) {
                    adjacentSpecials++;
                }
            }
        }

        let pressureBonus = 0;
        if (targetColor === 'ROUGE') {
            pressureBonus += 4;
        }
        if (leader && leader.color !== currentPlayer && targetColor === leader.color) {
            pressureBonus += 3;
        }

        return (
            pressureBonus +
            adjacentEnemyTiles * 1.7 +
            adjacentRedTiles * 1.8 +
            adjacentSpecials * 1.2
        );
    }
}

class AIBehaviors {
    static create(key) {
        const behaviorKey = key || 'OPPORTUNIST';
        const registry = {
            BUILDER: BuilderAIBehavior,
            OPPORTUNIST: OpportunistAIBehavior,
            AGGRESSIVE: AggressiveAIBehavior,
            PERTURBATOR: PerturbatorAIBehavior,
            BERSERK: BerserkAIBehavior,
            INCENDIARY: IncendiaryAIBehavior
        };
        const BehaviorClass = registry[behaviorKey] || OpportunistAIBehavior;
        return new BehaviorClass();
    }
}
