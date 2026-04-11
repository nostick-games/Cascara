class GameBoardRenderer {
    constructor(board) {
        this.board = board;
        this.scene = board.scene;
    }

    getTileTextureKey(color) {
        const textureMap = {
            ROUGE: 'tile-red',
            BLEU: 'tile-blue',
            VERT: 'tile-green',
            JAUNE: 'tile-scarlet',
            GRIS: 'tile-grey'
        };
        return textureMap[color] || 'tile-grey';
    }

    getTileAnimationTextureKey(color, phase) {
        const baseKey = this.getTileTextureKey(color);
        return `${baseKey}-${phase}`;
    }

    getTileDisplayMetrics() {
        const displayWidth = this.board.CELL_SIZE;
        const displayHeight = displayWidth;

        return { displayWidth, displayHeight };
    }

    drawBoard(grid) {
        for (let row = 0; row < this.board.GRID_SIZE; row++) {
            for (let col = 0; col < this.board.GRID_SIZE; col++) {
                this.drawPion(grid, row, col);
            }
        }

        this.board.drawSwampAreaOverlays(grid);
        this.board.drawFrozenAreaOverlays(grid);
        this.board.drawFrameOverlay();
    }

    drawPion(grid, row, col) {
        const pion = grid[row][col];
        const x = this.board.GRID_OFFSET_X + col * this.board.CELL_SIZE;
        const y = this.board.GRID_OFFSET_Y + row * this.board.CELL_SIZE;
        const centerX = x + this.board.CELL_SIZE / 2;
        const centerY = y + this.board.CELL_SIZE / 2;

        if (pion.emojiText) {
            pion.emojiText.destroy();
            pion.emojiText = null;
        }
        if (pion.burningText) {
            pion.burningText.destroy();
            pion.burningText = null;
        }
        if (pion.shieldText) {
            pion.shieldText.destroy();
            pion.shieldText = null;
        }
        if (pion.specialSprite) {
            pion.specialSprite.destroy();
            pion.specialSprite = null;
        }
        if (pion.selectionTween) {
            pion.selectionTween.stop();
            pion.selectionTween = null;
        }
        if (pion.aiIntentTween) {
            pion.aiIntentTween.stop();
            pion.aiIntentTween = null;
        }
        if (pion.tileVisual) {
            pion.tileVisual.setScale(1);
            pion.tileVisual = null;
        }
        if (pion.graphics) {
            pion.graphics.destroy();
        }

        const graphics = this.scene.add.container(centerX, centerY);
        const captureAnimation = pion.captureAnimation;
        const isAnimatingCapture = Boolean(captureAnimation && captureAnimation.active);
        const tileVisual = this.scene.add.container(0, 0);
        const tileSize = this.board.CELL_SIZE;
        const { displayWidth, displayHeight } = this.getTileDisplayMetrics();
        const introDisplayColor = this.board.boardRevealActive && pion.introDisplayColor
            ? pion.introDisplayColor
            : null;
        const renderColor = introDisplayColor || pion.color;
        const tileNode = isAnimatingCapture
            ? this.scene.add.sprite(
                0,
                0,
                captureAnimation.displayTexture || this.getTileTextureKey(renderColor),
                captureAnimation.displayFrame || 0
            )
            : this.scene.add.image(0, 0, this.getTileTextureKey(renderColor));
        tileNode.setOrigin(0.5, 0.5);
        tileNode.setDisplaySize(displayWidth, displayHeight);

        if (isAnimatingCapture) {
            if (tileNode instanceof Phaser.GameObjects.Sprite) {
                tileNode.setTexture(
                    captureAnimation.displayTexture || this.getTileTextureKey(renderColor),
                    captureAnimation.displayFrame || 0
                );
            }
        } else {
            if (pion.flashing) {
                tileNode.setTintFill(0xffffff);
            } else {
                tileNode.clearTint();
            }
        }

        if (pion.blinking) {
            tileNode.setAlpha(0.3);
        }

        tileVisual.add(tileNode);
        graphics.add(tileVisual);
        pion.tileVisual = tileVisual;

        const hitArea = this.scene.add.rectangle(0, 0, this.board.CELL_SIZE, this.board.CELL_SIZE, 0x000000, 0.001);
        hitArea.setOrigin(0.5, 0.5);
        graphics.add(hitArea);

        const placementColor = this.scene.gameState.currentPlayer;
        const isPlacingBomb = this.scene.gameState.pendingPlacementBonus === 'PLACE_BOMB';
        const isValidPlacement = isPlacingBomb &&
            pion.color === placementColor &&
            !pion.specialType &&
            !pion.isLocked &&
            !pion.isFrozen &&
            !pion.isSwamp &&
            !pion.isBurning;

        if (isPlacingBomb && !isValidPlacement) {
            const sepiaOverlay = this.scene.add.rectangle(0, 0, this.board.CELL_SIZE, this.board.CELL_SIZE, 0x6b4a2e, 0.42);
            sepiaOverlay.setOrigin(0.5, 0.5);
            graphics.add(sepiaOverlay);
        }

        if (pion.selectionMarked) {
            const selectionOverlay = this.scene.add.rectangle(0, 0, this.board.CELL_SIZE, this.board.CELL_SIZE, 0x000000, 0.42);
            selectionOverlay.setOrigin(0.5, 0.5);
            graphics.add(selectionOverlay);
        }

        if (pion.isBurning) {
            const burningOverlay = this.scene.add.rectangle(0, 0, this.board.CELL_SIZE, this.board.CELL_SIZE, 0xff8b1f, 0.28);
            burningOverlay.setOrigin(0.5, 0.5);
            graphics.add(burningOverlay);
        }

        if (pion.isLocked) {
            const lockedOverlay = this.scene.add.rectangle(0, 0, this.board.CELL_SIZE, this.board.CELL_SIZE, 0x2f2f2f, 0.52);
            lockedOverlay.setOrigin(0.5, 0.5);
            graphics.add(lockedOverlay);
        }

        if (this.board.orangePotionPreviewKeys.has(`${row},${col}`)) {
            const orangePotionOverlay = this.scene.add.rectangle(0, 0, this.board.CELL_SIZE, this.board.CELL_SIZE, 0x000000, 0.28);
            orangePotionOverlay.setOrigin(0.5, 0.5);
            graphics.add(orangePotionOverlay);
        }

        this.addSpecialTileVisuals(pion, graphics, tileSize, displayWidth, displayHeight);
        this.addBurningVisual(pion, graphics);
        this.addShieldVisual(pion, graphics);
        this.addLockedVisual(pion, graphics);

        hitArea.setInteractive();
        hitArea.on('pointerdown', () => {
            this.scene.handlePionClick(row, col);
        });

        hitArea.on('pointerover', () => {
            this.board.onPionHover(row, col, tileVisual, true);
        });

        hitArea.on('pointerout', () => {
            this.board.onPionHover(row, col, tileVisual, false);
        });

        if (this.board.boardRevealActive && pion.introHidden) {
            graphics.setAlpha(0);
        }

        pion.graphics = graphics;
    }

    addSpecialTileVisuals(pion, graphics, tileSize, tileDisplayWidth, tileDisplayHeight) {
        if (
            pion.specialType !== 'BOMB' &&
            pion.specialType !== 'SUPER_BOMB' &&
            pion.specialType !== 'LIGHTNING' &&
            pion.specialType !== 'ICE' &&
            pion.specialType !== 'SWAMP'
        ) {
            return;
        }

        if (pion.specialType === 'ICE') {
            pion.specialSprite = this.scene.add.image(0, 0, 'bonus-ice-icon')
                .setOrigin(0.5)
                .setDisplaySize(tileSize * 0.72, tileSize * 0.72)
                .setAlpha(0.9);
            graphics.add(pion.specialSprite);
            return;
        }

        if (pion.specialType === 'SWAMP') {
            pion.specialSprite = this.scene.add.image(0, 0, 'bonus-swamp-icon')
                .setOrigin(0.5)
                .setDisplaySize(tileSize * 0.72, tileSize * 0.72)
                .setAlpha(0.95);
            graphics.add(pion.specialSprite);
            return;
        }

        if (pion.specialType === 'BOMB') {
            pion.specialSprite = this.scene.add.image(0, 0, 'bonus-explosion-icon')
                .setOrigin(0.5)
                .setDisplaySize(tileSize * 0.74, tileSize * 0.74)
                .setAlpha(0.95);
            graphics.add(pion.specialSprite);
            return;
        }

        if (pion.specialType === 'SUPER_BOMB') {
            pion.specialSprite = this.scene.add.image(0, 0, 'bonus-bomb-icon')
                .setOrigin(0.5)
                .setDisplaySize(tileSize * 0.74, tileSize * 0.74)
                .setAlpha(0.95);
            if (pion.specialOwnerColor && this.board.COLORS[pion.specialOwnerColor]) {
                pion.specialSprite.setTint(this.board.COLORS[pion.specialOwnerColor]);
            }
            graphics.add(pion.specialSprite);
            return;
        }

        if (pion.specialType === 'LIGHTNING') {
            pion.specialSprite = this.scene.add.sprite(0, 0, 'bonus-lightning-tile', 0)
                .setOrigin(0.5)
                .setDisplaySize(tileDisplayWidth * 2, tileDisplayHeight * 2)
                .setAlpha(0.95);
            pion.specialSprite.play('bonus-lightning-tile-idle');
            graphics.add(pion.specialSprite);
            return;
        }

        let emoji = '💥';
        pion.emojiText = this.scene.add.text(0, 0, emoji, {
            fontSize: '18px'
        }).setOrigin(0.5);
        graphics.add(pion.emojiText);
    }

    addShieldVisual(pion, graphics) {
        if (!pion.isShielded) {
            return;
        }

        pion.shieldText = this.scene.add.text(0, 0, '🛡️', {
            fontSize: '17px'
        }).setOrigin(0.5);
        graphics.add(pion.shieldText);
    }

    addLockedVisual(pion, graphics) {
        if (!pion.isLocked) {
            return;
        }

        pion.shieldText = this.scene.add.text(0, 0, '🛡️', {
            fontSize: '17px'
        }).setOrigin(0.5);
        graphics.add(pion.shieldText);
    }

    addBurningVisual(pion, graphics) {
        if (!pion.isBurning) {
            return;
        }

        pion.burningText = this.scene.add.text(0, 0, '🔥', {
            fontSize: '16px'
        }).setOrigin(0.5);
        graphics.add(pion.burningText);
    }

    redrawPreviewCells(cellKeys) {
        cellKeys.forEach((key) => {
            const [row, col] = key.split(',').map(Number);
            if (Number.isInteger(row) && Number.isInteger(col)) {
                this.drawPion(this.scene.gameState.grid, row, col);
            }
        });
    }
}
