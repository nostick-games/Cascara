class StrategoScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StrategoScene' });
    }

    init(data) {
        if (data?.language) {
            TranslationManager.setLanguage(data.language);
        }
    }

    preload() {
        this.load.image('ui-button-left-off', 'assets/images/UI/bouton_bord_gauche_off.png');
        this.load.image('ui-button-fill-off', 'assets/images/UI/bouton_fond_off.png');
        this.load.image('ui-button-right-off', 'assets/images/UI/bouton_bord_droite_off.png');
        this.load.image('ui-button-left-on', 'assets/images/UI/bouton_bord_gauche_on.png');
        this.load.image('ui-button-fill-on', 'assets/images/UI/bouton_fond_on.png');
        this.load.image('ui-button-right-on', 'assets/images/UI/bouton_bord_droite_on.png');
        this.load.image('stratego-tile-red', 'assets/images/tiles/red.png');
        this.load.image('stratego-tile-grey', 'assets/images/tiles/grey.png');
        this.load.image('arcade-kingdom-verdombre', 'assets/images/astrolabe/verdombre.png');
        this.load.image('arcade-kingdom-vulkarn', 'assets/images/astrolabe/Vulkarn.png');
        this.load.image('arcade-kingdom-drazhul', 'assets/images/astrolabe/drazhul.png');
    }

    create() {
        const viewportWidth = this.scale.width || 800;
        const viewportHeight = this.scale.height || 700;
        const centerX = viewportWidth / 2;
        const isNarrowViewport = viewportWidth < 500;
        const titleY = isNarrowViewport ? 28 : 36;
        const subtitleY = isNarrowViewport ? 86 : 116;
        const availableArcadeKingdoms = ArcadeKingdomCatalog.getUnlockedForArcade();
        const shouldShowKingdomCarousel = availableArcadeKingdoms.length > 1;
        const sizeLabelY = subtitleY + (isNarrowViewport ? 82 : 92);
        const sizeButtonsY = sizeLabelY + 46;
        const thumbnailsTitleY = sizeButtonsY + (isNarrowViewport ? 56 : 64);
        const thumbnailsY = thumbnailsTitleY + (isNarrowViewport ? 52 : 60);
        const detailsY = thumbnailsY + (isNarrowViewport ? 132 : 154);
        const kingdomsTitleY = detailsY + (isNarrowViewport ? 38 : 44);
        const kingdomsCarouselY = kingdomsTitleY + (isNarrowViewport ? 28 : 34);
        const goButtonY = Math.min(
            viewportHeight - 90,
            (shouldShowKingdomCarousel ? kingdomsCarouselY + (isNarrowViewport ? 114 : 126) : detailsY) + 88
        );
        const backButtonY = Math.min(viewportHeight - 34, goButtonY + 58);
        const optionSpacing = isNarrowViewport ? 100 : 112;
        const buttonBaseX = centerX - optionSpacing;
        const boardSizes = [8, 12, 14];
        const seedPatternIdsByBoardSize = {
            8: StrategoPuzzleGenerator.getSeedPatternIds(8),
            12: StrategoPuzzleGenerator.getSeedPatternIds(12),
            14: StrategoPuzzleGenerator.getSeedPatternIds(14)
        };
        const selectedSeedPatternByBoardSize = {
            8: seedPatternIdsByBoardSize[8][0] || null,
            12: seedPatternIdsByBoardSize[12][0] || null,
            14: seedPatternIdsByBoardSize[14][0] || null
        };
        let selectedBoardSize = null;
        let selectedArcadeKingdomIndex = 0;

        this.cameras.main.setBackgroundColor('#060606');

        this.add.text(centerX, titleY, TranslationManager.t('astrolabe.item.stratego.title'), {
            fontSize: isNarrowViewport ? '30px' : '40px',
            fill: '#fff3d5',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#4a2d20',
            strokeThickness: 3
        }).setOrigin(0.5, 0);

        this.add.text(centerX, subtitleY, TranslationManager.t('stratego.subtitle'), {
            fontSize: isNarrowViewport ? '16px' : '20px',
            fill: '#d0c5b4',
            fontFamily: 'Vollkorn',
            align: 'center',
            wordWrap: { width: isNarrowViewport ? viewportWidth - 36 : 560 }
        }).setOrigin(0.5);

        this.add.text(centerX, sizeLabelY, TranslationManager.t('stratego.board_size'), {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Vollkorn'
        }).setOrigin(0.5);

        const sizeButtons = [];
        const sizeTexts = [];
        const thumbnailCards = [];
        const thumbnailsTitle = this.add.text(centerX, thumbnailsTitleY, TranslationManager.t('stratego.choose_puzzle'), {
            fontSize: isNarrowViewport ? '16px' : '18px',
            fill: '#ffffff',
            fontFamily: 'Vollkorn',
            align: 'center'
        }).setOrigin(0.5);
        const detailsText = this.add.text(centerX, detailsY, '', {
            fontSize: isNarrowViewport ? '15px' : '18px',
            fill: '#f8fafc',
            fontFamily: 'Vollkorn',
            align: 'center'
        }).setOrigin(0.5);

        const thumbnailsContainer = this.add.container(centerX, thumbnailsY);

        const updateSelection = () => {
            const currentPatternIds = selectedBoardSize ? (seedPatternIdsByBoardSize[selectedBoardSize] || []) : [];
            const selectedSeedPatternId = selectedBoardSize ? selectedSeedPatternByBoardSize[selectedBoardSize] : null;
            const canSelectPuzzle = currentPatternIds.length > 1;
            const thumbnailSpacing = isNarrowViewport
                ? Math.min(72, Math.floor((viewportWidth - 40) / Math.max(1, currentPatternIds.length || 1)))
                : 94;
            const thumbnailStartX = -((Math.max(0, currentPatternIds.length - 1)) * thumbnailSpacing) / 2;

            boardSizes.forEach((boardSize, index) => {
                const isSelected = boardSize === selectedBoardSize;
                sizeButtons[index].setState(isSelected);
                sizeTexts[index].setText(`${boardSize} x ${boardSize}`);
            });

            const hasSelectedBoardSize = selectedBoardSize !== null;
            const showThumbnails = hasSelectedBoardSize && canSelectPuzzle;
            thumbnailsTitle.setVisible(showThumbnails);
            thumbnailsContainer.setVisible(showThumbnails);
            thumbnailCards.forEach((card) => {
                const shouldShow = showThumbnails && card.boardSize === selectedBoardSize;
                card.container.setVisible(shouldShow);
                card.hitArea.disableInteractive();
                if (shouldShow) {
                    card.container.setX(thumbnailStartX + card.index * thumbnailSpacing);
                    card.hitArea.setInteractive({ useHandCursor: true });
                }
                const isSelected = shouldShow && card.patternId === selectedSeedPatternId;
                card.setSelected(isSelected);
            });

            detailsText.setVisible(hasSelectedBoardSize);
            startButton.container.setVisible(hasSelectedBoardSize);

            if (!hasSelectedBoardSize) {
                detailsText.setText('');
                return;
            }

            const settings = StrategoPuzzleGenerator.getSettings(selectedBoardSize);
            const bestMoveCount = selectedSeedPatternId
                ? MetaProgression.getStrategoSolvedMoveCount(selectedBoardSize, selectedSeedPatternId)
                : null;
            if (bestMoveCount !== null) {
                detailsText.setText(TranslationManager.t('stratego.best_score', {
                    value: bestMoveCount
                }));
            } else {
                detailsText.setText(TranslationManager.t('stratego.moves_range', {
                    min: settings.moveRange[0],
                    max: settings.moveRange[1]
                }));
            }
        };

        boardSizes.forEach((boardSize, index) => {
            const x = buttonBaseX + index * optionSpacing;
            const button = this.createUiButton(
                x,
                sizeButtonsY,
                isNarrowViewport ? 86 : 100,
                42,
                `${boardSize} x ${boardSize}`,
                isNarrowViewport ? '14px' : '16px'
            );
            const label = button.label;

            button.hitArea.on('pointerdown', () => {
                selectedBoardSize = boardSize;
                updateSelection();
            });

            button.hitArea.on('pointerover', () => {
                if (selectedBoardSize !== boardSize) {
                    button.setState(true);
                }
            });

            button.hitArea.on('pointerout', () => {
                updateSelection();
            });

            sizeButtons.push(button);
            sizeTexts.push(label);
        });

        [8, 12, 14].forEach((boardSize) => {
            const patternIds = seedPatternIdsByBoardSize[boardSize] || [];
            patternIds.forEach((patternId, index) => {
                const card = this.createPuzzleThumbnailCard(
                    0,
                    0,
                    boardSize,
                    patternId,
                    index,
                    isNarrowViewport
                );
                card.container.setVisible(false);
                card.hitArea.disableInteractive();
                card.hitArea.on('pointerdown', () => {
                    selectedSeedPatternByBoardSize[boardSize] = patternId;
                    updateSelection();
                });
                card.hitArea.on('pointerover', () => {
                    if (selectedBoardSize === boardSize && selectedSeedPatternByBoardSize[boardSize] !== patternId) {
                        card.setHover(true);
                    }
                });
                card.hitArea.on('pointerout', () => {
                    card.setHover(false);
                    updateSelection();
                });
                thumbnailsContainer.add(card.container);
                thumbnailCards.push(card);
            });
        });

        if (shouldShowKingdomCarousel) {
            this.add.text(centerX, kingdomsTitleY, TranslationManager.t('briefing.kingdoms'), {
                fontSize: isNarrowViewport ? '16px' : '18px',
                fill: '#ffffff',
                fontFamily: 'Vollkorn',
                align: 'center'
            }).setOrigin(0.5);

            BriefingArcadeKingdomCarousel.create(this, {
                centerX,
                topY: kingdomsCarouselY,
                sectionWidth: Math.min(isNarrowViewport ? viewportWidth - 52 : 360, viewportWidth - 36),
                isNarrowViewport,
                getAvailableKingdoms: () => availableArcadeKingdoms,
                selectedKingdomIndex: () => selectedArcadeKingdomIndex,
                isKingdomChosen: () => false,
                onSelectionChange: (nextIndex) => {
                    selectedArcadeKingdomIndex = nextIndex;
                },
                onSelectCurrent: () => {}
            });
        }

        const startButton = this.createUiButton(
            centerX,
            goButtonY,
            isNarrowViewport ? 200 : 220,
            54,
            TranslationManager.t('stratego.start'),
            isNarrowViewport ? '26px' : '30px'
        );
        startButton.hitArea.on('pointerover', () => startButton.setState(true));
        startButton.hitArea.on('pointerout', () => startButton.setState(false));
        startButton.hitArea.on('pointerdown', () => {
            if (selectedBoardSize === null) {
                return;
            }
            startButton.setState(true);
            const puzzle = StrategoPuzzleGenerator.generate(selectedBoardSize, {
                seedPatternId: selectedSeedPatternByBoardSize[selectedBoardSize] || null
            });
            this.scene.start('GameScene', {
                aiCount: 0,
                boardSize: selectedBoardSize,
                difficulty: 'NORMAL',
                language: TranslationManager.getLanguage(),
                arcadeKingdomId: availableArcadeKingdoms[selectedArcadeKingdomIndex]?.id || 'VERDOMBRE',
                strategoConfig: puzzle
            });
        });
        startButton.container.setVisible(false);

        const backButton = this.createUiButton(
            centerX,
            backButtonY,
            isNarrowViewport ? 180 : 200,
            42,
            TranslationManager.t('menu.back'),
            isNarrowViewport ? '18px' : '20px'
        );
        backButton.hitArea.on('pointerover', () => backButton.setState(true));
        backButton.hitArea.on('pointerout', () => backButton.setState(false));
        backButton.hitArea.on('pointerdown', () => {
            backButton.setState(true);
            this.time.delayedCall(120, () => {
                this.scene.start('MainMenuScene', { language: TranslationManager.getLanguage() });
            });
        });

        updateSelection();
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

        return {
            container,
            label: text,
            hitArea,
            setState
        };
    }

    createPuzzleThumbnailCard(x, y, boardSize, patternId, index, isNarrowViewport) {
        const container = this.add.container(x, y);
        const previewCellSize = this.getPuzzleThumbnailCellSize(boardSize, isNarrowViewport);
        const previewSize = previewCellSize * boardSize;
        const framePadding = isNarrowViewport ? 4 : 5;
        const width = previewSize + framePadding * 2;
        const height = width;
        const frame = this.add.rectangle(0, -6, width, height, 0x25131A, 0.88)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x895A45, 1);
        const preview = this.createPuzzleThumbnailPreview(0, -6, boardSize, patternId, isNarrowViewport);
        const hitArea = this.add.zone(0, 0, width, height)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        container.add([frame, preview, hitArea]);

        const setSelected = (isSelected) => {
            frame.setStrokeStyle(2, isSelected ? 0xf3c37a : 0x895A45, 1);
            frame.setFillStyle(isSelected ? 0x3b2419 : 0x25131A, 0.92);
        };

        const setHover = (isHovering) => {
            if (isHovering) {
                frame.setFillStyle(0x3b2419, 0.92);
            }
        };

        const solvedBadge = MetaProgression.hasSolvedStrategoPattern(boardSize, patternId)
            ? StoryMapRenderer.createCompletedNodeBadge(
                this,
                width / 2 - (isNarrowViewport ? 10 : 12),
                -height / 2 + (isNarrowViewport ? 10 : 12) - 6,
                isNarrowViewport
            ).setAlpha(1)
            : null;
        if (solvedBadge) {
            container.add(solvedBadge);
        }

        return {
            container,
            hitArea,
            boardSize,
            patternId,
            index,
            setSelected,
            setHover
        };
    }

    getPuzzleThumbnailCellSize(boardSize, isNarrowViewport) {
        if (boardSize === 14) {
            return isNarrowViewport ? 3 : 4;
        }
        if (boardSize === 12) {
            return isNarrowViewport ? 4 : 5;
        }
        return isNarrowViewport ? 6 : 7;
    }

    createPuzzleThumbnailPreview(x, y, boardSize, patternId, isNarrowViewport) {
        const preview = this.add.container(x, y);
        const cellSize = this.getPuzzleThumbnailCellSize(boardSize, isNarrowViewport);
        const totalSize = boardSize * cellSize;
        const startX = -totalSize / 2 + cellSize / 2;
        const startY = -totalSize / 2 + cellSize / 2;
        const redTiles = new Set(
            StrategoPuzzleGenerator.buildSeedPattern(
                boardSize,
                StrategoPuzzleGenerator.getSettings(boardSize).seedSize,
                patternId
            ).map((position) => `${position.row},${position.col}`)
        );

        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const textureKey = redTiles.has(`${row},${col}`) ? 'stratego-tile-red' : 'stratego-tile-grey';
                const tile = this.add.image(
                    startX + col * cellSize,
                    startY + row * cellSize,
                    textureKey
                )
                    .setOrigin(0.5)
                    .setDisplaySize(cellSize, cellSize);
                preview.add(tile);
            }
        }

        return preview;
    }
}
