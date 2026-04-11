class BriefingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BriefingScene' });
    }

    init(data) {
        this.launchingCombat = false;
        this.aiCount = data.aiCount || 2;
        this.boardSize = data.boardSize || 14;
        this.difficulty = data.difficulty || 'NORMAL';
        this.enemyAssignments = data.enemyAssignments || {};
        this.progressPotions = (data.progressPotions || []).map((potion) => ({ ...potion }));
        this.storyContext = data?.storyContext || null;
        this.storyNodeType = data?.storyNodeType || null;
        this.storyGoldReward = data?.storyGoldReward || 0;
        this.arcadeKingdomId = data?.arcadeKingdomId || 'VERDOMBRE';
        this.availableArcadeKingdoms = this.getAvailableArcadeKingdoms();
        this.selectedArcadeKingdomIndex = this.getInitialSelectedArcadeKingdomIndex();
        this.arcadeKingdomChosen = this.availableArcadeKingdoms.length <= 1;
        this.availableBossBlessings = this.getAvailableBossBlessings();
        this.selectedBossBlessingIndex = this.getInitialSelectedBossBlessingIndex();
        this.maxFragmentSelections = BriefingStoryContextHelper.getMaxFragmentSelections(this.storyContext?.storyState || {});
        this.availableFragments = this.getAvailableFragments();
        this.selectedFragmentIndex = this.getInitialSelectedFragmentIndex();
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

        const enemyDefinitions = EnemyDefinitions.getAll();
        Object.values(enemyDefinitions).forEach((enemy) => {
            this.load.spritesheet(enemy.idleTexture, enemy.idleAssetPath || `assets/images/enemies/${enemy.key.toLowerCase()}_idle_left.png`, {
                frameWidth: enemy.frameWidth || 64,
                frameHeight: enemy.frameHeight || 64
            });
            this.load.spritesheet(enemy.briefingIdleTexture || enemy.idleTexture, enemy.briefingIdleAssetPath || enemy.idleAssetPath || `assets/images/enemies/${enemy.key.toLowerCase()}_idle_left.png`, {
                frameWidth: enemy.frameWidth || 64,
                frameHeight: enemy.frameHeight || 64
            });
        });

        this.load.image('progress-potion-rose', 'assets/images/bonus/potion_rose.png');
        this.load.image('progress-potion-orange', 'assets/images/bonus/potion_orange.png');
        this.load.image('progress-potion-menthe', 'assets/images/bonus/potion_menthe.png');
        this.load.image('progress-potion-marron', 'assets/images/bonus/potion_marron.png');
        this.load.image('progress-potion-blanche', 'assets/images/bonus/potion_white.png');
        this.load.image('progress-potion-cyan', 'assets/images/bonus/potion_cyan.png');
        this.load.image('story-fragment-initiative', 'assets/images/fragments/fragment_initiative.png');
        this.load.image('story-fragment-ambition', 'assets/images/fragments/fragment_ambition.png');
        this.load.image('story-fragment-alchemist', 'assets/images/fragments/fragment_alchemist.png');
        this.load.image('story-fragment-fire', 'assets/images/fragments/fragment_fire.png');
        this.load.image('story-fragment-rune', 'assets/images/fragments/fragment_rune.png');
        this.load.image('story-fragment-guardian', 'assets/images/fragments/fragment_guardian.png');
        this.load.image('story-fragment-lost', 'assets/images/fragments/fragment_lost.png');
        this.load.image('story-fragment-phoenix', 'assets/images/fragments/fragment_phoenix.png');
        this.load.image('bonus-bomb-icon', 'assets/images/bonus/bomb_icon.png');
        this.load.image('boss-blessing-shoe', 'assets/images/bonus/shoe.png');
        this.load.image('boss-blessing-shield', 'assets/images/bonus/shield.png');
        this.load.image('arcade-kingdom-verdombre', 'assets/images/astrolabe/verdombre.png');
        this.load.image('arcade-kingdom-vulkarn', 'assets/images/astrolabe/Vulkarn.png');
        this.load.image('arcade-kingdom-drazhul', 'assets/images/astrolabe/drazhul.png');
    }

    create() {
        const viewportWidth = this.scale.width || 800;
        const viewportHeight = this.scale.height || 700;
        const centerX = viewportWidth / 2;
        const isNarrowViewport = viewportWidth < 500;

        this.cameras.main.setBackgroundColor('#060606');
        this.lostFragmentPrompt = null;
        this.ensureBriefingEnemyAnimations();

        const content = this.add.container(0, 0);
        const animatedBlocks = [];
        const contentStartY = isNarrowViewport ? 44 : 54;
        let currentY = contentStartY;
        const sectionWidth = Math.min(viewportWidth - 36, isNarrowViewport ? 320 : 540);
        const rowHeight = isNarrowViewport ? 56 : 64;
        const spriteScale = isNarrowViewport ? 1.4 : 1.7;
        const showFragmentsSection = this.storyContext?.source === 'story';
        const showBossBlessingsSection = showFragmentsSection && this.storyNodeType === 'boss';
        const showArcadeKingdomSection = !showFragmentsSection && this.availableArcadeKingdoms.length > 1;

        const queueAnimatedBlock = (targets) => {
            const targetList = Array.isArray(targets) ? targets : [targets];
            targetList.forEach((target) => {
                target.setAlpha(0);
                target.y -= 8;
            });
            animatedBlocks.push(targetList);
        };

        const readyText = BriefingRenderer.addCenteredText(this, content, centerX, sectionWidth, TranslationManager.t('briefing.ready'), currentY, isNarrowViewport ? '26px' : '30px');
        queueAnimatedBlock(readyText);
        currentY += readyText.height + (isNarrowViewport ? 14 : 18);

        const enemiesTitle = BriefingRenderer.addCenteredText(this, content, centerX, sectionWidth, TranslationManager.t('briefing.enemies'), currentY, isNarrowViewport ? '18px' : '20px', '#f3e8d2');
        queueAnimatedBlock(enemiesTitle);
        currentY += enemiesTitle.height + 10;

        const enemyColors = ['BLEU', 'VERT', 'JAUNE'].filter((color) => this.enemyAssignments[color]);
        enemyColors.forEach((color) => {
            const enemy = this.enemyAssignments[color];
            const row = BriefingRenderer.addEnemyRow(this, content, centerX, sectionWidth, currentY, rowHeight, spriteScale, isNarrowViewport, enemy);
            queueAnimatedBlock([row.sprite, row.name, row.desc]);
            currentY += row.height + 6;
        });

        currentY += 8;
        const potionsTitle = BriefingRenderer.addCenteredText(this, content, centerX, sectionWidth, TranslationManager.t('briefing.potions'), currentY, isNarrowViewport ? '18px' : '20px', '#f3e8d2');
        queueAnimatedBlock(potionsTitle);
        currentY += potionsTitle.height + 10;

        this.progressPotions.forEach((potion) => {
            const row = BriefingRenderer.addPotionRow(this, content, centerX, sectionWidth, currentY, rowHeight, isNarrowViewport, potion);
            queueAnimatedBlock([row.icon, row.name, row.desc]);
            currentY += row.height + 6;
        });

        if (showArcadeKingdomSection) {
            currentY += 14;
            const kingdomsTitle = BriefingRenderer.addCenteredText(this, content, centerX, sectionWidth, TranslationManager.t('briefing.kingdoms'), currentY, isNarrowViewport ? '18px' : '20px', '#f3e8d2');
            queueAnimatedBlock(kingdomsTitle);
            currentY += kingdomsTitle.height + 12;

            const kingdomCarousel = this.createArcadeKingdomCarousel(centerX, currentY, sectionWidth, isNarrowViewport);
            content.add(kingdomCarousel.container);
            queueAnimatedBlock(kingdomCarousel.animatedTargets);
            currentY += kingdomCarousel.height + 10;

            const chooseKingdomButton = this.createUiButton(
                centerX,
                currentY + 20,
                isNarrowViewport ? 250 : 280,
                40,
                TranslationManager.t('briefing.choose_kingdom'),
                isNarrowViewport ? '16px' : '18px'
            );
            chooseKingdomButton.hitArea.on('pointerover', () => {
                if (!kingdomCarousel.isChoiceDisabled()) chooseKingdomButton.setState(true);
            });
            chooseKingdomButton.hitArea.on('pointerout', () => chooseKingdomButton.setState(false));
            chooseKingdomButton.hitArea.on('pointerdown', () => {
                if (kingdomCarousel.isChoiceDisabled()) {
                    return;
                }
                chooseKingdomButton.setState(true);
                kingdomCarousel.selectCurrentKingdom();
            });
            content.add(chooseKingdomButton.container);
            chooseKingdomButton.container.setVisible(false);
            chooseKingdomButton.hitArea.disableInteractive();
            queueAnimatedBlock(chooseKingdomButton.container);
            kingdomCarousel.setChooseButtonState(chooseKingdomButton);
            currentY += 54;
            currentY += 8;
        }

        if (showBossBlessingsSection) {
            currentY += 14;
            const blessingsTitle = BriefingRenderer.addCenteredText(this, content, centerX, sectionWidth, TranslationManager.t('briefing.boss_blessings'), currentY, isNarrowViewport ? '18px' : '20px', '#f3e8d2');
            queueAnimatedBlock(blessingsTitle);
            currentY += blessingsTitle.height + 12;

            const blessingCarousel = this.createBossBlessingCarousel(centerX, currentY, sectionWidth, isNarrowViewport);
            content.add(blessingCarousel.container);
            queueAnimatedBlock(blessingCarousel.animatedTargets);
            currentY += blessingCarousel.height + 10;

            const chooseBlessingButton = this.createUiButton(
                centerX,
                currentY + 20,
                isNarrowViewport ? 260 : 286,
                40,
                TranslationManager.t('briefing.choose_blessing'),
                isNarrowViewport ? '16px' : '18px'
            );
            chooseBlessingButton.hitArea.on('pointerover', () => {
                if (!blessingCarousel.isChoiceDisabled()) chooseBlessingButton.setState(true);
            });
            chooseBlessingButton.hitArea.on('pointerout', () => chooseBlessingButton.setState(false));
            chooseBlessingButton.hitArea.on('pointerdown', () => {
                if (blessingCarousel.isChoiceDisabled()) {
                    return;
                }
                chooseBlessingButton.setState(true);
                blessingCarousel.selectCurrentBlessing();
            });
            content.add(chooseBlessingButton.container);
            chooseBlessingButton.container.setVisible(false);
            chooseBlessingButton.hitArea.disableInteractive();
            queueAnimatedBlock(chooseBlessingButton.container);
            blessingCarousel.setChooseButtonState(chooseBlessingButton);
            currentY += 54;
            currentY += 8;
        }

        if (showFragmentsSection) {
            currentY += 14;
            const fragmentsTitle = BriefingRenderer.addCenteredText(this, content, centerX, sectionWidth, TranslationManager.t('briefing.fragments'), currentY, isNarrowViewport ? '18px' : '20px', '#f3e8d2');
            queueAnimatedBlock(fragmentsTitle);
            currentY += fragmentsTitle.height + 12;

            const fragmentCarousel = this.createFragmentCarousel(centerX, currentY, sectionWidth, isNarrowViewport);
            content.add(fragmentCarousel.container);
            queueAnimatedBlock(fragmentCarousel.animatedTargets);
            currentY += fragmentCarousel.height + 10;

            const chooseFragmentButton = this.createUiButton(
                centerX,
                currentY + 20,
                isNarrowViewport ? 286 : 332,
                40,
                this.getFragmentChoiceButtonLabel(),
                isNarrowViewport ? '16px' : '18px'
            );
            chooseFragmentButton.hitArea.on('pointerover', () => {
                if (!fragmentCarousel.isChoiceDisabled()) chooseFragmentButton.setState(true);
            });
            chooseFragmentButton.hitArea.on('pointerout', () => chooseFragmentButton.setState(false));
            chooseFragmentButton.hitArea.on('pointerdown', () => {
                if (fragmentCarousel.isChoiceDisabled()) {
                    return;
                }
                chooseFragmentButton.setState(true);
                fragmentCarousel.selectCurrentFragment();
            });
            content.add(chooseFragmentButton.container);
            chooseFragmentButton.container.setVisible(false);
            chooseFragmentButton.hitArea.disableInteractive();
            if (this.availableFragments.length > 0) {
                queueAnimatedBlock(chooseFragmentButton.container);
                currentY += 54;
            }
            fragmentCarousel.setChooseButtonState(chooseFragmentButton);

            currentY += 8;
        } else {
            currentY += 14;
        }

        const goButton = this.createUiButton(
            centerX,
            currentY + 27,
            isNarrowViewport ? 200 : 220,
            54,
            TranslationManager.t('briefing.start'),
            isNarrowViewport ? '24px' : '30px'
        );
        goButton.hitArea.on('pointerover', () => goButton.setState(true));
        goButton.hitArea.on('pointerout', () => goButton.setState(false));
        goButton.hitArea.on('pointerdown', () => {
            this.launchCombatWithTransition(goButton);
        });
        content.add(goButton.container);
        currentY += 64;

        VerticalScrollHelper.enable(this, {
            container: content,
            contentHeight: currentY + (isNarrowViewport ? 22 : 28),
            viewportHeight,
            topPadding: 0,
            bottomPadding: isNarrowViewport ? 18 : 24
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

    launchCombatWithTransition(goButton) {
        if (this.launchingCombat) {
            return;
        }

        this.launchingCombat = true;
        goButton.setState(true);
        goButton.hitArea.disableInteractive();
        const gameStartPayload = this.buildGameStartPayload();
        let hasStartedCombat = false;
        const startCombat = () => {
            if (hasStartedCombat || !this.scene.isActive()) {
                return;
            }
            hasStartedCombat = true;
            this.scene.start('GameScene', gameStartPayload);
        };

        this.time.delayedCall(900, startCombat);
        BriefingBattleTransition.play(this, startCombat);
    }

    buildGameStartPayload() {
        return {
            aiCount: this.aiCount,
            boardSize: this.boardSize,
            difficulty: this.difficulty,
            language: TranslationManager.getLanguage(),
            enemyAssignments: this.enemyAssignments,
            progressPotions: this.progressPotions,
            arcadeKingdomId: this.getSelectedArcadeKingdomId(),
            storyNodeType: this.storyNodeType,
            storyContext: this.buildStoryContextForGame(),
            storyGoldReward: this.storyGoldReward
        };
    }

    ensureBriefingEnemyAnimations() {
        const enemyDefinitions = EnemyDefinitions.getAll();

        Object.values(enemyDefinitions).forEach((enemy) => {
            const animationKey = this.getBriefingIdleAnimationKey(enemy.key);
            const textureKey = enemy.briefingIdleTexture || enemy.idleTexture;

            if (this.anims.exists(animationKey)) {
                return;
            }

            this.anims.create({
                key: animationKey,
                frames: this.anims.generateFrameNumbers(textureKey, {
                    start: 0,
                    end: enemy.idleFrames - 1
                }),
                frameRate: 7,
                repeat: -1
            });
        });
    }

    getBriefingIdleAnimationKey(enemyType) {
        return `enemy-${enemyType.toLowerCase()}-briefing-idle`;
    }

    getAvailableFragments() {
        const briefingFragmentIds = this.storyContext?.storyState?.briefingFragmentIds || [];
        return StoryFragmentInventory.getOwnedFragments(
            this.storyContext?.storyState || {},
            briefingFragmentIds,
            Infinity
        );
    }

    getAvailableArcadeKingdoms() {
        if (this.storyContext?.source === 'story') {
            return [];
        }
        return ArcadeKingdomCatalog.getUnlockedForArcade();
    }

    getInitialSelectedArcadeKingdomIndex() {
        if (this.availableArcadeKingdoms.length === 0) {
            return -1;
        }

        const activeIndex = this.availableArcadeKingdoms.findIndex((kingdom) => kingdom.id === this.arcadeKingdomId);
        return activeIndex >= 0 ? activeIndex : 0;
    }

    getSelectedArcadeKingdomId() {
        if (this.availableArcadeKingdoms.length === 0) {
            return 'VERDOMBRE';
        }
        const currentKingdom = this.availableArcadeKingdoms[this.selectedArcadeKingdomIndex];
        return currentKingdom?.id || 'VERDOMBRE';
    }

    getSelectedFragmentIds(storyState = this.storyContext?.storyState || {}) {
        return BriefingStoryContextHelper.getSelectedFragmentIds(storyState);
    }

    getRemainingFragmentSelectionCount() {
        return Math.max(0, this.maxFragmentSelections - this.getSelectedFragmentIds().length);
    }

    getFragmentChoiceButtonLabel() {
        const remainingCount = this.getRemainingFragmentSelectionCount();
        if (remainingCount <= 0) {
            return TranslationManager.getLanguage() === 'en'
                ? 'No fragment left to choose'
                : 'Plus de fragment à choisir';
        }
        if (TranslationManager.getLanguage() === 'en') {
            return remainingCount === 1
                ? 'Choose 1 fragment'
                : `Choose ${remainingCount} fragments`;
        }
        if (remainingCount <= 1) {
            return `Choisir ${remainingCount} fragment`;
        }
        return `Choisir ${remainingCount} fragments`;
    }

    getInitialSelectedFragmentIndex() {
        if (this.availableFragments.length === 0) {
            return -1;
        }

        const selectedFragmentIds = this.getSelectedFragmentIds();
        const lastSelectedFragmentId = selectedFragmentIds[selectedFragmentIds.length - 1] || null;
        const activeIndex = this.availableFragments.findIndex((fragment) => fragment.id === lastSelectedFragmentId);
        return activeIndex >= 0 ? activeIndex : 0;
    }

    getAvailableBossBlessings() {
        if (this.storyContext?.source !== 'story' || this.storyNodeType !== 'boss') {
            return [];
        }
        return BossBlessingCatalog.getAll();
    }

    getInitialSelectedBossBlessingIndex() {
        if (this.availableBossBlessings.length === 0) {
            return -1;
        }

        const activeBossBlessingId = this.storyContext?.storyState?.activeBossBlessingId || null;
        const activeIndex = this.availableBossBlessings.findIndex((blessing) => blessing.id === activeBossBlessingId);
        return activeIndex >= 0 ? activeIndex : 0;
    }

    buildStoryContextForGame() {
        return BriefingStoryContextHelper.buildForGame(this.storyContext);
    }

    buildStoryContextForSelectedFragment(selectedFragment) {
        return BriefingStoryContextHelper.buildForSelectedFragment(this.storyContext, selectedFragment);
    }

    buildStoryContextForSelectedBossBlessing(selectedBlessing) {
        return BriefingStoryContextHelper.buildForSelectedBossBlessing(this.storyContext, selectedBlessing);
    }

    createFragmentCarousel(centerX, topY, sectionWidth, isNarrowViewport) {
        return BriefingFragmentCarousel.create(this, {
            centerX,
            topY,
            sectionWidth,
            isNarrowViewport,
            getAvailableFragments: () => this.availableFragments,
            selectedFragmentIndex: () => this.selectedFragmentIndex,
            getStoryState: () => this.storyContext?.storyState || {},
            getRemainingChoiceCount: () => this.getRemainingFragmentSelectionCount(),
            getChoiceLabel: () => this.getFragmentChoiceButtonLabel(),
            onSelectionChange: (nextIndex) => {
                this.selectedFragmentIndex = nextIndex;
            },
            onSelectCurrent: (selectedFragment) => {
                this.storyContext = this.buildStoryContextForSelectedFragment(selectedFragment);
                this.availableFragments = this.getAvailableFragments();
                if (this.availableFragments.length === 0) {
                    this.selectedFragmentIndex = -1;
                } else {
                    this.selectedFragmentIndex = Math.min(
                        this.selectedFragmentIndex,
                        this.availableFragments.length - 1
                    );
                }
                if (selectedFragment?.id === 'LOST') {
                    this.openLostFragmentPrompt();
                }
            }
        });
    }

    createBossBlessingCarousel(centerX, topY, sectionWidth, isNarrowViewport) {
        return BriefingBossBlessingCarousel.create(this, {
            centerX,
            topY,
            sectionWidth,
            isNarrowViewport,
            getAvailableBlessings: () => this.availableBossBlessings,
            selectedBlessingIndex: () => this.selectedBossBlessingIndex,
            getStoryState: () => this.storyContext?.storyState || {},
            onSelectionChange: (nextIndex) => {
                this.selectedBossBlessingIndex = nextIndex;
            },
            onSelectCurrent: (selectedBlessing) => {
                this.storyContext = this.buildStoryContextForSelectedBossBlessing(selectedBlessing);
            }
        });
    }

    createArcadeKingdomCarousel(centerX, topY, sectionWidth, isNarrowViewport) {
        return BriefingArcadeKingdomCarousel.create(this, {
            centerX,
            topY,
            sectionWidth,
            isNarrowViewport,
            getAvailableKingdoms: () => this.availableArcadeKingdoms,
            selectedKingdomIndex: () => this.selectedArcadeKingdomIndex,
            isKingdomChosen: () => this.arcadeKingdomChosen,
            onSelectionChange: (nextIndex) => {
                this.selectedArcadeKingdomIndex = nextIndex;
                this.arcadeKingdomId = this.getSelectedArcadeKingdomId();
            },
            onSelectCurrent: (selectedKingdom) => {
                this.arcadeKingdomId = selectedKingdom?.id || 'VERDOMBRE';
                this.arcadeKingdomChosen = true;
            }
        });
    }

    openLostFragmentPrompt() {
        if (this.lostFragmentPrompt) {
            this.lostFragmentPrompt.destroy(true);
            this.lostFragmentPrompt = null;
        }

        const viewportWidth = this.scale.width || 800;
        const viewportHeight = this.scale.height || 700;
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        const isNarrowViewport = viewportWidth < 500;
        const width = isNarrowViewport ? 270 : 340;
        const height = isNarrowViewport ? 190 : 220;
        const enemyColors = ['BLEU', 'VERT', 'JAUNE'].filter((color) => this.enemyAssignments[color]);

        const overlay = this.add.container(0, 0).setDepth(60);
        const blocker = this.add.rectangle(centerX, centerY, viewportWidth, viewportHeight, 0x000000, 0.62)
            .setInteractive();
        const panel = this.add.container(centerX, centerY).setAlpha(0);
        const background = this.add.rectangle(0, 0, width, height, 0xc86a20, 0.96)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xf3c37a, 1);
        const title = this.add.text(0, -height / 2 + (isNarrowViewport ? 18 : 22), TranslationManager.t('briefing.lost_prompt_title'), {
            fontSize: isNarrowViewport ? '18px' : '22px',
            fill: '#fff6df',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: width - 34 }
        }).setOrigin(0.5, 0);

        const rowY = isNarrowViewport ? 18 : 26;
        const spacing = enemyColors.length <= 1 ? 0 : (isNarrowViewport ? 86 : 96);
        const startX = centerX - ((enemyColors.length - 1) * spacing) / 2;

        const optionContainers = enemyColors.map((color, index) => {
            const enemy = this.enemyAssignments[color];
            const optionX = startX + index * spacing;
            const option = this.add.container(optionX, centerY + rowY);
            const textureKey = enemy.briefingIdleTexture || enemy.idleTexture;
            const animationKey = this.getBriefingIdleAnimationKey(enemy.key);
            const glow = this.add.rectangle(0, 0, isNarrowViewport ? 76 : 88, isNarrowViewport ? 90 : 104, 0xe0a33b, 0.72)
                .setOrigin(0.5);
            const sprite = this.add.sprite(0, -10, textureKey, 0)
                .setOrigin(0.5)
                .setScale(isNarrowViewport ? 1.25 : 1.45);
            if (this.anims.exists(animationKey)) {
                sprite.play(animationKey);
            }
            const label = this.add.text(0, isNarrowViewport ? 22 : 28, TranslationManager.t(`enemy.style.${enemy.style.toLowerCase()}`), {
                fontSize: isNarrowViewport ? '13px' : '15px',
                fill: '#fff6df',
                fontFamily: 'Vollkorn',
                fontStyle: 'bold',
                align: 'center'
            }).setOrigin(0.5, 0);
            const hitArea = this.add.zone(0, 0, isNarrowViewport ? 74 : 82, isNarrowViewport ? 96 : 108)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            hitArea.on('pointerover', () => {
                glow.setFillStyle(0xe7b04d, 0.86);
                glow.setScale(1.04);
            });
            hitArea.on('pointerout', () => {
                glow.setFillStyle(0xe0a33b, 0.72);
                glow.setScale(1);
            });
            hitArea.on('pointerdown', () => {
                this.setLostFragmentTarget(color);
                this.tweens.add({
                    targets: panel,
                    alpha: 0,
                    y: centerY - 14,
                    duration: 180,
                    ease: 'Quad.In',
                    onComplete: () => {
                        overlay.destroy(true);
                        this.lostFragmentPrompt = null;
                    }
                });
            });

            option.add([glow, sprite, label, hitArea]);
            return option;
        });

        panel.add([background, title]);
        overlay.add([blocker, panel, ...optionContainers]);
        this.lostFragmentPrompt = overlay;

        this.tweens.add({
            targets: panel,
            alpha: 1,
            y: centerY - 6,
            duration: 180,
            ease: 'Quad.Out'
        });
    }

    setLostFragmentTarget(color) {
        this.storyContext = BriefingStoryContextHelper.buildForLostTarget(this.storyContext, color);
    }

    createUiButton(x, y, width, height, label, fontSize = '16px') {
        return BriefingRenderer.createUiButton(this, x, y, width, height, label, fontSize);
    }
}
