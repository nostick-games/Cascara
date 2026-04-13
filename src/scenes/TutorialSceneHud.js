const TutorialSceneHudMixin = {
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
    },

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
    },

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
    },

    createObjectiveGauge() {
        this.objectiveGauge = {
            graphics: this.add.graphics().setDepth(10),
            segments: [],
            visible: false
        };
    },

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
    },

    renderPotions() {
        this.potionSprites.forEach(({ sprite, shadow, baseScale }) => {
            sprite.setVisible(false);
            shadow.setVisible(false);
            sprite.setAlpha(0.28);
            sprite.clearTint();
            sprite.setScale(baseScale);
        });
    },

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
    },

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
    },

    showObjectiveGauge(initialPercent = 0) {
        this.objectiveGauge.visible = true;
        this.objectiveProgress = initialPercent;
        this.displayedObjectiveProgress = initialPercent;
        this.renderObjectiveGauge(initialPercent);
    },

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
    },

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
    },

    showChaosGauge() {
        this.chaosGauge.graphics.setVisible(true);
        this.renderChaosGauge(this.displayedChaosCharge || 0);
    },

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
    },

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
    },

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
    },

    refreshChaosMask() {
        const gauge = this.chaosGauge;
        if (!gauge.rouletteMask) {
            return;
        }

        const radius = gauge.radius * gauge.scale;
        gauge.rouletteMask.clear();
        gauge.rouletteMask.fillStyle(0xffffff, 1);
        gauge.rouletteMask.fillCircle(gauge.x, gauge.y, Math.max(4, radius - 4));
    },

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
    },

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
    },

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
    },

    getBottomBackgroundWidth() {
        return this.viewportWidth + 10;
    },

    getChaosBonusImageKey(bonusType) {
        const imageMap = {
            PLACE_BOMB: 'tutorial-bonus-place-bomb',
            BOMB: 'tutorial-bonus-bomb',
            ICE: 'tutorial-bonus-ice',
            SWAMP: 'tutorial-bonus-swamp'
        };
        return imageMap[bonusType] || null;
    },

    showPotions() {
        this.potionSprites.forEach(({ sprite, shadow }) => {
            sprite.setVisible(true);
            shadow.setVisible(false);
        });
    },

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
    },

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
    },

    clearPotionPulse() {
        this.potionSprites?.forEach((entry) => {
            if (entry.pulseTween) {
                entry.pulseTween.stop();
                entry.pulseTween = null;
            }
            entry.sprite.setScale(entry.baseScale);
        });
    }
};
