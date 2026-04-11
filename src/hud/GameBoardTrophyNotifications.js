class GameBoardTrophyNotifications {
    constructor(hud) {
        this.hud = hud;
        this.board = hud.board;
        this.scene = hud.scene;
        this.queue = [];
        this.isShowing = false;
    }

    showUnlockNotification(trophyIds) {
        const ids = Array.isArray(trophyIds) ? trophyIds : [trophyIds];
        ids.filter(Boolean).forEach((id) => this.queue.push(id));
        this.showNext();
    }

    showFragmentNotification(fragment, message, buttonLabel, onConfirm) {
        if (!fragment) {
            if (onConfirm) onConfirm();
            return;
        }

        CenteredPromptModal.show(this.scene, {
            depth: 60,
            width: this.scene.scale.width < 500 ? 252 : 322,
            height: this.scene.scale.width < 500 ? 182 : 208,
            titleText: TranslationManager.t(fragment.titleKey),
            titleIconTextureKey: fragment.textureKey,
            titleIconSize: this.scene.scale.width < 500 ? 24 : 28,
            bodyText: message,
            buttonWidth: this.scene.scale.width < 500 ? 140 : 164,
            buttonLabel,
            onConfirm
        });
    }

    showNext() {
        if (this.isShowing || this.queue.length === 0) {
            return;
        }

        const trophyId = this.queue.shift();
        const trophy = TrophyManager.getDefinitions().find((entry) => entry.id === trophyId);
        if (!trophy) {
            this.showNext();
            return;
        }

        this.isShowing = true;

        const centerX = this.board.GRID_OFFSET_X + (this.board.GAUGE_WIDTH / 2);
        const isNarrowViewport = this.scene.scale.width < 500;
        const width = isNarrowViewport ? 220 : 280;
        const height = isNarrowViewport ? 64 : 76;
        const iconSize = isNarrowViewport ? 34 : 42;
        const topMargin = isNarrowViewport ? 18 : 24;
        const finalY = topMargin + height / 2;
        const hiddenY = finalY - 22;
        const panel = this.scene.add.container(centerX, hiddenY).setDepth(60).setAlpha(0);
        const background = this.scene.add.rectangle(0, 0, width, height, 0xc86a20, 0.96)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xf3c37a, 1);
        const icon = this.scene.add.image(-width / 2 + 18 + iconSize / 2, 0, trophy.imageKey)
            .setOrigin(0.5)
            .setDisplaySize(iconSize, iconSize);
        const title = this.scene.add.text(-width / 2 + 18 + iconSize + 12, 0, TranslationManager.t(trophy.titleKey), {
            fontSize: isNarrowViewport ? '15px' : '18px',
            fill: '#fff6df',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            wordWrap: { width: width - iconSize - 54 }
        }).setOrigin(0, 0.5);

        panel.add([background, icon, title]);

        this.scene.tweens.add({
            targets: panel,
            alpha: 1,
            y: finalY,
            duration: 180,
            ease: 'Quad.Out',
            onComplete: () => {
                this.scene.time.delayedCall(1200, () => {
                    this.scene.tweens.add({
                        targets: panel,
                        alpha: 0,
                        y: hiddenY,
                        duration: 220,
                        ease: 'Quad.In',
                        onComplete: () => {
                            panel.destroy(true);
                            this.isShowing = false;
                            this.showNext();
                        }
                    });
                });
            }
        });
    }
}
