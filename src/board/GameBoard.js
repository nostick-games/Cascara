class GameBoard {
    constructor(scene, config) {
        this.scene = scene;
        this.GRID_SIZE = config.gridSize || 20;
        this.CELL_SIZE = config.cellSize || 30;
        this.GRID_OFFSET_X = config.offsetX || 100;
        this.GRID_OFFSET_Y = config.offsetY || 80;
        this.COLORS = config.colors || {
            ROUGE: 0xff0000,
            BLEU: 0x0000ff,
            GRIS: 0x808080,
            NOIR: 0x000000
        };
        this.CAPTURE_DARK_COLOR = 0xAF7E4C;
        this.PROGRESS_POTION_ROW_OFFSET_Y = 48;
        this.PROGRESS_POTION_SCALE = 2;
        this.PROGRESS_POTION_SOURCE_HEIGHT = 42;
        this.BOTTOM_DECOR_ROOF_SOURCE_WIDTH = 153;
        this.BOTTOM_DECOR_ROOF_SOURCE_HEIGHT = 62;
        this.BOTTOM_BACKGROUND_VIEWPORT_MARGIN_BOTTOM = 0;
        this.BOTTOM_DECOR_EDGE_SCALE = 3;
        this.BOTTOM_DECOR_EDGE_OFFSET_Y = 18;
        this.BOTTOM_DECOR_SKULL_MOBILE_OFFSET_X = 14;
        this.BOTTOM_DECOR_POTION_ANCHOR_SOURCE_Y = 32;
        this.BOTTOM_DECOR_POTION_MOBILE_TOP_OFFSET_Y = 0;
        this.BONUS_GAUGE_COLORS = {
            ROUGE: 0xAC3232,
            BLEU: 0x5B6EE1,
            VERT: 0x37946E,
            JAUNE: 0x76428A
        };
        // Géométrie de la jauge d'objectif (en bas du plateau)
        this.GAUGE_X = this.GRID_OFFSET_X;
        this.GAUGE_Y = this.GRID_OFFSET_Y + this.GRID_SIZE * this.CELL_SIZE + 10;
        this.GAUGE_WIDTH = this.GRID_SIZE * this.CELL_SIZE;
        this.GAUGE_HEIGHT = 23;
        this.gaugeGraphics = null;
        this.goalGaugeSegments = [];
        this.goalGaugeNotches = [];
        this.progressPotionSprites = [];
        this.progressPotionShadows = [];
        this.progressPotionCooldownTexts = [];
        this.progressPotionSpriteMap = {};
        this.progressPotionShadowMap = {};
        this.progressPotionRenderStateMap = {};
        this.progressPotionNotchMap = {};
        this.progressPotionCooldownTextMap = {};
        this.progressPotionPulseTweens = {};
        this.potionCheatPanel = null;
        this.potionCheatSprites = [];
        this.displayedGoalProgress = 0;
        this.goalGaugeTween = null;
        this.goalGaugeBonusPulseTweens = [];
        this.goalGaugeClimaxTweens = [];
        this.goalGaugeClimaxActive = false;
        this.goalGaugeNotchAdvanceTweens = [];
        this.goalGaugeInitialized = false;
        this.backgroundSprite = null;
        this.bottomDecorRoofSprite = null;
        this.bottomDecorBooksSprite = null;
        this.bottomDecorSkullSprite = null;
        this.boardSurfaceSprite = null;
        this.frozenAreaSprites = [];
        this.swampAreaSprites = [];
        this.frozenAreaMaskGraphics = null;
        this.frozenAreaMask = null;
        this.playerHudContainer = null;
        this.playerHudSlots = {};
        this.frameSprites = [];
        this.heroSprite = null;
        this.heroDeathPlayed = false;
        this.enemySprites = {};
        this.enemyPulseTweens = {};
        this.enemyDeathPlayed = false;
        this.startSelectionTimers = [];
        this.startSelectionTween = null;
        this.lightningGaugeGraphics = {};
        this.bonusIconTexts = {};
        this.bonusIconImages = {};
        this.bonusHitAreas = {};
        this.thoughtBubbleTexts = {};
        this.thoughtEmojiTexts = {};
        this.thoughtBubbleTweens = {};
        this.thoughtStartTimers = {};
        this.thoughtSequenceActive = false;
        this.pendingThought = null;
        this.turnIndicatorTweens = {};
        this.lastTurnIndicatorColor = null;
        this.displayedLightningCharge = {};
        this.lightningGaugeTweens = {};
        this.THINKING_BUBBLE_DELAY_MS = 140;
        this.EUREKA_PULSE_DURATION_MS = 170;
        this.THOUGHT_FADE_DURATION_MS = 340;
        this.thoughtController = new ThoughtSequenceController(this);
        this.hud = new GameBoardHUD(this);
        this.effects = new GameBoardEffects(this);
        this.animations = new GameBoardAnimations(this);
        this.overlays = new GameBoardOverlays(this);
        this.potionMode = new PotionModeController(this);
        this.endScreenMonochrome = new EndScreenMonochromeController(this, this.potionMode);
        this.renderer = new GameBoardRenderer(this);
        this.interaction = new GameBoardInteraction(this);
        this.boardRevealActive = false;
        this.revealedIntroColors = new Set();
        this.orangePotionPreviewKeys = new Set();
        this.modePotionOverlays = [];
        this.modePotionHudOverlays = [];
        this.activePotionModeId = null;
        this.aiIntentPreviewSprites = [];
        this.endSequenceOverlay = null;
        this.endSequenceEraser = null;
        this.strategoMovesText = null;
        this.strategoMovesLabel = null;
        this.strategoRestartButton = null;
        this.fightDisplayedHealth = {};
        this.fightHealthTweens = {};
    }

    getTileTextureKey(color) {
        return this.renderer.getTileTextureKey(color);
    }

    getTileAnimationTextureKey(color, phase) {
        return this.renderer.getTileAnimationTextureKey(color, phase);
    }

    drawBoard(grid) {
        this.renderer.drawBoard(grid);
    }

    drawPion(grid, row, col) {
        this.renderer.drawPion(grid, row, col);
    }

    onPionHover(row, col, tileVisual, isHovering) {
        this.interaction.onPionHover(row, col, tileVisual, isHovering);
    }

    showOrangePotionPreview(centerRow, centerCol) {
        this.interaction.showOrangePotionPreview(centerRow, centerCol);
    }

    showSinglePotionPreview(row, col) {
        this.interaction.showSinglePotionPreview(row, col);
    }

    showCrossPotionPreview(centerRow, centerCol) {
        this.interaction.showCrossPotionPreview(centerRow, centerCol);
    }

    clearOrangePotionPreview(redraw = true) {
        this.interaction.clearOrangePotionPreview(redraw);
    }

    redrawPreviewCells(cellKeys) {
        this.renderer.redrawPreviewCells(cellKeys);
    }

    startCaptureAnimation(grid, row, col, fromColor, toColor) {
        this.animations.startCaptureAnimation(grid, row, col, fromColor, toColor);
    }

    stopCaptureAnimation(pion) {
        this.animations.stopCaptureAnimation(pion);
    }

    blinkPion(grid, row, col, isBlinking) {
        this.animations.blinkPion(grid, row, col, isBlinking);
    }

    resetBlinkPion(grid, row, col) {
        this.animations.resetBlinkPion(grid, row, col);
    }

    previewSelectedPion(grid, row, col, onComplete, duration = 110) {
        this.interaction.previewSelectedPion(grid, row, col, onComplete, duration);
    }

    animateBoardReveal(grid, playerOrder, onComplete) {
        this.animations.animateBoardReveal(grid, playerOrder, onComplete);
    }

    createUI() {
        this.hud.createUI();
        this.drawBattleBackground();
    }

    drawBattleBackground() {
        if (this.backgroundSprite) {
            this.backgroundSprite.destroy();
            this.backgroundSprite = null;
        }
        if (this.bottomDecorRoofSprite) {
            this.bottomDecorRoofSprite.destroy();
            this.bottomDecorRoofSprite = null;
        }
        if (this.bottomDecorBooksSprite) {
            this.bottomDecorBooksSprite.destroy();
            this.bottomDecorBooksSprite = null;
        }
        if (this.bottomDecorSkullSprite) {
            this.bottomDecorSkullSprite.destroy();
            this.bottomDecorSkullSprite = null;
        }
        if (this.boardSurfaceSprite) {
            this.boardSurfaceSprite.destroy();
            this.boardSurfaceSprite = null;
        }

        const topAnchor = this.scene.config.battleBackgroundTop || 0;
        const centerX = this.scene.config.battleBackgroundX || (this.GRID_OFFSET_X + this.GAUGE_WIDTH / 2);
        const bgWidth = 400;
        const scale = (this.scene.config.battleBackgroundWidth || this.GAUGE_WIDTH) / bgWidth;

        this.backgroundSprite = this.scene.add.image(centerX, topAnchor, this.scene.config.battleBackgroundKey || 'forest-fight-bg')
            .setOrigin(0.5, 0)
            .setScale(scale)
            .setDepth(-5);

        const boardSizePx = this.GRID_SIZE * this.CELL_SIZE;
        this.boardSurfaceSprite = this.scene.add.rectangle(
            this.GRID_OFFSET_X + boardSizePx / 2,
            this.GRID_OFFSET_Y + boardSizePx / 2,
            boardSizePx,
            boardSizePx,
            0x141013,
            1
        ).setOrigin(0.5).setDepth(-4.5);

        const viewportWidth = this.scene.scale.width || this.scene.config.viewportWidth || 800;
        const viewportHeight = this.scene.scale.height || this.scene.config.viewportHeight || 700;
        const isMobileViewport = viewportWidth < 500;
        const bottomBackgroundWidth = this.getBottomBackgroundWidth(viewportWidth);
        const bottomBackgroundLeftX = this.getBottomBackgroundLeftX(bottomBackgroundWidth);
        const bottomBackgroundHeight = Math.round(
            (bottomBackgroundWidth / this.BOTTOM_DECOR_ROOF_SOURCE_WIDTH) * this.BOTTOM_DECOR_ROOF_SOURCE_HEIGHT
        );
        const minRoofTopY = this.GAUGE_Y + this.GAUGE_HEIGHT + 8;
        const bottomBackgroundY = isMobileViewport
            ? (viewportHeight - this.BOTTOM_BACKGROUND_VIEWPORT_MARGIN_BOTTOM)
            : Math.max(
                viewportHeight - this.BOTTOM_BACKGROUND_VIEWPORT_MARGIN_BOTTOM,
                minRoofTopY + bottomBackgroundHeight
            );

        this.bottomDecorRoofSprite = this.scene.add.image(bottomBackgroundLeftX, bottomBackgroundY, 'ui-bottom-decor-roof')
            .setOrigin(0, 1)
            .setDisplaySize(bottomBackgroundWidth, bottomBackgroundHeight)
            .setDepth(-4);

        const bottomDecorEdgeY = bottomBackgroundY - this.BOTTOM_DECOR_EDGE_OFFSET_Y;

        this.bottomDecorBooksSprite = this.scene.add.image(bottomBackgroundLeftX, bottomDecorEdgeY, 'ui-bottom-decor-books')
            .setOrigin(0, 1)
            .setScale(this.BOTTOM_DECOR_EDGE_SCALE)
            .setDepth(-3.9);

        const skullX = isMobileViewport
            ? (bottomBackgroundLeftX + bottomBackgroundWidth + this.BOTTOM_DECOR_SKULL_MOBILE_OFFSET_X)
            : (bottomBackgroundLeftX + bottomBackgroundWidth);

        this.bottomDecorSkullSprite = this.scene.add.image(skullX, bottomDecorEdgeY, 'ui-bottom-decor-skull')
            .setOrigin(1, 1)
            .setScale(this.BOTTOM_DECOR_EDGE_SCALE)
            .setDepth(-4);
    }

    getBottomBackgroundPotionAnchorY() {
        if (this.bottomDecorRoofSprite?.active) {
            const roofHeight = this.bottomDecorRoofSprite.displayHeight || 0;
            const roofTopY = this.bottomDecorRoofSprite.y - roofHeight;
            const viewportWidth = this.scene.scale.width || this.scene.config.viewportWidth || 800;
            const isMobileViewport = viewportWidth < 500;

            if (isMobileViewport) {
                return roofTopY +
                    this.BOTTOM_DECOR_POTION_MOBILE_TOP_OFFSET_Y +
                    Math.round((this.PROGRESS_POTION_SOURCE_HEIGHT * this.PROGRESS_POTION_SCALE) / 2);
            }

            const roofScale = roofHeight / this.BOTTOM_DECOR_ROOF_SOURCE_HEIGHT;
            return roofTopY + Math.round(this.BOTTOM_DECOR_POTION_ANCHOR_SOURCE_Y * roofScale);
        }

        return this.GAUGE_Y + this.GAUGE_HEIGHT + this.PROGRESS_POTION_ROW_OFFSET_Y;
    }

    getBottomBackgroundWidth(viewportWidth = null) {
        const effectiveViewportWidth = viewportWidth || this.scene.scale.width || this.scene.config.viewportWidth || 800;
        const gameWindowWidth = this.backgroundSprite?.displayWidth || this.scene.config.battleBackgroundWidth || this.GAUGE_WIDTH;
        const horizontalBleed = effectiveViewportWidth < 500 ? 10 : 12;
        return Math.min(effectiveViewportWidth + horizontalBleed, Math.round(gameWindowWidth + horizontalBleed));
    }

    getBottomBackgroundLeftX(bottomBackgroundWidth) {
        const centerX = this.scene.config.battleBackgroundX || (this.GRID_OFFSET_X + this.GAUGE_WIDTH / 2);
        return Math.round(centerX - (bottomBackgroundWidth / 2));
    }

    drawFrozenAreaOverlays(grid) {
        this.overlays.drawFrozenAreaOverlays(grid);
    }

    drawSwampAreaOverlays(grid) {
        this.overlays.drawSwampAreaOverlays(grid);
    }

    ensureFrozenAreaMask() {
        this.overlays.ensureAreaMask();
    }

    drawFrameOverlay() {
        this.overlays.drawFrameOverlay();
    }

    clearFrameOverlay() {
        this.overlays.clearFrameOverlay();
    }

    clearFrozenAreaOverlays() {
        this.overlays.clearFrozenAreaOverlays();
    }

    clearSwampAreaOverlays() {
        this.overlays.clearSwampAreaOverlays();
    }

    updateUI(gameState, scoreData) {
        if (
            gameState.pendingProgressPotion !== 'ORANGE' &&
            gameState.pendingProgressPotion !== 'ROSE' &&
            gameState.pendingProgressPotion !== 'MENTHE' &&
            gameState.pendingProgressPotion !== 'BLANCHE' &&
            gameState.pendingProgressPotion !== 'CYAN'
        ) {
            this.clearOrangePotionPreview(false);
        }
        this.drawBoard(gameState.grid);
        this.hud.updateUI(gameState, scoreData);
        this.updatePotionModeOverlay(gameState);
    }

    updateStrategoMovesCounter(value) {
        this.hud.updateStrategoMovesCounter(value);
    }

    updatePotionModeOverlay(gameState) {
        this.potionMode.update(gameState);
    }

    clearPotionModeOverlay() {
        this.potionMode.clear();
    }

    applyPotionModeTint(isActive, animate = false) {
        this.potionMode.applyTint(isActive, animate);
    }

    showEndScreenMonochrome() {
        this.endScreenMonochrome.showEndScreenMonochrome();
    }

    showTrophyUnlockNotification(trophyIds) {
        this.hud.showTrophyUnlockNotification(trophyIds);
    }

    showFragmentActivationNotification(fragment, message, buttonLabel, onConfirm) {
        this.hud.showFragmentActivationNotification(fragment, message, buttonLabel, onConfirm);
    }

    animateObjectiveBonusGain(baseProgress, targetProgress, onComplete = null) {
        this.hud.animateObjectiveBonusGain(baseProgress, targetProgress, onComplete);
    }

    animateFirstPotionUnlockAdvance(offsetSegments, onComplete = null) {
        this.hud.animateFirstPotionUnlockAdvance(offsetSegments, onComplete);
    }

    playProgressPotionConsumeEffect(potionId) {
        const potionSprite = this.progressPotionSpriteMap?.[potionId];
        if (!potionSprite) return;

        const effect = this.scene.add.sprite(potionSprite.x, potionSprite.y, 'progress-potion-pouf', 0)
            .setOrigin(0.5)
            .setScale(1)
            .setDepth(18);

        effect.play('progress-potion-pouf');
        effect.once('animationcomplete', () => {
            effect.destroy();
        });
    }

    createTurnIndicator() {
        this.hud.createTurnIndicator();
    }

    updateTurnIndicator(currentPlayer, playerOrder) {
        this.hud.updateTurnIndicator(currentPlayer, playerOrder);
    }

    animateStartingPlayerSelection(playerOrder, onComplete) {
        this.hud.animateStartingPlayerSelection(playerOrder, onComplete);
    }

    clearStartingPlayerAnimation() {
        this.hud.clearStartingPlayerAnimation();
    }

    createLightningGauges() {
        this.hud.createLightningGauges();
    }

    updateLightningGauges(playerOrder, lightningCharge) {
        this.hud.updateLightningGauges(playerOrder, lightningCharge);
    }

    updateSuperBombCounters(playerOrder, spawnedSuperBombs) {
        this.hud.updateSuperBombCounters(playerOrder, spawnedSuperBombs);
    }

    animateSuperBombSpawn(grid, row, col) {
        this.effects.animateSuperBombSpawn(grid, row, col);
    }

    animateLightningSpawn(grid, row, col) {
        this.effects.animateLightningSpawn(grid, row, col);
    }

    animateThaw(grid, row, col) {
        this.effects.animateThaw(grid, row, col);
    }

    animateFightDamage(color, amount) {
        this.effects.animateFightDamage(color, amount);
    }

    createIceCracks(row, col, forWorldPosition = false) {
        return this.effects.createIceCracks(row, col, forWorldPosition);
    }

    animateLightningGauge(color, targetCharge, onComplete = null) {
        this.hud.animateLightningGauge(color, targetCharge, onComplete);
    }

    animateChaosGaugeDrain(color, onComplete = null) {
        this.hud.animateChaosGaugeDrain(color, onComplete);
    }

    renderLightningGauge(color, chargeValue) {
        this.hud.renderLightningGauge(color, chargeValue);
    }

    updateGauge(counts, playerOrder) {
        this.hud.updateGauge(counts, playerOrder);
    }

    showGameOver(winData) {
        this.hud.showGameOver(winData);
    }

    showDefeat(winnerColor = null) {
        this.hud.showDefeat(winnerColor);
    }

    showEndPanel(message, textColor) {
        this.hud.showEndPanel(message, textColor);
    }

    animateWinningTerritory(color, onComplete = null) {
        if (!color) {
            if (onComplete) onComplete();
            return;
        }

        const winners = [];
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const pion = this.scene.gameState.grid[row]?.[col];
                if (pion?.color === color && pion.graphics) {
                    winners.push({
                        graphics: pion.graphics,
                        x: pion.graphics.x,
                        y: pion.graphics.y
                    });
                }
            }
        }

        if (!winners.length) {
            if (onComplete) onComplete();
            return;
        }

        const leftToRight = winners
            .slice()
            .sort((left, right) => {
                if (left.x !== right.x) {
                    return left.x - right.x;
                }
                return left.y - right.y;
            });
        const rightToLeft = [...leftToRight].reverse();

        const animateWave = (orderedTiles, baseDelay, onWaveComplete = null) => {
            orderedTiles.forEach((entry, index) => {
                const tileContainer = entry.graphics;
                tileContainer.setScale(1);
                this.scene.tweens.add({
                    targets: tileContainer,
                    scaleX: 1.22,
                    scaleY: 1.22,
                    duration: 110,
                    delay: baseDelay + index * 16,
                    yoyo: true,
                    ease: 'Sine.InOut',
                    onComplete: () => {
                        tileContainer.setScale(1);
                    }
                });
            });

            const waveDuration = baseDelay + orderedTiles.length * 16 + 180;
            this.scene.time.delayedCall(waveDuration, () => {
                if (onWaveComplete) {
                    onWaveComplete();
                }
            });
        };

        animateWave(leftToRight, 0, () => {
            animateWave(rightToLeft, 40, () => {
                if (onComplete) {
                    onComplete();
                }
            });
        });
    }

    playWinnerFocusIris(color, onComplete = null) {
        const targetSprite = color === 'ROUGE'
            ? this.heroSprite
            : this.enemySprites?.[color];

        if (!targetSprite) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        if (this.endSequenceOverlay) {
            this.endSequenceOverlay.destroy();
            this.endSequenceOverlay = null;
        }
        if (this.endSequenceEraser) {
            this.endSequenceEraser.destroy();
            this.endSequenceEraser = null;
        }

        const viewportWidth = this.scene.scale.width || this.scene.config.viewportWidth || 800;
        const viewportHeight = this.scene.scale.height || this.scene.config.viewportHeight || 700;
        const overlay = this.scene.add.renderTexture(0, 0, viewportWidth, viewportHeight)
            .setOrigin(0, 0)
            .setDepth(39);
        const eraser = this.scene.add.circle(targetSprite.x, targetSprite.y, 64, 0xffffff, 1)
            .setVisible(false)
            .setScale(Math.max(viewportWidth, viewportHeight) / 64 * 1.6);
        const irisState = {
            scale: eraser.scaleX
        };
        const targetRadius = this.scene.scale.width < 500 ? 56 : 74;
        const targetScale = targetRadius / 64;

        this.endSequenceOverlay = overlay;
        this.endSequenceEraser = eraser;

        const redrawOverlay = () => {
            overlay.clear();
            overlay.fill(0x000000, 0.94);
            eraser.setPosition(targetSprite.x, targetSprite.y);
            eraser.setScale(irisState.scale);
            overlay.erase(eraser);
        };

        redrawOverlay();
        this.scene.tweens.add({
            targets: irisState,
            scale: targetScale,
            duration: 520,
            ease: 'Sine.InOut',
            onUpdate: redrawOverlay,
            onComplete: () => {
                this.scene.time.delayedCall(220, () => {
                    overlay.destroy();
                    eraser.destroy();
                    if (this.endSequenceOverlay === overlay) {
                        this.endSequenceOverlay = null;
                    }
                    if (this.endSequenceEraser === eraser) {
                        this.endSequenceEraser = null;
                    }
                    if (onComplete) {
                        onComplete();
                    }
                });
            }
        });
    }

    startThinking(color) {
        this.thoughtController.startThinking(color);
    }

    queueThinking(color, onShown = null) {
        this.thoughtController.queueThinking(color, onShown);
    }

    stopThinking(color) {
        this.thoughtController.stopThinking(color);
    }

    isThoughtSequenceActive() {
        return this.thoughtSequenceActive;
    }

    clearThoughts() {
        this.thoughtController.clearAll();
    }

    revealThought(color, onComplete) {
        this.thoughtController.revealThought(color, onComplete);
    }

    revealThoughtWithEmoji(color, emoji, onComplete) {
        this.thoughtController.revealThoughtWithEmoji(color, emoji, onComplete);
    }

    showAIIntentPreviews(previews) {
        this.overlays.showAIIntentPreviews(previews);
    }

    clearAIIntentPreviews(animate = true) {
        this.overlays.clearAIIntentPreviews(animate);
    }
}
