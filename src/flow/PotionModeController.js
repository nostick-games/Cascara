class PotionModeController {
    constructor(board) {
        this.board = board;
        this.scene = board.scene;
        this.transitionDuration = 260;
        this.monochromeTint = 0x8f8f8f;
        this.monochromeAlpha = 0.68;
        this.uiOverlayAlpha = 0.44;
    }

    update(gameState) {
        if (!gameState.pendingProgressPotion) {
            if (!this.board.activePotionModeId &&
                !this.board.modePotionOverlays.length &&
                !this.board.modePotionHudOverlays.length) {
                return;
            }
            this.clear();
            return;
        }

        if (
            this.board.activePotionModeId === gameState.pendingProgressPotion &&
            (this.board.modePotionOverlays.length || this.board.modePotionHudOverlays.length)
        ) {
            this.applyTint(true, false);
            return;
        }

        this.clear();

        const viewportWidth = this.scene.scale.width;
        const viewportHeight = this.scene.scale.height;
        const boardLeft = this.board.GRID_OFFSET_X;
        const boardTop = this.board.GRID_OFFSET_Y;
        const boardSizePx = this.board.GRID_SIZE * this.board.CELL_SIZE;
        const boardRight = boardLeft + boardSizePx;
        const boardBottom = boardTop + boardSizePx;
        const frameOuterOffset = this.getFrameOuterOffset();
        const frameLeft = Math.max(0, boardLeft - frameOuterOffset);
        const frameTop = Math.max(0, boardTop - frameOuterOffset);
        const frameRight = Math.min(viewportWidth, boardRight + frameOuterOffset);
        const frameBottom = Math.min(viewportHeight, boardBottom + frameOuterOffset);
        const overlayColor = 0x000000;
        const overlayAlpha = this.uiOverlayAlpha;
        const boardOverlayDepth = 13;
        const hudOverlayDepth = 15;

        const heroSlot = this.board.playerHudSlots?.ROUGE;
        const heroProtectionLeft = heroSlot ? heroSlot.x + this.board.CELL_SIZE * 0.9 : 0;
        const topHeight = Math.max(0, frameTop);
        const topRightWidth = Math.max(0, viewportWidth - heroProtectionLeft);
        const frameBandHeight = Math.max(0, boardTop - frameTop);
        const frameBandWidth = Math.max(0, frameRight - frameLeft);
        const frameSideWidth = Math.max(0, boardLeft - frameLeft);
        const frameSideHeight = Math.max(0, boardBottom - boardTop);

        if (topRightWidth > 0 && topHeight > 0) {
            const topRightOverlay = this.scene.add.rectangle(
                heroProtectionLeft + topRightWidth / 2,
                topHeight / 2,
                topRightWidth,
                topHeight,
                overlayColor,
                0
            ).setDepth(boardOverlayDepth);
            this.board.modePotionOverlays.push(topRightOverlay);
        }

        if (frameBandWidth > 0 && frameBandHeight > 0) {
            const topFrameOverlay = this.scene.add.rectangle(
                frameLeft + frameBandWidth / 2,
                frameTop + frameBandHeight / 2,
                frameBandWidth,
                frameBandHeight,
                overlayColor,
                0
            ).setDepth(boardOverlayDepth);
            const bottomFrameOverlay = this.scene.add.rectangle(
                frameLeft + frameBandWidth / 2,
                boardBottom + frameBandHeight / 2,
                frameBandWidth,
                frameBandHeight,
                overlayColor,
                0
            ).setDepth(boardOverlayDepth);
            this.board.modePotionOverlays.push(topFrameOverlay, bottomFrameOverlay);
        }

        if (frameSideWidth > 0 && frameSideHeight > 0) {
            const leftFrameOverlay = this.scene.add.rectangle(
                frameLeft + frameSideWidth / 2,
                boardTop + frameSideHeight / 2,
                frameSideWidth,
                frameSideHeight,
                overlayColor,
                0
            ).setDepth(boardOverlayDepth);
            const rightFrameOverlay = this.scene.add.rectangle(
                boardRight + frameSideWidth / 2,
                boardTop + frameSideHeight / 2,
                frameSideWidth,
                frameSideHeight,
                overlayColor,
                0
            ).setDepth(boardOverlayDepth);
            this.board.modePotionOverlays.push(leftFrameOverlay, rightFrameOverlay);
        }

        const bottomHeight = Math.max(0, viewportHeight - frameBottom);
        const bottomOverlay = this.scene.add.rectangle(
            viewportWidth / 2,
            frameBottom + bottomHeight / 2,
            viewportWidth,
            bottomHeight,
            overlayColor,
            0
        ).setDepth(boardOverlayDepth);
        const leftOverlay = this.scene.add.rectangle(
            frameLeft / 2,
            frameTop + (frameBottom - frameTop) / 2,
            frameLeft,
            frameBottom - frameTop,
            overlayColor,
            0
        ).setDepth(boardOverlayDepth);
        const rightWidth = Math.max(0, viewportWidth - frameRight);
        const rightOverlay = this.scene.add.rectangle(
            frameRight + rightWidth / 2,
            frameTop + (frameBottom - frameTop) / 2,
            rightWidth,
            frameBottom - frameTop,
            overlayColor,
            0
        ).setDepth(boardOverlayDepth);

        this.board.modePotionOverlays.push(bottomOverlay, leftOverlay, rightOverlay);

        Object.values(this.board.enemySprites).forEach((sprite) => {
            if (!sprite?.active) return;

            const enemyOverlay = this.scene.add.rectangle(
                sprite.x,
                sprite.y,
                Math.max(52, sprite.displayWidth * 0.88),
                Math.max(68, sprite.displayHeight * 0.92),
                overlayColor,
                0
            ).setDepth(hudOverlayDepth);
            this.board.modePotionHudOverlays.push(enemyOverlay);
        });

        Object.values(this.board.lightningGaugeGraphics).forEach((gauge) => {
            if (!gauge) return;

            const gaugeOverlay = this.scene.add.circle(
                gauge.x,
                gauge.y,
                gauge.radius + 10,
                overlayColor,
                0
            ).setDepth(hudOverlayDepth);
            this.board.modePotionHudOverlays.push(gaugeOverlay);
        });

        this.board.activePotionModeId = gameState.pendingProgressPotion;
        this.applyMonochrome(true, true);

        this.scene.tweens.add({
            targets: [...this.board.modePotionOverlays, ...this.board.modePotionHudOverlays],
            alpha: overlayAlpha,
            duration: this.transitionDuration,
            ease: 'Sine.easeOut'
        });
    }

    clear() {
        if (!this.board.activePotionModeId &&
            !this.board.modePotionOverlays.length &&
            !this.board.modePotionHudOverlays.length) {
            return;
        }

        const fadingOverlays = [...this.board.modePotionOverlays, ...this.board.modePotionHudOverlays];
        this.board.modePotionOverlays = [];
        this.board.modePotionHudOverlays = [];
        this.board.activePotionModeId = null;
        this.applyMonochrome(false, true);

        fadingOverlays.forEach((overlay) => {
            this.scene.tweens.add({
                targets: overlay,
                alpha: 0,
                duration: this.transitionDuration,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    overlay.destroy();
                }
            });
        });
    }

    applyTint(isActive, animate = false) {
        this.applyMonochrome(isActive, animate);
    }

    applyMonochrome(isActive, animate = false) {
        this.scene.cameras.main.setBackgroundColor(isActive ? '#6f6f6f' : '#B47C43');
        const grayscaleTint = this.monochromeTint;
        const neutralAlpha = this.monochromeAlpha;
        const activePotionId = this.board.activePotionModeId;

        if (this.board.backgroundSprite) {
            if (isActive) {
                this.board.backgroundSprite.setTint(grayscaleTint);
                this.tweenAlpha(this.board.backgroundSprite, neutralAlpha, animate);
            } else {
                this.restoreDisplayObject(this.board.backgroundSprite, animate, 1);
            }
        }

        this.board.frameSprites.forEach((sprite) => {
            if (isActive) {
                sprite.setTint(grayscaleTint);
                this.tweenAlpha(sprite, neutralAlpha, animate);
            } else {
                this.restoreDisplayObject(sprite, animate, 1);
            }
        });

        Object.values(this.board.enemySprites).forEach((sprite) => {
            if (!sprite) return;

            if (isActive) {
                sprite.setTint(grayscaleTint);
                this.tweenAlpha(sprite, 0.26, animate);
            } else {
                this.restoreDisplayObject(
                    sprite,
                    animate,
                    this.scene.gameState.playerOrder.includes(this.getEnemyColorForSprite(sprite)) ? 1 : 0.32
                );
            }
        });

        Object.entries(this.board.lightningGaugeGraphics).forEach(([color, gauge]) => {
            if (!gauge?.graphics) return;

            if (isActive) {
                this.tweenAlpha(gauge.graphics, 0.16, animate);
            } else {
                this.tweenAlpha(gauge.graphics, 1, animate);
            }

            const bonusText = this.board.bonusIconTexts[color];
            if (bonusText) {
                if (isActive) {
                    bonusText.setTint(grayscaleTint);
                    this.tweenAlpha(bonusText, 0.18, animate);
                } else {
                    this.restoreDisplayObject(bonusText, animate, 1);
                }
            }

            const bonusImage = this.board.bonusIconImages[color];
            if (bonusImage) {
                if (isActive) {
                    bonusImage.setTint(grayscaleTint);
                    this.tweenAlpha(bonusImage, 0.18, animate);
                } else {
                    if (this.scene.gameState.availableBonuses?.[color] === 'PLACE_BOMB') {
                        const gaugeColor = this.board.BONUS_GAUGE_COLORS?.[color] || this.board.COLORS[color];
                        this.restoreBonusBombImage(bonusImage, gaugeColor, animate);
                    } else {
                        this.restoreDisplayObject(bonusImage, animate, bonusImage.visible ? 1 : 0);
                    }
                }
            }
        });

        this.board.goalGaugeSegments.forEach((segment) => {
            if (isActive) {
                segment.setTint(grayscaleTint);
                this.tweenAlpha(segment, 0.5, animate);
            } else {
                this.restoreDisplayObject(segment, animate, 1);
            }
        });

        this.board.goalGaugeNotches.forEach((notch) => {
            if (isActive) {
                notch.setTint(grayscaleTint);
                this.tweenAlpha(notch, 0.35, animate);
            } else {
                this.restoreDisplayObject(notch, animate, 1);
            }
        });

        Object.entries(this.board.progressPotionSpriteMap).forEach(([potionId, sprite]) => {
            if (!sprite) return;
            const isActivePotionSprite = activePotionId && activePotionId === potionId;
            if (isActivePotionSprite) {
                this.preserveActivePotionSprite(sprite, this.getProgressPotionBaseAlpha(potionId));
                return;
            }

            if (isActive) {
                sprite.setTint(grayscaleTint);
                this.tweenAlpha(sprite, 0.3, animate);
            } else {
                this.restoreDisplayObject(sprite, animate, this.getProgressPotionBaseAlpha(potionId));
            }
        });

        this.board.progressPotionCooldownTexts.forEach((text) => {
            if (isActive) {
                text.setTint(grayscaleTint);
                this.tweenAlpha(text, 0.38, animate);
            } else {
                this.restoreDisplayObject(text, animate, 1);
            }
        });

        if (this.board.gaugeGraphics) {
            this.tweenAlpha(this.board.gaugeGraphics, isActive ? 0.42 : 1, animate);
        }

        if (this.board.potionCheatPanel) {
            const cheatPanelChildren = this.board.potionCheatPanel.list || [];
            cheatPanelChildren.forEach((child) => {
                if (this.board.potionCheatSprites.includes(child)) {
                    if (isActive) {
                        child.setTint(grayscaleTint);
                        this.tweenAlpha(child, 0.3, animate);
                    } else {
                        this.restoreDisplayObject(child, animate, 1);
                    }
                    return;
                }

                this.tweenAlpha(child, isActive ? 0.24 : 1, animate);
            });
        }
    }

    getEnemyColorForSprite(targetSprite) {
        const match = Object.entries(this.board.enemySprites).find(([, sprite]) => sprite === targetSprite);
        return match?.[0] || null;
    }

    applyMonochromeToContainer(container, isActive, animate, alpha) {
        if (!container?.list) {
            return;
        }

        container.list.forEach((child) => {
            if (child?.list) {
                this.applyMonochromeToContainer(child, isActive, animate, alpha);
                return;
            }

            if (isActive) {
                if (child.setTint) {
                    child.setTint(this.monochromeTint);
                }
                this.tweenAlpha(child, alpha, animate);
            } else {
                this.restoreDisplayObject(child, animate, child.visible === false ? 0 : 1);
            }
        });
    }

    getFrameOuterOffset() {
        if (this.scene.config.showBoardFrame === false) {
            return 0;
        }

        const tileSize = this.board.CELL_SIZE;
        const innerOverlap = Math.max(8, Math.min(tileSize - 1, Math.round(tileSize * 0.55)));
        return tileSize - innerOverlap;
    }

    tweenAlpha(target, alpha, animate) {
        if (!target) return;
        this.scene.tweens.killTweensOf(target);
        if (animate) {
            this.scene.tweens.add({
                targets: target,
                alpha,
                duration: this.transitionDuration,
                ease: 'Sine.easeOut'
            });
        } else {
            target.setAlpha(alpha);
        }
    }

    restoreDisplayObject(target, animate, alpha = 1) {
        if (!target) return;
        this.scene.tweens.killTweensOf(target);
        if (animate) {
            this.scene.tweens.add({
                targets: target,
                alpha,
                duration: this.transitionDuration,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    if (target.clearTint) {
                        target.clearTint();
                    }
                }
            });
        } else {
            if (target.clearTint) {
                target.clearTint();
            }
            target.setAlpha(alpha);
        }
    }

    preserveActivePotionSprite(target, alpha = 1) {
        if (!target) return;
        if (target.clearTint) {
            target.clearTint();
        }
        target.setAlpha(alpha);
    }

    restoreBonusBombImage(target, tintColor, animate) {
        if (!target) return;
        this.scene.tweens.killTweensOf(target);
        target.setTint(tintColor);
        if (animate) {
            this.scene.tweens.add({
                targets: target,
                alpha: target.visible ? 1 : 0,
                duration: this.transitionDuration,
                ease: 'Sine.easeOut'
            });
        } else {
            target.setAlpha(target.visible ? 1 : 0);
        }
    }

    getProgressPotionBaseAlpha(potionId) {
        const potionState = this.board.progressPotionRenderStateMap?.[potionId];
        if (!potionState) {
            return 1;
        }

        if (potionState.mode === 'inactive') {
            return 0.28;
        }

        if (potionState.mode === 'consumed') {
            const potion = (this.scene.gameState.progressPotions || []).find((entry) => entry.id === potionId);
            if (!potion) {
                return 0.2;
            }

            const interval = this.scene.flow?.getProgressPotionRefreshInterval?.() || 0;
            const turnsRemaining = Math.max(0, potion.cooldownTurnsRemaining || 0);
            const progressRatio = interval > 0 ? (interval - turnsRemaining) / interval : 0;
            return Phaser.Math.Linear(0.12, 0.34, progressRatio);
        }

        return 1;
    }
}
