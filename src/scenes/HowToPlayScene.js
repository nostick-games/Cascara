class HowToPlayScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HowToPlayScene' });
    }

    init(data) {
        if (data?.language) {
            TranslationManager.setLanguage(data.language);
        }
    }

    preload() {
        this.load.image('ui-parchment', 'assets/images/UI/parchemin.png');
        this.load.image('ui-button-left-off', 'assets/images/UI/bouton_bord_gauche_off.png');
        this.load.image('ui-button-fill-off', 'assets/images/UI/bouton_fond_off.png');
        this.load.image('ui-button-right-off', 'assets/images/UI/bouton_bord_droite_off.png');
        this.load.image('ui-button-left-on', 'assets/images/UI/bouton_bord_gauche_on.png');
        this.load.image('ui-button-fill-on', 'assets/images/UI/bouton_fond_on.png');
        this.load.image('ui-button-right-on', 'assets/images/UI/bouton_bord_droite_on.png');
        this.load.image('merchant-banner', 'assets/images/fragments/banniere_boutique.png');
        this.load.image('ui-goal-gauge-empty', 'assets/images/UI/jauge_vide.png');
        this.load.image('ui-goal-gauge-full', 'assets/images/UI/jauge_pleine.png');
        this.load.image('meta-star', 'assets/images/bonus/star.png');
        this.load.image('howto-potion-rose', 'assets/images/bonus/potion_rose.png');
        this.load.image('howto-potion-orange', 'assets/images/bonus/potion_orange.png');
        this.load.image('howto-potion-menthe', 'assets/images/bonus/potion_menthe.png');
        this.load.image('howto-potion-marron', 'assets/images/bonus/potion_marron.png');
        this.load.image('howto-potion-blanche', 'assets/images/bonus/potion_white.png');
        this.load.image('howto-potion-cyan', 'assets/images/bonus/potion_cyan.png');
        this.load.spritesheet('hero-idle', 'assets/images/hero/idle_right.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.image('bonus-bomb-icon', 'assets/images/bonus/bomb_icon.png');
        this.load.spritesheet('howto-enemy-goblin-face', 'assets/images/enemies/goblin_idle_face.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('howto-enemy-skull-face', 'assets/images/enemies/skull_idle_face.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('howto-enemy-wizard-face', 'assets/images/enemies/wizard_idle_face.png', {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    create() {
        const viewportWidth = this.scale.width || 800;
        const viewportHeight = this.scale.height || 700;
        const centerX = viewportWidth / 2;
        const isNarrowViewport = viewportWidth < 500;

        this.cameras.main.setBackgroundColor('#060606');

        const parchmentMaxWidth = isNarrowViewport
            ? viewportWidth - 22
            : Math.min(viewportWidth - 88, 640);
        const parchmentMaxHeight = isNarrowViewport
            ? viewportHeight - 24
            : Math.min(viewportHeight - 54, viewportHeight * 0.9);
        const parchmentScale = Math.min(
            parchmentMaxWidth / 320,
            parchmentMaxHeight / 480
        ) * (isNarrowViewport ? 1 : 0.9);
        const parchmentWidth = 320 * parchmentScale;
        const parchmentHeight = 480 * parchmentScale;
        const bannerHeight = isNarrowViewport ? 118 : 154;
        const parchmentTopY = bannerHeight + (isNarrowViewport ? 10 : 14);
        const centerY = parchmentTopY + parchmentHeight / 2;
        const parchmentBottomY = centerY + parchmentHeight / 2;
        const contentLeftX = centerX - parchmentWidth / 2 + (isNarrowViewport ? 22 : 34);
        const contentRightX = centerX + parchmentWidth / 2 - (isNarrowViewport ? 22 : 34);
        const contentWidth = contentRightX - contentLeftX;
        const innerTopY = parchmentTopY + (isNarrowViewport ? 18 : 24);
        const innerBottomY = parchmentBottomY - (isNarrowViewport ? 16 : 22);
        const innerHeight = innerBottomY - innerTopY;

        this.add.image(centerX, bannerHeight / 2, 'merchant-banner')
            .setOrigin(0.5)
            .setDisplaySize(parchmentWidth, bannerHeight)
            .setDepth(4);
        this.add.text(centerX, isNarrowViewport ? 24 : 26, TranslationManager.t('menu.how_to_play'), {
            fontSize: isNarrowViewport ? '24px' : '32px',
            fill: '#fff3d5',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#4a2d20',
            strokeThickness: 3
        }).setOrigin(0.5, 0).setDepth(6);

        this.add.image(centerX, centerY, 'ui-parchment')
            .setOrigin(0.5)
            .setScale(parchmentScale)
            .setAngle(90)
            .setDepth(5);

        this.ensureEnemyFaceAnimations();
        this.ensureHeroIdleAnimation();

        const content = this.add.container(contentLeftX, innerTopY).setDepth(12);
        const contentMaskShape = this.make.graphics({ x: 0, y: 0, add: false });
        contentMaskShape.fillStyle(0xffffff, 1);
        contentMaskShape.fillRect(contentLeftX - 6, innerTopY - 6, contentWidth + 12, innerHeight + 12);
        content.setMask(contentMaskShape.createGeometryMask());

        let currentY = 0;
        const intro = this.add.text(contentWidth / 2, currentY, TranslationManager.t('how_to_play.intro'), {
            fontSize: isNarrowViewport ? '16px' : '19px',
            fill: '#3b2419',
            fontFamily: 'Vollkorn',
            fontStyle: 'italic',
            align: 'center',
            wordWrap: { width: contentWidth }
        }).setOrigin(0.5, 0);
        content.add(intro);
        currentY += intro.height + (isNarrowViewport ? 18 : 22);

        const tutorialButton = StoryMerchantRenderer.createUiTextButton(
            this,
            contentWidth / 2,
            currentY + 21,
            isNarrowViewport ? 196 : 218,
            42,
            TranslationManager.t('how_to_play.try_tutorial'),
            isNarrowViewport ? '18px' : '20px'
        );
        tutorialButton.hitArea.on('pointerover', () => tutorialButton.setState(true));
        tutorialButton.hitArea.on('pointerout', () => tutorialButton.setState(false));
        tutorialButton.hitArea.on('pointerdown', () => {
            tutorialButton.setState(true);
            this.scene.start('TutorialScene', {
                language: TranslationManager.getLanguage(),
                returnSceneKey: 'HowToPlayScene',
                returnSceneData: { language: TranslationManager.getLanguage() }
            });
        });
        content.add(tutorialButton.container);
        currentY += 56;

        const sections = [
            { titleKey: 'how_to_play.section.gameplay.title', bodyKey: 'how_to_play.section.gameplay.body' },
            { titleKey: 'how_to_play.section.chaos.title', bodyKey: 'how_to_play.section.chaos.body' },
            { titleKey: 'how_to_play.section.modes.title', bodyKey: 'how_to_play.section.modes.body' },
            { titleKey: 'how_to_play.section.potions.title', bodyKey: 'how_to_play.section.potions.body' },
            { titleKey: 'how_to_play.section.fragments.title', bodyKey: 'how_to_play.section.fragments.body' },
            { titleKey: 'how_to_play.section.astrolabe.title', bodyKey: 'how_to_play.section.astrolabe.body' }
        ];

        sections.forEach((section, index) => {
            if (index > 0) {
                currentY += isNarrowViewport ? 14 : 18;
            }

            const title = this.add.text(contentWidth / 2, currentY, TranslationManager.t(section.titleKey), {
                fontSize: isNarrowViewport ? '18px' : '21px',
                fill: '#3b2419',
                fontFamily: 'Vollkorn',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: { width: contentWidth }
            }).setOrigin(0.5, 0);
            content.add(title);
            currentY += title.height + 6;

            const body = this.add.text(0, currentY, TranslationManager.t(section.bodyKey), {
                fontSize: isNarrowViewport ? '15px' : '18px',
                fill: '#5d3b2b',
                fontFamily: 'Vollkorn',
                align: 'left',
                wordWrap: { width: contentWidth },
                lineSpacing: isNarrowViewport ? 4 : 6
            }).setOrigin(0, 0);
            content.add(body);
            currentY += body.height + 8;

            if (section.titleKey === 'how_to_play.section.gameplay.title') {
                const gauge = this.createAnimatedGoalGauge(contentWidth / 2, currentY + 30, isNarrowViewport);
                content.add(gauge.container);
                currentY += gauge.height + 42;
            }

            if (section.titleKey === 'how_to_play.section.chaos.title') {
                const chaosDemo = this.createAnimatedChaosDemo(contentWidth / 2, currentY + 85, isNarrowViewport);
                content.add(chaosDemo.container);
                currentY += chaosDemo.height + 18;
            }

            if (section.titleKey === 'how_to_play.section.modes.title') {
                currentY += isNarrowViewport ? 2 : 6;
                const hint = this.add.text(contentWidth / 2, currentY, TranslationManager.t('how_to_play.section.modes.hint'), {
                    fontSize: isNarrowViewport ? '14px' : '16px',
                    fill: '#5d3b2b',
                    fontFamily: 'Vollkorn',
                    fontStyle: 'italic',
                    align: 'center',
                    wordWrap: { width: contentWidth }
                }).setOrigin(0.5, 0);
                content.add(hint);
                currentY += hint.height + 10;
                const enemyRow = this.createBasicEnemyRow(contentWidth / 2, currentY, isNarrowViewport);
                content.add(enemyRow);
                currentY += (isNarrowViewport ? 52 : 64) + 52;
            }

            if (section.titleKey === 'how_to_play.section.potions.title') {
                currentY += isNarrowViewport ? 8 : 12;
                const potionsGrid = this.createPotionsGrid(contentWidth / 2, currentY + 30, isNarrowViewport);
                content.add(potionsGrid);
                currentY += isNarrowViewport ? 128 : 154;
            }

            if (section.titleKey === 'how_to_play.section.astrolabe.title') {
                const starsRow = this.createAstrolabeStarsRow(contentWidth / 2, currentY + 14, isNarrowViewport);
                content.add(starsRow);
                currentY += (isNarrowViewport ? 30 : 36);
            }
        });

        currentY += isNarrowViewport ? 18 : 22;
        const backButton = StoryMerchantRenderer.createUiTextButton(
            this,
            contentWidth / 2,
            currentY + 21,
            isNarrowViewport ? 180 : 204,
            42,
            TranslationManager.t('menu.back'),
            isNarrowViewport ? '18px' : '20px'
        );
        backButton.hitArea.on('pointerover', () => backButton.setState(true));
        backButton.hitArea.on('pointerout', () => backButton.setState(false));
        backButton.hitArea.on('pointerdown', () => {
            backButton.setState(true);
            this.scene.start('MainMenuScene', { language: TranslationManager.getLanguage() });
        });
        content.add(backButton.container);
        currentY += 54;

        VerticalScrollHelper.enable(this, {
            container: content,
            contentHeight: innerTopY + currentY,
            viewportHeight: innerBottomY,
            topPadding: innerTopY,
            bottomPadding: 0
        });
    }

    ensureHeroIdleAnimation() {
        if (this.anims.exists('hero-idle')) {
            return;
        }

        this.anims.create({
            key: 'hero-idle',
            frames: this.anims.generateFrameNumbers('hero-idle', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });
    }

    createAnimatedGoalGauge(centerX, y, isNarrowViewport) {
        const container = this.add.container(centerX, y);
        const segmentCount = isNarrowViewport ? 20 : 24;
        const segmentWidth = isNarrowViewport ? 11 : 12;
        const segmentHeight = isNarrowViewport ? 18 : 20;
        const segmentSpacing = 2;
        const outerPadding = isNarrowViewport ? 8 : 10;
        const totalSegmentsWidth = segmentCount * segmentWidth + (segmentCount - 1) * segmentSpacing;
        const gaugeWidth = totalSegmentsWidth + outerPadding * 2;
        const gaugeHeight = segmentHeight + outerPadding * 2;
        const segmentsStartX = -totalSegmentsWidth / 2;
        const segmentsStartY = -segmentHeight / 2;
        const frame = this.add.rectangle(0, 0, gaugeWidth, gaugeHeight, 0x25131A, 1)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x895A45, 1);

        const segments = [];
        for (let index = 0; index < segmentCount; index++) {
            const segment = this.add.image(
                segmentsStartX + index * (segmentWidth + segmentSpacing),
                segmentsStartY,
                'ui-goal-gauge-empty'
            )
                .setOrigin(0, 0)
                .setDisplaySize(segmentWidth, segmentHeight);
            segments.push(segment);
        }

        container.add([frame, ...segments]);

        const tweenState = { value: 0 };
        this.tweens.add({
            targets: tweenState,
            value: segmentCount * 0.9,
            duration: 1600,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            onStart: () => {
                tweenState.value = segmentCount * 0.3;
            },
            onUpdate: () => {
                const filledSegments = Math.max(0, Math.min(segmentCount, Math.round(tweenState.value)));
                segments.forEach((segment, index) => {
                    segment.setTexture(index < filledSegments ? 'ui-goal-gauge-full' : 'ui-goal-gauge-empty');
                });
            }
        });

        return {
            container,
            height: gaugeHeight
        };
    }

    createAnimatedChaosDemo(centerX, y, isNarrowViewport) {
        const container = this.add.container(centerX, y);
        const heroSize = isNarrowViewport ? 65 : 79;
        const gaugeRadius = isNarrowViewport ? 14 : 17;
        const hero = this.add.sprite(0, 0, 'hero-idle', 0)
            .setOrigin(0.5, 1)
            .setDisplaySize(heroSize, heroSize);
        hero.play('hero-idle');

        const gaugeY = isNarrowViewport ? 22 : 26;
        const gaugeGraphics = this.add.graphics();
        const bombIcon = this.add.image(0, gaugeY, 'bonus-bomb-icon')
            .setOrigin(0.5)
            .setDisplaySize(isNarrowViewport ? 16 : 19, isNarrowViewport ? 16 : 19)
            .setVisible(false)
            .setTint(0xAC3232);

        const renderGauge = (chargeValue, hasBomb) => {
            const progress = Math.max(0, Math.min(1, chargeValue / 100));
            gaugeGraphics.clear();
            gaugeGraphics.lineStyle(3, 0xAC3232, 1);
            gaugeGraphics.strokeCircle(0, gaugeY, gaugeRadius);
            gaugeGraphics.fillStyle(0xffffff, 1);
            gaugeGraphics.fillCircle(0, gaugeY, gaugeRadius - 3);

            if (!hasBomb && progress > 0) {
                gaugeGraphics.fillStyle(0xAC3232, 1);
                gaugeGraphics.beginPath();
                gaugeGraphics.moveTo(0, gaugeY);
                gaugeGraphics.arc(0, gaugeY, gaugeRadius - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
                gaugeGraphics.closePath();
                gaugeGraphics.fillPath();
            }

            gaugeGraphics.lineStyle(2, 0x111111, 1);
            gaugeGraphics.strokeCircle(0, gaugeY, gaugeRadius - 1);
            bombIcon.setVisible(hasBomb);
        };

        const startLoop = () => {
            const tweenState = { value: 0 };
            renderGauge(0, false);
            this.tweens.add({
                targets: tweenState,
                value: 100,
                duration: 1500,
                ease: 'Sine.easeOut',
                onUpdate: () => {
                    renderGauge(tweenState.value, false);
                },
                onComplete: () => {
                    renderGauge(100, true);
                    this.time.delayedCall(900, () => {
                        renderGauge(0, false);
                        this.time.delayedCall(260, startLoop);
                    });
                }
            });
        };

        startLoop();
        container.add([hero, gaugeGraphics, bombIcon]);

        return {
            container,
            height: heroSize + gaugeRadius * 2 + (isNarrowViewport ? 14 : 16)
        };
    }

    createAstrolabeStarsRow(centerX, y, isNarrowViewport) {
        const row = this.add.container(centerX, y);
        const spacing = isNarrowViewport ? 28 : 34;
        const starSize = isNarrowViewport ? 22 : 26;

        [-spacing, 0, spacing].forEach((offsetX) => {
            const star = this.add.image(offsetX, 0, 'meta-star')
                .setOrigin(0.5)
                .setDisplaySize(starSize, starSize);
            row.add(star);
        });

        return row;
    }

    createPotionsGrid(centerX, y, isNarrowViewport) {
        const grid = this.add.container(centerX, y);
        const columnSpacing = isNarrowViewport ? 82 : 102;
        const rowSpacing = isNarrowViewport ? 56 : 68;
        const potionSize = isNarrowViewport ? 38 : 46;
        const potionKeys = [
            'howto-potion-rose',
            'howto-potion-orange',
            'howto-potion-menthe',
            'howto-potion-marron',
            'howto-potion-blanche',
            'howto-potion-cyan'
        ];

        potionKeys.forEach((textureKey, index) => {
            const column = index % 3;
            const row = Math.floor(index / 3);
            const x = (column - 1) * columnSpacing;
            const yOffset = row * rowSpacing;
            const potion = this.add.image(x, yOffset, textureKey)
                .setOrigin(0.5)
                .setDisplaySize(potionSize, potionSize);
            grid.add(potion);
        });

        return grid;
    }

    ensureEnemyFaceAnimations() {
        const animationDefinitions = [
            { key: 'howto-enemy-goblin-face-idle', texture: 'howto-enemy-goblin-face' },
            { key: 'howto-enemy-skull-face-idle', texture: 'howto-enemy-skull-face' },
            { key: 'howto-enemy-wizard-face-idle', texture: 'howto-enemy-wizard-face' }
        ];

        animationDefinitions.forEach((definition) => {
            if (this.anims.exists(definition.key)) {
                return;
            }

            this.anims.create({
                key: definition.key,
                frames: this.anims.generateFrameNumbers(definition.texture, { start: 0, end: 3 }),
                frameRate: 5,
                repeat: -1
            });
        });
    }

    createBasicEnemyRow(centerX, y, isNarrowViewport) {
        const row = this.add.container(centerX, y);
        const spacing = isNarrowViewport ? 92 : 118;
        const spriteSize = isNarrowViewport ? 132 : 162;
        const feetBaselineY = spriteSize - (isNarrowViewport ? 8 : 10);
        const enemyEntries = [
            { texture: 'howto-enemy-skull-face', animation: 'howto-enemy-skull-face-idle', offsetX: -spacing, footOffset: isNarrowViewport ? 12 : 14 },
            { texture: 'howto-enemy-wizard-face', animation: 'howto-enemy-wizard-face-idle', offsetX: 0, footOffset: isNarrowViewport ? 2 : 6 },
            { texture: 'howto-enemy-goblin-face', animation: 'howto-enemy-goblin-face-idle', offsetX: spacing, footOffset: isNarrowViewport ? 8 : 10 }
        ];

        enemyEntries.forEach((entry) => {
            const sprite = this.add.sprite(entry.offsetX, feetBaselineY - entry.footOffset, entry.texture, 0)
                .setOrigin(0.5, 1)
                .setDisplaySize(spriteSize, spriteSize);
            sprite.play(entry.animation);
            row.add(sprite);
        });

        return row;
    }
}
