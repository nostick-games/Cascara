class GameLogic {
    constructor(gridSize = 20, playerColors = ['ROUGE', 'BLEU', 'VERT'], specialCellCount = 4, difficulty = 'NORMAL') {
        this.GRID_SIZE = gridSize;
        this.SPECIAL_CELL_COUNT = specialCellCount;
        this.playerColors = playerColors;
        this.LIGHTNING_CHARGE_TARGET_RATIO = 0.18;
        this.difficulty = difficulty;
        this.rules = new GameRules(this);
        this.moveEvaluator = new GameMoveEvaluator(this);
        this.gridFactory = new GameGridFactory(this);
    }

    static getWinThreshold(gridSize, playerCount) {
        return GameRules.getWinThreshold(gridSize, playerCount);
    }

    static getDifficultyShift(gridSize, difficulty) {
        return GameRules.getDifficultyShift(gridSize, difficulty);
    }

    canCapturePion(grid, row, col, currentPlayer) {
        return this.rules.canCapturePion(grid, row, col, currentPlayer);
    }

    evaluateMove(grid, row, col, currentPlayer) {
        return this.moveEvaluator.evaluateMove(grid, row, col, currentPlayer);
    }

    countAdjacentBombCells(grid, row, col) {
        return this.moveEvaluator.countAdjacentBombCells(grid, row, col);
    }

    evaluateSuperBombMove(grid, row, col, currentPlayer) {
        return this.moveEvaluator.evaluateSuperBombMove(grid, row, col, currentPlayer);
    }

    evaluateLightningMove(grid, row, col, currentPlayer) {
        return this.moveEvaluator.evaluateLightningMove(grid, row, col, currentPlayer);
    }

    evaluateIceMove(grid, row, col, currentPlayer) {
        return this.moveEvaluator.evaluateIceMove(grid, row, col, currentPlayer);
    }

    checkWinCondition(grid) {
        return this.rules.checkWinCondition(grid);
    }

    getScoreData(grid) {
        return this.rules.getScoreData(grid);
    }

    getLeadingPlayer(scoreData) {
        return this.rules.getLeadingPlayer(scoreData);
    }

    initializeGrid() {
        return this.gridFactory.initializeGrid();
    }

    buildInitialColorDistribution(totalPions) {
        return this.gridFactory.buildInitialColorDistribution(totalPions);
    }

    redistributeFromOthers(desiredCounts, amount) {
        return this.gridFactory.redistributeFromOthers(desiredCounts, amount);
    }

    redistributeToOthers(desiredCounts, amount) {
        return this.gridFactory.redistributeToOthers(desiredCounts, amount);
    }

    spawnSuperBombCell(grid, ownerColor = null) {
        return this.gridFactory.spawnSuperBombCell(grid, ownerColor);
    }

    spawnOwnedSuperBombCell(grid, ownerColor) {
        return this.gridFactory.spawnOwnedSuperBombCell(grid, ownerColor);
    }

    placeOwnedSuperBombCell(grid, row, col, ownerColor) {
        return this.gridFactory.placeOwnedSuperBombCell(grid, row, col, ownerColor);
    }

    spawnLightningCell(grid, ownerColor = null) {
        return this.gridFactory.spawnLightningCell(grid, ownerColor);
    }

    spawnIceCell(grid, ownerColor = null) {
        return this.gridFactory.spawnIceCell(grid, ownerColor);
    }

    spawnSwampCell(grid, ownerColor = null) {
        return this.gridFactory.spawnSwampCell(grid, ownerColor);
    }

    getLightningChargeIncrement(convertedCount) {
        return this.rules.getLightningChargeIncrement(convertedCount);
    }

    spawnSpecialCell(grid, specialType, excludedRow = null, excludedCol = null, ownerColor = null) {
        return this.gridFactory.spawnSpecialCell(grid, specialType, excludedRow, excludedCol, ownerColor);
    }
}
