class GameBoardEndPanelReveal {
    constructor(endPanel) {
        this.endPanel = endPanel;
        this.scene = endPanel.scene;
    }

    playParchmentReveal(parchment, centerX, topY, width, height, onComplete = null) {
        const maskGraphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        const mask = maskGraphics.createGeometryMask();
        parchment.setMask(mask);

        const progress = { value: 0 };
        this.scene.tweens.add({
            targets: progress,
            value: height,
            duration: 360,
            ease: 'Cubic.Out',
            onUpdate: () => {
                maskGraphics.clear();
                maskGraphics.fillStyle(0xffffff, 1);
                maskGraphics.fillRect(centerX - width / 2, topY, width, progress.value);
            },
            onComplete: () => {
                parchment.clearMask();
                maskGraphics.destroy();
                if (onComplete) {
                    onComplete();
                }
            }
        });
    }

    prepareTarget(target) {
        if (!target) {
            return;
        }
        target.setData('endPanelRevealBaseY', target.y);
        target.setAlpha(0);
        target.setVisible(false);
        target.y += 10;
    }

    prepareTargets(targets = []) {
        (targets || []).forEach((target) => this.prepareTarget(target));
    }

    revealTarget(target, delay = 0, onComplete = null) {
        if (!target) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        this.scene.time.delayedCall(delay, () => {
            target.setVisible(true);
            this.scene.tweens.add({
                targets: target,
                alpha: 1,
                y: target.getData('endPanelRevealBaseY') ?? target.y,
                duration: 180,
                ease: 'Quad.Out',
                onComplete: () => {
                    if (onComplete) {
                        onComplete();
                    }
                }
            });
        });
    }

    revealIntro({
        parchment,
        centerX,
        parchmentTopY,
        parchmentWidth,
        parchmentHeight,
        messageText,
        footerText,
        strategoVictoryText,
        bossRushVictoryText,
        onRewardsReady,
        introButtons,
        buttonsToReveal,
        buttonRevealDelay,
        menuButton,
        shouldConvertGoldToStars,
        ogreConversionCompleted
    }) {
        this.playParchmentReveal(parchment, centerX, parchmentTopY, parchmentWidth, parchmentHeight, () => {
            this.revealTarget(messageText, 0);
            if (footerText.visible) {
                this.revealTarget(footerText, 120);
            }
            if (strategoVictoryText.visible) {
                this.revealTarget(strategoVictoryText, 120);
            }
            if (bossRushVictoryText.visible) {
                this.revealTarget(bossRushVictoryText, 120);
            }

            this.scene.time.delayedCall(230, () => {
                if (onRewardsReady) {
                    onRewardsReady();
                }
            });

            buttonsToReveal.forEach((button, index) => {
                this.revealTarget(button.container, buttonRevealDelay + index * 90, () => {
                    const shouldEnableMenuButton = !shouldConvertGoldToStars || ogreConversionCompleted();
                    if (
                        button === menuButton
                            ? shouldEnableMenuButton
                            : button.container.visible
                    ) {
                        button.hitArea.setInteractive({ useHandCursor: true });
                    }
                });
            });
        });
    }
}
