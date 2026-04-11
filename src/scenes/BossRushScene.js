class BossRushScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BossRushScene' });
        this.ui = new FighterSceneUiHelper(this);
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
        this.load.image('arcade-kingdom-verdombre', 'assets/images/astrolabe/verdombre.png');
        this.load.image('arcade-kingdom-vulkarn', 'assets/images/astrolabe/Vulkarn.png');
        this.load.image('arcade-kingdom-drazhul', 'assets/images/astrolabe/drazhul.png');

        this.load.image('progress-potion-rose', 'assets/images/bonus/potion_rose.png');
        this.load.image('progress-potion-orange', 'assets/images/bonus/potion_orange.png');
        this.load.image('progress-potion-menthe', 'assets/images/bonus/potion_menthe.png');
        this.load.image('progress-potion-marron', 'assets/images/bonus/potion_marron.png');
        this.load.image('progress-potion-blanche', 'assets/images/bonus/potion_white.png');
        this.load.image('progress-potion-cyan', 'assets/images/bonus/potion_cyan.png');
    }

    create() {
        const viewportWidth = this.scale.width || 800;
        const viewportHeight = this.scale.height || 700;
        const centerX = viewportWidth / 2;
        const isNarrowViewport = viewportWidth < 500;
        const scrollContent = this.add.container(0, 0);
        const availableArcadeKingdoms = ArcadeKingdomCatalog.getUnlockedForArcade();
        const shouldShowKingdomCarousel = availableArcadeKingdoms.length > 1;
        let selectedModeId = null;
        let selectedKingdomIndex = 0;
        let previewPotions = [];

        this.cameras.main.setBackgroundColor('#060606');

        const titleText = this.add.text(centerX, isNarrowViewport ? 28 : 36, TranslationManager.t('astrolabe.item.boss_rush.title'), {
            fontSize: isNarrowViewport ? '30px' : '40px',
            fill: '#fff3d5',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#4a2d20',
            strokeThickness: 3
        }).setOrigin(0.5, 0);
        scrollContent.add(titleText);

        const subtitleText = this.add.text(centerX, isNarrowViewport ? 98 : 118, TranslationManager.t('boss_rush.subtitle'), {
            fontSize: isNarrowViewport ? '16px' : '20px',
            fill: '#d0c5b4',
            fontFamily: 'Vollkorn',
            align: 'center',
            wordWrap: { width: isNarrowViewport ? viewportWidth - 36 : 620 }
        }).setOrigin(0.5);
        scrollContent.add(subtitleText);

        const difficultyLabelY = isNarrowViewport ? 174 : 206;
        const difficultyLabel = this.add.text(centerX, difficultyLabelY, TranslationManager.t('boss_rush.choose_difficulty'), {
            fontSize: isNarrowViewport ? '17px' : '20px',
            fill: '#ffffff',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        scrollContent.add(difficultyLabel);

        const difficultyModes = [
            { id: 'EASY', labelKey: 'boss_rush.mode.easy' },
            { id: 'NORMAL', labelKey: 'boss_rush.mode.normal' },
            { id: 'HARD', labelKey: 'boss_rush.mode.hard' },
            { id: 'ULTIME', labelKey: 'boss_rush.mode.ultimate' }
        ];
        const difficultyButtons = [];
        const firstRowY = difficultyLabelY + (isNarrowViewport ? 48 : 58);
        const secondRowY = firstRowY + (isNarrowViewport ? 56 : 62);
        const columnOffset = isNarrowViewport ? 88 : 118;
        const selectedModeTextY = secondRowY + (isNarrowViewport ? 42 : 48);
        const selectedModeText = this.add.text(centerX, selectedModeTextY, '', {
            fontSize: isNarrowViewport ? '14px' : '17px',
            fill: '#d0c5b4',
            fontFamily: 'Vollkorn',
            align: 'center',
            wordWrap: { width: isNarrowViewport ? viewportWidth - 42 : 560 }
        }).setOrigin(0.5).setVisible(false);

        difficultyModes.forEach((mode, index) => {
            const isTopRow = index < 2;
            const button = this.ui.createUiButton(
                centerX + (index % 2 === 0 ? -columnOffset : columnOffset),
                isTopRow ? firstRowY : secondRowY,
                isNarrowViewport ? 146 : 188,
                46,
                TranslationManager.t(mode.labelKey),
                isNarrowViewport ? '18px' : '22px'
            );
            button.hitArea.on('pointerover', () => {
                if (selectedModeId !== mode.id) {
                    button.setState(true);
                }
            });
            button.hitArea.on('pointerout', () => {
                button.setState(selectedModeId === mode.id);
            });
            button.hitArea.on('pointerdown', () => {
                selectedModeId = mode.id;
                previewPotions = ProgressPotionCatalog.selectFromPool();
                difficultyButtons.forEach((entry) => entry.button.setState(entry.mode.id === selectedModeId));
                selectedModeText.setText(TranslationManager.t(`boss_rush.selected_mode.${mode.id.toLowerCase()}`));
                selectedModeText.setVisible(true);
                potionsLabel.setVisible(true);
                potionPreview.setVisible(true);
                potionPreview.update(previewPotions);
                startButton.container.setVisible(true);
                startButton.hitArea.setInteractive({ useHandCursor: true });
            });
            difficultyButtons.push({ mode, button });
            scrollContent.add(button.container);
        });
        scrollContent.add(selectedModeText);

        const potionsLabelY = selectedModeTextY + (isNarrowViewport ? 50 : 58);
        const potionsLabel = this.add.text(centerX, potionsLabelY, TranslationManager.t('boss_rush.first_combat_potions'), {
            fontSize: isNarrowViewport ? '16px' : '19px',
            fill: '#ffffff',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);
        scrollContent.add(potionsLabel);
        const potionPreview = this.createPotionPreview(centerX, potionsLabelY + (isNarrowViewport ? 54 : 64), isNarrowViewport);
        potionPreview.setVisible(false);
        scrollContent.add(potionPreview.container);

        let kingdomBottomY = potionPreview.bottomY;
        let kingdomCard = null;
        if (shouldShowKingdomCarousel) {
            const kingdomLabelY = potionPreview.bottomY + (isNarrowViewport ? 30 : 38);
            const kingdomLabel = this.add.text(centerX, kingdomLabelY, TranslationManager.t('fighter.choose_kingdom'), {
                fontSize: isNarrowViewport ? '17px' : '20px',
                fill: '#ffffff',
                fontFamily: 'Vollkorn',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            scrollContent.add(kingdomLabel);

            kingdomCard = this.ui.createKingdomCarousel(
                centerX,
                kingdomLabelY + (isNarrowViewport ? 88 : 96),
                isNarrowViewport,
                availableArcadeKingdoms,
                () => selectedKingdomIndex
            );
            kingdomCard.update();
            kingdomBottomY = kingdomCard.bottomY;
            scrollContent.add(kingdomCard.container);

            kingdomCard.leftButton.hitArea.on('pointerdown', () => {
                selectedKingdomIndex = (selectedKingdomIndex - 1 + availableArcadeKingdoms.length) % availableArcadeKingdoms.length;
                kingdomCard.update();
            });
            kingdomCard.rightButton.hitArea.on('pointerdown', () => {
                selectedKingdomIndex = (selectedKingdomIndex + 1) % availableArcadeKingdoms.length;
                kingdomCard.update();
            });
        }

        const startButton = this.ui.createUiButton(
            centerX,
            Math.min(viewportHeight - 92, kingdomBottomY + (isNarrowViewport ? 68 : 82)),
            isNarrowViewport ? 206 : 226,
            54,
            TranslationManager.t('boss_rush.start'),
            isNarrowViewport ? '24px' : '30px'
        );
        startButton.container.setVisible(false);
        startButton.hitArea.disableInteractive();
        scrollContent.add(startButton.container);
        startButton.hitArea.on('pointerover', () => startButton.setState(true));
        startButton.hitArea.on('pointerout', () => startButton.setState(false));
        startButton.hitArea.on('pointerdown', () => {
            if (!selectedModeId || previewPotions.length === 0) {
                return;
            }

            const sequence = this.buildBossRushSequence(selectedModeId);
            const nextPotions = sequence.length > 1 ? ProgressPotionCatalog.selectFromPool() : [];
            const firstEncounter = sequence[0];
            const selectedKingdom = availableArcadeKingdoms[selectedKingdomIndex];
            const playerOrder = ['ROUGE', 'BLEU'];
            const enemyAssignments = EnemyDefinitions.createAssignmentsFromTypeKeys(playerOrder, [firstEncounter.bossTypeKey]);

            startButton.setState(true);
            this.scene.start('GameScene', {
                aiCount: 1,
                boardSize: 12,
                difficulty: firstEncounter.difficulty,
                language: TranslationManager.getLanguage(),
                arcadeKingdomId: selectedKingdom?.id || 'VERDOMBRE',
                enemyAssignments,
                progressPotions: previewPotions,
                storyNodeType: 'boss',
                bossRushConfig: {
                    modeId: selectedModeId,
                    sequence,
                    currentIndex: 0,
                    anyPotionUsed: false,
                    nextProgressPotions: nextPotions
                }
            });
        });

        const backButton = this.ui.createUiButton(
            centerX,
            Math.min(viewportHeight - 34, startButton.container.y + (isNarrowViewport ? 60 : 68)),
            isNarrowViewport ? 188 : 228,
            42,
            TranslationManager.t('boss_rush.back'),
            isNarrowViewport ? '16px' : '18px'
        );
        scrollContent.add(backButton.container);
        backButton.hitArea.on('pointerover', () => backButton.setState(true));
        backButton.hitArea.on('pointerout', () => backButton.setState(false));
        backButton.hitArea.on('pointerdown', () => {
            backButton.setState(true);
            this.scene.start('MainMenuScene', { language: TranslationManager.getLanguage() });
        });

        const contentHeight = backButton.container.y + (isNarrowViewport ? 44 : 52);
        VerticalScrollHelper.enable(this, {
            container: scrollContent,
            contentHeight,
            viewportHeight,
            topPadding: 0,
            bottomPadding: isNarrowViewport ? 18 : 28,
            wheelFactor: 0.75
        });
    }

    buildBossRushSequence(modeId) {
        const bosses = ['SALAMANDER', 'GOLEM', 'OGRE'];
        if (modeId === 'ULTIME') {
            return ['EASY', 'NORMAL', 'HARD'].flatMap((difficulty) =>
                bosses.map((bossTypeKey) => ({ bossTypeKey, difficulty }))
            );
        }

        return bosses.map((bossTypeKey) => ({ bossTypeKey, difficulty: modeId }));
    }

    createPotionPreview(centerX, centerY, isNarrowViewport) {
        const container = this.add.container(0, 0);
        const spacing = isNarrowViewport ? 84 : 106;
        const iconSize = isNarrowViewport ? 42 : 52;
        const entries = Array.from({ length: 3 }, (_, index) => {
            const x = centerX + (index - 1) * spacing;
            const icon = this.add.image(x, centerY - 10, 'progress-potion-rose')
                .setOrigin(0.5)
                .setDisplaySize(iconSize, iconSize);
            const label = this.add.text(x, centerY + (isNarrowViewport ? 24 : 30), '', {
                fontSize: isNarrowViewport ? '12px' : '14px',
                fill: '#d0c5b4',
                fontFamily: 'Vollkorn',
                align: 'center',
                wordWrap: { width: isNarrowViewport ? 78 : 96 }
            }).setOrigin(0.5, 0);
            container.add([icon, label]);
            return { icon, label };
        });

        return {
            container,
            bottomY: centerY + (isNarrowViewport ? 56 : 66),
            setVisible: (visible) => container.setVisible(visible),
            update: (potions) => {
                entries.forEach((entry, index) => {
                    const potion = potions[index];
                    entry.icon.setVisible(Boolean(potion));
                    entry.label.setVisible(Boolean(potion));
                    if (!potion) {
                        return;
                    }
                    entry.icon.setTexture(potion.textureKey);
                    entry.label.setText(TranslationManager.t(`potion.${potion.id.toLowerCase()}.title`));
                });
            }
        };
    }
}
