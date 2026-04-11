class EndScreenMonochromeController {
    constructor(board, potionMode) {
        this.board = board;
        this.scene = board.scene;
        this.potionMode = potionMode;
        this.endScreenActive = false;
        this.endScreenOverlay = null;
    }

    showEndScreenMonochrome() {
        if (this.endScreenActive) {
            return;
        }

        this.potionMode.clear();
        this.endScreenActive = true;

        this.endScreenOverlay = this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            this.scene.scale.width,
            this.scene.scale.height,
            0x9f9f9f,
            0
        ).setDepth(30);

        this.applyEndScreenMonochrome(true, true);

        this.scene.tweens.add({
            targets: this.endScreenOverlay,
            alpha: 0.36,
            duration: this.potionMode.transitionDuration,
            ease: 'Sine.easeOut'
        });
    }

    applyEndScreenMonochrome(isActive, animate = false) {
        const grayscaleTint = this.potionMode.monochromeTint;
        const boardAlpha = 0.74;

        this.scene.cameras.main.setBackgroundColor(isActive ? '#7a7a7a' : '#B47C43');

        if (this.board.backgroundSprite) {
            if (isActive) {
                this.board.backgroundSprite.setTint(grayscaleTint);
                this.potionMode.tweenAlpha(this.board.backgroundSprite, 0.78, animate);
            } else {
                this.potionMode.restoreDisplayObject(this.board.backgroundSprite, animate, 1);
            }
        }

        const grid = this.scene.gameState?.grid || [];
        grid.forEach((row) => {
            row.forEach((pion) => {
                if (!pion?.graphics) return;
                this.potionMode.applyMonochromeToContainer(pion.graphics, isActive, animate, boardAlpha);
            });
        });

        Object.values(this.board.enemySprites).forEach((sprite) => {
            if (!sprite) return;
            if (isActive) {
                sprite.setTint(grayscaleTint);
                this.potionMode.tweenAlpha(sprite, 0.42, animate);
            } else {
                this.potionMode.restoreDisplayObject(
                    sprite,
                    animate,
                    this.scene.gameState.playerOrder.includes(this.potionMode.getEnemyColorForSprite(sprite)) ? 1 : 0.32
                );
            }
        });

        if (this.board.heroSprite) {
            if (isActive) {
                this.board.heroSprite.setTint(grayscaleTint);
                this.potionMode.tweenAlpha(this.board.heroSprite, 0.52, animate);
            } else {
                this.potionMode.restoreDisplayObject(this.board.heroSprite, animate, 1);
            }
        }

        Object.values(this.board.playerHudSlots || {}).forEach((slot) => {
            if (!slot) return;
            [slot.selector, slot.thoughtBubble, slot.thoughtEmoji].forEach((element) => {
                if (!element) return;
                if (isActive) {
                    element.setTint(grayscaleTint);
                    this.potionMode.tweenAlpha(element, 0.4, animate);
                } else {
                    this.potionMode.restoreDisplayObject(element, animate, element.visible === false ? 0 : 1);
                }
            });
        });

        Object.entries(this.board.lightningGaugeGraphics).forEach(([color, gauge]) => {
            if (!gauge?.graphics) return;

            this.potionMode.tweenAlpha(gauge.graphics, isActive ? 0.24 : 1, animate);

            const bonusText = this.board.bonusIconTexts[color];
            if (bonusText) {
                if (isActive) {
                    bonusText.setTint(grayscaleTint);
                    this.potionMode.tweenAlpha(bonusText, 0.28, animate);
                } else {
                    this.potionMode.restoreDisplayObject(bonusText, animate, 1);
                }
            }

            const bonusImage = this.board.bonusIconImages[color];
            if (bonusImage) {
                if (isActive) {
                    bonusImage.setTint(grayscaleTint);
                    this.potionMode.tweenAlpha(bonusImage, 0.28, animate);
                } else if (this.scene.gameState.availableBonuses?.[color] === 'PLACE_BOMB') {
                    const gaugeColor = this.board.BONUS_GAUGE_COLORS?.[color] || this.board.COLORS[color];
                    this.potionMode.restoreBonusBombImage(bonusImage, gaugeColor, animate);
                } else {
                    this.potionMode.restoreDisplayObject(bonusImage, animate, bonusImage.visible ? 1 : 0);
                }
            }
        });

        this.board.goalGaugeSegments.forEach((segment) => {
            if (isActive) {
                segment.setTint(grayscaleTint);
                this.potionMode.tweenAlpha(segment, 0.54, animate);
            } else {
                this.potionMode.restoreDisplayObject(segment, animate, 1);
            }
        });

        this.board.goalGaugeNotches.forEach((notch) => {
            if (isActive) {
                notch.setTint(grayscaleTint);
                this.potionMode.tweenAlpha(notch, 0.48, animate);
            } else {
                this.potionMode.restoreDisplayObject(notch, animate, 1);
            }
        });

        Object.entries(this.board.progressPotionSpriteMap).forEach(([, sprite]) => {
            if (!sprite) return;
            if (isActive) {
                sprite.setTint(grayscaleTint);
                this.potionMode.tweenAlpha(sprite, 0.34, animate);
            } else {
                this.potionMode.restoreDisplayObject(sprite, animate, 1);
            }
        });

        this.board.progressPotionCooldownTexts.forEach((text) => {
            if (isActive) {
                text.setTint(grayscaleTint);
                this.potionMode.tweenAlpha(text, 0.36, animate);
            } else {
                this.potionMode.restoreDisplayObject(text, animate, 1);
            }
        });

        if (this.board.gaugeGraphics) {
            this.potionMode.tweenAlpha(this.board.gaugeGraphics, isActive ? 0.46 : 1, animate);
        }

        if (this.board.potionCheatPanel) {
            (this.board.potionCheatPanel.list || []).forEach((child) => {
                if (isActive) {
                    if (child.setTint) {
                        child.setTint(grayscaleTint);
                    }
                    this.potionMode.tweenAlpha(child, 0.3, animate);
                } else {
                    this.potionMode.restoreDisplayObject(child, animate, 1);
                }
            });
        }
    }
}
