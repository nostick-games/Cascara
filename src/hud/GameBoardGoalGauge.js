class GameBoardGoalGauge {
    constructor(hud) {
        this.hud = hud;
        this.board = hud.board;
        this.scene = hud.scene;
    }

    updateGauge(scoreData) {
        if (this.scene.isFightMode) {
            return;
        }
        if (!this.board.gaugeGraphics) return;

        const winThreshold = this.scene.getGoalGaugeThreshold?.()
            || GameLogic.getWinThreshold(this.board.GRID_SIZE, this.scene.gameState.playerOrder.length);
        const objectiveBonus = this.scene.gameState.objectiveProgressBonusPercent || 0;
        const playerProgress = Math.max(0, Math.min(winThreshold, (scoreData.percentages?.ROUGE || 0) + objectiveBonus));
        this.updateProgressPotionStates(playerProgress, winThreshold);

        if (!this.board.goalGaugeInitialized) {
            this.board.goalGaugeInitialized = true;
            this.board.displayedGoalProgress = 0;

            if (this.board.goalGaugeTween) {
                this.board.goalGaugeTween.stop();
            }

            const tweenState = { value: 0 };
            this.board.goalGaugeTween = this.scene.tweens.add({
                targets: tweenState,
                value: playerProgress,
                duration: 700,
                ease: 'Sine.easeOut',
                onUpdate: () => {
                    this.board.displayedGoalProgress = tweenState.value;
                    this.renderGoalGauge(winThreshold, tweenState.value);
                },
                onComplete: () => {
                    this.board.displayedGoalProgress = playerProgress;
                    this.board.goalGaugeTween = null;
                }
            });
            this.renderGoalGauge(winThreshold, 0);
            return;
        }

        if (this.board.goalGaugeTween) {
            this.board.goalGaugeTween.stop();
            this.board.goalGaugeTween = null;
        }

        this.board.displayedGoalProgress = playerProgress;
        this.renderGoalGauge(winThreshold, playerProgress);
    }

    renderGoalGauge(winThreshold, playerProgress) {
        if (this.scene.isFightMode) {
            return;
        }
        const layout = this.getGoalGaugeLayout();
        const gaugeOuterX = layout.gaugeOuterX;
        const gaugeOuterY = layout.gaugeOuterY;
        const gaugeOuterWidth = layout.gaugeOuterWidth;
        const gaugeOuterHeight = layout.gaugeOuterHeight;
        const segmentWidth = layout.segmentWidth;
        const segmentHeight = layout.segmentHeight;
        const segmentSpacing = layout.segmentSpacing;
        const segmentCount = layout.segmentCount;
        const totalSegmentsWidth = layout.totalSegmentsWidth;
        const segmentsStartX = layout.segmentsStartX;
        const segmentsStartY = layout.segmentsStartY;
        const filledSegments = Math.max(0, Math.min(segmentCount, Math.floor(playerProgress / (winThreshold / segmentCount))));
        const progressRatio = winThreshold > 0 ? Math.max(0, Math.min(1, playerProgress / winThreshold)) : 0;
        const progressPercent = progressRatio * 100;

        this.board.gaugeGraphics.clear();
        this.board.gaugeGraphics.lineStyle(layout.borderSize, 0x895A45, 1);
        this.board.gaugeGraphics.fillStyle(0x25131A, 1);
        this.board.gaugeGraphics.fillRect(gaugeOuterX, gaugeOuterY, gaugeOuterWidth, gaugeOuterHeight);
        this.board.gaugeGraphics.strokeRect(gaugeOuterX, gaugeOuterY, gaugeOuterWidth, gaugeOuterHeight);

        this.stopGoalGaugeBonusPulse();
        this.board.goalGaugeSegments.forEach((segment) => segment.destroy());
        this.board.goalGaugeSegments = [];

        for (let index = 0; index < segmentCount; index++) {
            const textureKey = index < filledSegments ? 'ui-goal-gauge-full' : 'ui-goal-gauge-empty';
            const segmentX = segmentsStartX + index * (segmentWidth + segmentSpacing);
            const segment = this.scene.add.image(segmentX, segmentsStartY, textureKey)
                .setOrigin(0, 0)
                .setDisplaySize(segmentWidth, segmentHeight)
                .setDepth(15);
            this.board.goalGaugeSegments.push(segment);
        }

        const progressPotions = this.scene.gameState.progressPotions || [];
        const gaugeInnerWidth = totalSegmentsWidth;
        const gaugeInnerLeft = segmentsStartX;
        const potionY = this.board.getBottomBackgroundPotionAnchorY();
        const potionSpacing = 100;
        const potionStartX = gaugeOuterX + Math.floor(gaugeOuterWidth / 2) - Math.floor(((progressPotions.length - 1) * potionSpacing) / 2);
        const usedPotionIds = new Set();

        progressPotions.forEach((potion, index) => {
            usedPotionIds.add(potion.id);
            const effectiveThreshold = this.getEffectivePotionUnlockThreshold(potion, segmentCount);
            const thresholdRatio = effectiveThreshold / 100;
            const notchX = Math.round(gaugeInnerLeft + gaugeInnerWidth * thresholdRatio);
            const notchReached = progressPercent >= effectiveThreshold;
            const potionX = potionStartX + index * potionSpacing;
            this.syncPotionNotch(potion, notchX, gaugeOuterY + Math.floor(gaugeOuterHeight / 2), !potion.consumed && !notchReached);
            this.syncPotionSprite(potion, potionX, potionY);
        });

        this.cleanupPotionDisplay(usedPotionIds);
        this.updateGoalGaugeClimaxPulse(progressPercent);
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
        const layout = this.getGoalGaugeLayout();
        progressPotions.forEach((potion) => {
            if (potion.consumed) {
                potion.active = false;
                return;
            }

            potion.active = gaugePercent >= this.getEffectivePotionUnlockThreshold(potion, layout.segmentCount);
        });
    }

    animateGoalGaugeTo(targetProgress, onComplete = null) {
        if (!this.board.gaugeGraphics) {
            if (onComplete) onComplete();
            return;
        }

        const winThreshold = this.scene.getGoalGaugeThreshold?.()
            || GameLogic.getWinThreshold(this.board.GRID_SIZE, this.scene.gameState.playerOrder.length);
        const clampedTarget = Math.max(0, Math.min(winThreshold, targetProgress));
        const currentProgress = this.board.displayedGoalProgress || 0;

        if (clampedTarget <= currentProgress + 0.01) {
            this.board.displayedGoalProgress = clampedTarget;
            this.updateProgressPotionStates(clampedTarget, winThreshold);
            this.renderGoalGauge(winThreshold, clampedTarget);
            if (onComplete) onComplete();
            return;
        }

        if (this.board.goalGaugeTween) {
            this.board.goalGaugeTween.stop();
            this.board.goalGaugeTween = null;
        }

        const tweenState = { value: currentProgress };
        this.board.goalGaugeTween = this.scene.tweens.add({
            targets: tweenState,
            value: clampedTarget,
            duration: Math.max(180, Math.round((clampedTarget - currentProgress) * 12)),
            ease: 'Sine.easeOut',
            onUpdate: () => {
                this.board.displayedGoalProgress = tweenState.value;
                this.updateProgressPotionStates(tweenState.value, winThreshold);
                this.renderGoalGauge(winThreshold, tweenState.value);
            },
            onComplete: () => {
                this.board.displayedGoalProgress = clampedTarget;
                this.updateProgressPotionStates(clampedTarget, winThreshold);
                this.renderGoalGauge(winThreshold, clampedTarget);
                this.board.goalGaugeTween = null;
                if (onComplete) onComplete();
            }
        });
    }

    animateObjectiveBonusGain(baseProgress, targetProgress, onComplete = null) {
        if (!this.board.gaugeGraphics) {
            if (onComplete) onComplete();
            return;
        }

        const winThreshold = this.scene.getGoalGaugeThreshold?.()
            || GameLogic.getWinThreshold(this.board.GRID_SIZE, this.scene.gameState.playerOrder.length);
        const clampedBase = Math.max(0, Math.min(winThreshold, baseProgress));
        const clampedTarget = Math.max(clampedBase, Math.min(winThreshold, targetProgress));

        this.board.displayedGoalProgress = clampedBase;
        this.updateProgressPotionStates(clampedBase, winThreshold);
        this.renderGoalGauge(winThreshold, clampedBase);

        this.animateGoalGaugeTo(clampedTarget, () => {
            this.pulseObjectiveBonusSegments(clampedBase, clampedTarget, winThreshold, onComplete);
        });
    }

    pulseObjectiveBonusSegments(baseProgress, targetProgress, winThreshold, onComplete = null) {
        const segmentCount = this.board.goalGaugeSegments.length;
        if (!segmentCount) {
            if (onComplete) onComplete();
            return;
        }

        const baseFilledSegments = this.getFilledSegmentCount(segmentCount, winThreshold, baseProgress);
        const targetFilledSegments = this.getFilledSegmentCount(segmentCount, winThreshold, targetProgress);
        const bonusSegments = this.board.goalGaugeSegments.slice(baseFilledSegments, targetFilledSegments);

        if (!bonusSegments.length) {
            if (onComplete) onComplete();
            return;
        }

        this.stopGoalGaugeBonusPulse();
        bonusSegments.forEach((segment, index) => {
            segment.setScale(1);
            const tween = this.scene.tweens.add({
                targets: segment,
                scaleX: 1.32,
                scaleY: 1.32,
                duration: 170,
                yoyo: true,
                repeat: 1,
                ease: 'Sine.easeInOut',
                delay: index * 55,
                onComplete: () => {
                    segment.setScale(1);
                }
            });
            this.board.goalGaugeBonusPulseTweens.push(tween);
        });

        if (onComplete) {
            const lastDelay = (bonusSegments.length - 1) * 55;
            this.scene.time.delayedCall(lastDelay + 420, onComplete);
        }
    }

    stopGoalGaugeBonusPulse() {
        (this.board.goalGaugeBonusPulseTweens || []).forEach((tween) => tween.stop());
        this.board.goalGaugeBonusPulseTweens = [];
        this.board.goalGaugeSegments.forEach((segment) => {
            if (segment?.active) {
                segment.setScale(1);
            }
        });
    }

    updateGoalGaugeClimaxPulse(progressPercent) {
        const shouldPulse = progressPercent >= 90 && !this.scene.gameState.gameOver;
        if (!shouldPulse) {
            this.stopGoalGaugeClimaxPulse();
            return;
        }

        this.startGoalGaugeClimaxPulse();
    }

    startGoalGaugeClimaxPulse() {
        this.stopGoalGaugeClimaxPulse();
        this.board.goalGaugeClimaxActive = true;

        const pulseTargets = (this.board.goalGaugeSegments || [])
            .filter((target) => target?.active && target.visible !== false);

        if (!pulseTargets.length) {
            return;
        }

        pulseTargets.forEach((target) => {
            if (typeof target.setScale === 'function') {
                target.setScale(1);
            }
            if (typeof target.setAlpha === 'function') {
                target.setAlpha(1);
            }
        });

        this.board.goalGaugeClimaxTweens.push(this.scene.tweens.add({
            targets: pulseTargets,
            scaleX: 1.08,
            scaleY: 1.08,
            alpha: 0.86,
            duration: 240,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        }));
    }

    stopGoalGaugeClimaxPulse() {
        (this.board.goalGaugeClimaxTweens || []).forEach((tween) => tween.stop());
        this.board.goalGaugeClimaxTweens = [];
        this.board.goalGaugeClimaxActive = false;

        (this.board.goalGaugeSegments || []).forEach((target) => {
            if (!target?.active) {
                return;
            }

            if (typeof target.setScale === 'function') {
                target.setScale(1);
            }
            if (typeof target.setAlpha === 'function') {
                target.setAlpha(1);
            }
        });
    }

    getFilledSegmentCount(segmentCount, winThreshold, playerProgress) {
        if (segmentCount <= 0 || winThreshold <= 0) {
            return 0;
        }

        return Math.max(0, Math.min(
            segmentCount,
            Math.floor(playerProgress / (winThreshold / segmentCount))
        ));
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

        const layout = this.getGoalGaugeLayout();
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
            this.renderGoalGauge(winThreshold, currentProgress);
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
                this.renderGoalGauge(winThreshold, currentProgress);
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

    getGoalGaugeLayout() {
        const gaugeOuterX = this.board.GAUGE_X;
        const gaugeOuterY = this.board.GAUGE_Y;
        const gaugeOuterWidth = this.board.GAUGE_WIDTH;
        const gaugeOuterHeight = this.board.GAUGE_HEIGHT;
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

        return {
            gaugeOuterX,
            gaugeOuterY,
            gaugeOuterWidth,
            gaugeOuterHeight,
            borderSize,
            innerPaddingX,
            innerX,
            innerY,
            innerHeight,
            segmentWidth,
            segmentHeight,
            segmentSpacing,
            usableWidth,
            segmentCount,
            totalSegmentsWidth,
            segmentsStartX,
            segmentsStartY
        };
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
