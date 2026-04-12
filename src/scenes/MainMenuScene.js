class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    init(data) {
        if (data?.language) {
            TranslationManager.setLanguage(data.language);
        }
        MetaProgression.ensureInitialized();
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
        const showCheats = Boolean(globalThis.CASCARA_SHOW_CHEATS);
        const scrollContent = this.add.container(0, 0);
        const titleY = isNarrowViewport ? 24 : 36;
        const buttonWidth = isNarrowViewport ? 250 : 300;
        const buttonHeight = isNarrowViewport ? 48 : 54;
        const blockSpacing = isNarrowViewport ? 88 : 96;
        const descriptionSpacing = isNarrowViewport ? 26 : 28;
        let currentY = isNarrowViewport ? 170 : 210;

        this.cameras.main.setBackgroundColor('#060606');

        const sourceWidth = 800;
        const sourceHeight = 510;
        const maxLogoWidth = viewportWidth * (isNarrowViewport ? 0.38 : 0.24);
        const maxLogoHeight = viewportHeight * (isNarrowViewport ? 0.10 : 0.12);
        const logoScale = Math.min(maxLogoWidth / sourceWidth, maxLogoHeight / sourceHeight);
        const logo = this.add.image(centerX, titleY, 'ui-gridfall-logo')
            .setOrigin(0.5, 0)
            .setScale(logoScale);
        scrollContent.add(logo);

        const menuItems = [
            {
                titleKey: 'menu.story',
                descKey: 'menu.story_desc',
                action: () => this.scene.start('StoryIntroScene', { language: TranslationManager.getLanguage() })
            },
            {
                titleKey: 'menu.arcade',
                descKey: 'menu.arcade_desc',
                action: () => this.scene.start('IntroScene', { language: TranslationManager.getLanguage() })
            },
            {
                titleKey: 'menu.astrolabe',
                descKey: 'menu.astrolabe_desc',
                action: () => this.scene.start('AstrolabeScene', { language: TranslationManager.getLanguage() })
            },
            ...(MetaProgression.hasAstrolabePurchase('MINIGAME_STRATEGO') ? [{
                titleKey: 'menu.stratego',
                descKey: 'menu.stratego_desc',
                action: () => this.scene.start('StrategoScene', { language: TranslationManager.getLanguage() })
            }] : []),
            ...(MetaProgression.hasAstrolabePurchase('MINIGAME_FIGHTER') ? [{
                titleKey: 'menu.fighter',
                descKey: 'menu.fighter_desc',
                action: () => this.scene.start('FighterScene', { language: TranslationManager.getLanguage() })
            }] : []),
            ...(MetaProgression.hasAstrolabePurchase('MINIGAME_BOSS_RUSH') ? [{
                titleKey: 'menu.boss_rush',
                descKey: 'menu.boss_rush_desc',
                action: () => this.scene.start('BossRushScene', { language: TranslationManager.getLanguage() })
            }] : []),
            {
                titleKey: 'menu.how_to_play',
                descKey: null,
                action: () => this.scene.start('HowToPlayScene', { language: TranslationManager.getLanguage() })
            },
            {
                titleKey: 'menu.trophies',
                descKey: null,
                action: () => this.scene.start('TrophiesScene', { language: TranslationManager.getLanguage() })
            },
            ...(showCheats ? [{
                titleKey: 'menu.fragments_cheat',
                descKey: 'menu.fragments_cheat_desc',
                action: () => this.scene.start('StoryModePlaceholderScene', {
                    language: TranslationManager.getLanguage(),
                    grantAllFragmentsCheat: true
                })
            },
            {
                titleKey: 'menu.final_boss_cheat',
                descKey: 'menu.final_boss_cheat_desc',
                action: () => this.scene.start('StoryModePlaceholderScene', {
                    language: TranslationManager.getLanguage(),
                    storyState: this.createFinalBossTestState()
                })
            },
            {
                titleKey: 'menu.golem_boss_cheat',
                descKey: 'menu.golem_boss_cheat_desc',
                action: () => this.scene.start('StoryModePlaceholderScene', {
                    language: TranslationManager.getLanguage(),
                    storyState: this.createGolemBossTestState()
                })
            },
            {
                titleKey: 'menu.salamander_boss_cheat',
                descKey: 'menu.salamander_boss_cheat_desc',
                action: () => this.scene.start('StoryModePlaceholderScene', {
                    language: TranslationManager.getLanguage(),
                    storyState: this.createSalamanderBossTestState()
                })
            },
            {
                titleKey: 'menu.tile_test',
                descKey: 'menu.tile_test_desc',
                action: () => this.scene.start('TileAnimationTestScene', {
                    language: TranslationManager.getLanguage()
                })
            },
            {
                titleKey: 'menu.tutorial_test',
                descKey: 'menu.tutorial_test_desc',
                action: () => this.scene.start('TutorialScene', {
                    language: TranslationManager.getLanguage()
                })
            }] : [])
        ];

        menuItems.forEach((item) => {
            const button = this.createUiButton(
                centerX,
                currentY,
                buttonWidth,
                buttonHeight,
                TranslationManager.t(item.titleKey),
                isNarrowViewport ? '20px' : '24px'
            );

            button.hitArea.on('pointerover', () => button.setState(true));
            button.hitArea.on('pointerout', () => button.setState(false));
            button.hitArea.on('pointerdown', () => {
                button.setState(true);
                this.time.delayedCall(120, item.action);
            });
            scrollContent.add(button.container);

            if (item.descKey) {
                const description = this.add.text(centerX, currentY + descriptionSpacing, TranslationManager.t(item.descKey), {
                    fontSize: isNarrowViewport ? '13px' : '15px',
                    fill: '#d0c5b4',
                    fontFamily: 'Vollkorn',
                    align: 'center'
                }).setOrigin(0.5, 0);
                scrollContent.add(description);
            }

            currentY += blockSpacing;
        });

        const contentHeight = currentY + (isNarrowViewport ? 24 : 36);
        VerticalScrollHelper.enable(this, {
            container: scrollContent,
            contentHeight,
            viewportHeight,
            topPadding: 0,
            bottomPadding: isNarrowViewport ? 18 : 28,
            wheelFactor: 0.75
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

    createFinalBossTestState() {
        const state = StoryMapState.createInitialState(['ROSE', 'ORANGE']);
        if (state?.rows?.[0]?.[0]) {
            state.rows[0][0].type = 'boss';
            state.rows[0][0].eventId = null;
        }
        state.fragments = this.createBossTestFragments();
        state.briefingFragmentIds = Object.keys(state.fragments);
        state.forcedBossTypeKey = 'OGRE';
        state.currentPathIndex = 2;
        state.bossSequenceIndex = 2;
        return state;
    }

    createGolemBossTestState() {
        const state = StoryMapState.createInitialState(['ROSE', 'ORANGE']);
        if (state?.rows?.[0]?.[0]) {
            state.rows[0][0].type = 'boss';
            state.rows[0][0].eventId = null;
        }
        state.fragments = this.createBossTestFragments();
        state.briefingFragmentIds = Object.keys(state.fragments);
        state.forcedBossTypeKey = 'GOLEM';
        state.currentPathIndex = 1;
        state.bossSequenceIndex = 1;
        return state;
    }

    createSalamanderBossTestState() {
        const state = StoryMapState.createInitialState(['ROSE', 'ORANGE']);
        if (state?.rows?.[0]?.[0]) {
            state.rows[0][0].type = 'boss';
            state.rows[0][0].eventId = null;
        }
        state.fragments = this.createBossTestFragments();
        state.briefingFragmentIds = Object.keys(state.fragments);
        state.forcedBossTypeKey = 'SALAMANDER';
        state.currentPathIndex = 0;
        state.bossSequenceIndex = 0;
        return state;
    }

    createBossTestFragments() {
        return StoryFragmentCatalog.getAll().reduce((counts, fragment) => {
            counts[fragment.id] = 2;
            return counts;
        }, {});
    }
}
