const TutorialSceneBoardMixin = {
    ensureAnimations() {
        const tileAnimations = [
            { key: 'tutorial-tile-red-off-anim', texture: 'tutorial-tile-red-off' },
            { key: 'tutorial-tile-red-on-anim', texture: 'tutorial-tile-red-on' },
            { key: 'tutorial-tile-grey-off-anim', texture: 'tutorial-tile-grey-off' },
            { key: 'tutorial-tile-grey-on-anim', texture: 'tutorial-tile-grey-on' }
        ];

        tileAnimations.forEach(({ key, texture }) => {
            if (this.anims.exists(key)) {
                return;
            }

            const totalFrames = this.textures.get(texture)?.frameTotal || 1;
            this.anims.create({
                key,
                frames: this.anims.generateFrameNumbers(texture, {
                    start: 0,
                    end: Math.max(0, totalFrames - 1)
                }),
                frameRate: 14,
                repeat: 0
            });
        });

        if (!this.anims.exists('hero-idle-face')) {
            this.anims.create({
                key: 'hero-idle-face',
                frames: this.anims.generateFrameNumbers('hero-idle-face', { start: 0, end: 3 }),
                frameRate: 5,
                repeat: -1
            });
        }
    },

    buildInitialGrid() {
        this.grid = Array.from({ length: this.gridSize }, (_, row) =>
            Array.from({ length: this.gridSize }, (_, col) => ({
                row,
                col,
                color: 'GRIS',
                introHidden: true
            }))
        );
    },

    renderBoard() {
        this.cellSprites.forEach((cell) => {
            cell.hitArea.destroy();
            cell.highlight.destroy();
            cell.sprite.destroy();
        });
        this.cellSprites = [];

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const centerX = this.boardOffsetX + col * this.cellSize + this.cellSize / 2;
                const centerY = this.boardOffsetY + row * this.cellSize + this.cellSize / 2;
                const highlight = this.add.rectangle(centerX, centerY, this.cellSize, this.cellSize)
                    .setFillStyle(0x000000, 0)
                    .setStrokeStyle(0, 0xffffff, 0)
                    .setDepth(4);
                const sprite = this.add.sprite(centerX, centerY, this.getIdleTextureKey(this.grid[row][col].color), 0)
                    .setDisplaySize(this.cellSize, this.cellSize)
                    .setDepth(5);
                const hitArea = this.add.rectangle(centerX, centerY, this.cellSize, this.cellSize, 0x000000, 0.001)
                    .setOrigin(0.5)
                    .setDepth(6);

                hitArea.setInteractive();
                hitArea.on('pointerdown', () => this.handleCellClick(row, col));
                hitArea.on('pointerover', () => this.handleCellPointerOver(row, col));
                hitArea.on('pointerout', () => this.handleCellPointerOut(row, col));

                this.cellSprites.push({
                    row,
                    col,
                    sprite,
                    hitArea,
                    highlight,
                    pulseTween: null,
                    baseScale: sprite.scaleX
                });
            }
        }

        this.refreshHighlights();
    },

    revealRedTerritory(onComplete = null) {
        const territoryCells = [
            { row: 0, col: 0 },
            { row: 0, col: 1 },
            { row: 1, col: 0 },
            { row: 1, col: 1 }
        ];

        let remaining = territoryCells.length;
        territoryCells.forEach(({ row, col }, index) => {
            this.time.delayedCall(index * 60, () => {
                const cell = this.grid[row][col];
                const entry = this.getCellEntry(row, col);
                if (!cell || !entry) {
                    remaining -= 1;
                    if (remaining === 0 && onComplete) {
                        onComplete();
                    }
                    return;
                }

                this.playCaptureAnimation(entry.sprite, 'GRIS', 'ROUGE', () => {
                    cell.color = 'ROUGE';
                    entry.sprite.setTexture(this.getIdleTextureKey('ROUGE'));
                    entry.sprite.setFrame(0);
                    entry.sprite.setScale(entry.baseScale);
                    remaining -= 1;
                    if (remaining === 0) {
                        this.refreshHighlights();
                        if (onComplete) {
                            onComplete();
                        }
                    }
                });
            });
        });
    },

    handlePotionClick(index) {
        if (this.isBusy || this.modalOpen) {
            return;
        }
        if (this.currentStep !== 'orange_potion_select' || index !== 0 || !this.orangePotionActive) {
            return;
        }

        this.enterStep('orange_potion_target');
    },

    handleCellPointerOver(row, col) {
        if (this.isBusy || this.modalOpen || !this.isCurrentTarget(row, col)) {
            return;
        }

        const entry = this.getCellEntry(row, col);
        if (!entry) {
            return;
        }

        this.tweens.killTweensOf(entry.sprite);
        entry.sprite.setScale(entry.baseScale);
        this.tweens.add({
            targets: entry.sprite,
            scaleX: entry.baseScale * 1.12,
            scaleY: entry.baseScale * 1.12,
            duration: 120,
            ease: 'Sine.easeOut'
        });
    },

    handleCellPointerOut(row, col) {
        const entry = this.getCellEntry(row, col);
        if (!entry) {
            return;
        }
        if (this.pendingPressedCellKey === `${row},${col}`) {
            return;
        }
        this.tweens.killTweensOf(entry.sprite);
        this.refreshHighlights();
    },

    handleCellClick(row, col) {
        if (this.isBusy || this.modalOpen || !this.isCurrentTarget(row, col)) {
            return;
        }

        this.currentTarget = null;
        this.currentTargetSet = null;
        this.refreshHighlights();

        this.playTargetPressAnimation(row, col, () => {
            if (this.currentStep === 'orange_potion_target' && this.orangePotionArmed) {
                this.consumeOrangePotion(row, col);
                return;
            }

            this.captureTarget(row, col, () => {
                if (this.currentStep === 'capture_corner') {
                    this.showModal(
                        TranslationManager.t('tutorial.modal_objective'),
                        TranslationManager.t('tutorial.button_objective'),
                        () => {
                            this.enterStep('capture_gauge');
                        }
                    );
                    return;
                }

                if (this.currentStep === 'capture_gauge') {
                    this.animateObjectiveGaugeTo(50, () => {
                        this.showModal(
                            TranslationManager.t('tutorial.modal_chaos_intro'),
                            TranslationManager.t('tutorial.button_chaos_intro'),
                            () => {
                                this.showChaosGauge();
                                this.showModal(
                                    TranslationManager.t('tutorial.modal_chaos_try'),
                                    TranslationManager.t('tutorial.button_chaos_try'),
                                    () => {
                                        this.enterStep('capture_chaos');
                                    }
                                );
                            }
                        );
                    });
                    return;
                }

                if (this.currentStep === 'capture_chaos') {
                    this.animateChaosGaugeTo(100, () => {
                        this.startChaosRoulette('PLACE_BOMB', () => {
                            this.showModal(
                                TranslationManager.t('tutorial.modal_bonus_ready'),
                                TranslationManager.t('tutorial.button_bonus_ready'),
                                () => {
                                    this.showPotions();
                                    this.setPotionStates([true, true, false]);
                                    this.showModal(
                                        TranslationManager.t('tutorial.modal_potions'),
                                        TranslationManager.t('tutorial.button_potions'),
                                        () => {
                                            this.enterStep('orange_potion_select');
                                        }
                                    );
                                }
                            );
                        });
                    });
                }
            });
        });
    },

    playTargetPressAnimation(row, col, onComplete = null) {
        const entry = this.getCellEntry(row, col);
        if (!entry) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        this.pendingPressedCellKey = `${row},${col}`;
        this.tweens.killTweensOf(entry.sprite);
        entry.sprite.setScale(entry.baseScale);
        this.tweens.add({
            targets: entry.sprite,
            scaleX: entry.baseScale * 0.92,
            scaleY: entry.baseScale * 0.92,
            duration: 90,
            ease: 'Quad.Out',
            yoyo: true,
            onComplete: () => {
                this.pendingPressedCellKey = null;
                entry.sprite.setScale(entry.baseScale);
                if (onComplete) {
                    onComplete();
                }
            }
        });

        this.time.delayedCall(220, () => {
            if (this.pendingPressedCellKey === `${row},${col}`) {
                this.pendingPressedCellKey = null;
                entry.sprite.setScale(entry.baseScale);
                if (onComplete) {
                    onComplete();
                }
            }
        });
    },

    captureTarget(row, col, onComplete = null) {
        const capturedCells = this.getCapturedCells(row, col);
        if (!capturedCells.length) {
            return;
        }

        this.isBusy = true;
        let remaining = capturedCells.length;
        capturedCells.forEach(({ row: targetRow, col: targetCol, fromColor }) => {
            const entry = this.getCellEntry(targetRow, targetCol);
            if (!entry) {
                remaining -= 1;
                return;
            }

            this.playCaptureAnimation(entry.sprite, fromColor, 'ROUGE', () => {
                this.grid[targetRow][targetCol].color = 'ROUGE';
                entry.sprite.setTexture(this.getIdleTextureKey('ROUGE'));
                entry.sprite.setFrame(0);
                entry.sprite.setScale(entry.baseScale);
                remaining -= 1;
                if (remaining === 0) {
                    this.isBusy = false;
                    this.refreshHighlights();
                    if (onComplete) {
                        onComplete();
                    }
                }
            });
        });
    },

    consumeOrangePotion(centerRow, centerCol) {
        const capturedCells = this.getOrangePotionCapturedCells(centerRow, centerCol);
        if (!capturedCells.length) {
            return;
        }

        this.isBusy = true;
        this.orangePotionArmed = false;
        this.orangePotionActive = false;
        this.clearPotionPulse();
        this.setPotionStates([false, true, false]);

        let remaining = capturedCells.length;
        capturedCells.forEach(({ row, col, fromColor }) => {
            const entry = this.getCellEntry(row, col);
            if (!entry) {
                remaining -= 1;
                return;
            }

            this.playCaptureAnimation(entry.sprite, fromColor, 'ROUGE', () => {
                this.grid[row][col].color = 'ROUGE';
                entry.sprite.setTexture(this.getIdleTextureKey('ROUGE'));
                entry.sprite.setFrame(0);
                entry.sprite.setScale(entry.baseScale);
                remaining -= 1;

                if (remaining === 0) {
                    this.isBusy = false;
                    this.refreshHighlights();
                    this.animateObjectiveGaugeTo(100, () => {
                        this.showModal(
                            TranslationManager.t('tutorial.modal_victory'),
                            TranslationManager.t('tutorial.button_victory'),
                            () => {
                                this.scene.start(this.returnSceneKey, this.returnSceneData);
                            }
                        );
                    });
                }
            });
        });
    },

    getCapturedCells(row, col) {
        const capturedCells = [];
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                const nextRow = row + rowOffset;
                const nextCol = col + colOffset;
                const cell = this.grid[nextRow]?.[nextCol];
                if (!cell || cell.color === 'ROUGE') {
                    continue;
                }

                capturedCells.push({
                    row: nextRow,
                    col: nextCol,
                    fromColor: cell.color
                });
            }
        }
        return capturedCells;
    },

    getOrangePotionCapturedCells(centerRow, centerCol) {
        const capturedCells = [];
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                const row = centerRow + rowOffset;
                const col = centerCol + colOffset;
                const cell = this.grid[row]?.[col];
                if (!cell || cell.color === 'ROUGE') {
                    continue;
                }
                capturedCells.push({
                    row,
                    col,
                    fromColor: cell.color
                });
            }
        }
        return capturedCells;
    },

    playCaptureAnimation(sprite, fromColor, toColor, onComplete) {
        const offAnimationKey = this.getAnimationKey(fromColor, 'off');
        const onAnimationKey = this.getAnimationKey(toColor, 'on');
        const offTextureKey = this.getTextureKey(fromColor, 'off');
        const onTextureKey = this.getTextureKey(toColor, 'on');

        if (this.cache.audio?.exists('tile-clap')) {
            this.sound.play('tile-clap', { volume: 0.28 });
        }

        sprite.setTexture(offTextureKey);
        sprite.setFrame(0);
        sprite.once(`animationcomplete-${offAnimationKey}`, () => {
            sprite.setTexture(onTextureKey);
            sprite.setFrame(0);
            sprite.play(onAnimationKey);
        });
        sprite.once(`animationcomplete-${onAnimationKey}`, () => {
            if (onComplete) {
                onComplete();
            }
        });
        sprite.play(offAnimationKey);
    },

    refreshHighlights() {
        this.cellSprites.forEach((entry) => {
            if (this.grid[entry.row]?.[entry.col]?.introHidden) {
                entry.sprite.setVisible(false);
                entry.highlight.setVisible(false);
                if (entry.pulseTween) {
                    entry.pulseTween.stop();
                    entry.pulseTween = null;
                }
                return;
            }

            entry.sprite.setVisible(true);
            entry.highlight.setVisible(true);
            const isTarget = this.isCurrentTarget(entry.row, entry.col);
            entry.highlight.setStrokeStyle(0, 0xfff3bf, 0);

            if (entry.pulseTween) {
                entry.pulseTween.stop();
                entry.pulseTween = null;
            }

            entry.sprite.setScale(entry.baseScale);
            if (isTarget) {
                entry.pulseTween = this.tweens.add({
                    targets: entry.sprite,
                    scaleX: entry.baseScale * 1.08,
                    scaleY: entry.baseScale * 1.08,
                    duration: 260,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    },

    animateBoardReveal(onComplete = null) {
        const entries = this.getRandomNeutralRevealEntries();
        const neutralWaveDelayMs = 24;

        entries.forEach((entry, index) => {
            this.time.delayedCall(index * neutralWaveDelayMs, () => {
                const cell = this.grid[entry.row][entry.col];
                const spriteEntry = this.getCellEntry(entry.row, entry.col);
                if (!cell || !spriteEntry) {
                    return;
                }

                cell.introHidden = false;
                spriteEntry.sprite.setVisible(true);
                this.playIntroOnAnimation(spriteEntry.sprite, 'GRIS');
            });
        });

        const finalDelay = entries.length * neutralWaveDelayMs + 420;
        this.time.delayedCall(finalDelay, () => {
            this.grid.forEach((row) => row.forEach((cell) => {
                cell.introHidden = false;
            }));
            this.refreshHighlights();
            if (onComplete) {
                onComplete();
            }
        });
    },

    playIntroOnAnimation(sprite, color) {
        const onAnimationKey = this.getAnimationKey(color, 'on');
        const onTextureKey = this.getTextureKey(color, 'on');
        const spriteEntry = this.cellSprites.find((entry) => entry.sprite === sprite) || null;
        sprite.setTexture(onTextureKey);
        sprite.setFrame(0);
        if (spriteEntry) {
            sprite.setScale(spriteEntry.baseScale);
        }
        sprite.once(`animationcomplete-${onAnimationKey}`, () => {
            sprite.setTexture(this.getIdleTextureKey(color));
            sprite.setFrame(0);
            if (spriteEntry) {
                sprite.setScale(spriteEntry.baseScale);
            }
        });
        sprite.play(onAnimationKey);
    },

    getRandomNeutralRevealEntries() {
        const entries = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                entries.push({ row, col });
            }
        }

        const variants = [
            this.getCornerWaveEntries.bind(this),
            this.getCenterSpiralEntries.bind(this),
            this.getFourCornersEntries.bind(this)
        ];

        return Phaser.Utils.Array.GetRandom(variants)(entries);
    },

    getCornerWaveEntries(entries) {
        return [...entries].sort((left, right) => {
            const leftScore = left.row + left.col;
            const rightScore = right.row + right.col;
            if (leftScore !== rightScore) return leftScore - rightScore;
            return left.row - right.row || left.col - right.col;
        });
    },

    getCenterSpiralEntries(entries) {
        const center = (this.gridSize - 1) / 2;
        return [...entries].sort((left, right) => {
            const leftRadius = Math.max(Math.abs(left.row - center), Math.abs(left.col - center));
            const rightRadius = Math.max(Math.abs(right.row - center), Math.abs(right.col - center));
            if (leftRadius !== rightRadius) return leftRadius - rightRadius;
            const leftAngle = this.getClockwiseAngleFromTop(left.row - center, left.col - center);
            const rightAngle = this.getClockwiseAngleFromTop(right.row - center, right.col - center);
            if (leftAngle !== rightAngle) return leftAngle - rightAngle;
            return left.row - right.row || left.col - right.col;
        });
    },

    getFourCornersEntries(entries) {
        const lastIndex = this.gridSize - 1;
        return [...entries].sort((left, right) => {
            const leftDistance = Math.min(
                left.row + left.col,
                left.row + (lastIndex - left.col),
                (lastIndex - left.row) + left.col,
                (lastIndex - left.row) + (lastIndex - left.col)
            );
            const rightDistance = Math.min(
                right.row + right.col,
                right.row + (lastIndex - right.col),
                (lastIndex - right.row) + right.col,
                (lastIndex - right.row) + (lastIndex - right.col)
            );
            if (leftDistance !== rightDistance) return leftDistance - rightDistance;
            const leftScore = left.row + left.col;
            const rightScore = right.row + right.col;
            if (leftScore !== rightScore) return leftScore - rightScore;
            return left.row - right.row || left.col - right.col;
        });
    },

    getClockwiseAngleFromTop(rowOffset, colOffset) {
        const angle = Math.atan2(rowOffset, colOffset);
        const normalized = angle + Math.PI / 2;
        return (normalized + Math.PI * 2) % (Math.PI * 2);
    },

    isCurrentTarget(row, col) {
        if (this.currentTargetSet) {
            return this.currentTargetSet.has(`${row},${col}`);
        }
        return Boolean(this.currentTarget) &&
            row === this.currentTarget.row &&
            col === this.currentTarget.col;
    },

    getCellEntry(row, col) {
        return this.cellSprites.find((cell) => cell.row === row && cell.col === col) || null;
    },

    getIdleTextureKey(color) {
        return this.getTextureKey(color, 'idle');
    },

    getTextureKey(color, state) {
        const mapping = {
            ROUGE: {
                idle: 'tutorial-tile-red-idle',
                off: 'tutorial-tile-red-off',
                on: 'tutorial-tile-red-on'
            },
            GRIS: {
                idle: 'tutorial-tile-grey-idle',
                off: 'tutorial-tile-grey-off',
                on: 'tutorial-tile-grey-on'
            }
        };
        return mapping[color]?.[state] || mapping.GRIS.idle;
    },

    getAnimationKey(color, state) {
        const mapping = {
            ROUGE: {
                off: 'tutorial-tile-red-off-anim',
                on: 'tutorial-tile-red-on-anim'
            },
            GRIS: {
                off: 'tutorial-tile-grey-off-anim',
                on: 'tutorial-tile-grey-on-anim'
            }
        };
        return mapping[color]?.[state] || mapping.GRIS.on;
    }
};
