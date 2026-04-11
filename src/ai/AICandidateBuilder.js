class AICandidateBuilder {
    static buildCaptureCandidates(ai, scene, grid, currentPlayer) {
        const candidates = [];

        for (let row = 0; row < ai.gameLogic.GRID_SIZE; row++) {
            for (let col = 0; col < ai.gameLogic.GRID_SIZE; col++) {
                if (!ai.gameLogic.canCapturePion(grid, row, col, currentPlayer)) continue;

                const score = ai.scoreMove(scene, grid, row, col, currentPlayer);
                candidates.push({
                    row,
                    col,
                    score,
                    targetColor: grid[row][col].color,
                    specialType: grid[row][col].specialType,
                    specialOwnerColor: grid[row][col].specialOwnerColor || null
                });
            }
        }

        candidates.sort((a, b) => b.score - a.score);
        return candidates;
    }

    static buildBombPlacementCandidates(ai, scene, grid, currentPlayer) {
        const scoreData = scene.gameLogic.getScoreData(grid);
        const leader = scene.gameLogic.getLeadingPlayer(scoreData);
        const candidates = [];

        for (let row = 0; row < ai.gameLogic.GRID_SIZE; row++) {
            for (let col = 0; col < ai.gameLogic.GRID_SIZE; col++) {
                const pion = grid[row][col];
                if (pion.color !== currentPlayer || pion.specialType || pion.isFrozen) continue;

                const score = ai.scoreBombPlacement(scene, grid, row, col, currentPlayer, leader);
                candidates.push({ row, col, score });
            }
        }

        candidates.sort((a, b) => b.score - a.score);
        return candidates;
    }
}
