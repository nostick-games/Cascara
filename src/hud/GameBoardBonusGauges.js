class GameBoardBonusGauges {
    constructor(hud) {
        this.hud = hud;
        this.board = hud.board;
        this.scene = hud.scene;
    }

    createLightningGauges() {
        const isNarrowViewport = this.scene.scale.width < 500;
        const radius = isNarrowViewport ? 26 : 30;
        const hitAreaSize = radius * 2.5;
        const gaugeYOffset = isNarrowViewport ? 10 : 12;

        this.board.lightningGaugeGraphics = {};
        this.board.bonusIconTexts = {};
        this.board.bonusIconImages = {};
        this.board.bonusHitAreas = {};
        this.board.displayedLightningCharge = {};
        this.board.lightningGaugeTweens = {};
        this.board.bonusGaugeStates = {};

        this.scene.gameState.playerOrder.forEach((color) => {
            const slot = this.board.playerHudSlots[color];
            const gaugeX = slot.gaugeX;
            const y = slot.y + gaugeYOffset;
            const graphics = this.scene.add.graphics();
            const bonusIcon = this.scene.add.text(gaugeX, y, '', {
                fontSize: isNarrowViewport ? '21px' : '24px',
                fill: '#111111',
                fontFamily: 'Vollkorn',
                align: 'center',
                lineSpacing: -2
            }).setOrigin(0.5).setDepth(13);
            const bonusImage = this.scene.add.image(gaugeX, y, 'bonus-ice-icon')
                .setOrigin(0.5)
                .setDisplaySize(isNarrowViewport ? 26 : 30, isNarrowViewport ? 26 : 30)
                .setVisible(false)
                .setDepth(13);
            const hitArea = this.scene.add.zone(gaugeX, y, hitAreaSize, hitAreaSize)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .setDepth(14);

            hitArea.on('pointerdown', () => {
                this.scene.handleBonusClick(color);
            });

            this.board.lightningGaugeGraphics[color] = { graphics, x: gaugeX, y, radius };
            this.board.bonusIconTexts[color] = bonusIcon;
            this.board.bonusIconImages[color] = bonusImage;
            this.board.bonusHitAreas[color] = hitArea;
            this.board.displayedLightningCharge[color] = 0;
            this.board.lightningGaugeTweens[color] = null;
            this.board.bonusGaugeStates[color] = {
                baseRadius: radius,
                gaugeScale: 1,
                lastAvailableBonus: null,
                rouletteActive: false,
                rouletteTargetBonus: null,
                rouletteStrip: null,
                rouletteMaskGraphics: null,
                rouletteTweens: [],
                iconPulseTween: null
            };
        });
    }

    updateLightningGauges(playerOrder, lightningCharge, availableBonuses) {
        playerOrder.forEach((color) => {
            const gauge = this.board.lightningGaugeGraphics[color];
            if (!gauge) return;

            const availableBonus = availableBonuses?.[color] || null;
            const bonusText = this.board.bonusIconTexts[color];
            const bonusImage = this.board.bonusIconImages[color];
            const hitArea = this.board.bonusHitAreas[color];
            const hideGauge = this.shouldHideChaosGauge(color);
            const state = this.getBonusGaugeState(color);

            if (hideGauge) {
                this.clearBonusRoulette(color);
                gauge.graphics.clear();
                if (bonusText) {
                    bonusText.setVisible(false);
                    bonusText.setAlpha(0);
                }
                if (bonusImage) {
                    bonusImage.setVisible(false);
                    bonusImage.setAlpha(0);
                }
                if (hitArea) {
                    hitArea.setVisible(false);
                    hitArea.input.enabled = false;
                }
                state.lastAvailableBonus = null;
                return;
            }

            if (!availableBonus) {
                state.lastAvailableBonus = null;
                this.clearBonusRoulette(color);
            } else if (
                (!state.rouletteActive && state.lastAvailableBonus !== availableBonus) ||
                (state.rouletteActive && state.rouletteTargetBonus !== availableBonus)
            ) {
                state.lastAvailableBonus = availableBonus;
                this.startBonusRoulette(color, availableBonus);
            }

            if (!state.rouletteActive) {
                this.syncBonusDisplay(color, availableBonus);
            } else {
                if (bonusText) {
                    bonusText.setVisible(false);
                    bonusText.setAlpha(0);
                }
                if (bonusImage) {
                    bonusImage.setVisible(false);
                    bonusImage.setAlpha(0);
                }
                this.refreshRouletteMask(color);
            }

            if (hitArea) {
                hitArea.setVisible(Boolean(availableBonus) && !state.rouletteActive);
                hitArea.input.enabled = color === 'ROUGE' &&
                    this.scene.gameState.currentPlayer === 'ROUGE' &&
                    !this.scene.gameState.gameOver &&
                    !this.scene.gameState.cascadeActive &&
                    !state.rouletteActive &&
                    Boolean(availableBonus);
            }

            const targetCharge = Math.max(0, Math.min(100, lightningCharge[color] || 0));
            this.animateLightningGauge(color, targetCharge);
        });
    }

    shouldHideChaosGauge(color) {
        if (this.scene.isStrategoMode) {
            return true;
        }

        const activeBossBlessingId = this.scene.storyContext?.storyState?.activeBossBlessingId || null;
        return color !== 'ROUGE' && activeBossBlessingId === 'DISABLE_BOSS_CHAOS';
    }

    animateLightningGauge(color, targetCharge, onComplete = null) {
        const currentCharge = this.board.displayedLightningCharge[color] || 0;

        if (Math.abs(currentCharge - targetCharge) < 0.01) {
            this.renderLightningGauge(color, targetCharge);
            if (onComplete) onComplete();
            return;
        }

        if (this.board.lightningGaugeTweens[color]) {
            this.board.lightningGaugeTweens[color].stop();
            this.board.lightningGaugeTweens[color] = null;
        }

        const tweenState = { value: currentCharge };

        if (targetCharge < currentCharge) {
            this.board.lightningGaugeTweens[color] = this.scene.tweens.add({
                targets: tweenState,
                value: 100,
                duration: 260,
                ease: 'Cubic.easeOut',
                onUpdate: () => {
                    this.renderLightningGauge(color, tweenState.value);
                },
                onComplete: () => {
                    this.board.displayedLightningCharge[color] = 0;
                    this.renderLightningGauge(color, 0);

                    const resetState = { value: 0 };
                    this.board.lightningGaugeTweens[color] = this.scene.tweens.add({
                        targets: resetState,
                        value: targetCharge,
                        duration: Math.max(180, targetCharge * 6),
                        ease: 'Sine.easeOut',
                        onUpdate: () => {
                            this.renderLightningGauge(color, resetState.value);
                        },
                        onComplete: () => {
                            this.board.displayedLightningCharge[color] = targetCharge;
                            this.board.lightningGaugeTweens[color] = null;
                            if (onComplete) onComplete();
                        }
                    });
                }
            });
            return;
        }

        this.board.lightningGaugeTweens[color] = this.scene.tweens.add({
            targets: tweenState,
            value: targetCharge,
            duration: Math.max(180, Math.abs(targetCharge - currentCharge) * 7),
            ease: 'Sine.easeOut',
            onUpdate: () => {
                this.renderLightningGauge(color, tweenState.value);
            },
            onComplete: () => {
                this.board.displayedLightningCharge[color] = targetCharge;
                this.board.lightningGaugeTweens[color] = null;
                if (onComplete) onComplete();
            }
        });
    }

    renderLightningGauge(color, chargeValue) {
        const gauge = this.board.lightningGaugeGraphics[color];
        if (!gauge) return;

        const progress = Math.max(0, Math.min(1, chargeValue / 100));
        const state = this.getBonusGaugeState(color);
        const { graphics, x, y, radius } = gauge;
        const hasAvailableBonus = Boolean(this.scene.gameState.availableBonuses?.[color]);
        const gaugeColor = this.board.BONUS_GAUGE_COLORS?.[color] || this.board.COLORS[color];
        const gaugeScale = state?.gaugeScale || 1;
        const scaledRadius = radius * gaugeScale;
        const outerStrokeWidth = 5;
        const fillRadius = Math.max(4, scaledRadius - outerStrokeWidth / 2);
        const progressRadius = fillRadius;

        this.board.displayedLightningCharge[color] = chargeValue;

        graphics.clear();
        if (hasAvailableBonus) {
            graphics.lineStyle(outerStrokeWidth, gaugeColor, 1);
            graphics.strokeCircle(x, y, scaledRadius);
            graphics.fillStyle(gaugeColor, 1);
            graphics.fillCircle(x, y, fillRadius);
            return;
        }

        graphics.lineStyle(outerStrokeWidth, gaugeColor, 1);
        graphics.strokeCircle(x, y, scaledRadius);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(x, y, fillRadius);

        if (progress > 0) {
            graphics.fillStyle(gaugeColor, 1);
            graphics.beginPath();
            graphics.moveTo(x, y);
            graphics.arc(x, y, progressRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
            graphics.closePath();
            graphics.fillPath();
        }

    }

    getBonusEmoji(bonusType) {
        const emojiMap = {
            PLACE_BOMB: '',
            BOMB: '',
            LIGHTNING: '⚡',
            ICE: '',
            SWAMP: ''
        };

        return emojiMap[bonusType] || '';
    }

    getBonusImageKey(bonusType) {
        const imageMap = {
            PLACE_BOMB: 'bonus-bomb-icon',
            BOMB: 'bonus-explosion-icon',
            ICE: 'bonus-ice-icon',
            SWAMP: 'bonus-swamp-icon'
        };

        return imageMap[bonusType] || null;
    }

    getBonusGaugeState(color) {
        if (!this.board.bonusGaugeStates) {
            this.board.bonusGaugeStates = {};
        }

        if (!this.board.bonusGaugeStates[color]) {
            const radius = this.board.lightningGaugeGraphics?.[color]?.radius || 20;
            this.board.bonusGaugeStates[color] = {
                baseRadius: radius,
                gaugeScale: 1,
                lastAvailableBonus: null,
                rouletteActive: false,
                rouletteTargetBonus: null,
                rouletteStrip: null,
                rouletteMaskGraphics: null,
                rouletteTweens: [],
                iconPulseTween: null
            };
        }

        return this.board.bonusGaugeStates[color];
    }

    syncBonusDisplay(color, availableBonus) {
        const bonusText = this.board.bonusIconTexts[color];
        const bonusImage = this.board.bonusIconImages[color];
        const state = this.getBonusGaugeState(color);
        const imageKey = this.getBonusImageKey(availableBonus);
        const imageSize = this.getBonusIconSize(availableBonus);

        if (bonusText) {
            bonusText.setText(this.getBonusEmoji(availableBonus));
            const shouldShowText = Boolean(availableBonus) && (!imageKey || availableBonus === 'LIGHTNING');
            bonusText.setVisible(shouldShowText);
            bonusText.setAlpha(shouldShowText ? 1 : 0);
            if (!state.iconPulseTween) {
                bonusText.setScale(state.gaugeScale || 1);
            }
        }

        if (bonusImage) {
            bonusImage.setVisible(Boolean(imageKey));
            if (imageKey) {
                bonusImage.setTexture(imageKey);
                bonusImage.setAlpha(availableBonus === 'LIGHTNING' ? 0.92 : 1);
                bonusImage.setDisplaySize(imageSize, imageSize);
                if (!state.iconPulseTween) {
                    bonusImage.setScale(state.gaugeScale || 1);
                }
                bonusImage.clearTint();
            } else {
                bonusImage.setAlpha(0);
            }
        }
    }

    getBonusIconSize(bonusType) {
        const isNarrowViewport = this.scene.scale.width < 500;
        if (bonusType === 'PLACE_BOMB') {
            return isNarrowViewport ? 32 : 36;
        }
        return isNarrowViewport ? 30 : 34;
    }

    createBonusToken(color, bonusType, x, y) {
        const imageKey = this.getBonusImageKey(bonusType);
        const token = this.scene.add.container(x, y);

        if (imageKey) {
            const size = this.getBonusIconSize(bonusType);
            const image = this.scene.add.image(0, 0, imageKey)
                .setOrigin(0.5)
                .setDisplaySize(size, size);
            token.add(image);
        } else {
            const label = this.scene.add.text(0, 0, this.getBonusEmoji(bonusType), {
                fontSize: this.scene.scale.width < 500 ? '28px' : '31px',
                fill: '#111111',
                fontFamily: 'Vollkorn',
                align: 'center',
                lineSpacing: -2
            }).setOrigin(0.5);
            token.add(label);
        }

        return token;
    }

    stopGaugeScaleTweens(color) {
        const state = this.getBonusGaugeState(color);
        (state.rouletteTweens || []).forEach((tween) => tween?.stop());
        state.rouletteTweens = [];
    }

    clearBonusRoulette(color) {
        const state = this.getBonusGaugeState(color);
        const wasActive = state.rouletteActive;
        this.stopGaugeScaleTweens(color);
        if (state.iconPulseTween) {
            state.iconPulseTween.stop();
            state.iconPulseTween = null;
        }
        if (state.rouletteStrip) {
            state.rouletteStrip.destroy(true);
            state.rouletteStrip = null;
        }
        if (state.rouletteMaskGraphics) {
            state.rouletteMaskGraphics.destroy();
            state.rouletteMaskGraphics = null;
        }
        state.rouletteActive = false;
        state.rouletteTargetBonus = null;
        state.gaugeScale = 1;
        if (wasActive && !this.hasActiveChaosRoulette()) {
            this.scene.gameState.specialActionInProgress = false;
        }
        this.syncBonusDisplay(color, this.scene.gameState.availableBonuses?.[color] || null);
        this.renderLightningGauge(color, this.board.displayedLightningCharge[color] || 0);
    }

    startBonusRoulette(color, selectedBonus) {
        const state = this.getBonusGaugeState(color);
        const gauge = this.board.lightningGaugeGraphics[color];
        if (!gauge || !selectedBonus) {
            return;
        }

        this.clearBonusRoulette(color);

        state.rouletteActive = true;
        state.rouletteTargetBonus = selectedBonus;
        this.scene.gameState.specialActionInProgress = true;

        const { x, y, radius } = gauge;
        const bonusTypes = ['PLACE_BOMB', 'BOMB', 'LIGHTNING', 'ICE', 'SWAMP'];
        const stripSpacing = Math.max(26, Math.round(radius * 1.4));
        const cycles = 6;
        const repeatedTypes = [];
        for (let cycle = 0; cycle < cycles; cycle++) {
            repeatedTypes.push(...bonusTypes);
        }

        const startIndex = bonusTypes.length + Phaser.Math.Between(0, bonusTypes.length - 1);
        const targetIndex = bonusTypes.length * 4 + bonusTypes.indexOf(selectedBonus);
        const strip = this.scene.add.container(x, y - startIndex * stripSpacing).setDepth(13);

        repeatedTypes.forEach((bonusType, index) => {
            strip.add(this.createBonusToken(color, bonusType, 0, index * stripSpacing));
        });

        const maskGraphics = this.scene.add.graphics().setVisible(false);
        strip.setMask(maskGraphics.createGeometryMask());

        state.rouletteStrip = strip;
        state.rouletteMaskGraphics = maskGraphics;
        this.refreshRouletteMask(color);

        const bonusText = this.board.bonusIconTexts[color];
        const bonusImage = this.board.bonusIconImages[color];
        if (bonusText) {
            bonusText.setVisible(false);
            bonusText.setAlpha(0);
        }
        if (bonusImage) {
            bonusImage.setVisible(false);
            bonusImage.setAlpha(0);
        }

        const zoomTween = this.scene.tweens.addCounter({
            from: 1,
            to: 1.38,
            duration: 170,
            ease: 'Back.easeOut',
            onUpdate: (tween) => {
                state.gaugeScale = tween.getValue();
                this.refreshRouletteMask(color);
                this.renderLightningGauge(color, this.board.displayedLightningCharge[color] || 0);
            },
            onComplete: () => {
                state.gaugeScale = 1.38;
                this.renderLightningGauge(color, this.board.displayedLightningCharge[color] || 0);

                const reelTween = this.scene.tweens.add({
                    targets: strip,
                    y: y - targetIndex * stripSpacing,
                    duration: 1160,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        if (state.rouletteStrip) {
                            state.rouletteStrip.destroy(true);
                            state.rouletteStrip = null;
                        }
                        if (state.rouletteMaskGraphics) {
                            state.rouletteMaskGraphics.destroy();
                            state.rouletteMaskGraphics = null;
                        }

                        state.rouletteActive = false;
                        this.syncBonusDisplay(color, selectedBonus);
                        this.pulseSelectedBonus(color, selectedBonus);

                        const settleTween = this.scene.tweens.addCounter({
                            from: state.gaugeScale,
                            to: 1,
                            duration: 180,
                            ease: 'Sine.easeInOut',
                            onUpdate: (tween) => {
                                state.gaugeScale = tween.getValue();
                                this.refreshRouletteMask(color);
                                this.syncBonusDisplay(color, selectedBonus);
                                this.renderLightningGauge(color, this.board.displayedLightningCharge[color] || 0);
                            },
                            onComplete: () => {
                                state.gaugeScale = 1;
                                this.syncBonusDisplay(color, selectedBonus);
                                this.renderLightningGauge(color, this.board.displayedLightningCharge[color] || 0);
                                this.scene.gameState.specialActionInProgress = false;
                            }
                        });
                        state.rouletteTweens.push(settleTween);
                    }
                });
                state.rouletteTweens.push(reelTween);
            }
        });

        state.rouletteTweens.push(zoomTween);
    }

    pulseSelectedBonus(color, selectedBonus) {
        const state = this.getBonusGaugeState(color);
        const imageKey = this.getBonusImageKey(selectedBonus);
        const target = imageKey ? this.board.bonusIconImages[color] : this.board.bonusIconTexts[color];
        if (!target) {
            return;
        }

        if (state.iconPulseTween) {
            state.iconPulseTween.stop();
            state.iconPulseTween = null;
        }

        target.setScale(1.25);
        state.iconPulseTween = this.scene.tweens.add({
            targets: target,
            scaleX: 1.62,
            scaleY: 1.62,
            duration: 180,
            yoyo: true,
            repeat: 2,
            ease: 'Back.easeOut',
            onComplete: () => {
                target.setScale(1);
                state.iconPulseTween = null;
            }
        });
    }

    refreshRouletteMask(color) {
        const state = this.getBonusGaugeState(color);
        const gauge = this.board.lightningGaugeGraphics[color];
        if (!state.rouletteMaskGraphics || !gauge) {
            return;
        }

        const scaledRadius = gauge.radius * (state.gaugeScale || 1);
        state.rouletteMaskGraphics.clear();
        state.rouletteMaskGraphics.fillStyle(0xffffff, 1);
        state.rouletteMaskGraphics.fillCircle(gauge.x, gauge.y, Math.max(4, scaledRadius - 4));
    }

    hasActiveChaosRoulette() {
        return Object.values(this.board.bonusGaugeStates || {}).some((state) => state?.rouletteActive);
    }
}
