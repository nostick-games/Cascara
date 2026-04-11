class StoryMerchantScene extends Phaser.Scene {
    constructor(config = { key: 'StoryMerchantScene' }) {
        super(config);
        this.selectionRerolled = false;
    }

    init(data) {
        if (data?.language) {
            TranslationManager.setLanguage(data.language);
        }
        this.selectedNodeId = data?.selectedNodeId || null;
        this.storyState = this.rebuildStoryState(data?.storyState || {});
        this.selectionRerolled = false;
        this.initialSelection = this.buildInitialSelection();
        this.currentSelection = [...this.initialSelection];
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
        this.load.image('story-gold', 'assets/images/Story/gold.png');
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
        const scrollContent = this.add.container(0, 0);
        const preExistingObjects = new Set(this.children.list);

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

        this.add.image(centerX, bannerHeight / 2, 'merchant-banner')
            .setOrigin(0.5)
            .setDisplaySize(parchmentWidth, bannerHeight)
            .setDepth(4);
        this.add.text(centerX, isNarrowViewport ? 24 : 26, TranslationManager.t('merchant.title'), {
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

        this.goldValueText = this.drawGoldCounter(
            centerX,
            bannerHeight - (isNarrowViewport ? 42 : 56),
            isNarrowViewport
        );

        this.offerContainer = this.add.container(0, 0).setDepth(12);
        this.renderSelection(
            centerX,
            parchmentTopY + (isNarrowViewport ? 28 : 34),
            contentWidth,
            isNarrowViewport
        );

        this.rerollButton = this.createUiTextButton(
            centerX,
            parchmentBottomY - (isNarrowViewport ? 136 : 146),
            isNarrowViewport ? 220 : 244,
            40,
            TranslationManager.t('merchant.new_selection'),
            isNarrowViewport ? '16px' : '18px'
        );
        this.rerollButton.hitArea.on('pointerover', () => {
            if (!this.selectionRerolled) this.rerollButton.setState(true);
        });
        this.rerollButton.hitArea.on('pointerout', () => this.rerollButton.setState(false));
        this.rerollButton.hitArea.on('pointerdown', () => {
            if (this.selectionRerolled) {
                return;
            }
            this.selectionRerolled = true;
            this.currentSelection = this.buildRerollSelection();
            this.renderSelection(
                centerX,
                parchmentTopY + (isNarrowViewport ? 28 : 34),
                contentWidth,
                isNarrowViewport
            );
            this.rerollButton.setDisabled(true);
            this.rerollHintText.setVisible(false);
        });

        this.rerollHintText = this.add.text(centerX, parchmentBottomY - (isNarrowViewport ? 102 : 112), TranslationManager.t('merchant.reroll_hint'), {
            fontSize: isNarrowViewport ? '13px' : '16px',
            fill: '#5d3b2b',
            fontFamily: 'Vollkorn',
            align: 'center',
            wordWrap: { width: contentWidth - (isNarrowViewport ? 20 : 30) },
            lineSpacing: 2
        }).setOrigin(0.5).setDepth(12);

        const continueButton = this.createUiTextButton(
            centerX,
            parchmentBottomY - (isNarrowViewport ? 40 : 46),
            isNarrowViewport ? 190 : 214,
            42,
            TranslationManager.t('briefing.start'),
            isNarrowViewport ? '18px' : '20px'
        );
        continueButton.hitArea.on('pointerover', () => continueButton.setState(true));
        continueButton.hitArea.on('pointerout', () => continueButton.setState(false));
        continueButton.hitArea.on('pointerdown', () => {
            continueButton.setState(true);
            this.scene.start('StoryModePlaceholderScene', {
                language: TranslationManager.getLanguage(),
                storyState: this.buildAdvancedStoryState()
            });
        });

        const createdObjects = this.children.list.filter((child) =>
            child !== scrollContent && !preExistingObjects.has(child)
        );
        if (createdObjects.length > 0) {
            scrollContent.add(createdObjects);
        }

        VerticalScrollHelper.enable(this, {
            container: scrollContent,
            contentHeight: parchmentBottomY + (isNarrowViewport ? 16 : 22),
            viewportHeight,
            topPadding: 0,
            bottomPadding: isNarrowViewport ? 18 : 24
        });

        if (MetaProgression.shouldShowAstralFavorMerchantIntro()) {
            this.showAstralFavorPrompt(centerX, centerY, isNarrowViewport);
        }
    }

    rebuildStoryState(rawState) {
        return StoryMerchantState.rebuild(rawState);
    }

    buildAdvancedStoryState() {
        return StoryMerchantState.buildAdvanced(this.storyState, this.selectedNodeId);
    }

    buildInitialSelection() {
        return StoryFragmentCatalog.getRandomSelection(3).map((fragment) => fragment.id);
    }

    buildRerollSelection() {
        const initialHasPhoenix = this.initialSelection.includes('PHOENIX');
        const excludedIds = [...this.initialSelection];

        if (initialHasPhoenix) {
            return StoryFragmentCatalog.getRandomSelection(3, excludedIds).map((fragment) => fragment.id);
        }

        const otherFragments = StoryFragmentCatalog.getRandomSelection(2, [...excludedIds, 'PHOENIX'])
            .map((fragment) => fragment.id);

        return Phaser.Utils.Array.Shuffle(['PHOENIX', ...otherFragments]);
    }

    getCurrentPathPriceMultiplier() {
        const pathIndex = Math.max(0, Math.floor(this.storyState?.currentPathIndex || 0));
        if (pathIndex <= 0) {
            return 1;
        }
        if (pathIndex === 1) {
            return 1.25;
        }
        return 1.5;
    }

    getFragmentPriceForCurrentPath(fragment) {
        const basePrice = Math.max(0, Math.floor(fragment?.price || 0));
        const pathAdjustedPrice = basePrice * this.getCurrentPathPriceMultiplier();
        const hasAstralFavor = MetaProgression.hasAstrolabePurchase('ASTRAL_FAVOR');
        const discountedPrice = hasAstralFavor ? pathAdjustedPrice * 0.9 : pathAdjustedPrice;
        return Math.max(1, Math.round(discountedPrice));
    }

    renderSelection(centerX, topY, width, isNarrowViewport) {
        this.offerContainer.removeAll(true);
        this.fragmentCardRefreshers = [];

        const fragmentIds = this.currentSelection.slice(0, 3);
        const blockSpacing = isNarrowViewport ? 126 : 146;
        const animatedCards = [];

        fragmentIds.forEach((fragmentId, index) => {
            const baseFragment = StoryFragmentCatalog.getById(fragmentId);
            const fragment = baseFragment
                ? {
                    ...baseFragment,
                    price: this.getFragmentPriceForCurrentPath(baseFragment)
                }
                : null;
            if (!fragment) {
                return;
            }

            const y = topY + index * blockSpacing;
            const { container, refreshCardState } = this.buildFragmentCard(centerX, y, width, isNarrowViewport, fragment);
            this.fragmentCardRefreshers.push(refreshCardState);
            this.offerContainer.add(container);
            animatedCards.push({ card: container, index });
        });

        animatedCards.forEach(({ card, index }) => {
            card.setAlpha(0);
            card.y += 10;
            this.tweens.add({
                targets: card,
                alpha: 1,
                y: card.y - 10,
                delay: 120 + index * 160,
                duration: 220,
                ease: 'Sine.easeOut'
            });
        });
    }

    refreshAllFragmentCards() {
        (this.fragmentCardRefreshers || []).forEach((refreshCardState) => {
            refreshCardState();
        });
    }

    buildFragmentCard(centerX, y, width, isNarrowViewport, fragment) {
        return StoryMerchantRenderer.buildFragmentCard(this, {
            centerX,
            y,
            width,
            isNarrowViewport,
            fragment,
            storyState: this.storyState,
            onPurchase: (selectedFragment) => {
                const previousGold = this.storyState.gold || 0;
                const nextGold = Math.max(0, previousGold - selectedFragment.price);
                this.storyState.gold = nextGold;
                this.storyState.fragments = StoryFragmentInventory.incrementCount(this.storyState.fragments || {}, selectedFragment.id);
                this.animateGoldTo(previousGold, nextGold);
                this.refreshAllFragmentCards();
            }
        });
    }

    createOwnedBadge(x, y, count) {
        return StoryMerchantRenderer.createOwnedBadge(this, x, y, count);
    }

    drawGoldCounter(centerX, y, isNarrowViewport) {
        return StoryMerchantRenderer.drawGoldCounter(this, centerX, y, isNarrowViewport, this.storyState.gold ?? 100);
    }

    animateGoldTo(fromValue, toValue) {
        if (!this.goldValueText) {
            return;
        }

        this.tweens.killTweensOf(this.goldValueText);
        this.goldValueText.setText(`${fromValue}`);

        this.tweens.addCounter({
            from: fromValue,
            to: toValue,
            duration: Math.min(900, Math.max(280, Math.abs(fromValue - toValue) * 20)),
            ease: 'Sine.easeOut',
            onUpdate: (tween) => {
                this.goldValueText.setText(`${Math.round(tween.getValue())}`);
            },
            onComplete: () => {
                this.goldValueText.setText(`${toValue}`);
            }
        });
    }

    createGoldPriceButton(x, y, width, height, price) {
        return StoryMerchantRenderer.createGoldPriceButton(this, x, y, width, height, price);
    }

    createUiTextButton(x, y, width, height, label, fontSize = '16px', centerContent = false) {
        return StoryMerchantRenderer.createUiTextButton(this, x, y, width, height, label, fontSize, centerContent);
    }

    showAstralFavorPrompt(centerX, centerY, isNarrowViewport) {
        CenteredPromptModal.show(this, {
            depth: 40,
            width: isNarrowViewport ? 282 : 364,
            height: isNarrowViewport ? 208 : 228,
            bodyText: TranslationManager.t('merchant.astral_favor_intro'),
            buttonLabel: TranslationManager.t('merchant.thanks'),
            onConfirm: () => {
                MetaProgression.markAstralFavorMerchantIntroSeen();
            }
        });
    }
}
