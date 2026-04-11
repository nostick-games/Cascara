class StoryIntroScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StoryIntroScene' });
    }

    init(data) {
        if (data?.language) {
            TranslationManager.setLanguage(data.language);
        }
        this.startingFragments = StoryFragmentCatalog.getRandomSelection(3);
    }

    preload() {
        this.load.image('ui-button-left-off', 'assets/images/UI/bouton_bord_gauche_off.png');
        this.load.image('ui-button-fill-off', 'assets/images/UI/bouton_fond_off.png');
        this.load.image('ui-button-right-off', 'assets/images/UI/bouton_bord_droite_off.png');
        this.load.image('ui-button-left-on', 'assets/images/UI/bouton_bord_gauche_on.png');
        this.load.image('ui-button-fill-on', 'assets/images/UI/bouton_fond_on.png');
        this.load.image('ui-button-right-on', 'assets/images/UI/bouton_bord_droite_on.png');
        this.load.image('story-fragment-initiative', 'assets/images/fragments/fragment_initiative.png');
        this.load.image('story-fragment-ambition', 'assets/images/fragments/fragment_ambition.png');
        this.load.image('story-fragment-alchemist', 'assets/images/fragments/fragment_alchemist.png');
        this.load.image('story-fragment-fire', 'assets/images/fragments/fragment_fire.png');
        this.load.image('story-fragment-rune', 'assets/images/fragments/fragment_rune.png');
        this.load.image('story-fragment-guardian', 'assets/images/fragments/fragment_guardian.png');
        this.load.image('story-fragment-lost', 'assets/images/fragments/fragment_lost.png');
        this.load.image('story-fragment-phoenix', 'assets/images/fragments/fragment_phoenix.png');
    }

    create() {
        const viewportWidth = this.scale.width || 800;
        const viewportHeight = this.scale.height || 700;
        const centerX = viewportWidth / 2;
        const isNarrowViewport = viewportWidth < 500;
        const sectionWidth = Math.min(viewportWidth - 36, isNarrowViewport ? 320 : 540);

        this.cameras.main.setBackgroundColor('#060606');

        const content = this.add.container(0, 0);
        const animatedBlocks = [];
        let currentY = isNarrowViewport ? 54 : 66;

        const addCenteredText = (text, y, size, color = '#ffffff', style = 'bold') => {
            const label = this.add.text(centerX, y, text, {
                fontSize: size,
                fill: color,
                fontFamily: 'Vollkorn',
                fontStyle: style,
                align: 'center',
                wordWrap: { width: sectionWidth }
            }).setOrigin(0.5, 0);
            content.add(label);
            return label;
        };

        const queueAnimatedBlock = (targets) => {
            const targetList = Array.isArray(targets) ? targets : [targets];
            targetList.forEach((target) => {
                target.setAlpha(0);
                target.y -= 8;
            });
            animatedBlocks.push(targetList);
        };

        const welcomeText = addCenteredText(TranslationManager.t('story_intro.welcome'), currentY, isNarrowViewport ? '28px' : '32px');
        queueAnimatedBlock(welcomeText);
        currentY += welcomeText.height + 16;

        const introText = addCenteredText(TranslationManager.t('story_intro.relics_intro'), currentY, isNarrowViewport ? '16px' : '19px', '#f3e8d2', 'normal');
        queueAnimatedBlock(introText);
        currentY += introText.height + 18;

        this.startingFragments.forEach((fragment) => {
            const slotY = currentY;
            const iconX = centerX - sectionWidth / 2 + (isNarrowViewport ? 34 : 48);
            const textX = iconX + (isNarrowViewport ? 38 : 50);
            const icon = this.add.image(iconX, slotY + (isNarrowViewport ? 20 : 22), fragment.textureKey)
                .setOrigin(0.5)
                .setDisplaySize(isNarrowViewport ? 34 : 40, isNarrowViewport ? 34 : 40);
            const name = this.add.text(textX, slotY, TranslationManager.t(fragment.titleKey), {
                fontSize: isNarrowViewport ? '17px' : '20px',
                fill: '#ffffff',
                fontFamily: 'Vollkorn',
                fontStyle: 'bold',
                wordWrap: { width: sectionWidth - (textX - (centerX - sectionWidth / 2)) }
            }).setOrigin(0, 0);
            const desc = this.add.text(textX, slotY + name.height + 2, TranslationManager.t(fragment.descKey), {
                fontSize: isNarrowViewport ? '13px' : '15px',
                fill: '#d0c5b4',
                fontFamily: 'Vollkorn',
                wordWrap: { width: sectionWidth - (textX - (centerX - sectionWidth / 2)) }
            }).setOrigin(0, 0);
            content.add([icon, name, desc]);
            queueAnimatedBlock([icon, name, desc]);
            currentY += Math.max(isNarrowViewport ? 60 : 68, desc.y + desc.height - slotY) + 8;
        });

        currentY += 8;
        const luckText = addCenteredText(TranslationManager.t('story_intro.good_luck'), currentY, isNarrowViewport ? '20px' : '24px', '#f3e8d2');
        queueAnimatedBlock(luckText);
        currentY += luckText.height + 16;

        const adventureButton = this.createUiButton(
            centerX,
            currentY + 27,
            isNarrowViewport ? 200 : 220,
            54,
            TranslationManager.t('story_intro.adventure'),
            isNarrowViewport ? '24px' : '30px'
        );
        adventureButton.hitArea.on('pointerover', () => adventureButton.setState(true));
        adventureButton.hitArea.on('pointerout', () => adventureButton.setState(false));
        adventureButton.hitArea.on('pointerdown', () => {
            adventureButton.setState(true);
            this.scene.start('StoryModePlaceholderScene', {
                language: TranslationManager.getLanguage(),
                initialStoryFragmentIds: this.startingFragments.map((fragment) => fragment.id),
                initialStoryFragments: this.startingFragments.reduce((accumulator, fragment) => {
                    accumulator[fragment.id] = (accumulator[fragment.id] || 0) + 1;
                    return accumulator;
                }, {})
            });
        });
        content.add(adventureButton.container);
        queueAnimatedBlock(adventureButton.container);
        currentY += 64;

        const contentHeight = currentY - (isNarrowViewport ? 54 : 66);
        VerticalScrollHelper.enable(this, {
            container: content,
            contentHeight: currentY + (isNarrowViewport ? 24 : 28),
            viewportHeight,
            topPadding: 0,
            bottomPadding: isNarrowViewport ? 20 : 28
        });

        this.animateBlocks(animatedBlocks);
    }

    animateBlocks(blocks) {
        blocks.forEach((block, index) => {
            this.time.delayedCall(index * 150, () => {
                block.forEach((target) => {
                    target.setVisible(true);
                    this.tweens.add({
                        targets: target,
                        alpha: 1,
                        y: target.y + 8,
                        duration: 220,
                        ease: 'Quad.Out'
                    });
                });
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

        return { container, hitArea, label: text, setState };
    }
}
