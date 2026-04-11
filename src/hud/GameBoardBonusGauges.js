class GameBoardBonusGauges {
    constructor(hud) {
        this.hud = hud;
        this.board = hud.board;
        this.scene = hud.scene;
    }

    createLightningGauges() {
        const radius = Math.max(18, Math.min(24, Math.round(this.board.CELL_SIZE * 0.42)));
        const isNarrowViewport = this.scene.scale.width < 500;

        this.board.lightningGaugeGraphics = {};
        this.board.bonusIconTexts = {};
        this.board.bonusIconImages = {};
        this.board.bonusHitAreas = {};
        this.board.displayedLightningCharge = {};
        this.board.lightningGaugeTweens = {};

        this.scene.gameState.playerOrder.forEach((color) => {
            const slot = this.board.playerHudSlots[color];
            const gaugeX = slot.gaugeX;
            const y = slot.y;
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
                .setDisplaySize(isNarrowViewport ? 22 : 26, isNarrowViewport ? 22 : 26)
                .setVisible(false)
                .setDepth(13);
            const hitArea = this.scene.add.zone(gaugeX, y, radius * 2.2, radius * 2.2)
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

            if (hideGauge) {
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
                return;
            }

            if (bonusText) {
                bonusText.setText(this.getBonusEmoji(availableBonus));
                bonusText.setVisible(Boolean(availableBonus) && !this.getBonusImageKey(availableBonus));
                bonusText.setAlpha(1);
            }

            if (bonusImage) {
                const imageKey = this.getBonusImageKey(availableBonus);
                bonusImage.setVisible(Boolean(imageKey));
                if (imageKey) {
                    bonusImage.setTexture(imageKey);
                    bonusImage.setAlpha(1);
                    const imageSize = availableBonus === 'PLACE_BOMB'
                        ? (this.scene.scale.width < 500 ? 24 : 28)
                        : (this.scene.scale.width < 500 ? 22 : 26);
                    bonusImage.setDisplaySize(imageSize, imageSize);
                    if (availableBonus === 'PLACE_BOMB') {
                        const gaugeColor = this.board.BONUS_GAUGE_COLORS?.[color] || this.board.COLORS[color];
                        bonusImage.setTint(gaugeColor);
                    } else {
                        bonusImage.clearTint();
                    }
                } else {
                    bonusImage.setAlpha(0);
                }
            }

            if (hitArea) {
                hitArea.setVisible(Boolean(availableBonus));
                hitArea.input.enabled = color === 'ROUGE' &&
                    this.scene.gameState.currentPlayer === 'ROUGE' &&
                    !this.scene.gameState.gameOver &&
                    !this.scene.gameState.cascadeActive &&
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
        const { graphics, x, y, radius } = gauge;
        const hasAvailableBonus = Boolean(this.scene.gameState.availableBonuses?.[color]);
        const gaugeColor = this.board.BONUS_GAUGE_COLORS?.[color] || this.board.COLORS[color];

        this.board.displayedLightningCharge[color] = chargeValue;

        graphics.clear();
        if (hasAvailableBonus) {
            graphics.lineStyle(3, gaugeColor, 1);
            graphics.strokeCircle(x, y, radius);
            graphics.fillStyle(0xfff3bf, 1);
            graphics.fillCircle(x, y, radius - 3);
            graphics.lineStyle(2, 0x111111, 1);
            graphics.strokeCircle(x, y, radius - 1);
            return;
        }

        graphics.lineStyle(3, gaugeColor, 1);
        graphics.strokeCircle(x, y, radius);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(x, y, radius - 3);

        if (progress > 0) {
            graphics.fillStyle(gaugeColor, 1);
            graphics.beginPath();
            graphics.moveTo(x, y);
            graphics.arc(x, y, radius - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
            graphics.closePath();
            graphics.fillPath();
        }

        graphics.lineStyle(2, 0x111111, 1);
        graphics.strokeCircle(x, y, radius - 1);
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
}
