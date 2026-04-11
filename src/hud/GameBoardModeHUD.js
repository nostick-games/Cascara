class GameBoardModeHUD {
    constructor(hud) {
        this.hud = hud;
        this.board = hud.board;
        this.scene = hud.scene;
    }

    createFightHealthBars() {
        if (!this.scene.isFightMode) {
            return;
        }

        const isNarrowViewport = this.scene.scale.width < 500;
        const segmentCount = 10;
        const segmentWidth = isNarrowViewport ? 9 : 11;
        const segmentHeight = isNarrowViewport ? 12 : 14;
        const spacing = 1;
        const totalWidth = segmentCount * segmentWidth + (segmentCount - 1) * spacing;
        this.board.fightHealthBarEntries = {};

        ['ROUGE', 'BLEU'].forEach((color) => {
            const slot = this.board.playerHudSlots?.[color];
            if (!slot) {
                return;
            }

            this.board.fightDisplayedHealth[color] = 100;
            this.board.fightHealthTweens[color] = null;

            const container = this.scene.add.container(slot.gaugeX, slot.y + (isNarrowViewport ? 36 : 42));
            const frame = this.scene.add.graphics().setDepth(13);
            frame.fillStyle(0x25131A, 1);
            frame.lineStyle(2, 0x895A45, 1);
            frame.fillRect(-totalWidth / 2 - 4, -segmentHeight / 2 - 4, totalWidth + 8, segmentHeight + 8);
            frame.strokeRect(-totalWidth / 2 - 4, -segmentHeight / 2 - 4, totalWidth + 8, segmentHeight + 8);
            container.add(frame);

            const segments = [];
            for (let index = 0; index < segmentCount; index++) {
                const x = -totalWidth / 2 + index * (segmentWidth + spacing) + segmentWidth / 2;
                const empty = this.scene.add.image(x, 0, 'ui-goal-gauge-empty')
                    .setDisplaySize(segmentWidth, segmentHeight)
                    .setOrigin(0.5)
                    .setTint(0xb7aa8a);
                const fillTextureKey = color === 'ROUGE' ? 'ui-goal-gauge-full' : 'ui-goal-gauge-blue';
                const fill = this.scene.add.image(x, 0, fillTextureKey)
                    .setDisplaySize(segmentWidth, segmentHeight)
                    .setOrigin(0.5);
                if (color === 'ROUGE') {
                    fill.setTint(0xac3232);
                }
                container.add([empty, fill]);
                segments.push({ empty, fill });
            }

            container.setDepth(13);
            this.board.fightHealthBarEntries[color] = { container, segments };
        });
    }

    updateFightHealthBars(fightHealth) {
        if (!this.scene.isFightMode || !fightHealth || !this.board.fightHealthBarEntries) {
            return;
        }

        ['ROUGE', 'BLEU'].forEach((color) => {
            const entry = this.board.fightHealthBarEntries[color];
            if (!entry) {
                return;
            }

            const targetHealth = Math.max(0, Math.min(100, Math.floor(fightHealth[color] || 0)));
            const currentHealth = Math.max(
                0,
                Math.min(100, this.board.fightDisplayedHealth[color] ?? targetHealth)
            );

            const renderHealth = (value) => {
                const filledCount = Math.round(value / 10);
                entry.segments.forEach((segment, index) => {
                    segment.fill.setVisible(index < filledCount);
                });
            };

            if (Math.abs(currentHealth - targetHealth) < 0.01) {
                this.board.fightDisplayedHealth[color] = targetHealth;
                renderHealth(targetHealth);
                return;
            }

            if (this.board.fightHealthTweens[color]) {
                this.board.fightHealthTweens[color].stop();
                this.board.fightHealthTweens[color] = null;
            }

            const tweenState = { value: currentHealth };
            this.board.fightHealthTweens[color] = this.scene.tweens.add({
                targets: tweenState,
                value: targetHealth,
                duration: 420,
                ease: 'Sine.easeOut',
                onUpdate: () => {
                    this.board.fightDisplayedHealth[color] = tweenState.value;
                    renderHealth(tweenState.value);
                },
                onComplete: () => {
                    this.board.fightDisplayedHealth[color] = targetHealth;
                    this.board.fightHealthTweens[color] = null;
                    renderHealth(targetHealth);
                }
            });
        });
    }

    createStrategoMovesCounter() {
        if (!this.scene.isStrategoMode) {
            return;
        }

        const centerX = this.board.GRID_OFFSET_X + this.board.GAUGE_WIDTH / 2;
        const baseY = this.board.GAUGE_Y + (this.scene.scale.width < 500 ? 46 : 52);
        this.board.strategoMovesLabel = this.scene.add.text(centerX, baseY, '', {
            fontSize: this.scene.scale.width < 500 ? '18px' : '21px',
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            stroke: '#25131A',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(18);

        const restartButton = this.hud.endPanel.createStyledMenuButton(
            centerX,
            baseY + (this.scene.scale.width < 500 ? 34 : 38),
            this.scene.scale.width < 500 ? 204 : 236,
            36,
            TranslationManager.t('stratego.restart_current'),
            this.scene.scale.width < 500 ? '12px' : '14px',
            { fillTint: 0x9e2a2b, fillTintOn: 0xbb3e3f }
        );
        restartButton.container.setDepth(18);
        restartButton.hitArea.on('pointerover', () => restartButton.setState(true));
        restartButton.hitArea.on('pointerout', () => restartButton.setState(false));
        restartButton.hitArea.on('pointerdown', () => {
            restartButton.setState(true);
            this.scene.restartCurrentStrategoPuzzle();
        });
        this.board.strategoRestartButton = restartButton;
    }

    updateStrategoMovesCounter(value) {
        if (!this.scene.isStrategoMode || !this.board.strategoMovesLabel) {
            return;
        }

        this.board.strategoMovesLabel.setText(
            TranslationManager.t('stratego.moves_left', {
                value: Math.max(0, Math.floor(value || 0))
            })
        );
    }
}
