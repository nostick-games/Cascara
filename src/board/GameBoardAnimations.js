class GameBoardAnimations {
    constructor(board) {
        this.board = board;
        this.scene = board.scene;
    }

    startCaptureAnimation(grid, row, col, fromColor, toColor) {
        const pion = grid[row][col];
        this.stopCaptureAnimation(pion);
        this.playTileClap();

        const offTexture = this.board.getTileAnimationTextureKey(fromColor, 'off');
        const onTexture = this.board.getTileAnimationTextureKey(toColor, 'on');
        const offFrameCount = this.getFrameCount(offTexture);
        const onFrameCount = this.getFrameCount(onTexture);
        const sequence = [];

        for (let frame = 0; frame < offFrameCount; frame++) {
            sequence.push({
                texture: offTexture,
                frame
            });
        }

        for (let frame = 0; frame < onFrameCount; frame++) {
            sequence.push({
                texture: onTexture,
                frame
            });
        }

        this.playTileAnimationSequence(grid, row, col, sequence, () => {
            this.stopCaptureAnimation(pion);
            this.board.drawPion(grid, row, col);
        });
    }

    getFrameCount(textureKey) {
        return Math.max(1, (this.scene.textures.get(textureKey)?.frameTotal || 1) - 1);
    }

    playIntroOnAnimation(grid, row, col, color, onComplete = null) {
        const pion = grid[row][col];
        this.stopCaptureAnimation(pion);
        const texture = this.board.getTileAnimationTextureKey(color, 'on');
        const frameCount = this.getFrameCount(texture);
        const sequence = [];

        for (let frame = 0; frame < frameCount; frame++) {
            sequence.push({ texture, frame });
        }

        this.playTileAnimationSequence(grid, row, col, sequence, onComplete);
    }

    playTileAnimationSequence(grid, row, col, sequence, onComplete = null) {
        const pion = grid[row][col];
        pion.captureAnimation = {
            active: true,
            displayTexture: sequence[0]?.texture || this.board.getTileTextureKey(pion.color),
            displayFrame: sequence[0]?.frame || 0,
            timers: []
        };

        this.board.drawPion(grid, row, col);

        sequence.forEach((frameState, index) => {
            const timerId = this.scene.time.delayedCall(index * 48, () => {
                if (!pion.captureAnimation || !pion.captureAnimation.active) return;

                pion.captureAnimation.displayTexture = frameState.texture;
                pion.captureAnimation.displayFrame = frameState.frame;
                this.board.drawPion(grid, row, col);

                if (index === sequence.length - 1) {
                    if (onComplete) {
                        onComplete();
                    }
                }
            });

            pion.captureAnimation.timers.push(timerId);
        });
    }

    stopCaptureAnimation(pion) {
        if (!pion.captureAnimation) return;

        for (const timerId of pion.captureAnimation.timers || []) {
            if (timerId?.remove) {
                timerId.remove(false);
            }
        }

        pion.captureAnimation = null;
    }

    playTileClap() {
        if (!this.scene.cache.audio?.exists('tile-clap')) {
            return;
        }

        this.scene.sound.play('tile-clap', {
            volume: 0.28
        });
    }

    blinkPion(grid, row, col, isBlinking) {
        const pion = grid[row][col];
        pion.blinking = isBlinking;
        this.board.drawPion(grid, row, col);
    }

    resetBlinkPion(grid, row, col) {
        const pion = grid[row][col];
        pion.blinking = false;
        this.board.drawPion(grid, row, col);
    }

    animateBoardReveal(grid, playerOrder, onComplete) {
        const revealOrder = ['ROUGE', ...playerOrder.filter((color) => color !== 'ROUGE')];
        const neutralWaveDelayMs = 24;
        const colorRevealDelayMs = 210;
        const frameDurationMs = 48;

        this.board.boardRevealActive = true;
        this.board.revealedIntroColors = new Set();
        for (let row = 0; row < this.board.GRID_SIZE; row++) {
            for (let col = 0; col < this.board.GRID_SIZE; col++) {
                const pion = grid[row][col];
                pion.introHidden = true;
                pion.introDisplayColor = null;
                this.stopCaptureAnimation(pion);
            }
        }
        this.board.drawBoard(grid);

        const introEntries = this.getRandomNeutralRevealEntries(grid);
        introEntries.forEach((entry, index) => {
            this.scene.time.delayedCall(index * neutralWaveDelayMs, () => {
                const pion = grid[entry.row][entry.col];
                pion.introHidden = false;
                pion.introDisplayColor = 'GRIS';
                this.playIntroOnAnimation(grid, entry.row, entry.col, 'GRIS', () => {
                    this.stopCaptureAnimation(pion);
                    this.board.drawPion(grid, entry.row, entry.col);
                });
            });
        });

        const neutralRevealDuration = introEntries.length * neutralWaveDelayMs + this.getFrameCount(this.board.getTileAnimationTextureKey('GRIS', 'on')) * frameDurationMs + 80;

        revealOrder.forEach((color, index) => {
            this.scene.time.delayedCall(neutralRevealDuration + index * colorRevealDelayMs, () => {
                this.board.revealedIntroColors.add(color);

                for (let row = 0; row < this.board.GRID_SIZE; row++) {
                    for (let col = 0; col < this.board.GRID_SIZE; col++) {
                        const pion = grid[row][col];
                        if (pion.color !== color) continue;

                        this.playIntroOnAnimation(grid, row, col, color, () => {
                            pion.introDisplayColor = null;
                            this.stopCaptureAnimation(pion);
                            this.board.drawPion(grid, row, col);
                        });
                    }
                }

                if (index === revealOrder.length - 1) {
                    const revealEndDelay = this.getFrameCount(this.board.getTileAnimationTextureKey(color, 'on')) * frameDurationMs + 80;
                    this.scene.time.delayedCall(revealEndDelay, () => {
                        for (let clearRow = 0; clearRow < this.board.GRID_SIZE; clearRow++) {
                            for (let clearCol = 0; clearCol < this.board.GRID_SIZE; clearCol++) {
                                const pion = grid[clearRow][clearCol];
                                pion.introHidden = false;
                                pion.introDisplayColor = null;
                                this.stopCaptureAnimation(pion);
                            }
                        }
                        this.board.boardRevealActive = false;
                        this.board.revealedIntroColors = new Set(revealOrder);
                        this.board.drawBoard(grid);
                        if (onComplete) onComplete();
                    });
                }
            });
        });
    }

    getRandomNeutralRevealEntries(grid) {
        const entries = [];
        for (let row = 0; row < this.board.GRID_SIZE; row++) {
            for (let col = 0; col < this.board.GRID_SIZE; col++) {
                entries.push({ row, col, color: grid[row][col].color });
            }
        }

        const variants = [
            this.getCornerWaveEntries.bind(this),
            this.getCenterSpiralEntries.bind(this),
            this.getFourCornersEntries.bind(this)
        ];

        return Phaser.Utils.Array.GetRandom(variants)(entries);
    }

    getCornerWaveEntries(entries) {
        return [...entries].sort((left, right) => {
            const leftScore = left.row + left.col;
            const rightScore = right.row + right.col;
            if (leftScore !== rightScore) {
                return leftScore - rightScore;
            }
            return left.row - right.row || left.col - right.col;
        });
    }

    getCenterSpiralEntries(entries) {
        const center = (this.board.GRID_SIZE - 1) / 2;
        return [...entries].sort((left, right) => {
            const leftRadius = Math.max(Math.abs(left.row - center), Math.abs(left.col - center));
            const rightRadius = Math.max(Math.abs(right.row - center), Math.abs(right.col - center));
            if (leftRadius !== rightRadius) {
                return leftRadius - rightRadius;
            }

            const leftAngle = this.getClockwiseAngleFromTop(left.row - center, left.col - center);
            const rightAngle = this.getClockwiseAngleFromTop(right.row - center, right.col - center);
            if (leftAngle !== rightAngle) {
                return leftAngle - rightAngle;
            }

            return left.row - right.row || left.col - right.col;
        });
    }

    getFourCornersEntries(entries) {
        const lastIndex = this.board.GRID_SIZE - 1;
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

            if (leftDistance !== rightDistance) {
                return leftDistance - rightDistance;
            }

            const leftScore = left.row + left.col;
            const rightScore = right.row + right.col;
            if (leftScore !== rightScore) {
                return leftScore - rightScore;
            }

            return left.row - right.row || left.col - right.col;
        });
    }

    getClockwiseAngleFromTop(rowOffset, colOffset) {
        const angle = Math.atan2(rowOffset, colOffset);
        const normalized = angle + Math.PI / 2;
        return (normalized + Math.PI * 2) % (Math.PI * 2);
    }
}
