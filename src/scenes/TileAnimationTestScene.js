class TileAnimationTestScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TileAnimationTestScene' });
        this.gridSize = 8;
        this.playerOrder = ['ROUGE', 'BLEU', 'VERT', 'SCARLET'];
        this.currentPlayer = 'ROUGE';
        this.grid = [];
        this.cellSprites = [];
        this.isAnimating = false;
        this.introActive = false;
        this.lightningMarker = null;
    }

    init(data) {
        if (data?.language) {
            TranslationManager.setLanguage(data.language);
        }
    }

    preload() {
        this.load.image('tile-test-red-idle', 'assets/images/tiles/tile_red.png');
        this.load.image('tile-test-blue-idle', 'assets/images/tiles/tile_blue.png');
        this.load.image('tile-test-green-idle', 'assets/images/tiles/tile_green.png');
        this.load.image('tile-test-scarlet-idle', 'assets/images/tiles/tile_scarlet.png');
        this.load.image('tile-test-grey-idle', 'assets/images/tiles/tile_grey.png');
        this.load.spritesheet('tile-test-red-off', 'assets/images/tiles/tile_red_off.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tile-test-red-on', 'assets/images/tiles/tile_red_on.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tile-test-blue-off', 'assets/images/tiles/tile_blue_off.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tile-test-blue-on', 'assets/images/tiles/tile_blue_on.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tile-test-green-off', 'assets/images/tiles/tile_green_off.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tile-test-green-on', 'assets/images/tiles/tile_green_on.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tile-test-scarlet-off', 'assets/images/tiles/tile_scarlet_off.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tile-test-scarlet-on', 'assets/images/tiles/tile_scarlet_on.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tile-test-grey-off', 'assets/images/tiles/tile_grey_off.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tile-test-grey-on', 'assets/images/tiles/tile_grey_on.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.image('ui-button-left-off', 'assets/images/UI/bouton_bord_gauche_off.png');
        this.load.image('ui-button-fill-off', 'assets/images/UI/bouton_fond_off.png');
        this.load.image('ui-button-right-off', 'assets/images/UI/bouton_bord_droite_off.png');
        this.load.image('ui-button-left-on', 'assets/images/UI/bouton_bord_gauche_on.png');
        this.load.image('ui-button-fill-on', 'assets/images/UI/bouton_fond_on.png');
        this.load.image('ui-button-right-on', 'assets/images/UI/bouton_bord_droite_on.png');
        this.load.image('tile-test-lightning-clouds-left', 'assets/images/bonus/lightning/lightning_clouds_left.png');
        this.load.image('tile-test-lightning-clouds-right', 'assets/images/bonus/lightning/lightning_clouds_right.png');
        this.load.image('tile-test-lightning-1', 'assets/images/bonus/lightning/lightning.png');
        this.load.image('tile-test-lightning-2', 'assets/images/bonus/lightning/lightning2.png');
        this.load.image('tile-test-lightning-3', 'assets/images/bonus/lightning/lightning3.png');
        this.load.spritesheet('tile-test-lightning-tile', 'assets/images/bonus/lightning/tile_lightning.png', {
            frameWidth: 256,
            frameHeight: 256
        });
    }

    create() {
        const viewportWidth = this.scale.width || 800;
        const viewportHeight = this.scale.height || 700;
        const centerX = viewportWidth / 2;
        const isNarrowViewport = viewportWidth < 500;

        this.cameras.main.setBackgroundColor('#10131a');
        this.ensureTileAnimations();

        this.add.text(centerX, isNarrowViewport ? 24 : 30, TranslationManager.t('tile_test.title'), {
            fontSize: isNarrowViewport ? '28px' : '34px',
            fill: '#fff3d5',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            stroke: '#4a2d20',
            strokeThickness: 3
        }).setOrigin(0.5, 0);

        this.infoText = this.add.text(centerX, isNarrowViewport ? 66 : 78, TranslationManager.t('tile_test.subtitle'), {
            fontSize: isNarrowViewport ? '14px' : '17px',
            fill: '#d0c5b4',
            fontFamily: 'Vollkorn',
            align: 'center',
            wordWrap: { width: isNarrowViewport ? viewportWidth - 28 : 560 }
        }).setOrigin(0.5, 0);

        this.turnText = this.add.text(centerX, this.infoText.y + this.infoText.height + 12, '', {
            fontSize: isNarrowViewport ? '18px' : '22px',
            fill: '#ffffff',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        const boardTop = this.turnText.y + this.turnText.height + 20;
        const horizontalPadding = isNarrowViewport ? 18 : 40;
        this.cellSize = Math.floor(Math.min(
            (viewportWidth - horizontalPadding * 2) / this.gridSize,
            (viewportHeight - boardTop - 120) / this.gridSize
        ));
        this.cellSize = Math.max(isNarrowViewport ? 34 : 42, this.cellSize);
        this.tileDisplayWidth = this.cellSize;
        this.tileDisplayHeight = this.tileDisplayWidth;
        this.boardOffsetX = Math.floor((viewportWidth - this.gridSize * this.cellSize) / 2);
        this.boardOffsetY = boardTop;

        this.boardFrame = this.add.rectangle(
            centerX,
            this.boardOffsetY + (this.gridSize * this.cellSize) / 2,
            this.gridSize * this.cellSize + 10,
            this.gridSize * this.cellSize + 10,
            0xAF7E4C,
            1
        );

        this.createControlButtons(
            centerX,
            this.boardOffsetY + this.gridSize * this.cellSize + (isNarrowViewport ? 42 : 50),
            isNarrowViewport
        );

        this.buildRandomGrid();
        this.renderBoard();
        this.turnText.setText('');
        this.startBoardIntroAnimation();
    }

    ensureTileAnimations() {
        const definitions = [
            { key: 'tile-test-red-off-anim', texture: 'tile-test-red-off' },
            { key: 'tile-test-red-on-anim', texture: 'tile-test-red-on' },
            { key: 'tile-test-blue-off-anim', texture: 'tile-test-blue-off' },
            { key: 'tile-test-blue-on-anim', texture: 'tile-test-blue-on' },
            { key: 'tile-test-green-off-anim', texture: 'tile-test-green-off' },
            { key: 'tile-test-green-on-anim', texture: 'tile-test-green-on' },
            { key: 'tile-test-scarlet-off-anim', texture: 'tile-test-scarlet-off' },
            { key: 'tile-test-scarlet-on-anim', texture: 'tile-test-scarlet-on' },
            { key: 'tile-test-grey-off-anim', texture: 'tile-test-grey-off' },
            { key: 'tile-test-grey-on-anim', texture: 'tile-test-grey-on' }
        ];

        definitions.forEach(({ key, texture }) => {
            if (this.anims.exists(key)) {
                return;
            }

            const totalFrames = this.textures.get(texture)?.frameTotal || 1;
            this.anims.create({
                key,
                frames: this.anims.generateFrameNumbers(texture, { start: 0, end: Math.max(0, totalFrames - 1) }),
                frameRate: 14,
                repeat: 0
            });
        });

        if (!this.anims.exists('tile-test-lightning-tile-idle')) {
            this.anims.create({
                key: 'tile-test-lightning-tile-idle',
                frames: this.anims.generateFrameNumbers('tile-test-lightning-tile', {
                    start: 0,
                    end: 9
                }),
                frameRate: 18,
                repeat: -1
            });
        }
    }

    buildRandomGrid() {
        this.grid = Array.from({ length: this.gridSize }, (_, row) =>
            Array.from({ length: this.gridSize }, (_, col) => ({
                row,
                col,
                color: 'GRIS'
            }))
        );

        this.applyCornerSeed(0, 0, 'ROUGE');
        this.applyCornerSeed(0, this.gridSize - 2, 'BLEU');
        this.applyCornerSeed(this.gridSize - 2, 0, 'VERT');
        this.applyCornerSeed(this.gridSize - 2, this.gridSize - 2, 'SCARLET');
        this.currentPlayer = 'ROUGE';
    }

    applyCornerSeed(startRow, startCol, color) {
        for (let row = startRow; row < startRow + 2; row++) {
            for (let col = startCol; col < startCol + 2; col++) {
                if (this.grid[row]?.[col]) {
                    this.grid[row][col].color = color;
                }
            }
        }
    }

    countTiles(grid, color) {
        let count = 0;
        grid.forEach((row) => row.forEach((cell) => {
            if (cell.color === color) {
                count += 1;
            }
        }));
        return count;
    }

    hasAnyCapture(grid, playerColor) {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.canCapture(grid, row, col, playerColor)) {
                    return true;
                }
            }
        }
        return false;
    }

    canCapture(grid, row, col, playerColor) {
        const cell = grid[row]?.[col];
        if (!cell || cell.color === playerColor) {
            return false;
        }

        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                if (rowOffset === 0 && colOffset === 0) {
                    continue;
                }

                const neighbor = grid[row + rowOffset]?.[col + colOffset];
                if (neighbor?.color === playerColor) {
                    return true;
                }
            }
        }

        return false;
    }

    renderBoard() {
        this.cellSprites.forEach((entry) => {
            entry.zone.destroy();
            entry.sprite.destroy();
            entry.border.destroy();
        });
        this.cellSprites = [];

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const centerX = this.boardOffsetX + col * this.cellSize + this.cellSize / 2;
                const centerY = this.boardOffsetY + row * this.cellSize + this.cellSize / 2;
                const border = this.add.rectangle(centerX, centerY, this.cellSize, this.cellSize, 0x000000, 0)
                    .setVisible(false);
                const sprite = this.add.sprite(centerX, centerY, this.getIdleTextureKey(this.grid[row][col].color), 0)
                    .setDisplaySize(this.tileDisplayWidth, this.tileDisplayHeight);
                const zone = this.add.zone(centerX, centerY, this.cellSize, this.cellSize)
                    .setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });
                zone.on('pointerdown', () => this.handleCellClick(row, col));
                zone.on('pointerover', () => this.handleCellPointerOver(row, col));
                zone.on('pointerout', () => this.handleCellPointerOut(row, col));

                this.cellSprites.push({ row, col, border, sprite, zone });
            }
        }

        this.refreshCaptureHighlights();
    }

    refreshCaptureHighlights() {
        this.cellSprites.forEach((entry) => {
            const isCapturable = !this.isAnimating && this.canCapture(this.grid, entry.row, entry.col, this.currentPlayer);
            entry.sprite.setAlpha(isCapturable ? 1 : 0.92);
            entry.sprite.setScale(this.tileDisplayWidth / entry.sprite.width, this.tileDisplayHeight / entry.sprite.height);
        });
    }

    handleCellPointerOver(row, col) {
        if (this.isAnimating || !this.canCapture(this.grid, row, col, this.currentPlayer)) {
            return;
        }

        const entry = this.cellSprites.find((cell) => cell.row === row && cell.col === col);
        if (!entry) {
            return;
        }

        this.tweens.killTweensOf(entry.sprite);
        this.tweens.add({
            targets: entry.sprite,
            scaleX: (this.tileDisplayWidth / entry.sprite.width) * 1.08,
            scaleY: (this.tileDisplayHeight / entry.sprite.height) * 1.08,
            duration: 120,
            ease: 'Sine.easeOut'
        });
    }

    handleCellPointerOut(row, col) {
        const entry = this.cellSprites.find((cell) => cell.row === row && cell.col === col);
        if (!entry) {
            return;
        }

        this.tweens.killTweensOf(entry.sprite);
        this.tweens.add({
            targets: entry.sprite,
            scaleX: this.tileDisplayWidth / entry.sprite.width,
            scaleY: this.tileDisplayHeight / entry.sprite.height,
            duration: 100,
            ease: 'Sine.easeOut'
        });
    }

    handleCellClick(row, col) {
        if (this.introActive || this.isAnimating || !this.canCapture(this.grid, row, col, this.currentPlayer)) {
            return;
        }

        const toColor = this.currentPlayer;
        const capturedCells = this.getCapturedCells(row, col, this.currentPlayer);
        if (capturedCells.length <= 0) {
            return;
        }

        this.isAnimating = true;
        this.refreshCaptureHighlights();

        let pendingAnimations = capturedCells.length;
        capturedCells.forEach(({ row: capturedRow, col: capturedCol, fromColor }) => {
            const entry = this.cellSprites.find((cell) => cell.row === capturedRow && cell.col === capturedCol);
            if (!entry) {
                pendingAnimations -= 1;
                return;
            }

            this.playCaptureAnimation(entry.sprite, fromColor, toColor, () => {
                this.grid[capturedRow][capturedCol].color = toColor;
                entry.sprite.setTexture(this.getIdleTextureKey(toColor));
                entry.sprite.setFrame(0);
                pendingAnimations -= 1;

                if (pendingAnimations > 0) {
                    return;
                }

                this.currentPlayer = this.getNextPlayablePlayer(this.currentPlayer);
                this.isAnimating = false;

                this.updateTurnText();
                this.refreshCaptureHighlights();
            });
        });
    }

    getNextPlayablePlayer(currentPlayer) {
        const currentIndex = this.playerOrder.indexOf(currentPlayer);
        for (let offset = 1; offset <= this.playerOrder.length; offset++) {
            const nextColor = this.playerOrder[(currentIndex + offset) % this.playerOrder.length];
            if (this.hasAnyCapture(this.grid, nextColor)) {
                return nextColor;
            }
        }

        return currentPlayer;
    }

    getCapturedCells(row, col, playerColor) {
        const capturedCells = [];

        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                const nextRow = row + rowOffset;
                const nextCol = col + colOffset;
                const cell = this.grid[nextRow]?.[nextCol];
                if (!cell || cell.color === playerColor) {
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
    }

    playCaptureAnimation(sprite, fromColor, toColor, onComplete) {
        const offAnimationKey = this.getAnimationKey(fromColor, 'off');
        const onAnimationKey = this.getAnimationKey(toColor, 'on');
        const offTextureKey = this.getTextureKey(fromColor, 'off');
        const onTextureKey = this.getTextureKey(toColor, 'on');

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
    }

    getIdleTextureKey(color) {
        return this.getTextureKey(color, 'idle');
    }

    getTextureKey(color, state) {
        const mapping = {
            ROUGE: {
                idle: 'tile-test-red-idle',
                off: 'tile-test-red-off',
                on: 'tile-test-red-on'
            },
            BLEU: {
                idle: 'tile-test-blue-idle',
                off: 'tile-test-blue-off',
                on: 'tile-test-blue-on'
            },
            VERT: {
                idle: 'tile-test-green-idle',
                off: 'tile-test-green-off',
                on: 'tile-test-green-on'
            },
            SCARLET: {
                idle: 'tile-test-scarlet-idle',
                off: 'tile-test-scarlet-off',
                on: 'tile-test-scarlet-on'
            },
            GRIS: {
                idle: 'tile-test-grey-idle',
                off: 'tile-test-grey-off',
                on: 'tile-test-grey-on'
            }
        };

        return mapping[color]?.[state] || mapping.GRIS.idle;
    }

    getAnimationKey(color, state) {
        const mapping = {
            ROUGE: {
                off: 'tile-test-red-off-anim',
                on: 'tile-test-red-on-anim'
            },
            BLEU: {
                off: 'tile-test-blue-off-anim',
                on: 'tile-test-blue-on-anim'
            },
            VERT: {
                off: 'tile-test-green-off-anim',
                on: 'tile-test-green-on-anim'
            },
            SCARLET: {
                off: 'tile-test-scarlet-off-anim',
                on: 'tile-test-scarlet-on-anim'
            },
            GRIS: {
                off: 'tile-test-grey-off-anim',
                on: 'tile-test-grey-on-anim'
            }
        };

        return mapping[color]?.[state] || mapping.GRIS.on;
    }

    updateTurnText() {
        const turnKeyMap = {
            ROUGE: 'tile_test.turn_red',
            BLEU: 'tile_test.turn_blue',
            VERT: 'tile_test.turn_green',
            SCARLET: 'tile_test.turn_scarlet'
        };
        const turnKey = turnKeyMap[this.currentPlayer] || 'tile_test.turn_red';
        this.turnText.setText(TranslationManager.t(turnKey));
    }

    startBoardIntroAnimation() {
        this.introActive = true;
        this.isAnimating = true;
        this.refreshCaptureHighlights();

        const neutralTextureKey = this.getIdleTextureKey('GRIS');
        this.cellSprites.forEach((entry) => {
            entry.sprite.setVisible(false);
            entry.sprite.setTexture(neutralTextureKey);
            entry.sprite.setFrame(0);
        });

        const waveEntries = this.getRandomNeutralIntroEntries();

        waveEntries.forEach((entry, index) => {
            this.time.delayedCall(index * 24, () => {
                entry.sprite.setVisible(true);
                this.playIntroAnimation(entry.sprite, 'GRIS', () => {
                    entry.sprite.setTexture(neutralTextureKey);
                    entry.sprite.setFrame(0);
                });
            });
        });

        const finalWaveDelay = waveEntries.length * 24 + 120;
        this.time.delayedCall(finalWaveDelay, () => this.startPlayerClaimAnimation());
    }

    getRandomNeutralIntroEntries() {
        const introVariants = [
            this.getCornerWaveEntries.bind(this),
            this.getCenterSpiralEntries.bind(this),
            this.getFourCornersEntries.bind(this)
        ];
        const selectedVariant = Phaser.Utils.Array.GetRandom(introVariants);
        return selectedVariant();
    }

    getCornerWaveEntries() {
        return [...this.cellSprites].sort((left, right) => {
            const leftScore = left.row + left.col;
            const rightScore = right.row + right.col;
            if (leftScore !== rightScore) {
                return leftScore - rightScore;
            }
            return left.row - right.row || left.col - right.col;
        });
    }

    getCenterSpiralEntries() {
        const center = (this.gridSize - 1) / 2;
        return [...this.cellSprites].sort((left, right) => {
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

    getFourCornersEntries() {
        const lastIndex = this.gridSize - 1;
        return [...this.cellSprites].sort((left, right) => {
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

    startPlayerClaimAnimation() {
        const claimedEntries = this.cellSprites
            .filter((entry) => this.grid[entry.row][entry.col].color !== 'GRIS')
            .sort((left, right) => {
                const leftScore = left.row + left.col;
                const rightScore = right.row + right.col;
                if (leftScore !== rightScore) {
                    return leftScore - rightScore;
                }
                return left.row - right.row || left.col - right.col;
            });

        claimedEntries.forEach((entry, index) => {
            const targetColor = this.grid[entry.row][entry.col].color;
            this.time.delayedCall(index * 55, () => {
                this.playIntroAnimation(entry.sprite, targetColor, () => {
                    entry.sprite.setTexture(this.getIdleTextureKey(targetColor));
                    entry.sprite.setFrame(0);
                });
            });
        });

        const endDelay = claimedEntries.length * 55 + 180;
        this.time.delayedCall(endDelay, () => {
            this.introActive = false;
            this.isAnimating = false;
            this.updateTurnText();
            this.refreshCaptureHighlights();
        });
    }

    playIntroAnimation(sprite, color, onComplete) {
        const animationKey = this.getAnimationKey(color, 'on');
        const textureKey = this.getTextureKey(color, 'on');

        sprite.setTexture(textureKey);
        sprite.setFrame(0);
        sprite.off(`animationcomplete-${animationKey}`);
        sprite.once(`animationcomplete-${animationKey}`, () => {
            if (onComplete) {
                onComplete();
            }
        });
        sprite.play(animationKey);
    }

    createControlButtons(centerX, y, isNarrowViewport) {
        const buttonWidth = isNarrowViewport ? 128 : 150;
        const buttonSpacing = isNarrowViewport ? 138 : 162;
        const shuffleButton = this.createUiButton(
            centerX - buttonSpacing,
            y,
            buttonWidth,
            42,
            TranslationManager.t('tile_test.shuffle'),
            isNarrowViewport ? '16px' : '18px'
        );
        shuffleButton.hitArea.on('pointerover', () => shuffleButton.setState(true));
        shuffleButton.hitArea.on('pointerout', () => shuffleButton.setState(false));
        shuffleButton.hitArea.on('pointerdown', () => {
            shuffleButton.setState(true);
            this.buildRandomGrid();
            this.renderBoard();
            this.turnText.setText('');
            this.startBoardIntroAnimation();
        });

        const lightningButton = this.createUiButton(
            centerX,
            y,
            buttonWidth,
            42,
            TranslationManager.t('tile_test.lightning'),
            isNarrowViewport ? '16px' : '18px'
        );
        lightningButton.hitArea.on('pointerover', () => lightningButton.setState(true));
        lightningButton.hitArea.on('pointerout', () => lightningButton.setState(false));
        lightningButton.hitArea.on('pointerdown', () => {
            lightningButton.setState(true);
            this.triggerLightningSequence();
        });

        const backButton = this.createUiButton(
            centerX + buttonSpacing,
            y,
            buttonWidth,
            42,
            TranslationManager.t('menu.back'),
            isNarrowViewport ? '16px' : '18px'
        );
        backButton.hitArea.on('pointerover', () => backButton.setState(true));
        backButton.hitArea.on('pointerout', () => backButton.setState(false));
        backButton.hitArea.on('pointerdown', () => {
            backButton.setState(true);
            this.scene.start('MainMenuScene', { language: TranslationManager.getLanguage() });
        });
    }

    triggerLightningSequence() {
        if (this.introActive || this.isAnimating) {
            return;
        }

        const targetEntry = this.getRandomLightningTargetEntry();
        if (!targetEntry) {
            return;
        }

        this.isAnimating = true;
        this.refreshCaptureHighlights();

        const viewportWidth = this.scale.width || 800;
        const cloudsY = this.boardOffsetY - Math.max(32, Math.round(this.cellSize * 0.9));
        const leftCloud = this.add.image(-20, cloudsY, 'tile-test-lightning-clouds-left')
            .setOrigin(0, 0.5)
            .setScale(5)
            .setDepth(20);
        const rightCloud = this.add.image(viewportWidth + 20, cloudsY, 'tile-test-lightning-clouds-right')
            .setOrigin(1, 0.5)
            .setScale(5)
            .setDepth(20);

        const overlapX = this.boardOffsetX + (this.gridSize * this.cellSize) / 2;
        const leftTargetX = overlapX - Math.round(this.cellSize * 0.35);
        const rightTargetX = overlapX + Math.round(this.cellSize * 0.35);

        this.tweens.add({
            targets: leftCloud,
            x: leftTargetX,
            duration: 360,
            ease: 'Sine.easeOut'
        });
        this.tweens.add({
            targets: rightCloud,
            x: rightTargetX,
            duration: 360,
            ease: 'Sine.easeOut',
            onComplete: () => this.playLightningBursts(targetEntry, leftCloud, rightCloud)
        });
    }

    playLightningBursts(targetEntry, leftCloud, rightCloud) {
        const lightningKeys = [
            'tile-test-lightning-1',
            'tile-test-lightning-2',
            'tile-test-lightning-3',
            'tile-test-lightning-2',
            'tile-test-lightning-1'
        ];
        const centerX = this.boardOffsetX + (this.gridSize * this.cellSize) / 2;
        const targetY = targetEntry.sprite.y - Math.round(this.tileDisplayHeight * 0.2);

        lightningKeys.forEach((textureKey, index) => {
            this.time.delayedCall(index * 90, () => {
                const lightning = this.add.image(centerX, targetY - 48, textureKey)
                    .setOrigin(0.5, 0)
                    .setDepth(21)
                    .setScale(4.2);
                this.cameras.main.flash(70, 255, 255, 255, false);
                this.cameras.main.shake(90, 0.0035);
                this.tweens.add({
                    targets: lightning,
                    alpha: 0,
                    duration: 70,
                    ease: 'Linear',
                    onComplete: () => lightning.destroy()
                });
            });
        });

        const endDelay = lightningKeys.length * 90 + 40;
        this.time.delayedCall(endDelay, () => {
            this.tweens.add({
                targets: [leftCloud, rightCloud],
                alpha: 0,
                duration: 160,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    leftCloud.destroy();
                    rightCloud.destroy();
                    this.placeLightningMarker(targetEntry);
                    this.isAnimating = false;
                    this.refreshCaptureHighlights();
                }
            });
        });
    }

    getRandomLightningTargetEntry() {
        const neutralEntries = this.cellSprites.filter((entry) => this.grid[entry.row][entry.col].color === 'GRIS');
        const pool = neutralEntries.length > 0 ? neutralEntries : this.cellSprites;
        return Phaser.Utils.Array.GetRandom(pool);
    }

    placeLightningMarker(targetEntry) {
        if (this.lightningMarker) {
            this.lightningMarker.destroy();
            this.lightningMarker = null;
        }

        this.lightningMarker = this.add.sprite(targetEntry.sprite.x, targetEntry.sprite.y, 'tile-test-lightning-tile', 0)
            .setOrigin(0.5, 0.5)
            .setDepth(22)
            .setScale(1.28);
        this.lightningMarker.play('tile-test-lightning-tile-idle');
    }

    createUiButton(x, y, width, height, label, fontSize = '16px') {
        const leftWidth = 18;
        const rightWidth = 18;
        const fillWidth = Math.max(8, width - leftWidth - rightWidth);
        const container = this.add.container(x, y);
        const left = this.add.image(-width / 2 + leftWidth / 2, 0, 'ui-button-left-off')
            .setDisplaySize(leftWidth, height)
            .setOrigin(0.5);
        const fill = this.add.image(0, 0, 'ui-button-fill-off')
            .setDisplaySize(fillWidth, height)
            .setOrigin(0.5);
        const right = this.add.image(width / 2 - rightWidth / 2, 0, 'ui-button-right-off')
            .setDisplaySize(rightWidth, height)
            .setOrigin(0.5);
        const text = this.add.text(0, 1, label, {
            fontSize,
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const hitArea = this.add.zone(0, 0, width, height)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        container.add([left, fill, right, text, hitArea]);

        const setState = (isOn) => {
            left.setTexture(isOn ? 'ui-button-left-on' : 'ui-button-left-off');
            fill.setTexture(isOn ? 'ui-button-fill-on' : 'ui-button-fill-off');
            right.setTexture(isOn ? 'ui-button-right-on' : 'ui-button-right-off');
            text.setColor(isOn ? '#fff8de' : '#f3e8d2');
        };

        return { container, hitArea, setState };
    }
}
