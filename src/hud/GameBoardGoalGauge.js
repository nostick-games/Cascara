class GameBoardGoalGauge {
    constructor(hud) {
        this.hud = hud;
        this.board = hud.board;
        this.scene = hud.scene;
        this.potions = new GameBoardGoalGaugePotions(this);
        this.animations = new GameBoardGoalGaugeAnimations(this);
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
        this.potions.updateProgressPotionStates(playerProgress, winThreshold);

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
            const effectiveThreshold = this.potions.getEffectivePotionUnlockThreshold(potion, segmentCount);
            const thresholdRatio = effectiveThreshold / 100;
            const notchX = Math.round(gaugeInnerLeft + gaugeInnerWidth * thresholdRatio);
            const notchReached = progressPercent >= effectiveThreshold;
            const potionX = potionStartX + index * potionSpacing;
            this.potions.syncPotionNotch(potion, notchX, gaugeOuterY + Math.floor(gaugeOuterHeight / 2), !potion.consumed && !notchReached);
            this.potions.syncPotionSprite(potion, potionX, potionY);
        });

        this.potions.cleanupPotionDisplay(usedPotionIds);
        this.animations.updateGoalGaugeClimaxPulse(progressPercent);
    }

    animateGoalGaugeTo(targetProgress, onComplete = null) {
        return this.animations.animateGoalGaugeTo(targetProgress, onComplete);
    }

    animateObjectiveBonusGain(baseProgress, targetProgress, onComplete = null) {
        return this.animations.animateObjectiveBonusGain(baseProgress, targetProgress, onComplete);
    }

    pulseObjectiveBonusSegments(baseProgress, targetProgress, winThreshold, onComplete = null) {
        return this.animations.pulseObjectiveBonusSegments(baseProgress, targetProgress, winThreshold, onComplete);
    }

    stopGoalGaugeBonusPulse() {
        return this.animations.stopGoalGaugeBonusPulse();
    }

    updateGoalGaugeClimaxPulse(progressPercent) {
        return this.animations.updateGoalGaugeClimaxPulse(progressPercent);
    }

    startGoalGaugeClimaxPulse() {
        return this.animations.startGoalGaugeClimaxPulse();
    }

    stopGoalGaugeClimaxPulse() {
        return this.animations.stopGoalGaugeClimaxPulse();
    }

    getFilledSegmentCount(segmentCount, winThreshold, playerProgress) {
        return this.animations.getFilledSegmentCount(segmentCount, winThreshold, playerProgress);
    }

    animateFirstPotionUnlockAdvance(offsetSegments, onComplete = null) {
        return this.potions.animateFirstPotionUnlockAdvance(offsetSegments, onComplete);
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

    stopGoalGaugeNotchAdvanceTweens() {
        return this.potions.stopGoalGaugeNotchAdvanceTweens();
    }
}
