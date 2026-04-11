class IntroScene extends Phaser.Scene {
    constructor() {
        super({ key: 'IntroScene' });
    }

    init(data) {
        if (data?.language) {
            TranslationManager.setLanguage(data.language);
        }
    }

    preload() {
        this.load.image('ui-gridfall-logo', 'assets/images/UI/logo_gridfall.png');
        this.load.image('ui-button-left-off', 'assets/images/UI/bouton_bord_gauche_off.png');
        this.load.image('ui-button-fill-off', 'assets/images/UI/bouton_fond_off.png');
        this.load.image('ui-button-right-off', 'assets/images/UI/bouton_bord_droite_off.png');
        this.load.image('ui-button-left-on', 'assets/images/UI/bouton_bord_gauche_on.png');
        this.load.image('ui-button-fill-on', 'assets/images/UI/bouton_fond_on.png');
        this.load.image('ui-button-right-on', 'assets/images/UI/bouton_bord_droite_on.png');
    }

    create() {
        const viewportWidth = this.scale.width || 800;
        const viewportHeight = this.scale.height || 700;
        const centerX = viewportWidth / 2;
        const isNarrowViewport = viewportWidth < 500;
        const titleY = isNarrowViewport ? 24 : 36;
        const aiLabelY = isNarrowViewport ? 156 : 212;
        const aiButtonsY = aiLabelY + 44;
        const sizeLabelY = aiButtonsY + 56;
        const sizeButtonsY = sizeLabelY + 45;
        const difficultyLabelY = sizeButtonsY + 50;
        const difficultyButtonsY = difficultyLabelY + 45;
        const winConditionY = difficultyButtonsY + 52;
        const goButtonY = Math.min(viewportHeight - 90, winConditionY + 70);
        const backButtonY = Math.min(viewportHeight - 34, goButtonY + 58);
        const optionSpacing = isNarrowViewport ? 100 : 110;
        const buttonBaseX = centerX - optionSpacing;
        const aiButtonWidth = isNarrowViewport ? 86 : 100;
        const boardButtonWidth = isNarrowViewport ? 86 : 100;
        const difficultyButtonWidth = isNarrowViewport ? 92 : 100;
        const aiOptions = [1, 2, 3];
        const boardSizes = [8, 12, 14];
        const difficultyOptions = [
            { key: 'EASY', labelKey: 'difficulty.easy' },
            { key: 'NORMAL', labelKey: 'difficulty.normal' },
            { key: 'HARD', labelKey: 'difficulty.hard' }
        ];
        let selectedAiCount = 2;
        let selectedBoardSize = 14;
        let selectedDifficulty = 'NORMAL';

        // Arrière-plan avec un dégradé
        this.cameras.main.setBackgroundColor('#060606');

        const sourceWidth = 800;
        const sourceHeight = 510;
        const maxLogoWidth = viewportWidth * (isNarrowViewport ? 0.38 : 0.24);
        const maxLogoHeight = viewportHeight * (isNarrowViewport ? 0.10 : 0.12);
        const logoScale = Math.min(maxLogoWidth / sourceWidth, maxLogoHeight / sourceHeight);
        const titleLogo = this.add.image(centerX, titleY, 'ui-gridfall-logo')
            .setOrigin(0.5, 0)
            .setScale(logoScale);

        const selectorLabel = this.add.text(centerX, aiLabelY, TranslationManager.t('intro.ai_count'), {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Vollkorn'
        }).setOrigin(0.5);

        const optionButtons = [];
        const optionTexts = [];
        const sizeButtons = [];
        const sizeTexts = [];
        const difficultyButtons = [];
        const difficultyTexts = [];
        const isBoardSizeAllowed = (boardSize, aiCount) => !(boardSize === 8 && aiCount === 3);
        const winConditionText = this.add.text(centerX, winConditionY, '', {
            fontSize: isNarrowViewport ? '14px' : '15px',
            fill: '#f8fafc',
            fontFamily: 'Vollkorn',
            align: 'center'
        }).setOrigin(0.5);

        const updateSelection = () => {
            if (!isBoardSizeAllowed(selectedBoardSize, selectedAiCount)) {
                selectedBoardSize = 14;
            }

            aiOptions.forEach((aiCount, index) => {
                const isSelected = aiCount === selectedAiCount;
                optionButtons[index].setState(isSelected);
                optionTexts[index].setText(`${aiCount} ${TranslationManager.t('intro.ai_suffix')}`);
            });

            boardSizes.forEach((boardSize, index) => {
                const isAllowed = isBoardSizeAllowed(boardSize, selectedAiCount);
                const isSelected = boardSize === selectedBoardSize;
                sizeButtons[index].setState(isAllowed && isSelected);
                sizeTexts[index].setText(`${boardSize} x ${boardSize}`);
                sizeButtons[index].container.setAlpha(isAllowed ? 1 : 0.42);
                sizeTexts[index].setAlpha(isAllowed ? 1 : 0.65);
                sizeButtons[index].hitArea.input.enabled = isAllowed;
            });

            difficultyOptions.forEach((difficulty, index) => {
                const isSelected = difficulty.key === selectedDifficulty;
                difficultyButtons[index].setState(isSelected);
                difficultyTexts[index].setText(TranslationManager.t(difficulty.labelKey));
            });

            const playerCount = selectedAiCount + 1;
            const winThreshold = GameLogic.getWinThreshold(selectedBoardSize, playerCount);
            winConditionText.setText(
                TranslationManager.t('intro.win_condition', {
                    threshold: winThreshold,
                    playerCount
                })
            );
        };

        aiOptions.forEach((aiCount, index) => {
            const x = buttonBaseX + index * optionSpacing;
            const button = this.createUiButton(
                x,
                aiButtonsY,
                aiButtonWidth,
                42,
                `${aiCount} ${TranslationManager.t('intro.ai_suffix')}`
            );
            const label = button.label;

            button.hitArea.on('pointerdown', () => {
                selectedAiCount = aiCount;
                updateSelection();
            });

            button.hitArea.on('pointerover', () => {
                if (selectedAiCount !== aiCount) {
                    button.setState(true);
                }
            });

            button.hitArea.on('pointerout', () => {
                updateSelection();
            });

            optionButtons.push(button);
            optionTexts.push(label);
        });

        const sizeLabel = this.add.text(centerX, sizeLabelY, TranslationManager.t('intro.board_size'), {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Vollkorn'
        }).setOrigin(0.5);

        boardSizes.forEach((boardSize, index) => {
            const x = buttonBaseX + index * optionSpacing;
            const button = this.createUiButton(
                x,
                sizeButtonsY,
                boardButtonWidth,
                42,
                `${boardSize} x ${boardSize}`,
                isNarrowViewport ? '14px' : '16px'
            );
            const label = button.label;

            button.hitArea.on('pointerdown', () => {
                if (!isBoardSizeAllowed(boardSize, selectedAiCount)) return;
                selectedBoardSize = boardSize;
                updateSelection();
            });

            button.hitArea.on('pointerover', () => {
                if (!isBoardSizeAllowed(boardSize, selectedAiCount)) return;
                if (selectedBoardSize !== boardSize) {
                    button.setState(true);
                }
            });

            button.hitArea.on('pointerout', () => {
                if (!isBoardSizeAllowed(boardSize, selectedAiCount)) {
                    return;
                }
                updateSelection();
            });

            sizeButtons.push(button);
            sizeTexts.push(label);
        });

        const difficultyLabel = this.add.text(centerX, difficultyLabelY, TranslationManager.t('intro.difficulty'), {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Vollkorn'
        }).setOrigin(0.5);

        difficultyOptions.forEach((difficulty, index) => {
            const x = buttonBaseX + index * optionSpacing;
            const button = this.createUiButton(
                x,
                difficultyButtonsY,
                difficultyButtonWidth,
                42,
                TranslationManager.t(difficulty.labelKey),
                isNarrowViewport ? '14px' : '15px'
            );
            const label = button.label;

            button.hitArea.on('pointerdown', () => {
                selectedDifficulty = difficulty.key;
                updateSelection();
            });

            button.hitArea.on('pointerover', () => {
                if (selectedDifficulty !== difficulty.key) {
                    button.setState(true);
                }
            });

            button.hitArea.on('pointerout', () => {
                updateSelection();
            });

            difficultyButtons.push(button);
            difficultyTexts.push(label);
        });

        updateSelection();
        
        // Bouton GO
        const goButton = this.createUiButton(
            centerX,
            goButtonY,
            isNarrowViewport ? 200 : 220,
            54,
            TranslationManager.t('intro.start'),
            isNarrowViewport ? '28px' : '32px'
        );

        goButton.hitArea.on('pointerover', () => {
            goButton.setState(true);
        });

        goButton.hitArea.on('pointerout', () => {
            goButton.setState(false);
        });

        goButton.hitArea.on('pointerdown', () => {
            goButton.setState(true);
            const playerOrder = ['ROUGE', 'BLEU', 'VERT', 'JAUNE'].slice(0, selectedAiCount + 1);
            const enemyAssignments = EnemyDefinitions.createAssignments(playerOrder);
            const progressPotions = new GameSceneSetup(this).selectProgressPotions();
            this.scene.start('BriefingScene', {
                aiCount: selectedAiCount,
                boardSize: selectedBoardSize,
                difficulty: selectedDifficulty,
                language: TranslationManager.getLanguage(),
                enemyAssignments,
                progressPotions,
                arcadeKingdomId: 'VERDOMBRE'
            });
        });

        const backButton = this.createUiButton(
            centerX,
            backButtonY,
            isNarrowViewport ? 180 : 200,
            42,
            TranslationManager.t('menu.back'),
            isNarrowViewport ? '18px' : '20px'
        );

        backButton.hitArea.on('pointerover', () => {
            backButton.setState(true);
        });

        backButton.hitArea.on('pointerout', () => {
            backButton.setState(false);
        });

        backButton.hitArea.on('pointerdown', () => {
            backButton.setState(true);
            this.time.delayedCall(120, () => {
                this.scene.start('MainMenuScene', { language: TranslationManager.getLanguage() });
            });
        });
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
} 
