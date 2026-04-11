class GameBoardHUD {
    constructor(board) {
        this.board = board;
        this.scene = board.scene;
        this.goalGauge = new GameBoardGoalGauge(this);
        this.modeHud = new GameBoardModeHUD(this);
        this.characterHud = new GameBoardCharacterHUD(this);
        this.bonusGauges = new GameBoardBonusGauges(this);
        this.cheatPanel = new GameBoardCheatPanel(this);
        this.trophyNotifications = new GameBoardTrophyNotifications(this);
        this.endPanel = new GameBoardEndPanel(this);
    }

    createUI() {
        this.board.enemyDeathPlayed = false;
        this.board.heroDeathPlayed = false;
        this.board.gaugeGraphics = this.scene.add.graphics();
        this.board.gaugeGraphics.setDepth(14);
        this.board.gaugeGraphics.clear();

        this.createTurnIndicator();
        this.createLightningGauges();
        this.modeHud.createFightHealthBars();
        if (!this.scene.isFightMode) {
            this.createPotionCheatPanel();
        }
        this.createHeroSprite();
        this.createEnemySprites();
        this.modeHud.createStrategoMovesCounter();
    }

    updateUI(gameState, scoreData) {
        this.updateGauge(scoreData);
        this.updateTurnIndicator(gameState.currentPlayer, gameState.playerOrder);
        this.updateLightningGauges(gameState.playerOrder, gameState.lightningCharge, gameState.availableBonuses);
        this.modeHud.updateFightHealthBars(gameState.fightHealth);
        this.updateEnemySprites(gameState.playerOrder, scoreData);
        this.modeHud.updateStrategoMovesCounter(gameState.strategoMovesRemaining);
    }

    createTurnIndicator() {
        this.characterHud.createTurnIndicator();
    }

    computeEvenlySpacedPositions(startX, endX, count) {
        return this.characterHud.computeEvenlySpacedPositions(startX, endX, count);
    }

    computeEnemyPositions(heroX, backgroundLeft, backgroundWidth, count, isNarrowViewport) {
        return this.characterHud.computeEnemyPositions(heroX, backgroundLeft, backgroundWidth, count, isNarrowViewport);
    }

    updateTurnIndicator(currentPlayer, playerOrder) {
        this.characterHud.updateTurnIndicator(currentPlayer, playerOrder);
    }

    animateStartingPlayerSelection(playerOrder, onComplete) {
        this.characterHud.animateStartingPlayerSelection(playerOrder, onComplete);
    }

    clearStartingPlayerAnimation() {
        this.characterHud.clearStartingPlayerAnimation();
    }

    createLightningGauges() {
        this.bonusGauges.createLightningGauges();
    }

    createPotionCheatPanel() {
        this.cheatPanel.createPotionCheatPanel();
    }

    createCheatActionButton(x, y, width, height, label, onClick) {
        return this.cheatPanel.createCheatActionButton(x, y, width, height, label, onClick);
    }

    createEnemySprites() {
        this.characterHud.createEnemySprites();
    }

    createHeroSprite() {
        this.characterHud.createHeroSprite();
    }

    updateEnemySprites(activePlayers, scoreData) {
        this.characterHud.updateEnemySprites(activePlayers, scoreData);
    }

    updateLightningGauges(playerOrder, lightningCharge, availableBonuses) {
        this.bonusGauges.updateLightningGauges(playerOrder, lightningCharge, availableBonuses);
    }

    animateLightningGauge(color, targetCharge, onComplete = null) {
        this.bonusGauges.animateLightningGauge(color, targetCharge, onComplete);
    }

    renderLightningGauge(color, chargeValue) {
        this.bonusGauges.renderLightningGauge(color, chargeValue);
    }

    updateGauge(scoreData) {
        this.goalGauge.updateGauge(scoreData);
    }

    renderGoalGauge(winThreshold, playerProgress) {
        this.goalGauge.renderGoalGauge(winThreshold, playerProgress);
    }

    updateProgressPotionStates(playerProgress, winThreshold) {
        this.goalGauge.updateProgressPotionStates(playerProgress, winThreshold);
    }

    updateSuperBombCounters() {}

    showGameOver(winData) {
        this.endPanel.showGameOver(winData);
    }

    showDefeat(winnerColor = null) {
        this.endPanel.showDefeat(winnerColor);
    }

    showEndPanel(resultType) {
        this.endPanel.showEndPanel(resultType);
    }

    buildEndStatsText() {
        return this.endPanel.buildEndStatsText();
    }

    createPotionStatsRow(centerX, y, isNarrowViewport) {
        return this.endPanel.createPotionStatsRow(centerX, y, isNarrowViewport);
    }

    createStyledMenuButton(x, y, width, height, label, fontSize = '15px') {
        return this.endPanel.createStyledMenuButton(x, y, width, height, label, fontSize);
    }

    showTrophyUnlockNotification(trophyIds) {
        this.trophyNotifications.showUnlockNotification(trophyIds);
    }

    showFragmentActivationNotification(fragment, message, buttonLabel, onConfirm) {
        this.trophyNotifications.showFragmentNotification(fragment, message, buttonLabel, onConfirm);
    }

    animateGoalGaugeTo(targetProgress, onComplete = null) {
        this.goalGauge.animateGoalGaugeTo(targetProgress, onComplete);
    }

    animateObjectiveBonusGain(baseProgress, targetProgress, onComplete = null) {
        this.goalGauge.animateObjectiveBonusGain(baseProgress, targetProgress, onComplete);
    }

    animateFirstPotionUnlockAdvance(offsetSegments, onComplete = null) {
        this.goalGauge.animateFirstPotionUnlockAdvance(offsetSegments, onComplete);
    }

    playEnemyDeathAnimations() {
        this.characterHud.playEnemyDeathAnimations();
    }

    playHeroDefeatAnimation() {
        this.characterHud.playHeroDefeatAnimation();
    }

    getIdleAnimationKey(enemyType) {
        return this.characterHud.getIdleAnimationKey(enemyType);
    }

    getDeathAnimationKey(enemyType) {
        return this.characterHud.getDeathAnimationKey(enemyType);
    }

    getBonusEmoji(bonusType) {
        return this.bonusGauges.getBonusEmoji(bonusType);
    }

    getBonusImageKey(bonusType) {
        return this.bonusGauges.getBonusImageKey(bonusType);
    }

}
