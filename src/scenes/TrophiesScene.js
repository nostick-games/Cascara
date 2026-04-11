class TrophiesScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TrophiesScene' });
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
        this.trophies = this.trophies || new TrophyManager(this);
        this.trophies.preloadAssets(this);
    }

    create() {
        const viewportWidth = this.scale.width || 800;
        const viewportHeight = this.scale.height || 700;
        const centerX = viewportWidth / 2;
        const isNarrowViewport = viewportWidth < 500;
        const unlockedIds = new Set(TrophyManager.loadUnlockedIds());
        const trophies = TrophyManager.getDefinitions();
        const unlockedCount = trophies.filter((trophy) => unlockedIds.has(trophy.id)).length;

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
        this.add.text(centerX, isNarrowViewport ? 24 : 26, TranslationManager.t('menu.trophies_title'), {
            fontSize: isNarrowViewport ? '24px' : '32px',
            fill: '#fff3d5',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#4a2d20',
            strokeThickness: 3
        }).setOrigin(0.5, 0).setDepth(6);
        this.add.text(centerX, bannerHeight - (isNarrowViewport ? 42 : 56), `${unlockedCount}/${trophies.length}`, {
            fontSize: isNarrowViewport ? '18px' : '21px',
            fill: '#fff3d5',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            stroke: '#4a2d20',
            strokeThickness: 2
        }).setOrigin(0.5, 0.5).setDepth(12);

        this.add.image(centerX, centerY, 'ui-parchment')
            .setOrigin(0.5)
            .setScale(parchmentScale)
            .setAngle(90)
            .setDepth(5);

        const content = this.add.container(contentLeftX, innerTopY).setDepth(12);
        const contentMaskShape = this.make.graphics({ x: 0, y: 0, add: false });
        contentMaskShape.fillStyle(0xffffff, 1);
        contentMaskShape.fillRect(contentLeftX - 6, innerTopY - 6, contentWidth + 12, innerHeight + 12);
        content.setMask(contentMaskShape.createGeometryMask());

        let currentY = 0;
        currentY += this.createTrophyList(content, contentWidth, currentY, isNarrowViewport, trophies, unlockedIds);
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

    createTrophyList(parent, width, startY, isNarrowViewport, trophies, unlockedIds) {
        let currentY = startY;
        let currentCategory = null;

        trophies.forEach((trophy, index) => {
            if (trophy.categoryKey !== currentCategory) {
                currentCategory = trophy.categoryKey;
                if (index > 0) {
                    currentY += isNarrowViewport ? 14 : 18;
                }
                const categoryText = this.add.text(width / 2, currentY, TranslationManager.t(trophy.categoryKey), {
                    fontSize: isNarrowViewport ? '18px' : '21px',
                    fill: '#3b2419',
                    fontFamily: 'Vollkorn',
                    fontStyle: 'bold',
                    align: 'center',
                    wordWrap: { width }
                }).setOrigin(0.5, 0);
                parent.add(categoryText);
                currentY += categoryText.height + 10;
            }

            const isUnlocked = unlockedIds.has(trophy.id);
            const iconSize = isNarrowViewport ? 42 : 52;
            const iconX = iconSize / 2;
            const iconY = currentY + iconSize / 2;
            const textX = iconSize + 10;

            const icon = this.add.image(iconX, iconY, trophy.imageKey)
                .setOrigin(0.5)
                .setDisplaySize(iconSize, iconSize);
            const title = this.add.text(textX, currentY - 2, TranslationManager.t(trophy.titleKey), {
                fontSize: isNarrowViewport ? '15px' : '18px',
                fill: '#3b2419',
                fontFamily: 'Vollkorn',
                fontStyle: 'bold',
                wordWrap: { width: width - iconSize - 16 }
            }).setOrigin(0, 0);
            const desc = this.add.text(textX, currentY + title.height + 2, TranslationManager.t(trophy.descKey), {
                fontSize: isNarrowViewport ? '12px' : '14px',
                fill: '#5d3b2b',
                fontFamily: 'Vollkorn',
                wordWrap: { width: width - iconSize - 16 }
            }).setOrigin(0, 0);

            if (!isUnlocked) {
                icon.setTintFill(0x8a8a8a);
                icon.setAlpha(0.55);
                title.setAlpha(0.72);
                desc.setAlpha(0.72);
            }

            parent.add([icon, title, desc]);
            currentY += Math.max(iconSize, title.height + desc.height + 4) + 12;
        });

        return currentY - startY;
    }
}
