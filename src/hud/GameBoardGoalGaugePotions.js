class GameBoardGoalGaugePotions {
    constructor(goalGauge) {
        this.goalGauge = goalGauge;
        this.board = goalGauge.board;
        this.scene = goalGauge.scene;
    }

    syncPotionNotch(potion, x, y, visible) {
        let notch = this.board.progressPotionNotchMap[potion.id];

        if (!visible) {
            if (notch) {
                notch.setVisible(false);
            }
            return;
        }

        if (!notch) {
            notch = this.scene.add.image(x, y, potion.notchTextureKey)
                .setOrigin(0.5)
                .setDisplaySize(12, 18)
                .setDepth(16);
            this.board.progressPotionNotchMap[potion.id] = notch;
            this.board.goalGaugeNotches.push(notch);
        }

        notch
            .setTexture(potion.notchTextureKey)
            .setPosition(x, y)
            .setVisible(true)
            .setAlpha(1);
    }

    syncPotionSprite(potion, x, y) {
        let shadowSprite = this.board.progressPotionShadowMap[potion.id];
        if (!shadowSprite) {
            shadowSprite = this.scene.add.image(x, y + 20, 'progress-potion-shadow')
                .setOrigin(0.5)
                .setScale(this.board.PROGRESS_POTION_SCALE)
                .setDepth(15)
                .setVisible(false);
            this.board.progressPotionShadowMap[potion.id] = shadowSprite;
            this.board.progressPotionShadows.push(shadowSprite);
        }

        let potionSprite = this.board.progressPotionSpriteMap[potion.id];
        if (!potionSprite) {
            potionSprite = this.scene.add.image(x, y, potion.textureKey)
                .setOrigin(0.5)
                .setScale(this.board.PROGRESS_POTION_SCALE)
                .setDepth(16);
            this.board.progressPotionSpriteMap[potion.id] = potionSprite;
            this.board.progressPotionSprites.push(potionSprite);
            potionSprite.on('pointerdown', () => {
                this.scene.handleProgressPotionClick(potion.id);
            });
        }

        const cooldownText = this.syncPotionCooldownText(potion, x, y);
        const isSelectedPotion = this.scene.gameState.pendingProgressPotion === potion.id;
        const renderState = {
            textureKey: potion.textureKey,
            x,
            y,
            mode: potion.consumed ? 'consumed' : (potion.active ? 'active' : 'inactive'),
            isSelected: isSelectedPotion,
            currentPlayer: this.scene.gameState.currentPlayer,
            canInteract:
                this.scene.gameState.currentPlayer === 'ROUGE' &&
                !this.scene.gameState.gameOver &&
                !this.scene.gameState.selectingStartingPlayer &&
                !this.scene.gameState.cascadeActive &&
                !this.scene.gameState.specialActionInProgress,
            turnsRemaining: potion.cooldownTurnsRemaining || 0
        };
        const previousState = this.board.progressPotionRenderStateMap[potion.id];

        if (this.isSamePotionRenderState(previousState, renderState)) {
            return;
        }

        shadowSprite.setPosition(x, y + 40);

        potionSprite.setPosition(x, y).setVisible(true);
        if (!previousState || previousState.textureKey !== renderState.textureKey) {
            potionSprite.setTexture(potion.textureKey);
        }

        if (potion.consumed) {
            const refreshStatus = this.getPotionRefreshStatus(potion);
            const ghostAlpha = Phaser.Math.Linear(0.08, 0.24, refreshStatus.progressRatio);
            shadowSprite.setVisible(false);
            potionSprite.disableInteractive();
            potionSprite.clearTint().setAlpha(ghostAlpha);
            cooldownText
                .setPosition(x, y)
                .setText(`${refreshStatus.turnsRemaining}`)
                .setVisible(true)
                .setAlpha(1);
            this.stopPotionPulse(potion.id, potionSprite);
            this.board.progressPotionRenderStateMap[potion.id] = renderState;
            return;
        }

        if (cooldownText.visible) {
            cooldownText.setVisible(false);
        }

        if (!potion.active) {
            shadowSprite.setVisible(false);
            potionSprite.disableInteractive();
            if (!previousState || previousState.mode !== renderState.mode) {
                potionSprite.clearTint().setAlpha(0.28);
            }
            this.stopPotionPulse(potion.id, potionSprite);
            this.board.progressPotionRenderStateMap[potion.id] = renderState;
            return;
        }

        shadowSprite.setVisible(true);
        if (!previousState || previousState.mode !== renderState.mode) {
            potionSprite.clearTint().setAlpha(1);
        }
        if (renderState.canInteract) {
            potionSprite.setInteractive({ useHandCursor: true });
        } else {
            potionSprite.disableInteractive();
        }

        if (isSelectedPotion) {
            this.startPotionPulse(potion.id, potionSprite);
        } else {
            this.stopPotionPulse(potion.id, potionSprite);
        }

        this.board.progressPotionRenderStateMap[potion.id] = renderState;
    }

    isSamePotionRenderState(previousState, nextState) {
        if (!previousState || !nextState) {
            return false;
        }

        return previousState.textureKey === nextState.textureKey &&
            previousState.x === nextState.x &&
            previousState.y === nextState.y &&
            previousState.mode === nextState.mode &&
            previousState.isSelected === nextState.isSelected &&
            previousState.currentPlayer === nextState.currentPlayer &&
            previousState.canInteract === nextState.canInteract &&
            previousState.turnsRemaining === nextState.turnsRemaining;
    }

    syncPotionCooldownText(potion, x, y) {
        let cooldownText = this.board.progressPotionCooldownTextMap[potion.id];
        if (!cooldownText) {
            cooldownText = this.scene.add.text(x, y, '', {
                fontSize: '28px',
                fill: '#cbb8a0',
                fontFamily: 'Vollkorn',
                fontStyle: 'bold',
                stroke: '#25131A',
                strokeThickness: 4
            })
                .setOrigin(0.5)
                .setDepth(17)
                .setVisible(false);
            this.board.progressPotionCooldownTextMap[potion.id] = cooldownText;
            this.board.progressPotionCooldownTexts.push(cooldownText);
        }

        cooldownText.setPosition(x, y);
        return cooldownText;
    }

    startPotionPulse(potionId, potionSprite) {
        if (this.board.progressPotionPulseTweens[potionId]) {
            return;
        }

        this.board.progressPotionPulseTweens[potionId] = this.scene.tweens.add({
            targets: potionSprite,
            scaleX: 2.14,
            scaleY: 2.14,
            duration: 240,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    stopPotionPulse(potionId, potionSprite) {
        const tween = this.board.progressPotionPulseTweens[potionId];
        if (tween) {
            tween.stop();
            delete this.board.progressPotionPulseTweens[potionId];
        }

        if (potionSprite) {
            potionSprite.setScale(2);
        }
    }

    cleanupPotionDisplay(usedPotionIds) {
        Object.entries(this.board.progressPotionSpriteMap).forEach(([potionId, sprite]) => {
            if (usedPotionIds.has(potionId)) {
                return;
            }

            this.stopPotionPulse(potionId, sprite);
            sprite.destroy();
            delete this.board.progressPotionSpriteMap[potionId];
            delete this.board.progressPotionRenderStateMap[potionId];
        });

        this.board.progressPotionSprites = this.board.progressPotionSprites.filter((sprite) => sprite.active);

        Object.entries(this.board.progressPotionShadowMap).forEach(([potionId, shadow]) => {
            if (usedPotionIds.has(potionId)) {
                return;
            }

            shadow.destroy();
            delete this.board.progressPotionShadowMap[potionId];
        });
        this.board.progressPotionShadows = this.board.progressPotionShadows.filter((shadow) => shadow.active);

        Object.entries(this.board.progressPotionNotchMap).forEach(([potionId, notch]) => {
            if (usedPotionIds.has(potionId)) {
                return;
            }

            notch.destroy();
            delete this.board.progressPotionNotchMap[potionId];
        });
        this.board.goalGaugeNotches = this.board.goalGaugeNotches.filter((notch) => notch.active);

        Object.entries(this.board.progressPotionCooldownTextMap).forEach(([potionId, text]) => {
            if (usedPotionIds.has(potionId)) {
                return;
            }

            text.destroy();
            delete this.board.progressPotionCooldownTextMap[potionId];
        });
        this.board.progressPotionCooldownTexts = this.board.progressPotionCooldownTexts.filter((text) => text.active);
    }

    getPotionRefreshStatus(potion) {
        const interval = this.scene.flow?.getProgressPotionRefreshInterval?.() || 0;
        if (!interval) {
            return {
                turnsRemaining: '-',
                progressRatio: 0
            };
        }

        const turnsRemaining = Math.max(0, potion.cooldownTurnsRemaining || 0);
        const completedSteps = interval - turnsRemaining;

        return {
            turnsRemaining,
            progressRatio: interval > 0 ? completedSteps / interval : 0
        };
    }

    updateProgressPotionStates(playerProgress, winThreshold) {
        const progressPotions = this.scene.gameState.progressPotions || [];
        const gaugePercent = winThreshold > 0 ? (playerProgress / winThreshold) * 100 : 0;
        const layout = this.goalGauge.getGoalGaugeLayout();
        progressPotions.forEach((potion) => {
            if (potion.consumed) {
                potion.active = false;
                return;
            }

            potion.active = gaugePercent >= this.getEffectivePotionUnlockThreshold(potion, layout.segmentCount);
        });
    }

    animateFirstPotionUnlockAdvance(offsetSegments, onComplete = null) {
        if (!this.board.gaugeGraphics) {
            if (onComplete) onComplete();
            return;
        }

        const progressPotions = this.scene.gameState.progressPotions || [];
        const firstPotion = this.getFirstProgressPotion(progressPotions);
        if (!firstPotion) {
            if (onComplete) onComplete();
            return;
        }

        const layout = this.goalGauge.getGoalGaugeLayout();
        const currentOffset = this.scene.gameState.firstPotionUnlockOffsetSegments || 0;
        const targetOffset = Math.max(currentOffset, offsetSegments || 0);
        const offsetSteps = targetOffset - currentOffset;

        if (offsetSteps <= 0) {
            if (onComplete) onComplete();
            return;
        }

        const notch = this.board.progressPotionNotchMap[firstPotion.id];
        const currentProgress = this.board.displayedGoalProgress || 0;

        if (!notch || !notch.visible) {
            this.scene.gameState.firstPotionUnlockOffsetSegments = targetOffset;
            const winThreshold = this.scene.getGoalGaugeThreshold?.()
                || GameLogic.getWinThreshold(this.board.GRID_SIZE, this.scene.gameState.playerOrder.length);
            this.updateProgressPotionStates(currentProgress, winThreshold);
            this.goalGauge.renderGoalGauge(winThreshold, currentProgress);
            this.pulsePotionNotch(firstPotion.id, onComplete);
            return;
        }

        this.stopGoalGaugeNotchAdvanceTweens();

        const stepDistance = layout.segmentWidth + layout.segmentSpacing;
        const advanceOneStep = (remainingSteps) => {
            if (remainingSteps <= 0) {
                this.scene.gameState.firstPotionUnlockOffsetSegments = targetOffset;
                const winThreshold = this.scene.getGoalGaugeThreshold?.()
                    || GameLogic.getWinThreshold(this.board.GRID_SIZE, this.scene.gameState.playerOrder.length);
                this.updateProgressPotionStates(currentProgress, winThreshold);
                this.goalGauge.renderGoalGauge(winThreshold, currentProgress);
                this.pulsePotionNotch(firstPotion.id, onComplete);
                return;
            }

            const tween = this.scene.tweens.add({
                targets: notch,
                x: notch.x - stepDistance,
                duration: 120,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    advanceOneStep(remainingSteps - 1);
                }
            });
            this.board.goalGaugeNotchAdvanceTweens.push(tween);
        };

        advanceOneStep(offsetSteps);
    }

    pulsePotionNotch(potionId, onComplete = null) {
        const notch = this.board.progressPotionNotchMap[potionId];
        if (!notch || !notch.active) {
            if (onComplete) onComplete();
            return;
        }

        const tween = this.scene.tweens.add({
            targets: notch,
            scaleX: 1.35,
            scaleY: 1.35,
            duration: 170,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                notch.setScale(1);
                if (onComplete) onComplete();
            }
        });
        this.board.goalGaugeNotchAdvanceTweens.push(tween);
    }

    stopGoalGaugeNotchAdvanceTweens() {
        (this.board.goalGaugeNotchAdvanceTweens || []).forEach((tween) => tween.stop());
        this.board.goalGaugeNotchAdvanceTweens = [];
        Object.values(this.board.progressPotionNotchMap || {}).forEach((notch) => {
            if (notch?.active) {
                notch.setScale(1);
            }
        });
    }

    getFirstProgressPotion(progressPotions) {
        return (progressPotions || [])
            .slice()
            .sort((left, right) => left.unlockThreshold - right.unlockThreshold)[0] || null;
    }

    getEffectivePotionUnlockThreshold(potion, segmentCount) {
        if (!potion) {
            return 100;
        }

        const firstPotion = this.getFirstProgressPotion(this.scene.gameState.progressPotions || []);
        if (!firstPotion || firstPotion.id !== potion.id) {
            return potion.unlockThreshold;
        }

        const offsetSegments = this.scene.gameState.firstPotionUnlockOffsetSegments || 0;
        if (offsetSegments <= 0) {
            return potion.unlockThreshold;
        }

        const segmentPercent = 100 / Math.max(1, segmentCount);
        return Math.max(0, potion.unlockThreshold - (offsetSegments * segmentPercent));
    }
}
