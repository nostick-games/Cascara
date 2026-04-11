class AstrolabeScene extends Phaser.Scene {
    constructor(config = { key: 'AstrolabeScene' }) {
        super(config);
        this.itemRefreshers = [];
        this.displayedStars = 0;
    }

    init(data) {
        if (data?.language) {
            TranslationManager.setLanguage(data.language);
        }
        MetaProgression.ensureInitialized();
        this.displayedStars = MetaProgression.getStars();
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
        this.load.image('meta-star', 'assets/images/bonus/star.png');
        this.load.image('astrolabe-astral-favor', 'assets/images/astrolabe/faveur_astrale.png');
        this.load.image('astrolabe-lucky-star', 'assets/images/astrolabe/bonne_etoile.png');
        this.load.image('arcade-kingdom-verdombre', 'assets/images/astrolabe/verdombre.png');
        this.load.image('arcade-kingdom-vulkarn', 'assets/images/astrolabe/Vulkarn.png');
        this.load.image('arcade-kingdom-drazhul', 'assets/images/astrolabe/drazhul.png');
        this.load.spritesheet('astrolabe-minigame-stratego', 'assets/images/astrolabe/stratego.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('astrolabe-minigame-fighter', 'assets/images/astrolabe/fight.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('astrolabe-minigame-boss-rush', 'assets/images/astrolabe/boss_rush.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }

    create() {
        const viewportWidth = this.scale.width || 800;
        const viewportHeight = this.scale.height || 700;
        const centerX = viewportWidth / 2;
        const isNarrowViewport = viewportWidth < 500;

        this.cameras.main.setBackgroundColor('#060606');
        this.ensurePreviewAnimations();

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
        this.add.text(centerX, isNarrowViewport ? 24 : 26, TranslationManager.t('astrolabe.title'), {
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

        this.starValueText = this.drawStarsCounter(
            centerX,
            bannerHeight - (isNarrowViewport ? 42 : 56),
            isNarrowViewport
        );

        const content = this.add.container(contentLeftX, innerTopY).setDepth(12);
        const contentMaskShape = this.make.graphics({ x: 0, y: 0, add: false });
        contentMaskShape.fillStyle(0xffffff, 1);
        contentMaskShape.fillRect(contentLeftX - 6, innerTopY - 6, contentWidth + 12, innerHeight + 12);
        content.setMask(contentMaskShape.createGeometryMask());

        let currentY = 0;
        const sections = AstrolabeCatalog.getSections();
        this.itemRefreshers = [];

        const introText = this.add.text(contentWidth / 2, currentY, TranslationManager.t('astrolabe.intro'), {
            fontSize: isNarrowViewport ? '16px' : '19px',
            fill: '#3b2419',
            fontFamily: 'Vollkorn',
            fontStyle: 'italic',
            align: 'center',
            wordWrap: { width: contentWidth }
        }).setOrigin(0.5, 0);
        content.add(introText);
        currentY += introText.height + (isNarrowViewport ? 18 : 22);

        sections.forEach((section, sectionIndex) => {
            if (sectionIndex > 0) {
                currentY += isNarrowViewport ? 18 : 22;
            }
            const title = this.add.text(contentWidth / 2, currentY, TranslationManager.t(section.titleKey), {
                fontSize: isNarrowViewport ? '21px' : '23px',
                fill: '#3b2419',
                fontFamily: 'Vollkorn',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: { width: contentWidth }
            }).setOrigin(0.5, 0);
            content.add(title);
            currentY += title.height + 10;

            section.items.forEach((item) => {
                const { container, height, refreshCardState } = this.buildAstrolabeCard(
                    contentWidth / 2,
                    currentY,
                    contentWidth,
                    isNarrowViewport,
                    item
                );
                content.add(container);
                this.itemRefreshers.push(refreshCardState);
                currentY += height + 8;
            });
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

        if (MetaProgression.shouldShowAstrolabeWelcome()) {
            this.showWelcomeRewardPrompt(centerX, centerY, isNarrowViewport);
        }
    }

    drawStarsCounter(centerX, y, isNarrowViewport) {
        const iconSize = isNarrowViewport ? 26 : 30;
        const valueText = this.add.text(0, y, `${this.displayedStars}`, {
            fontSize: isNarrowViewport ? '18px' : '21px',
            fill: '#fff3d5',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            stroke: '#4a2d20',
            strokeThickness: 2
        }).setOrigin(0, 0.5).setDepth(12);
        const totalWidth = iconSize + 8 + valueText.width;
        const iconX = centerX - totalWidth / 2;

        this.add.image(iconX, y, 'meta-star')
            .setOrigin(0, 0.5)
            .setDisplaySize(iconSize, iconSize)
            .setDepth(12);
        valueText.setX(iconX + iconSize + 8);
        return valueText;
    }

    animateStarsTo(fromValue, toValue) {
        const startValue = Math.max(0, Math.floor(fromValue || 0));
        const endValue = Math.max(0, Math.floor(toValue || 0));
        this.displayedStars = startValue;
        this.starValueText.setText(`${startValue}`);

        if (startValue === endValue) {
            return;
        }

        this.tweens.addCounter({
            from: startValue,
            to: endValue,
            duration: Math.min(1400, Math.max(500, Math.abs(endValue - startValue) * 40)),
            ease: 'Sine.easeOut',
            onUpdate: (tween) => {
                const nextValue = Math.round(tween.getValue());
                this.displayedStars = nextValue;
                this.starValueText.setText(`${nextValue}`);
            }
        });
    }

    createStarsPriceButton(x, y, width, height, price) {
        const button = StoryMerchantRenderer.createUiTextButton(this, x, y, width, height, `${price}`, '16px', true);
        const icon = this.add.image(-18, 0, 'meta-star')
            .setOrigin(0.5)
            .setDisplaySize(18, 18);
        button.container.addAt(icon, 3);
        button.label.setX(8);
        button.icon = icon;
        return button;
    }

    buildAstrolabeCard(centerX, y, width, isNarrowViewport, item) {
        const container = this.add.container(0, 0);
        const iconX = centerX - width / 2 + (isNarrowViewport ? 30 : 38);
        const iconY = y + (isNarrowViewport ? 30 : 34);
        const iconSize = isNarrowViewport ? 56 : 68;
        const textX = iconX + (isNarrowViewport ? 42 : 54);
        const buttonWidth = isNarrowViewport ? 126 : 138;
        const cardHeight = isNarrowViewport ? 118 : 132;

        const previewImage = item.previewTextureKey
            ? (
                item.previewAnimationKey
                    ? this.add.sprite(iconX, iconY, item.previewTextureKey, 0)
                        .setOrigin(0.5)
                        .setDisplaySize(iconSize, iconSize)
                        .play(item.previewAnimationKey)
                    : this.add.image(iconX, iconY, item.previewTextureKey)
                        .setOrigin(0.5)
                        .setDisplaySize(iconSize, iconSize)
            )
            : null;
        const placeholder = previewImage
            ? null
            : this.add.rectangle(iconX, iconY, iconSize, iconSize, 0xc86a20, 0.96)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0xf3c37a, 1);
        const placeholderText = this.add.text(iconX, iconY + 1, item.placeholderLabel || '?', {
            fontSize: isNarrowViewport ? '18px' : '22px',
            fill: '#fff6df',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5).setVisible(!previewImage);

        const title = this.add.text(textX, y, TranslationManager.t(item.titleKey), {
            fontSize: isNarrowViewport ? '13px' : '21px',
            fill: '#3b2419',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            wordWrap: { width: width - (isNarrowViewport ? 120 : 150) }
        }).setOrigin(0, 0);
        const desc = this.add.text(textX, y + title.height + 2, TranslationManager.t(item.descKey), {
            fontSize: isNarrowViewport ? '16px' : '19px',
            fill: '#5d3b2b',
            fontFamily: 'Vollkorn',
            wordWrap: { width: width - (isNarrowViewport ? 120 : 150) }
        }).setOrigin(0, 0);

        const buyButton = this.createStarsPriceButton(
            textX + buttonWidth / 2,
            y + (isNarrowViewport ? 88 : 100),
            buttonWidth,
            34,
            item.price
        );

        const refreshCardState = () => {
            const owned = MetaProgression.hasAstrolabePurchase(item.id);
            const currentStars = MetaProgression.getStars();
            const affordable = currentStars >= item.price;
            buyButton.label.setText(owned ? TranslationManager.t('astrolabe.owned') : `${item.price}`);
            buyButton.label.setX(owned ? 0 : 8);
            buyButton.icon.setVisible(!owned);
            buyButton.setDisabled(owned || !affordable);
            buyButton.setState(false);
            if (owned || !affordable) {
                buyButton.hitArea.disableInteractive();
                buyButton.container.setAlpha(0.55);
            } else {
                buyButton.hitArea.setInteractive({ useHandCursor: true });
                buyButton.container.setAlpha(1);
            }
        };

        buyButton.hitArea.on('pointerover', () => {
            if (!buyButton.isDisabled()) {
                buyButton.setState(true);
            }
        });
        buyButton.hitArea.on('pointerout', () => buyButton.setState(false));
        buyButton.hitArea.on('pointerdown', () => {
            if (buyButton.isDisabled()) {
                return;
            }
            const previousStars = MetaProgression.getStars();
            if (!MetaProgression.purchaseAstrolabeItem(item.id, item.price)) {
                refreshCardState();
                return;
            }
            this.animateStarsTo(previousStars, MetaProgression.getStars());
            this.refreshAllItems();
        });

        refreshCardState();

        container.add([
            ...(placeholder ? [placeholder] : []),
            ...(previewImage ? [previewImage] : []),
            placeholderText,
            title,
            desc,
            buyButton.container
        ]);

        return {
            container,
            height: cardHeight,
            refreshCardState
        };
    }

    ensurePreviewAnimations() {
        const animationDefinitions = [
            {
                key: 'astrolabe-minigame-stratego-idle',
                textureKey: 'astrolabe-minigame-stratego'
            },
            {
                key: 'astrolabe-minigame-fighter-idle',
                textureKey: 'astrolabe-minigame-fighter'
            },
            {
                key: 'astrolabe-minigame-boss-rush-idle',
                textureKey: 'astrolabe-minigame-boss-rush'
            }
        ];

        animationDefinitions.forEach(({ key, textureKey }) => {
            if (this.anims.exists(key)) {
                return;
            }

            this.anims.create({
                key,
                frames: this.anims.generateFrameNumbers(textureKey, {
                    start: 0,
                    end: 5
                }),
                frameRate: 7,
                repeat: -1
            });
        });
    }

    refreshAllItems() {
        this.itemRefreshers.forEach((refreshCardState) => refreshCardState());
    }

    showWelcomeRewardPrompt(centerX, centerY, isNarrowViewport) {
        CenteredPromptModal.show(this, {
            depth: 40,
            width: isNarrowViewport ? 278 : 352,
            height: isNarrowViewport ? 212 : 236,
            bodyText: TranslationManager.t('astrolabe.welcome_body'),
            buttonLabel: TranslationManager.t('astrolabe.welcome_confirm'),
            onConfirm: () => {
                const previousStars = MetaProgression.getStars();
                const nextStars = MetaProgression.grantAstrolabeWelcomeStars();
                this.animateStarsTo(previousStars, nextStars);
                this.refreshAllItems();
            }
        });
    }
}
