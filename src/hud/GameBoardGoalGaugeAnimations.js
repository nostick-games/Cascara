class GameBoardGoalGaugeAnimations {
    constructor(goalGauge) {
        this.goalGauge = goalGauge;
        this.board = goalGauge.board;
        this.scene = goalGauge.scene;
        this.potions = goalGauge.potions;
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
            this.potions.updateProgressPotionStates(clampedTarget, winThreshold);
            this.goalGauge.renderGoalGauge(winThreshold, clampedTarget);
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
                this.potions.updateProgressPotionStates(tweenState.value, winThreshold);
                this.goalGauge.renderGoalGauge(winThreshold, tweenState.value);
            },
            onComplete: () => {
                this.board.displayedGoalProgress = clampedTarget;
                this.potions.updateProgressPotionStates(clampedTarget, winThreshold);
                this.goalGauge.renderGoalGauge(winThreshold, clampedTarget);
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
        this.potions.updateProgressPotionStates(clampedBase, winThreshold);
        this.goalGauge.renderGoalGauge(winThreshold, clampedBase);

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
}
