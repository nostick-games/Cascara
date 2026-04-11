class GameBoardOverlays {
    constructor(board) {
        this.board = board;
        this.scene = board.scene;
    }

    drawFrozenAreaOverlays(grid) {
        this.clearFrozenAreaOverlays();
        this.ensureAreaMask();

        const tileSize = this.board.CELL_SIZE;
        const statusAreaConfig = this.getStatusAreaDisplayConfig();
        const seenOrigins = new Set();

        for (let row = 0; row < this.board.GRID_SIZE; row++) {
            for (let col = 0; col < this.board.GRID_SIZE; col++) {
                const pion = grid[row][col];
                if (!pion.isFrozen || pion.frozenSourceRow === null || pion.frozenSourceCol === null) {
                    continue;
                }

                const originKey = `${pion.frozenSourceRow},${pion.frozenSourceCol}`;
                if (seenOrigins.has(originKey)) {
                    continue;
                }
                seenOrigins.add(originKey);

                const originX = this.board.GRID_OFFSET_X +
                    pion.frozenSourceCol * this.board.CELL_SIZE +
                    this.board.CELL_SIZE / 2 +
                    statusAreaConfig.centerOffsetPx;
                const originY = this.board.GRID_OFFSET_Y +
                    pion.frozenSourceRow * this.board.CELL_SIZE +
                    this.board.CELL_SIZE / 2 +
                    statusAreaConfig.centerOffsetPx;
                const frozenAlpha = pion.frozenTurns <= 1 ? 0.42 : 0.78;
                const frozenSprite = this.scene.add.image(originX, originY, 'bonus-ice')
                    .setOrigin(0.5)
                    .setDisplaySize(tileSize * statusAreaConfig.tileSpan, tileSize * statusAreaConfig.tileSpan)
                    .setAlpha(frozenAlpha)
                    .setDepth(8);
                frozenSprite.setMask(this.board.frozenAreaMask);

                this.board.frozenAreaSprites.push(frozenSprite);
            }
        }
    }

    drawSwampAreaOverlays(grid) {
        this.clearSwampAreaOverlays();
        this.ensureAreaMask();

        const tileSize = this.board.CELL_SIZE;
        const statusAreaConfig = this.getStatusAreaDisplayConfig();
        const seenOrigins = new Set();

        for (let row = 0; row < this.board.GRID_SIZE; row++) {
            for (let col = 0; col < this.board.GRID_SIZE; col++) {
                const pion = grid[row][col];
                if (!pion.isSwamp || pion.swampSourceRow === null || pion.swampSourceCol === null) {
                    continue;
                }

                const originKey = `${pion.swampSourceRow},${pion.swampSourceCol}`;
                if (seenOrigins.has(originKey)) {
                    continue;
                }
                seenOrigins.add(originKey);

                const originX = this.board.GRID_OFFSET_X +
                    pion.swampSourceCol * this.board.CELL_SIZE +
                    this.board.CELL_SIZE / 2 +
                    statusAreaConfig.centerOffsetPx;
                const originY = this.board.GRID_OFFSET_Y +
                    pion.swampSourceRow * this.board.CELL_SIZE +
                    this.board.CELL_SIZE / 2 +
                    statusAreaConfig.centerOffsetPx;
                const swampSprite = this.scene.add.image(originX, originY, 'bonus-swamp')
                    .setOrigin(0.5)
                    .setDisplaySize(tileSize * statusAreaConfig.tileSpan, tileSize * statusAreaConfig.tileSpan)
                    .setDepth(7);
                swampSprite.setMask(this.board.frozenAreaMask);

                this.board.swampAreaSprites.push(swampSprite);
            }
        }
    }

    ensureAreaMask() {
        const boardLeft = this.board.GRID_OFFSET_X;
        const boardTop = this.board.GRID_OFFSET_Y;
        const boardSizePx = this.board.GRID_SIZE * this.board.CELL_SIZE;

        if (!this.board.frozenAreaMaskGraphics) {
            this.board.frozenAreaMaskGraphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            this.board.frozenAreaMask = this.board.frozenAreaMaskGraphics.createGeometryMask();
        }

        this.board.frozenAreaMaskGraphics.clear();
        this.board.frozenAreaMaskGraphics.fillStyle(0xffffff, 1);
        this.board.frozenAreaMaskGraphics.fillRect(boardLeft, boardTop, boardSizePx, boardSizePx);
    }

    getStatusAreaDisplayConfig() {
        if (this.board.GRID_SIZE >= 14) {
            return {
                tileSpan: 6,
                centerOffsetPx: this.board.CELL_SIZE / 2
            };
        }

        if (this.board.GRID_SIZE >= 12) {
            return {
                tileSpan: 5,
                centerOffsetPx: 0
            };
        }

        return {
            tileSpan: 3,
            centerOffsetPx: 0
        };
    }

    drawFrameOverlay() {
        this.clearFrameOverlay();

        if (this.scene.config.showBoardFrame === false) {
            return;
        }

        const tileSize = this.board.CELL_SIZE;
        const frameDepth = 12;
        const innerOverlap = Math.max(8, Math.min(tileSize - 1, Math.round(tileSize * 0.55)));
        const outerOffset = tileSize - innerOverlap;
        const left = this.board.GRID_OFFSET_X;
        const top = this.board.GRID_OFFSET_Y;
        const boardSizePx = this.board.GRID_SIZE * this.board.CELL_SIZE;
        const right = left + boardSizePx;
        const bottom = top + boardSizePx;

        const createFrameTile = (textureKey, x, y) => {
            const sprite = this.scene.add.image(x, y, textureKey)
                .setOrigin(0, 0)
                .setDisplaySize(tileSize, tileSize)
                .setDepth(frameDepth);
            this.board.frameSprites.push(sprite);
        };

        for (let index = 0; index < this.board.GRID_SIZE; index++) {
            const edgeX = left + index * tileSize;
            const edgeY = top + index * tileSize;

            createFrameTile('forest-edge-top', edgeX, top - outerOffset);
            createFrameTile('forest-edge-bottom', edgeX, bottom - innerOverlap);
            createFrameTile('forest-edge-left', left - outerOffset, edgeY);
            createFrameTile('forest-edge-right', right - innerOverlap, edgeY);
        }

        createFrameTile('forest-corner-top-left', left - outerOffset, top - outerOffset);
        createFrameTile('forest-corner-top-right', right - innerOverlap, top - outerOffset);
        createFrameTile('forest-corner-bottom-left', left - outerOffset, bottom - innerOverlap);
        createFrameTile('forest-corner-bottom-right', right - innerOverlap, bottom - innerOverlap);
    }

    clearFrameOverlay() {
        this.board.frameSprites.forEach((sprite) => sprite.destroy());
        this.board.frameSprites = [];
    }

    clearFrozenAreaOverlays() {
        this.board.frozenAreaSprites.forEach((sprite) => sprite.destroy());
        this.board.frozenAreaSprites = [];
    }

    clearSwampAreaOverlays() {
        this.board.swampAreaSprites.forEach((sprite) => sprite.destroy());
        this.board.swampAreaSprites = [];
    }

    showAIIntentPreviews(previews = []) {
        this.clearAIIntentPreviews(false);

        previews.forEach((preview) => {
            const pion = this.scene.gameState?.grid?.[preview.row]?.[preview.col];
            const tileVisual = pion?.tileVisual;
            if (!tileVisual) {
                return;
            }

            const tween = this.scene.tweens.add({
                targets: tileVisual,
                scaleX: 1.18,
                scaleY: 1.18,
                duration: 420,
                yoyo: true,
                repeat: 2,
                ease: 'Sine.easeInOut'
            });

            pion.aiIntentTween = tween;
            this.board.aiIntentPreviewSprites.push({ tileVisual, tween, pion });
        });
    }

    clearAIIntentPreviews(animate = true) {
        const previews = this.board.aiIntentPreviewSprites || [];
        if (!previews.length) {
            return;
        }

        this.board.aiIntentPreviewSprites = [];

        previews.forEach((preview) => {
            if (preview.tween) {
                preview.tween.stop();
            }

            const destroyPreview = () => {
                if (preview.pion) {
                    preview.pion.aiIntentTween = null;
                }
                preview.tileVisual?.setScale(1);
            };

            if (!animate) {
                destroyPreview();
                return;
            }

            this.scene.tweens.add({
                targets: [preview.tileVisual].filter(Boolean),
                scaleX: 1,
                scaleY: 1,
                duration: 100,
                ease: 'Sine.easeOut',
                onComplete: destroyPreview
            });
        });
    }

}
