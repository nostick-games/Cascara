class FighterScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FighterScene' });
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

        const enemyDefinitions = EnemyDefinitions.getAll();
        Object.values(enemyDefinitions).forEach((enemy) => {
            this.load.spritesheet(enemy.briefingIdleTexture || enemy.idleTexture, enemy.briefingIdleAssetPath || enemy.idleAssetPath, {
                frameWidth: enemy.frameWidth || 64,
                frameHeight: enemy.frameHeight || 64
            });
        });
    }

    create() {
        this.ui.ensureEnemyAnimations();

        const viewportWidth = this.scale.width || 800;
        const viewportHeight = this.scale.height || 700;
        const centerX = viewportWidth / 2;
        const isNarrowViewport = viewportWidth < 500;
        const availableEnemies = this.ui.getAvailableEnemies();
        const availableArcadeKingdoms = ArcadeKingdomCatalog.getUnlockedForArcade();
        const shouldShowKingdomCarousel = availableArcadeKingdoms.length > 1;
        let selectedEnemyIndex = 0;
        let selectedKingdomIndex = 0;

        this.cameras.main.setBackgroundColor('#060606');

        this.add.text(centerX, isNarrowViewport ? 28 : 36, TranslationManager.t('astrolabe.item.fighter.title'), {
            fontSize: isNarrowViewport ? '30px' : '40px',
            fill: '#fff3d5',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#4a2d20',
            strokeThickness: 3
        }).setOrigin(0.5, 0);

        this.add.text(centerX, isNarrowViewport ? 98 : 118, TranslationManager.t('fighter.subtitle'), {
            fontSize: isNarrowViewport ? '16px' : '20px',
            fill: '#d0c5b4',
            fontFamily: 'Vollkorn',
            align: 'center',
            wordWrap: { width: isNarrowViewport ? viewportWidth - 36 : 560 }
        }).setOrigin(0.5);

        const enemyLabelY = isNarrowViewport ? 178 : 210;
        this.add.text(centerX, enemyLabelY, TranslationManager.t('fighter.choose_enemy'), {
            fontSize: isNarrowViewport ? '17px' : '20px',
            fill: '#ffffff',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const enemyCard = this.ui.createEnemyCarousel(centerX, enemyLabelY + (isNarrowViewport ? 84 : 92), isNarrowViewport, availableEnemies, () => selectedEnemyIndex);
        let kingdomCard = null;
        let kingdomBottomY = enemyCard.bottomY;
        if (shouldShowKingdomCarousel) {
            const kingdomLabelY = enemyCard.bottomY + (isNarrowViewport ? 34 : 42);
            this.add.text(centerX, kingdomLabelY, TranslationManager.t('fighter.choose_kingdom'), {
                fontSize: isNarrowViewport ? '17px' : '20px',
                fill: '#ffffff',
                fontFamily: 'Vollkorn',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            kingdomCard = this.ui.createKingdomCarousel(
                centerX,
                kingdomLabelY + (isNarrowViewport ? 88 : 96),
                isNarrowViewport,
                availableArcadeKingdoms,
                () => selectedKingdomIndex
            );
            kingdomBottomY = kingdomCard.bottomY;
        }

        enemyCard.leftButton.hitArea.on('pointerdown', () => {
            selectedEnemyIndex = (selectedEnemyIndex - 1 + availableEnemies.length) % availableEnemies.length;
            enemyCard.update();
        });
        enemyCard.rightButton.hitArea.on('pointerdown', () => {
            selectedEnemyIndex = (selectedEnemyIndex + 1) % availableEnemies.length;
            enemyCard.update();
        });

        if (kingdomCard) {
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
            TranslationManager.t('fighter.start'),
            isNarrowViewport ? '24px' : '30px'
        );
        startButton.hitArea.on('pointerover', () => startButton.setState(true));
        startButton.hitArea.on('pointerout', () => startButton.setState(false));
        startButton.hitArea.on('pointerdown', () => {
            const selectedEnemy = availableEnemies[selectedEnemyIndex];
            const selectedKingdom = availableArcadeKingdoms[selectedKingdomIndex];
            startButton.setState(true);
            this.scene.start('GameScene', {
                aiCount: 1,
                boardSize: 8,
                difficulty: 'HYPER_EASY',
                language: TranslationManager.getLanguage(),
                arcadeKingdomId: selectedKingdom?.id || 'VERDOMBRE',
                fightConfig: {
                    enemyTypeKey: selectedEnemy.key
                }
            });
        });

        const backButton = this.ui.createUiButton(
            centerX,
            Math.min(viewportHeight - 36, startButton.container.y + 58),
            isNarrowViewport ? 170 : 190,
            42,
            TranslationManager.t('hud.back_to_menu'),
            isNarrowViewport ? '15px' : '16px'
        );
        backButton.hitArea.on('pointerover', () => backButton.setState(true));
        backButton.hitArea.on('pointerout', () => backButton.setState(false));
        backButton.hitArea.on('pointerdown', () => {
            backButton.setState(true);
            this.scene.start('MainMenuScene', { language: TranslationManager.getLanguage() });
        });

        enemyCard.update();
        if (kingdomCard) {
            kingdomCard.update();
        }
    }

}
