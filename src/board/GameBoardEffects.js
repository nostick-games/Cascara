class GameBoardEffects {
    constructor(board) {
        this.board = board;
        this.scene = board.scene;
    }

    animateSuperBombSpawn(grid, row, col) {
        const targetX = this.board.GRID_OFFSET_X + col * this.board.CELL_SIZE + this.board.CELL_SIZE / 2;
        const targetY = this.board.GRID_OFFSET_Y + row * this.board.CELL_SIZE + this.board.CELL_SIZE / 2;
        const spawnY = targetY - Math.max(this.board.CELL_SIZE * 1.4, 42);
        const bombSize = Math.max(this.board.CELL_SIZE * 1.35, 48);
        const bombIcon = this.scene.add.image(targetX, spawnY, 'bonus-bomb-icon')
            .setOrigin(0.5)
            .setDisplaySize(bombSize, bombSize);

        this.scene.tweens.add({
            targets: bombIcon,
            x: targetX + 16,
            duration: 42,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: 7,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: bombIcon,
                    x: targetX,
                    y: targetY,
                    scale: 0.4,
                    duration: 180,
                    ease: 'Back.easeIn',
                    onComplete: () => {
                        bombIcon.destroy();
                        this.board.drawPion(grid, row, col);
                        this.scene.cameras.main.shake(180, 0.01);
                    }
                });
            }
        });
    }

    animateLightningSpawn(grid, row, col) {
        const targetX = this.board.GRID_OFFSET_X + col * this.board.CELL_SIZE + this.board.CELL_SIZE / 2;
        const targetY = this.board.GRID_OFFSET_Y + row * this.board.CELL_SIZE + this.board.CELL_SIZE / 2;
        const viewportWidth = this.scene.scale.width || this.scene.config.viewportWidth || 800;
        const cloudsY = this.board.GRID_OFFSET_Y - Math.max(34, Math.round(this.board.CELL_SIZE * 0.95));
        const leftCloud = this.scene.add.image(-20, cloudsY, 'bonus-lightning-clouds-left')
            .setOrigin(0, 0.5)
            .setScale(this.scene.scale.width < 500 ? 4.2 : 3.1)
            .setDepth(20);
        const rightCloud = this.scene.add.image(viewportWidth + 20, cloudsY, 'bonus-lightning-clouds-right')
            .setOrigin(1, 0.5)
            .setScale(this.scene.scale.width < 500 ? 4.2 : 3.1)
            .setDepth(20);

        const overlapX = this.board.GRID_OFFSET_X + this.board.GAUGE_WIDTH / 2;
        const leftTargetX = overlapX - Math.round(this.board.CELL_SIZE * 0.35);
        const rightTargetX = overlapX + Math.round(this.board.CELL_SIZE * 0.35);

        this.scene.tweens.add({
            targets: leftCloud,
            x: leftTargetX,
            duration: 360,
            ease: 'Sine.easeOut'
        });
        this.scene.tweens.add({
            targets: rightCloud,
            x: rightTargetX,
            duration: 360,
            ease: 'Sine.easeOut',
            onComplete: () => {
                const lightningKeys = [
                    'bonus-lightning-1',
                    'bonus-lightning-2',
                    'bonus-lightning-3',
                    'bonus-lightning-2',
                    'bonus-lightning-1'
                ];
                const centerX = overlapX;
                const impactY = targetY - Math.round(this.board.CELL_SIZE * 1.35);

                lightningKeys.forEach((textureKey, index) => {
                    this.scene.time.delayedCall(index * 90, () => {
                        const lightning = this.scene.add.image(centerX, impactY, textureKey)
                            .setOrigin(0.5, 0)
                            .setDepth(21)
                            .setScale(this.scene.scale.width < 500 ? 4.2 : 3.1);
                        this.scene.cameras.main.flash(70, 255, 255, 255, false);
                        this.scene.cameras.main.shake(90, 0.0035);
                        this.scene.tweens.add({
                            targets: lightning,
                            alpha: 0,
                            duration: 70,
                            ease: 'Linear',
                            onComplete: () => lightning.destroy()
                        });
                    });
                });

                const endDelay = lightningKeys.length * 90 + 40;
                this.scene.time.delayedCall(endDelay, () => {
                    this.scene.tweens.add({
                        targets: [leftCloud, rightCloud],
                        alpha: 0,
                        duration: 160,
                        ease: 'Sine.easeIn',
                        onComplete: () => {
                            leftCloud.destroy();
                            rightCloud.destroy();
                            this.board.drawPion(grid, row, col);
                        }
                    });
                });
            }
        });
    }

    animateThaw(grid, row, col) {
        const x = this.board.GRID_OFFSET_X + col * this.board.CELL_SIZE + this.board.CELL_SIZE / 2;
        const y = this.board.GRID_OFFSET_Y + row * this.board.CELL_SIZE + this.board.CELL_SIZE / 2;
        const thawOverlay = this.scene.add.rectangle(x, y, this.board.CELL_SIZE - 2, this.board.CELL_SIZE - 2, 0xe7f7ff, 0.7)
            .setOrigin(0.5);
        const crackBurst = this.createIceCracks(row, col, true);
        crackBurst.setPosition(x, y);
        const shardOffsets = [
            { x: -10, y: -8 },
            { x: 9, y: -10 },
            { x: -12, y: 9 },
            { x: 11, y: 11 }
        ];
        const shards = shardOffsets.map((offset, index) => this.scene.add.text(x + offset.x * 0.25, y + offset.y * 0.25, '✦', {
            fontSize: index % 2 === 0 ? '10px' : '8px',
            fill: '#dff7ff',
            fontFamily: 'Vollkorn'
        }).setOrigin(0.5).setAlpha(0));

        this.scene.tweens.add({
            targets: [thawOverlay, crackBurst],
            alpha: 0,
            scale: 1.2,
            duration: 220,
            ease: 'Quad.easeOut',
            onComplete: () => {
                thawOverlay.destroy();
                crackBurst.destroy();
                grid[row][col].thawing = false;
                this.board.drawPion(grid, row, col);
            }
        });

        shards.forEach((shard, index) => {
            const offset = shardOffsets[index];
            this.scene.tweens.add({
                targets: shard,
                alpha: { from: 0.95, to: 0 },
                x: x + offset.x,
                y: y + offset.y,
                scale: 1.4,
                duration: 180,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    shard.destroy();
                }
            });
        });
    }

    createIceCracks(row, col, forWorldPosition = false) {
        const crackGraphics = this.scene.add.graphics();
        const lineColor = 0xeaf9ff;
        const secondaryColor = 0xa8ddff;
        const size = this.board.CELL_SIZE - 6;
        const left = -size / 2;
        const top = -size / 2;
        const seedX = ((row * 37) + (col * 17)) % 7;
        const seedY = ((row * 19) + (col * 29)) % 7;

        crackGraphics.lineStyle(1.5, lineColor, 0.9);
        crackGraphics.beginPath();
        crackGraphics.moveTo(left + 3, top + 5 + seedY);
        crackGraphics.lineTo(left + size * 0.45, top + size * 0.32);
        crackGraphics.lineTo(left + size - 4, top + size * 0.18 + seedX);
        crackGraphics.strokePath();

        crackGraphics.lineStyle(1.2, secondaryColor, 0.85);
        crackGraphics.beginPath();
        crackGraphics.moveTo(left + size * 0.55, top + 4);
        crackGraphics.lineTo(left + size * 0.48, top + size * 0.48);
        crackGraphics.lineTo(left + size * 0.7, top + size - 4);
        crackGraphics.strokePath();

        crackGraphics.lineStyle(1, lineColor, 0.8);
        crackGraphics.beginPath();
        crackGraphics.moveTo(left + 6 + seedX, top + size * 0.7);
        crackGraphics.lineTo(left + size * 0.35, top + size * 0.52);
        crackGraphics.lineTo(left + size * 0.52, top + size - 5);
        crackGraphics.strokePath();

        if (!forWorldPosition) {
            crackGraphics.setPosition(0, 0);
        }

        return crackGraphics;
    }

    animateFightDamage(color, amount) {
        if (!this.scene.isFightMode || !color || !amount) {
            return;
        }

        const slot = this.board.playerHudSlots?.[color];
        if (!slot) {
            return;
        }

        const isHero = color === 'ROUGE';
        const targetSprite = isHero ? this.board.heroSprite : this.board.enemySprites?.[color];
        const baseX = slot.spriteX + (isHero ? 28 : 24);
        const baseY = slot.spriteY - (this.scene.scale.width < 500 ? 22 : 28);
        const damageText = this.scene.add.text(baseX, baseY, `-${amount}`, {
            fontSize: this.scene.scale.width < 500 ? '22px' : '28px',
            fill: '#fff1f1',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            stroke: '#7a1010',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(24);

        if (targetSprite) {
            const originX = targetSprite.x;
            const originY = targetSprite.y;
            this.scene.tweens.add({
                targets: targetSprite,
                x: originX + (isHero ? -8 : 8),
                y: originY - 2,
                duration: 70,
                ease: 'Sine.easeOut',
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    targetSprite.setPosition(originX, originY);
                }
            });
        }

        this.scene.tweens.add({
            targets: damageText,
            y: baseY - 42,
            alpha: 0,
            scaleX: 1.18,
            scaleY: 1.18,
            duration: 1120,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }
}
