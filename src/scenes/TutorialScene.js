class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' });
        this.gridSize = 8;
        this.grid = [];
        this.cellSprites = [];
        this.currentTarget = null;
        this.currentTargetSet = null;
        this.currentStep = null;
        this.isBusy = false;
        this.objectiveProgress = 0;
        this.displayedObjectiveProgress = 0;
        this.chaosCharge = 0;
        this.displayedChaosCharge = 0;
        this.activeChaosBonus = null;
        this.orangePotionArmed = false;
        this.orangePotionActive = false;
        this.modalOpen = false;
        this.activeModalHandle = null;
        this.modalBackdrop = null;
        this.pendingPressedCellKey = null;
    }

    init(data) {
        if (data?.language) {
            TranslationManager.setLanguage(data.language);
        }
        this.returnSceneKey = data?.returnSceneKey || 'MainMenuScene';
        this.returnSceneData = data?.returnSceneData || { language: TranslationManager.getLanguage() };
    }

    preload() {
        this.load.spritesheet('hero-idle-face', 'assets/images/hero/idle_face.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.image('tutorial-fight-bg', 'assets/images/maps/forest_fight.png');
        this.load.image('tutorial-roof', 'assets/images/UI/decor_roof.png');
        this.load.image('tutorial-books', 'assets/images/UI/decor_books.png');
        this.load.image('tutorial-skull', 'assets/images/UI/decor_skull.png');
        this.load.image('ui-goal-gauge-empty', 'assets/images/UI/jauge_vide.png');
        this.load.image('ui-goal-gauge-full', 'assets/images/UI/jauge_pleine.png');
        this.load.image('tutorial-potion-orange', 'assets/images/bonus/potion_orange.png');
        this.load.image('tutorial-potion-menthe', 'assets/images/bonus/potion_menthe.png');
        this.load.image('tutorial-potion-marron', 'assets/images/bonus/potion_marron.png');
        this.load.image('tutorial-potion-shadow', 'assets/images/bonus/potion_shadow.png');
        this.load.image('tutorial-bonus-place-bomb', 'assets/images/bonus/bomb_icon.png');
        this.load.image('tutorial-bonus-bomb', 'assets/images/bonus/explosion_icon.png');
        this.load.image('tutorial-bonus-ice', 'assets/images/bonus/ice_icon.png');
        this.load.image('tutorial-bonus-swamp', 'assets/images/bonus/swamp_icon.png');
        this.load.audio('tile-clap', 'assets/sounds/clap.mp3');

        this.load.image('tutorial-tile-red-idle', 'assets/images/tiles/tile_red.png');
        this.load.image('tutorial-tile-grey-idle', 'assets/images/tiles/tile_grey.png');
        this.load.spritesheet('tutorial-tile-red-off', 'assets/images/tiles/tile_red_off.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tutorial-tile-red-on', 'assets/images/tiles/tile_red_on.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tutorial-tile-grey-off', 'assets/images/tiles/tile_grey_off.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tutorial-tile-grey-on', 'assets/images/tiles/tile_grey_on.png', {
            frameWidth: 13,
            frameHeight: 13
        });

        this.load.image('ui-button-left-off', 'assets/images/UI/bouton_bord_gauche_off.png');
        this.load.image('ui-button-fill-off', 'assets/images/UI/bouton_fond_off.png');
        this.load.image('ui-button-right-off', 'assets/images/UI/bouton_bord_droite_off.png');
        this.load.image('ui-button-left-on', 'assets/images/UI/bouton_bord_gauche_on.png');
        this.load.image('ui-button-fill-on', 'assets/images/UI/bouton_fond_on.png');
        this.load.image('ui-button-right-on', 'assets/images/UI/bouton_bord_droite_on.png');
    }

    create() {
        this.viewportWidth = this.scale.width || 800;
        this.viewportHeight = this.scale.height || 700;
        this.isNarrowViewport = this.viewportWidth < 500;
        this.centerX = this.viewportWidth / 2;

        this.cameras.main.setBackgroundColor('#AF7E4C');
        this.ensureAnimations();
        this.buildInitialGrid();
        this.buildLayout();
        this.renderBoard();
        this.renderObjectiveGauge(0);
        this.renderChaosGauge(0);
        this.renderPotions();
        this.animateBoardReveal(() => {
            this.showModal(
                TranslationManager.t('tutorial.modal_intro'),
                TranslationManager.t('tutorial.button_intro'),
                () => {
                    this.revealRedTerritory(() => {
                        this.showModal(
                            TranslationManager.t('tutorial.modal_first_capture'),
                            TranslationManager.t('tutorial.button_first_capture'),
                            () => {
                                this.enterStep('capture_corner');
                            }
                        );
                    });
                }
            );
        });
    }

    ensureAnimations() {
        const tileAnimations = [
            { key: 'tutorial-tile-red-off-anim', texture: 'tutorial-tile-red-off' },
            { key: 'tutorial-tile-red-on-anim', texture: 'tutorial-tile-red-on' },
            { key: 'tutorial-tile-grey-off-anim', texture: 'tutorial-tile-grey-off' },
            { key: 'tutorial-tile-grey-on-anim', texture: 'tutorial-tile-grey-on' }
        ];

        tileAnimations.forEach(({ key, texture }) => {
            if (this.anims.exists(key)) {
                return;
            }

            const totalFrames = this.textures.get(texture)?.frameTotal || 1;
            this.anims.create({
                key,
                frames: this.anims.generateFrameNumbers(texture, {
                    start: 0,
                    end: Math.max(0, totalFrames - 1)
                }),
                frameRate: 14,
                repeat: 0
            });
        });

        if (!this.anims.exists('hero-idle-face')) {
            this.anims.create({
                key: 'hero-idle-face',
                frames: this.anims.generateFrameNumbers('hero-idle-face', { start: 0, end: 3 }),
                frameRate: 5,
                repeat: -1
            });
        }
    }

    buildInitialGrid() {
        this.grid = Array.from({ length: this.gridSize }, (_, row) =>
            Array.from({ length: this.gridSize }, (_, col) => ({
                row,
                col,
                color: 'GRIS',
                introHidden: true
            }))
        );
    }

    buildLayout() {
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

        const backgroundSourceWidth = 400;
        const backgroundSourceHeight = 576;
        const plateauTopRatio = this.isNarrowViewport ? 0.40 : 0.44;
        const frameOuterRatio = 0.45;
        const horizontalPadding = this.isNarrowViewport ? 0 : 24;
        const bottomSafeSpace = this.isNarrowViewport ? 30 : 40;
        const availableWidth = Math.max(200, this.viewportWidth - horizontalPadding * 2);
        const maxBackgroundWidthByHeight = this.isNarrowViewport
            ? availableWidth
            : Math.floor(
                (this.viewportHeight - bottomSafeSpace) /
                (1 + ((backgroundSourceHeight / backgroundSourceWidth) * plateauTopRatio))
            );
        const targetBackgroundWidth = this.isNarrowViewport
            ? availableWidth
            : Math.min(availableWidth, maxBackgroundWidthByHeight);
        const dynamicCellSize = Math.floor(
            targetBackgroundWidth / (this.gridSize + frameOuterRatio * 2)
        );
        const maxDesktopCellSizeByBoard = { 8: 56 };
        const maxCellSize = this.isNarrowViewport
            ? dynamicCellSize
            : (maxDesktopCellSizeByBoard[this.gridSize] || 36);
        this.cellSize = Math.min(
            maxCellSize,
            Math.max(this.isNarrowViewport ? 22 : 28, dynamicCellSize)
        );
        this.boardPixelSize = this.gridSize * this.cellSize;
        this.boardOffsetX = Math.round((this.viewportWidth - this.boardPixelSize) / 2);
        const backgroundWidth = this.isNarrowViewport
            ? Math.max(this.boardPixelSize + Math.round(this.cellSize * frameOuterRatio) * 2, this.viewportWidth + 4)
            : this.boardPixelSize + Math.round(this.cellSize * frameOuterRatio) * 2;
        const backgroundScale = backgroundWidth / backgroundSourceWidth;
        this.battleBackgroundWidth = backgroundWidth;
        this.battleBackgroundHeight = backgroundSourceHeight * backgroundScale;
        this.boardOffsetY = Math.round(backgroundSourceHeight * backgroundScale * plateauTopRatio);

        this.GAUGE_X = this.boardOffsetX;
        this.GAUGE_Y = this.boardOffsetY + this.boardPixelSize + 10;
        this.GAUGE_WIDTH = this.boardPixelSize;
        this.GAUGE_HEIGHT = 23;

        this.drawBattleBackground();
        this.createHeroAndChaosGauge();
        this.createObjectiveGauge();
        this.createPotionRow();
    }

    drawBattleBackground() {
        const bgCenterX = this.boardOffsetX + this.boardPixelSize / 2;
        const bgScale = this.battleBackgroundWidth / 400;

        this.add.image(bgCenterX, 0, 'tutorial-fight-bg')
            .setOrigin(0.5, 0)
            .setScale(bgScale)
            .setDepth(-5);

        this.add.rectangle(
            this.boardOffsetX + this.boardPixelSize / 2,
            this.boardOffsetY + this.boardPixelSize / 2,
            this.boardPixelSize,
            this.boardPixelSize,
            0x141013,
            1
        ).setOrigin(0.5).setDepth(-4.5);

        const roofWidth = this.getBottomBackgroundWidth();
        const roofHeight = Math.round(
            (roofWidth / this.BOTTOM_DECOR_ROOF_SOURCE_WIDTH) * this.BOTTOM_DECOR_ROOF_SOURCE_HEIGHT
        );
        const minRoofTopY = this.GAUGE_Y + this.GAUGE_HEIGHT + 8;
        const roofBottomY = this.isNarrowViewport
            ? (this.viewportHeight - this.BOTTOM_BACKGROUND_VIEWPORT_MARGIN_BOTTOM)
            : Math.max(
                this.viewportHeight - this.BOTTOM_BACKGROUND_VIEWPORT_MARGIN_BOTTOM,
                minRoofTopY + roofHeight
            );
        const edgeY = roofBottomY - this.BOTTOM_DECOR_EDGE_OFFSET_Y;

        this.roofSprite = this.add.image(0, roofBottomY, 'tutorial-roof')
            .setOrigin(0, 1)
            .setDisplaySize(roofWidth, roofHeight)
            .setDepth(-4.9);

        this.booksSprite = this.add.image(0, edgeY, 'tutorial-books')
            .setOrigin(0, 1)
            .setScale(this.BOTTOM_DECOR_EDGE_SCALE)
            .setDepth(-4.7);

        const skullX = this.isNarrowViewport
            ? this.viewportWidth + this.BOTTOM_DECOR_SKULL_MOBILE_OFFSET_X
            : this.viewportWidth;
        this.skullSprite = this.add.image(skullX, edgeY, 'tutorial-skull')
            .setOrigin(1, 1)
            .setScale(this.BOTTOM_DECOR_EDGE_SCALE)
            .setDepth(-4.7);

        this.roofTopY = roofBottomY - roofHeight;
    }

    createHeroAndChaosGauge() {
        const heroX = this.centerX;
        const heroY = this.isNarrowViewport ? 92 : 84;

        this.heroSprite = this.add.sprite(heroX, heroY, 'hero-idle-face', 0)
            .setScale(this.isNarrowViewport ? 2.7 : 3)
            .setDepth(8);
        this.heroSprite.play('hero-idle-face');

        const gaugeYOffset = this.isNarrowViewport ? 82 : 88;
        this.chaosGauge = {
            x: heroX,
            y: heroY + gaugeYOffset,
            radius: this.isNarrowViewport ? 26 : 30,
            scale: 1,
            graphics: this.add.graphics().setDepth(10),
            iconText: this.add.text(heroX, heroY + gaugeYOffset, '', {
                fontSize: this.isNarrowViewport ? '28px' : '31px',
                fill: '#111111',
                fontFamily: 'Vollkorn',
                align: 'center'
            }).setOrigin(0.5).setVisible(false).setDepth(11),
            iconImage: this.add.image(heroX, heroY + gaugeYOffset, 'tutorial-bonus-place-bomb')
                .setOrigin(0.5)
                .setVisible(false)
                .setDepth(11)
        };

        this.chaosGauge.graphics.setVisible(false);
        this.chaosGauge.iconText.setVisible(false);
        this.chaosGauge.iconImage.setVisible(false);
    }

    createObjectiveGauge() {
        this.objectiveGauge = {
            graphics: this.add.graphics().setDepth(10),
            segments: [],
            visible: false
        };
    }

    createPotionRow() {
        const spacing = this.isNarrowViewport ? 104 : 120;
        const centerY = this.getBottomBackgroundPotionAnchorY();
        const startX = this.GAUGE_X + this.GAUGE_WIDTH / 2 - spacing;
        const textures = ['tutorial-potion-orange', 'tutorial-potion-menthe', 'tutorial-potion-marron'];

        this.potionSprites = textures.map((textureKey, index) => {
            const x = startX + index * spacing;
            const shadow = this.add.image(x, centerY + 40, 'tutorial-potion-shadow')
                .setOrigin(0.5)
                .setScale(this.PROGRESS_POTION_SCALE)
                .setVisible(false)
                .setDepth(-3.8);
            const sprite = this.add.image(x, centerY, textureKey)
                .setOrigin(0.5)
                .setScale(this.PROGRESS_POTION_SCALE)
                .setVisible(false)
                .setDepth(-3.7)
                .setInteractive({ useHandCursor: true });
            sprite.on('pointerdown', () => this.handlePotionClick(index));

            return {
                sprite,
                shadow,
                pulseTween: null,
                baseScale: this.PROGRESS_POTION_SCALE
            };
        });
    }

    renderPotions() {
        this.potionSprites.forEach(({ sprite, shadow, baseScale }) => {
            sprite.setVisible(false);
            shadow.setVisible(false);
            sprite.setAlpha(0.28);
            sprite.clearTint();
            sprite.setScale(baseScale);
        });
    }

    renderBoard() {
        this.cellSprites.forEach((cell) => {
            cell.hitArea.destroy();
            cell.highlight.destroy();
            cell.sprite.destroy();
        });
        this.cellSprites = [];

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const centerX = this.boardOffsetX + col * this.cellSize + this.cellSize / 2;
                const centerY = this.boardOffsetY + row * this.cellSize + this.cellSize / 2;
                const highlight = this.add.rectangle(centerX, centerY, this.cellSize, this.cellSize)
                    .setFillStyle(0x000000, 0)
                    .setStrokeStyle(0, 0xffffff, 0)
                    .setDepth(4);
                const sprite = this.add.sprite(centerX, centerY, this.getIdleTextureKey(this.grid[row][col].color), 0)
                    .setDisplaySize(this.cellSize, this.cellSize)
                    .setDepth(5);
                const hitArea = this.add.rectangle(centerX, centerY, this.cellSize, this.cellSize, 0x000000, 0.001)
                    .setOrigin(0.5)
                    .setDepth(6);

                hitArea.setInteractive();
                hitArea.on('pointerdown', () => this.handleCellClick(row, col));
                hitArea.on('pointerover', () => this.handleCellPointerOver(row, col));
                hitArea.on('pointerout', () => this.handleCellPointerOut(row, col));

                this.cellSprites.push({
                    row,
                    col,
                    sprite,
                    hitArea,
                    highlight,
                    pulseTween: null,
                    baseScale: sprite.scaleX
                });
            }
        }

        this.refreshHighlights();
    }

    showModal(message, buttonLabel, onConfirm) {
        if (this.activeModalHandle?.overlay?.active) {
            this.activeModalHandle.overlay.destroy(true);
            this.activeModalHandle = null;
        }

        this.ensureModalBackdrop();
        this.modalBackdrop.setVisible(true);
        this.modalBackdrop.setAlpha(0.62);

        this.modalOpen = true;
        this.activeModalHandle = CenteredPromptModal.show(this, {
            depth: 60,
            width: this.isNarrowViewport ? 286 : 372,
            height: this.isNarrowViewport ? 218 : 238,
            overlayAlpha: 0,
            bodyText: message,
            buttonWidth: this.isNarrowViewport ? 210 : 236,
            buttonLabel,
            onConfirm: () => {
                this.modalOpen = false;
                this.activeModalHandle = null;
                if (onConfirm) {
                    onConfirm();
                }
                if (!this.activeModalHandle && this.modalBackdrop?.active) {
                    this.modalBackdrop.setVisible(false);
                }
            }
        });
    }

    ensureModalBackdrop() {
        if (this.modalBackdrop?.active) {
            this.modalBackdrop
                .setPosition(this.centerX, this.viewportHeight / 2)
                .setSize(this.viewportWidth, this.viewportHeight);
            return;
        }

        this.modalBackdrop = this.add.rectangle(
            this.centerX,
            this.viewportHeight / 2,
            this.viewportWidth,
            this.viewportHeight,
            0x000000,
            0.62
        )
            .setDepth(59)
            .setVisible(false);
    }

    revealRedTerritory(onComplete = null) {
        const territoryCells = [
            { row: 0, col: 0 },
            { row: 0, col: 1 },
            { row: 1, col: 0 },
            { row: 1, col: 1 }
        ];

        let remaining = territoryCells.length;
        territoryCells.forEach(({ row, col }, index) => {
            this.time.delayedCall(index * 60, () => {
                const cell = this.grid[row][col];
                const entry = this.getCellEntry(row, col);
                if (!cell || !entry) {
                    remaining -= 1;
                    if (remaining === 0 && onComplete) {
                        onComplete();
                    }
                    return;
                }

        this.playCaptureAnimation(entry.sprite, 'GRIS', 'ROUGE', () => {
                    cell.color = 'ROUGE';
                    entry.sprite.setTexture(this.getIdleTextureKey('ROUGE'));
                    entry.sprite.setFrame(0);
                    entry.sprite.setScale(entry.baseScale);
                    remaining -= 1;
                    if (remaining === 0) {
                        this.refreshHighlights();
                        if (onComplete) {
                            onComplete();
                        }
                    }
                });
            });
        });
    }

    enterStep(stepId) {
        this.currentStep = stepId;
        this.orangePotionArmed = false;
        this.clearPotionPulse();

        switch (stepId) {
            case 'capture_corner':
                this.currentTarget = { row: 2, col: 2 };
                this.currentTargetSet = null;
                break;
            case 'capture_gauge':
                this.currentTarget = { row: 0, col: 3 };
                this.currentTargetSet = null;
                this.showObjectiveGauge(25);
                break;
            case 'capture_chaos':
                this.currentTarget = { row: 4, col: 4 };
                this.currentTargetSet = null;
                this.showChaosGauge();
                this.animateObjectiveGaugeTo(75);
                this.animateChaosGaugeTo(92);
                break;
            case 'orange_potion_select':
                this.currentTarget = null;
                this.currentTargetSet = null;
                this.showPotions();
                this.setPotionStates([true, true, false]);
                this.pulsePotion(0);
                break;
            case 'orange_potion_target':
                this.currentTarget = { row: 6, col: 1 };
                this.currentTargetSet = null;
                this.orangePotionArmed = true;
                break;
            default:
                this.currentTarget = null;
                this.currentTargetSet = null;
                break;
        }

        this.refreshHighlights();
    }

    showObjectiveGauge(initialPercent = 0) {
        this.objectiveGauge.visible = true;
        this.objectiveProgress = initialPercent;
        this.displayedObjectiveProgress = initialPercent;
        this.renderObjectiveGauge(initialPercent);
    }

    renderObjectiveGauge(progressPercent) {
        if (!this.objectiveGauge.visible) {
            return;
        }
        const clampedProgress = Phaser.Math.Clamp(progressPercent, 0, 100);
        const gaugeOuterX = this.boardOffsetX;
        const gaugeOuterY = this.GAUGE_Y;
        const gaugeOuterWidth = this.GAUGE_WIDTH;
        const gaugeOuterHeight = this.GAUGE_HEIGHT;
        const borderSize = 2;
        const innerPaddingX = 3;
        const innerX = gaugeOuterX + borderSize + innerPaddingX;
        const innerY = gaugeOuterY + borderSize;
        const innerHeight = gaugeOuterHeight - borderSize * 2;
        const segmentWidth = 11;
        const segmentHeight = 16;
        const segmentSpacing = 1;
        const usableWidth = gaugeOuterWidth - (borderSize + innerPaddingX) * 2;
        const segmentCount = Math.max(1, Math.floor((usableWidth + segmentSpacing) / (segmentWidth + segmentSpacing)));
        const totalSegmentsWidth = segmentCount * segmentWidth + Math.max(0, segmentCount - 1) * segmentSpacing;
        const segmentsStartX = innerX + Math.floor((usableWidth - totalSegmentsWidth) / 2);
        const segmentsStartY = innerY + Math.floor((innerHeight - segmentHeight) / 2);
        const filledSegments = Math.max(0, Math.min(segmentCount, Math.floor((clampedProgress / 100) * segmentCount)));

        this.objectiveGauge.graphics.clear();
        this.objectiveGauge.graphics.lineStyle(borderSize, 0x895A45, 1);
        this.objectiveGauge.graphics.fillStyle(0x25131A, 1);
        this.objectiveGauge.graphics.fillRect(gaugeOuterX, gaugeOuterY, gaugeOuterWidth, gaugeOuterHeight);
        this.objectiveGauge.graphics.strokeRect(gaugeOuterX, gaugeOuterY, gaugeOuterWidth, gaugeOuterHeight);

        this.objectiveGauge.segments.forEach((segment) => segment.destroy());
        this.objectiveGauge.segments = [];

        for (let index = 0; index < segmentCount; index++) {
            const textureKey = index < filledSegments ? 'ui-goal-gauge-full' : 'ui-goal-gauge-empty';
            const segmentX = segmentsStartX + index * (segmentWidth + segmentSpacing);
            const segment = this.add.image(segmentX, segmentsStartY, textureKey)
                .setOrigin(0, 0)
                .setDisplaySize(segmentWidth, segmentHeight)
                .setDepth(11);
            this.objectiveGauge.segments.push(segment);
        }
    }

    animateObjectiveGaugeTo(targetPercent, onComplete = null) {
        if (!this.objectiveGauge.visible) {
            this.showObjectiveGauge(this.displayedObjectiveProgress || 0);
        }

        const tweenState = { value: this.displayedObjectiveProgress || 0 };
        this.tweens.add({
            targets: tweenState,
            value: targetPercent,
            duration: 420,
            ease: 'Sine.easeOut',
            onUpdate: () => {
                this.displayedObjectiveProgress = tweenState.value;
                this.renderObjectiveGauge(tweenState.value);
            },
            onComplete: () => {
                this.objectiveProgress = targetPercent;
                this.displayedObjectiveProgress = targetPercent;
                this.renderObjectiveGauge(targetPercent);
                if (onComplete) {
                    onComplete();
                }
            }
        });
    }

    showChaosGauge() {
        this.chaosGauge.graphics.setVisible(true);
        this.renderChaosGauge(this.displayedChaosCharge || 0);
    }

    renderChaosGauge(chargeValue = this.displayedChaosCharge || 0) {
        const gauge = this.chaosGauge;
        if (!gauge.graphics.visible) {
            return;
        }

        const progress = Phaser.Math.Clamp(chargeValue / 100, 0, 1);
        const radius = gauge.radius * gauge.scale;
        const outerStrokeWidth = 5;
        const fillRadius = Math.max(4, radius - outerStrokeWidth / 2);
        const progressRadius = fillRadius;

        gauge.graphics.clear();
        gauge.graphics.lineStyle(outerStrokeWidth, 0xAC3232, 1);
        gauge.graphics.strokeCircle(gauge.x, gauge.y, radius);

        if (this.activeChaosBonus) {
            gauge.graphics.fillStyle(0xAC3232, 1);
            gauge.graphics.fillCircle(gauge.x, gauge.y, fillRadius);
        } else {
            gauge.graphics.fillStyle(0xffffff, 1);
            gauge.graphics.fillCircle(gauge.x, gauge.y, fillRadius);
            if (progress > 0) {
                gauge.graphics.fillStyle(0xAC3232, 1);
                gauge.graphics.beginPath();
                gauge.graphics.moveTo(gauge.x, gauge.y);
                gauge.graphics.arc(gauge.x, gauge.y, progressRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
                gauge.graphics.closePath();
                gauge.graphics.fillPath();
            }
        }

        gauge.iconText.setVisible(this.activeChaosBonus === 'LIGHTNING');
        gauge.iconImage.setVisible(Boolean(this.activeChaosBonus) && this.activeChaosBonus !== 'LIGHTNING');
        if (gauge.iconText.visible) {
            gauge.iconText.setText('⚡️');
            gauge.iconText.setScale(gauge.scale);
        }
        if (gauge.iconImage.visible) {
            gauge.iconImage.setTexture(this.getChaosBonusImageKey(this.activeChaosBonus));
            const size = this.isNarrowViewport ? 32 : 36;
            gauge.iconImage.setDisplaySize(size, size);
            gauge.iconImage.setScale(gauge.scale);
            gauge.iconImage.clearTint();
        }
    }

    animateChaosGaugeTo(targetCharge, onComplete = null) {
        this.showChaosGauge();
        const tweenState = { value: this.displayedChaosCharge || 0 };
        this.tweens.add({
            targets: tweenState,
            value: targetCharge,
            duration: 420,
            ease: 'Sine.easeOut',
            onUpdate: () => {
                this.displayedChaosCharge = tweenState.value;
                this.renderChaosGauge(tweenState.value);
            },
            onComplete: () => {
                this.chaosCharge = targetCharge;
                this.displayedChaosCharge = targetCharge;
                this.renderChaosGauge(targetCharge);
                if (onComplete) {
                    onComplete();
                }
            }
        });
    }

    startChaosRoulette(selectedBonus, onComplete = null) {
        const gauge = this.chaosGauge;
        gauge.iconText.setVisible(false);
        gauge.iconImage.setVisible(false);
        this.activeChaosBonus = null;
        this.renderChaosGauge(100);

        const bonusTypes = ['PLACE_BOMB', 'BOMB', 'LIGHTNING', 'ICE', 'SWAMP'];
        const spacing = 34;
        const strip = this.add.container(gauge.x, gauge.y - spacing * 3).setDepth(12);
        for (let cycle = 0; cycle < 5; cycle++) {
            bonusTypes.forEach((bonusType, index) => {
                strip.add(this.createChaosToken(bonusType, 0, (cycle * bonusTypes.length + index) * spacing));
            });
        }

        const mask = this.add.graphics().setVisible(false);
        strip.setMask(mask.createGeometryMask());
        gauge.rouletteContainer = strip;
        gauge.rouletteMask = mask;
        this.refreshChaosMask();

        const targetIndex = bonusTypes.length * 3 + bonusTypes.indexOf(selectedBonus);

        this.tweens.addCounter({
            from: 1,
            to: 1.35,
            duration: 180,
            ease: 'Back.easeOut',
            onUpdate: (tween) => {
                gauge.scale = tween.getValue();
                this.refreshChaosMask();
                this.renderChaosGauge(100);
            },
            onComplete: () => {
                gauge.scale = 1.35;
                this.refreshChaosMask();
                this.renderChaosGauge(100);

                this.tweens.add({
                    targets: strip,
                    y: gauge.y - targetIndex * spacing,
                    duration: 1000,
                    ease: 'Cubic.easeOut',
                    onUpdate: () => this.refreshChaosMask(),
                    onComplete: () => {
                        strip.destroy(true);
                        mask.destroy();
                        gauge.rouletteContainer = null;
                        gauge.rouletteMask = null;
                        this.activeChaosBonus = selectedBonus;
                        this.renderChaosGauge(100);
                        this.pulseChaosBonus(() => {
                            this.tweens.addCounter({
                                from: gauge.scale,
                                to: 1,
                                duration: 180,
                                ease: 'Sine.easeInOut',
                                onUpdate: (tween) => {
                                    gauge.scale = tween.getValue();
                                    this.renderChaosGauge(100);
                                },
                                onComplete: () => {
                                    gauge.scale = 1;
                                    this.renderChaosGauge(100);
                                    if (onComplete) {
                                        onComplete();
                                    }
                                }
                            });
                        });
                    }
                });
            }
        });
    }

    refreshChaosMask() {
        const gauge = this.chaosGauge;
        if (!gauge.rouletteMask) {
            return;
        }

        const radius = gauge.radius * gauge.scale;
        gauge.rouletteMask.clear();
        gauge.rouletteMask.fillStyle(0xffffff, 1);
        gauge.rouletteMask.fillCircle(gauge.x, gauge.y, Math.max(4, radius - 4));
    }

    pulseChaosBonus(onComplete = null) {
        const gauge = this.chaosGauge;
        const pulseTarget = this.activeChaosBonus === 'LIGHTNING' ? gauge.iconText : gauge.iconImage;
        if (!pulseTarget) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        pulseTarget.setScale(1.25);
        this.tweens.add({
            targets: pulseTarget,
            scaleX: 1.62,
            scaleY: 1.62,
            duration: 180,
            yoyo: true,
            repeat: 2,
            ease: 'Back.easeOut',
            onComplete: () => {
                pulseTarget.setScale(1);
                if (onComplete) {
                    onComplete();
                }
            }
        });
    }

    createChaosToken(bonusType, x, y) {
        const container = this.add.container(x, y);
        const imageKey = this.getChaosBonusImageKey(bonusType);
        if (imageKey) {
            container.add(
                this.add.image(0, 0, imageKey)
                    .setOrigin(0.5)
                    .setDisplaySize(34, 34)
            );
        }
        if (bonusType === 'LIGHTNING') {
            container.add(this.add.text(0, 0, '⚡️', {
                fontSize: '28px',
                fill: '#111111',
                fontFamily: 'Vollkorn'
            }).setOrigin(0.5));
        }
        return container;
    }

    getBottomBackgroundPotionAnchorY() {
        if (!this.roofSprite?.active) {
            return this.GAUGE_Y + this.GAUGE_HEIGHT + 48;
        }

        const roofHeight = this.roofSprite.displayHeight || 0;
        const roofTopY = this.roofSprite.y - roofHeight;

        if (this.isNarrowViewport) {
            return roofTopY +
                this.BOTTOM_DECOR_POTION_MOBILE_TOP_OFFSET_Y +
                Math.round((this.PROGRESS_POTION_SOURCE_HEIGHT * this.PROGRESS_POTION_SCALE) / 2);
        }

        const roofScale = roofHeight / this.BOTTOM_DECOR_ROOF_SOURCE_HEIGHT;
        return roofTopY + Math.round(this.BOTTOM_DECOR_POTION_ANCHOR_SOURCE_Y * roofScale);
    }

    getBottomBackgroundWidth() {
        return this.viewportWidth + 10;
    }

    getChaosBonusImageKey(bonusType) {
        const imageMap = {
            PLACE_BOMB: 'tutorial-bonus-place-bomb',
            BOMB: 'tutorial-bonus-bomb',
            ICE: 'tutorial-bonus-ice',
            SWAMP: 'tutorial-bonus-swamp'
        };
        return imageMap[bonusType] || null;
    }

    showPotions() {
        this.potionSprites.forEach(({ sprite, shadow }) => {
            sprite.setVisible(true);
            shadow.setVisible(false);
        });
    }

    setPotionStates(activeStates) {
        this.orangePotionActive = Boolean(activeStates?.[0]);
        this.potionSprites.forEach(({ sprite, shadow }, index) => {
            const isActive = Boolean(activeStates[index]);
            sprite.setAlpha(isActive ? 1 : 0.28);
            sprite.clearTint();
            shadow.setVisible(isActive);
            if (!isActive) {
                sprite.setTint(0x777777);
            }
        });
    }

    pulsePotion(index) {
        this.clearPotionPulse();
        const entry = this.potionSprites[index];
        if (!entry) {
            return;
        }

        entry.pulseTween = this.tweens.add({
            targets: entry.sprite,
            scaleX: entry.baseScale * 1.12,
            scaleY: entry.baseScale * 1.12,
            duration: 260,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    clearPotionPulse() {
        this.potionSprites?.forEach((entry) => {
            if (entry.pulseTween) {
                entry.pulseTween.stop();
                entry.pulseTween = null;
            }
            entry.sprite.setScale(entry.baseScale);
        });
    }

    handlePotionClick(index) {
        if (this.isBusy || this.modalOpen) {
            return;
        }
        if (this.currentStep !== 'orange_potion_select' || index !== 0 || !this.orangePotionActive) {
            return;
        }

        this.enterStep('orange_potion_target');
    }

    handleCellPointerOver(row, col) {
        if (this.isBusy || this.modalOpen || !this.isCurrentTarget(row, col)) {
            return;
        }

        const entry = this.getCellEntry(row, col);
        if (!entry) {
            return;
        }

        this.tweens.killTweensOf(entry.sprite);
        entry.sprite.setScale(entry.baseScale);
        this.tweens.add({
            targets: entry.sprite,
            scaleX: entry.baseScale * 1.12,
            scaleY: entry.baseScale * 1.12,
            duration: 120,
            ease: 'Sine.easeOut'
        });
    }

    handleCellPointerOut(row, col) {
        const entry = this.getCellEntry(row, col);
        if (!entry) {
            return;
        }
        if (this.pendingPressedCellKey === `${row},${col}`) {
            return;
        }
        this.tweens.killTweensOf(entry.sprite);
        this.refreshHighlights();
    }

    handleCellClick(row, col) {
        if (this.isBusy || this.modalOpen || !this.isCurrentTarget(row, col)) {
            return;
        }

        this.currentTarget = null;
        this.currentTargetSet = null;
        this.refreshHighlights();

        this.playTargetPressAnimation(row, col, () => {
            if (this.currentStep === 'orange_potion_target' && this.orangePotionArmed) {
                this.consumeOrangePotion(row, col);
                return;
            }

            this.captureTarget(row, col, () => {
                if (this.currentStep === 'capture_corner') {
                    this.showModal(
                        TranslationManager.t('tutorial.modal_objective'),
                        TranslationManager.t('tutorial.button_objective'),
                        () => {
                            this.enterStep('capture_gauge');
                        }
                    );
                    return;
                }

                if (this.currentStep === 'capture_gauge') {
                    this.animateObjectiveGaugeTo(50, () => {
                        this.showModal(
                            TranslationManager.t('tutorial.modal_chaos_intro'),
                            TranslationManager.t('tutorial.button_chaos_intro'),
                            () => {
                                this.showChaosGauge();
                                this.showModal(
                                    TranslationManager.t('tutorial.modal_chaos_try'),
                                    TranslationManager.t('tutorial.button_chaos_try'),
                                    () => {
                                        this.enterStep('capture_chaos');
                                    }
                                );
                            }
                        );
                    });
                    return;
                }

                if (this.currentStep === 'capture_chaos') {
                    this.animateChaosGaugeTo(100, () => {
                        this.startChaosRoulette('PLACE_BOMB', () => {
                            this.showModal(
                                TranslationManager.t('tutorial.modal_bonus_ready'),
                                TranslationManager.t('tutorial.button_bonus_ready'),
                                () => {
                                    this.showPotions();
                                    this.setPotionStates([true, true, false]);
                                    this.showModal(
                                        TranslationManager.t('tutorial.modal_potions'),
                                        TranslationManager.t('tutorial.button_potions'),
                                        () => {
                                            this.enterStep('orange_potion_select');
                                        }
                                    );
                                }
                            );
                        });
                    });
                }
            });
        });
    }

    playTargetPressAnimation(row, col, onComplete = null) {
        const entry = this.getCellEntry(row, col);
        if (!entry) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        this.pendingPressedCellKey = `${row},${col}`;
        this.tweens.killTweensOf(entry.sprite);
        entry.sprite.setScale(entry.baseScale);
        this.tweens.add({
            targets: entry.sprite,
            scaleX: entry.baseScale * 0.92,
            scaleY: entry.baseScale * 0.92,
            duration: 90,
            ease: 'Quad.Out',
            yoyo: true,
            onComplete: () => {
                this.pendingPressedCellKey = null;
                entry.sprite.setScale(entry.baseScale);
                if (onComplete) {
                    onComplete();
                }
            }
        });

        this.time.delayedCall(220, () => {
            if (this.pendingPressedCellKey === `${row},${col}`) {
                this.pendingPressedCellKey = null;
                entry.sprite.setScale(entry.baseScale);
                if (onComplete) {
                    onComplete();
                }
            }
        });
    }

    captureTarget(row, col, onComplete = null) {
        const capturedCells = this.getCapturedCells(row, col);
        if (!capturedCells.length) {
            return;
        }

        this.isBusy = true;
        let remaining = capturedCells.length;
        capturedCells.forEach(({ row: targetRow, col: targetCol, fromColor }) => {
            const entry = this.getCellEntry(targetRow, targetCol);
            if (!entry) {
                remaining -= 1;
                return;
            }

            this.playCaptureAnimation(entry.sprite, fromColor, 'ROUGE', () => {
                this.grid[targetRow][targetCol].color = 'ROUGE';
                entry.sprite.setTexture(this.getIdleTextureKey('ROUGE'));
                entry.sprite.setFrame(0);
                entry.sprite.setScale(entry.baseScale);
                remaining -= 1;
                if (remaining === 0) {
                    this.isBusy = false;
                    this.refreshHighlights();
                    if (onComplete) {
                        onComplete();
                    }
                }
            });
        });
    }

    consumeOrangePotion(centerRow, centerCol) {
        const capturedCells = this.getOrangePotionCapturedCells(centerRow, centerCol);
        if (!capturedCells.length) {
            return;
        }

        this.isBusy = true;
        this.orangePotionArmed = false;
        this.orangePotionActive = false;
        this.clearPotionPulse();
        this.setPotionStates([false, true, false]);

        let remaining = capturedCells.length;
        capturedCells.forEach(({ row, col, fromColor }) => {
            const entry = this.getCellEntry(row, col);
            if (!entry) {
                remaining -= 1;
                return;
            }

            this.playCaptureAnimation(entry.sprite, fromColor, 'ROUGE', () => {
                this.grid[row][col].color = 'ROUGE';
                entry.sprite.setTexture(this.getIdleTextureKey('ROUGE'));
                entry.sprite.setFrame(0);
                entry.sprite.setScale(entry.baseScale);
                remaining -= 1;

                if (remaining === 0) {
                    this.isBusy = false;
                    this.refreshHighlights();
                    this.animateObjectiveGaugeTo(100, () => {
                        this.showModal(
                            TranslationManager.t('tutorial.modal_victory'),
                            TranslationManager.t('tutorial.button_victory'),
                            () => {
                                this.scene.start(this.returnSceneKey, this.returnSceneData);
                            }
                        );
                    });
                }
            });
        });
    }

    getCapturedCells(row, col) {
        const capturedCells = [];
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                const nextRow = row + rowOffset;
                const nextCol = col + colOffset;
                const cell = this.grid[nextRow]?.[nextCol];
                if (!cell || cell.color === 'ROUGE') {
                    continue;
                }

                capturedCells.push({
                    row: nextRow,
                    col: nextCol,
                    fromColor: cell.color
                });
            }
        }
        return capturedCells;
    }

    getOrangePotionCapturedCells(centerRow, centerCol) {
        const capturedCells = [];
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                const row = centerRow + rowOffset;
                const col = centerCol + colOffset;
                const cell = this.grid[row]?.[col];
                if (!cell || cell.color === 'ROUGE') {
                    continue;
                }
                capturedCells.push({
                    row,
                    col,
                    fromColor: cell.color
                });
            }
        }
        return capturedCells;
    }

    playCaptureAnimation(sprite, fromColor, toColor, onComplete) {
        const offAnimationKey = this.getAnimationKey(fromColor, 'off');
        const onAnimationKey = this.getAnimationKey(toColor, 'on');
        const offTextureKey = this.getTextureKey(fromColor, 'off');
        const onTextureKey = this.getTextureKey(toColor, 'on');

        if (this.cache.audio?.exists('tile-clap')) {
            this.sound.play('tile-clap', { volume: 0.28 });
        }

        sprite.setTexture(offTextureKey);
        sprite.setFrame(0);
        sprite.once(`animationcomplete-${offAnimationKey}`, () => {
            sprite.setTexture(onTextureKey);
            sprite.setFrame(0);
            sprite.play(onAnimationKey);
        });
        sprite.once(`animationcomplete-${onAnimationKey}`, () => {
            if (onComplete) {
                onComplete();
            }
        });
        sprite.play(offAnimationKey);
    }

    refreshHighlights() {
        this.cellSprites.forEach((entry) => {
            if (this.grid[entry.row]?.[entry.col]?.introHidden) {
                entry.sprite.setVisible(false);
                entry.highlight.setVisible(false);
                if (entry.pulseTween) {
                    entry.pulseTween.stop();
                    entry.pulseTween = null;
                }
                return;
            }

            entry.sprite.setVisible(true);
            entry.highlight.setVisible(true);
            const isTarget = this.isCurrentTarget(entry.row, entry.col);
            entry.highlight.setStrokeStyle(0, 0xfff3bf, 0);

            if (entry.pulseTween) {
                entry.pulseTween.stop();
                entry.pulseTween = null;
            }

            entry.sprite.setScale(entry.baseScale);
            if (isTarget) {
                entry.pulseTween = this.tweens.add({
                    targets: entry.sprite,
                    scaleX: entry.baseScale * 1.08,
                    scaleY: entry.baseScale * 1.08,
                    duration: 260,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }

    animateBoardReveal(onComplete = null) {
        const entries = this.getRandomNeutralRevealEntries();
        const neutralWaveDelayMs = 24;

        entries.forEach((entry, index) => {
            this.time.delayedCall(index * neutralWaveDelayMs, () => {
                const cell = this.grid[entry.row][entry.col];
                const spriteEntry = this.getCellEntry(entry.row, entry.col);
                if (!cell || !spriteEntry) {
                    return;
                }

                cell.introHidden = false;
                spriteEntry.sprite.setVisible(true);
                this.playIntroOnAnimation(spriteEntry.sprite, 'GRIS');
            });
        });

        const finalDelay = entries.length * neutralWaveDelayMs + 420;
        this.time.delayedCall(finalDelay, () => {
            this.grid.forEach((row) => row.forEach((cell) => {
                cell.introHidden = false;
            }));
            this.refreshHighlights();
            if (onComplete) {
                onComplete();
            }
        });
    }

    playIntroOnAnimation(sprite, color) {
        const onAnimationKey = this.getAnimationKey(color, 'on');
        const onTextureKey = this.getTextureKey(color, 'on');
        const spriteEntry = this.cellSprites.find((entry) => entry.sprite === sprite) || null;
        sprite.setTexture(onTextureKey);
        sprite.setFrame(0);
        if (spriteEntry) {
            sprite.setScale(spriteEntry.baseScale);
        }
        sprite.once(`animationcomplete-${onAnimationKey}`, () => {
            sprite.setTexture(this.getIdleTextureKey(color));
            sprite.setFrame(0);
            if (spriteEntry) {
                sprite.setScale(spriteEntry.baseScale);
            }
        });
        sprite.play(onAnimationKey);
    }

    getRandomNeutralRevealEntries() {
        const entries = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                entries.push({ row, col });
            }
        }

        const variants = [
            this.getCornerWaveEntries.bind(this),
            this.getCenterSpiralEntries.bind(this),
            this.getFourCornersEntries.bind(this)
        ];

        return Phaser.Utils.Array.GetRandom(variants)(entries);
    }

    getCornerWaveEntries(entries) {
        return [...entries].sort((left, right) => {
            const leftScore = left.row + left.col;
            const rightScore = right.row + right.col;
            if (leftScore !== rightScore) return leftScore - rightScore;
            return left.row - right.row || left.col - right.col;
        });
    }

    getCenterSpiralEntries(entries) {
        const center = (this.gridSize - 1) / 2;
        return [...entries].sort((left, right) => {
            const leftRadius = Math.max(Math.abs(left.row - center), Math.abs(left.col - center));
            const rightRadius = Math.max(Math.abs(right.row - center), Math.abs(right.col - center));
            if (leftRadius !== rightRadius) return leftRadius - rightRadius;
            const leftAngle = this.getClockwiseAngleFromTop(left.row - center, left.col - center);
            const rightAngle = this.getClockwiseAngleFromTop(right.row - center, right.col - center);
            if (leftAngle !== rightAngle) return leftAngle - rightAngle;
            return left.row - right.row || left.col - right.col;
        });
    }

    getFourCornersEntries(entries) {
        const lastIndex = this.gridSize - 1;
        return [...entries].sort((left, right) => {
            const leftDistance = Math.min(
                left.row + left.col,
                left.row + (lastIndex - left.col),
                (lastIndex - left.row) + left.col,
                (lastIndex - left.row) + (lastIndex - left.col)
            );
            const rightDistance = Math.min(
                right.row + right.col,
                right.row + (lastIndex - right.col),
                (lastIndex - right.row) + right.col,
                (lastIndex - right.row) + (lastIndex - right.col)
            );
            if (leftDistance !== rightDistance) return leftDistance - rightDistance;
            const leftScore = left.row + left.col;
            const rightScore = right.row + right.col;
            if (leftScore !== rightScore) return leftScore - rightScore;
            return left.row - right.row || left.col - right.col;
        });
    }

    getClockwiseAngleFromTop(rowOffset, colOffset) {
        const angle = Math.atan2(rowOffset, colOffset);
        const normalized = angle + Math.PI / 2;
        return (normalized + Math.PI * 2) % (Math.PI * 2);
    }

    isCurrentTarget(row, col) {
        if (this.currentTargetSet) {
            return this.currentTargetSet.has(`${row},${col}`);
        }
        return Boolean(this.currentTarget) &&
            row === this.currentTarget.row &&
            col === this.currentTarget.col;
    }

    getCellEntry(row, col) {
        return this.cellSprites.find((cell) => cell.row === row && cell.col === col) || null;
    }

    getIdleTextureKey(color) {
        return this.getTextureKey(color, 'idle');
    }

    getTextureKey(color, state) {
        const mapping = {
            ROUGE: {
                idle: 'tutorial-tile-red-idle',
                off: 'tutorial-tile-red-off',
                on: 'tutorial-tile-red-on'
            },
            GRIS: {
                idle: 'tutorial-tile-grey-idle',
                off: 'tutorial-tile-grey-off',
                on: 'tutorial-tile-grey-on'
            }
        };
        return mapping[color]?.[state] || mapping.GRIS.idle;
    }

    getAnimationKey(color, state) {
        const mapping = {
            ROUGE: {
                off: 'tutorial-tile-red-off-anim',
                on: 'tutorial-tile-red-on-anim'
            },
            GRIS: {
                off: 'tutorial-tile-grey-off-anim',
                on: 'tutorial-tile-grey-on-anim'
            }
        };
        return mapping[color]?.[state] || mapping.GRIS.on;
    }
}
