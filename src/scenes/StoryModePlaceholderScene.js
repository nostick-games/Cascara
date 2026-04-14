class StoryModePlaceholderScene extends Phaser.Scene {
    constructor(config = { key: 'StoryModePlaceholderScene' }) {
        super(config);
        this.storyMap = null;
        this.selectedNodeId = null;
        this.exitConfirmModal = null;
        this.storyHeroSprite = null;
        this.storyMapSelectionLocked = false;
    }

    init(data) {
        this.selectedNodeId = null;
        this.exitConfirmModal = null;
        this.storyHeroSprite = null;
        this.storyMapSelectionLocked = false;
        this.storyMapLayout = null;

        if (data?.language) {
            TranslationManager.setLanguage(data.language);
        }
        this.unlockedPotionIds = Array.isArray(data?.unlockedPotionIds) && data.unlockedPotionIds.length > 0
            ? data.unlockedPotionIds.slice()
            : ['ROSE', 'ORANGE'];
        this.storyState = data?.storyState
            ? this.rebuildStoryState(data.storyState)
            : this.createInitialStoryState();
        if (data?.initialStoryFragments) {
            this.storyState.fragments = StoryFragmentInventory.mergeCounts(
                this.storyState.fragments || {},
                data.initialStoryFragments
            );
        }
        if (Array.isArray(data?.initialStoryFragmentIds) && data.initialStoryFragmentIds.length > 0) {
            this.storyState.briefingFragmentIds = [...data.initialStoryFragmentIds];
        }
        if (data?.grantAllFragmentsCheat) {
            this.storyState.fragments = StoryFragmentCatalog.getAll().reduce((accumulator, fragment) => {
                accumulator[fragment.id] = 1;
                return accumulator;
            }, {});
        }
        this.unlockedPotionIds = [...(this.storyState.unlockedPotionIds || this.unlockedPotionIds)];
    }

    preload() {
        this.load.image('ui-parchment', 'assets/images/UI/parchemin.png');
        this.load.image('ui-button-left-off', 'assets/images/UI/bouton_bord_gauche_off.png');
        this.load.image('ui-button-fill-off', 'assets/images/UI/bouton_fond_off.png');
        this.load.image('ui-button-right-off', 'assets/images/UI/bouton_bord_droite_off.png');
        this.load.image('ui-button-left-on', 'assets/images/UI/bouton_bord_gauche_on.png');
        this.load.image('ui-button-fill-on', 'assets/images/UI/bouton_fond_on.png');
        this.load.image('ui-button-right-on', 'assets/images/UI/bouton_bord_droite_on.png');
        this.load.image('story-node-fight', 'assets/images/story/icon_fight.png');
        this.load.image('story-node-merchant', 'assets/images/story/icon_merchant.png');
        this.load.image('story-node-elite', 'assets/images/story/icon_elite.png');
        this.load.image('story-node-boss', 'assets/images/story/icon_boss.png');
        this.load.image('story-node-surprise', 'assets/images/story/icon_surprise.png');
        this.load.image('story-gold', 'assets/images/story/gold.png');
        this.load.image('story-potion-rose', 'assets/images/bonus/potion_rose.png');
        this.load.image('story-potion-orange', 'assets/images/bonus/potion_orange.png');
        this.load.image('story-potion-menthe', 'assets/images/bonus/potion_menthe.png');
        this.load.image('story-potion-marron', 'assets/images/bonus/potion_marron.png');
        this.load.image('story-potion-blanche', 'assets/images/bonus/potion_white.png');
        this.load.image('story-potion-cyan', 'assets/images/bonus/potion_cyan.png');
        this.load.spritesheet('story-hero-idle-face', 'assets/images/hero/idle_face.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('story-hero-walk-down', 'assets/images/hero/walk_down.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('story-hero-walk-right', 'assets/images/hero/walk_right.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }

    create() {
        const viewportWidth = this.scale.width || 800;
        const viewportHeight = this.scale.height || 700;
        const centerX = viewportWidth / 2;
        const isNarrowViewport = viewportWidth < 500;
        const scrollContent = this.add.container(0, 0);
        const preExistingObjects = new Set(this.children.list);

        this.cameras.main.setBackgroundColor('#060606');
        this.ensureStoryHeroAnimations();

        const parchmentMaxWidth = isNarrowViewport
            ? viewportWidth - 22
            : Math.min(viewportWidth - 88, 610);
        const parchmentMaxHeight = isNarrowViewport
            ? viewportHeight - 28
            : Math.min(viewportHeight - 72, viewportHeight * 0.78);
        const parchmentScale = Math.min(
            parchmentMaxWidth / 320,
            parchmentMaxHeight / 480
        ) * (isNarrowViewport ? 1 : 0.85);
        const parchmentWidth = 320 * parchmentScale;
        const parchmentHeight = 480 * parchmentScale;
        const parchmentTopY = 10;
        const centerY = parchmentTopY + parchmentHeight / 2;
        const parchmentBottomY = parchmentTopY + parchmentHeight;
        const contentInsetX = isNarrowViewport ? 36 : 50;
        const contentInsetTop = (isNarrowViewport ? 42 : 50) + 20;
        const contentInsetBottom = isNarrowViewport ? 118 : 132;
        const mapWidth = parchmentWidth - contentInsetX * 2;
        const mapHeight = parchmentHeight - contentInsetTop - contentInsetBottom;
        const mapTopY = parchmentTopY + contentInsetTop;
        const mapBottomY = mapTopY + mapHeight;

        this.add.image(centerX, centerY, 'ui-parchment')
            .setOrigin(0.5)
            .setScale(parchmentScale)
            .setAngle(90)
            .setDepth(5);

        const infoRowY = parchmentTopY + (isNarrowViewport ? 28 : 32);
        const infoRowLeftX = centerX - parchmentWidth / 2 + (isNarrowViewport ? 26 : 34);
        const infoRowRightX = centerX + parchmentWidth / 2 - (isNarrowViewport ? 26 : 34);
        const goldBlockWidth = isNarrowViewport ? 62 : 74;
        const activePotionsLeftLimit = infoRowLeftX + goldBlockWidth + (isNarrowViewport ? 14 : 20);

        this.drawGoldCounter(
            infoRowLeftX,
            infoRowY,
            isNarrowViewport
        );
        this.drawActivePotionsRow(
            activePotionsLeftLimit,
            infoRowRightX,
            infoRowY,
            isNarrowViewport
        );

        this.drawStoryMap(centerX, mapTopY, mapBottomY, mapWidth, isNarrowViewport);
        this.createStoryHeroMarker();
        this.drawLegend(
            centerX,
            parchmentBottomY + (isNarrowViewport ? 50 : 54),
            Math.min(viewportWidth - 24, parchmentWidth + (isNarrowViewport ? 12 : 32)),
            isNarrowViewport
        );

        const backButton = this.createUiButton(
            centerX,
            parchmentBottomY - (isNarrowViewport ? 52 : 58),
            isNarrowViewport ? 180 : 200,
            42,
            TranslationManager.t('menu.back'),
            isNarrowViewport ? '18px' : '20px'
        );

        backButton.hitArea.on('pointerover', () => backButton.setState(true));
        backButton.hitArea.on('pointerout', () => backButton.setState(false));
        backButton.hitArea.on('pointerdown', () => {
            backButton.setState(true);
            this.time.delayedCall(120, () => {
                this.showExitConfirmation();
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
            contentHeight: parchmentBottomY + (isNarrowViewport ? 146 : 138),
            viewportHeight,
            topPadding: 0,
            bottomPadding: isNarrowViewport ? 22 : 28
        });

        this.registerDebugShortcuts();
    }

    registerDebugShortcuts() {
        if (!this.input?.keyboard) {
            return;
        }

        if (this.debugMerchantKey) {
            this.debugMerchantKey.destroy();
        }

        this.debugMerchantKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        this.debugMerchantKey.on('down', () => {
            this.scene.start('StoryMerchantScene', {
                language: TranslationManager.getLanguage(),
                selectedNodeId: null,
                storyState: this.serializeStoryState()
            });
        });
    }

    showExitConfirmation() {
        if (this.exitConfirmModal) {
            return;
        }

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        const isNarrowViewport = this.scale.width < 500;
        const width = isNarrowViewport ? 248 : 320;
        const height = isNarrowViewport ? 118 : 136;

        const overlay = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 0.28)
            .setOrigin(0.5)
            .setDepth(39)
            .setInteractive();
        const panel = this.add.container(centerX, centerY).setDepth(40).setAlpha(0);
        const background = this.add.rectangle(0, 0, width, height, 0xc86a20, 0.96)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xf3c37a, 1);
        const message = this.add.text(0, -26, TranslationManager.t('menu.confirm_exit_story'), {
            fontSize: isNarrowViewport ? '15px' : '18px',
            fill: '#fff6df',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: width - 28 }
        }).setOrigin(0.5);

        const yesButton = this.createUiButton(
            -(isNarrowViewport ? 54 : 62),
            isNarrowViewport ? 30 : 36,
            isNarrowViewport ? 82 : 92,
            36,
            TranslationManager.t('menu.yes'),
            isNarrowViewport ? '16px' : '18px'
        );
        const noButton = this.createUiButton(
            isNarrowViewport ? 54 : 62,
            isNarrowViewport ? 30 : 36,
            isNarrowViewport ? 82 : 92,
            36,
            TranslationManager.t('menu.no'),
            isNarrowViewport ? '16px' : '18px'
        );

        yesButton.hitArea.on('pointerover', () => yesButton.setState(true));
        yesButton.hitArea.on('pointerout', () => yesButton.setState(false));
        yesButton.hitArea.on('pointerdown', () => {
            yesButton.setState(true);
            this.closeExitConfirmation(() => {
                this.scene.start('MainMenuScene', { language: TranslationManager.getLanguage() });
            });
        });

        noButton.hitArea.on('pointerover', () => noButton.setState(true));
        noButton.hitArea.on('pointerout', () => noButton.setState(false));
        noButton.hitArea.on('pointerdown', () => {
            noButton.setState(true);
            this.closeExitConfirmation();
        });

        panel.add([
            background,
            message,
            yesButton.container,
            noButton.container
        ]);

        this.exitConfirmModal = { overlay, panel };

        this.tweens.add({
            targets: panel,
            alpha: 1,
            y: centerY - 8,
            duration: 180,
            ease: 'Quad.Out'
        });
    }

    closeExitConfirmation(onComplete = null) {
        if (!this.exitConfirmModal) {
            if (onComplete) onComplete();
            return;
        }

        const { overlay, panel } = this.exitConfirmModal;
        this.exitConfirmModal = null;

        this.tweens.add({
            targets: panel,
            alpha: 0,
            y: panel.y - 12,
            duration: 160,
            ease: 'Quad.In',
            onComplete: () => {
                overlay.destroy();
                panel.destroy(true);
                if (onComplete) onComplete();
            }
        });
    }

    generateStoryMapRows() {
        return StoryMapState.generateRows();
    }

    createInitialStoryState() {
        return this.rebuildStoryState(
            StoryMapState.createInitialState(this.unlockedPotionIds.slice())
        );
    }

    rebuildStoryState(rawState) {
        return StoryMapState.rebuild(rawState, this.unlockedPotionIds);
    }

    serializeStoryState() {
        return StoryMapState.serialize(this.storyState);
    }

    getRandomStoryNodeType(row) {
        return StoryMapState.getRandomNodeType(row);
    }

    drawStoryMap(centerX, topY, bottomY, width, isNarrowViewport) {
        StoryMapRenderer.drawMap(this, {
            centerX,
            topY,
            bottomY,
            width,
            isNarrowViewport,
            storyState: this.storyState,
            onNodeSelected: (node, rowNodes) => this.selectStoryNode(node, rowNodes)
        });
    }

    animateStoryMapReveal(rowNodeIcons, rowNodeChecks, rowConnections, lineGraphicsByRow, isNarrowViewport) {
        StoryMapRenderer.animateMapReveal(
            this,
            this.storyState.rows,
            rowNodeIcons,
            rowNodeChecks,
            rowConnections,
            lineGraphicsByRow,
            isNarrowViewport
        );
    }

    createCompletedNodeBadge(x, y, isNarrowViewport) {
        return StoryMapRenderer.createCompletedNodeBadge(this, x, y, isNarrowViewport);
    }

    selectStoryNode(selectedNode, rowNodes) {
        if (this.storyMapSelectionLocked) {
            return;
        }

        this.selectedNodeId = selectedNode.id;
        rowNodes.forEach((node) => {
            if (!node.icon) {
                return;
            }
            const isSelected = node.id === selectedNode.id;
            node.icon.clearTint();
            node.icon.setAlpha(isSelected ? 1 : 0.82);
            this.tweens.killTweensOf(node.icon);
            this.tweens.add({
                targets: node.icon,
                scaleX: isSelected ? node.baseScaleX * 1.08 : node.baseScaleX,
                scaleY: isSelected ? node.baseScaleY * 1.08 : node.baseScaleY,
                duration: 140,
                ease: 'Sine.easeOut'
            });
        });

        this.storyMapSelectionLocked = true;
        this.playStoryHeroTravel(selectedNode, () => {
            if (this.selectedNodeId !== selectedNode.id) {
                this.storyMapSelectionLocked = false;
                return;
            }

            if (selectedNode.type === 'fight' || selectedNode.type === 'elite' || selectedNode.type === 'boss') {
                this.launchStoryEncounter(selectedNode.type);
                return;
            }

            if (selectedNode.type === 'merchant') {
                this.scene.start('StoryMerchantScene', {
                    language: TranslationManager.getLanguage(),
                    selectedNodeId: this.selectedNodeId,
                    storyState: this.serializeStoryState()
                });
                return;
            }

            if (selectedNode.type === 'surprise') {
                this.scene.start('StoryEventScene', {
                    language: TranslationManager.getLanguage(),
                    selectedNodeId: this.selectedNodeId,
                    storyState: this.serializeStoryState(),
                    eventId: selectedNode.eventId || null
                });
                return;
            }

            this.storyMapSelectionLocked = false;
        });
    }

    launchStoryEncounter(nodeType) {
        const unlockedPotionIds = this.storyState?.unlockedPotionIds || this.unlockedPotionIds;
        const encounter = StoryEncounterFactory.createEncounter(nodeType, unlockedPotionIds, {
            forcedBossTypeKey: this.storyState?.forcedBossTypeKey || null,
            bossSequenceIndex: this.storyState?.bossSequenceIndex || 0,
            currentPathIndex: this.storyState?.currentPathIndex || 0
        });
        const playerOrder = ['ROUGE', 'BLEU', 'VERT', 'JAUNE'].slice(0, encounter.aiCount + 1);
        const enemyAssignments = encounter.enemyTypeKeys
            ? EnemyDefinitions.createAssignmentsFromTypeKeys(playerOrder, encounter.enemyTypeKeys)
            : EnemyDefinitions.createAssignments(playerOrder);
        const progressPotions = new GameSceneSetup(this).selectProgressPotionsFromPool(encounter.availablePotionIds);

        this.scene.start('BriefingScene', {
            aiCount: encounter.aiCount,
            boardSize: encounter.boardSize,
            difficulty: encounter.difficulty,
            language: TranslationManager.getLanguage(),
            enemyAssignments,
            progressPotions,
            storyNodeType: encounter.nodeType,
            storyGoldReward: encounter.goldReward,
            storyContext: {
                source: 'story',
                selectedNodeId: this.selectedNodeId,
                storyState: this.serializeStoryState()
            }
        });
    }

    getStoryNodeTexture(type) {
        return StoryMapRenderer.getNodeTexture(type);
    }

    drawLegend(centerX, centerY, width, isNarrowViewport) {
        StoryMapRenderer.drawLegend(this, { centerX, centerY, width, isNarrowViewport });
    }

    drawGoldCounter(x, y, isNarrowViewport) {
        StoryMapRenderer.drawGoldCounter(this, {
            x,
            y,
            isNarrowViewport,
            gold: this.storyState.gold ?? 100
        });
    }

    drawActivePotionsRow(leftLimit, rightX, y, isNarrowViewport) {
        StoryMapRenderer.drawActivePotionsRow(this, {
            leftLimit,
            rightX,
            y,
            isNarrowViewport,
            unlockedPotionIds: this.storyState.unlockedPotionIds || []
        });
    }

    getStoryPotionTexture(potionId) {
        return StoryMapRenderer.getPotionTexture(potionId);
    }

    drawDashedLine(graphics, x1, y1, x2, y2, color, alpha, dashLength, gapLength, progress = 1) {
        StoryMapRenderer.drawDashedLine(graphics, x1, y1, x2, y2, color, alpha, dashLength, gapLength, progress);
    }

    ensureStoryHeroAnimations() {
        if (!this.anims.exists('story-hero-idle-face')) {
            this.anims.create({
                key: 'story-hero-idle-face',
                frames: this.anims.generateFrameNumbers('story-hero-idle-face', { start: 0, end: 3 }),
                frameRate: 7,
                repeat: -1
            });
        }

        if (!this.anims.exists('story-hero-walk-down')) {
            this.anims.create({
                key: 'story-hero-walk-down',
                frames: this.anims.generateFrameNumbers('story-hero-walk-down', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        if (!this.anims.exists('story-hero-walk-right')) {
            this.anims.create({
                key: 'story-hero-walk-right',
                frames: this.anims.generateFrameNumbers('story-hero-walk-right', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }
    }

    getStoryHeroAnchorNodeId() {
        const completedNodeIds = this.storyState?.completedNodeIds || [];
        if (completedNodeIds.length > 0) {
            return completedNodeIds[completedNodeIds.length - 1];
        }

        const currentNodeIds = this.storyState?.currentNodeIds || [];
        return currentNodeIds[0] || null;
    }

    getStoryHeroIdlePosition(nodeId) {
        const position = this.storyMapLayout?.nodePositions?.[nodeId];
        if (!position) {
            return null;
        }

        const heroOffsetX = this.storyMapLayout?.isNarrowViewport ? 26 : 30;
        const heroOffsetY = this.storyMapLayout?.isNarrowViewport ? 24 : 26;
        return {
            x: position.x + heroOffsetX,
            y: position.y + heroOffsetY
        };
    }

    createStoryHeroMarker() {
        const anchorNodeId = this.getStoryHeroAnchorNodeId();
        const heroPosition = this.getStoryHeroIdlePosition(anchorNodeId);
        if (!heroPosition) {
            return;
        }

        if (this.storyHeroSprite?.active) {
            this.storyHeroSprite.destroy();
        }

        this.storyHeroSprite = this.add.sprite(heroPosition.x, heroPosition.y, 'story-hero-idle-face', 0)
            .setOrigin(0.5, 1)
            .setScale(this.storyMapLayout?.isNarrowViewport ? 1.35 : 1.5)
            .setDepth(14)
            .setAlpha(0);
        this.storyHeroSprite.play('story-hero-idle-face');

        const rowIndex = this.storyMapLayout?.nodeRowIndexes?.[anchorNodeId] || 0;
        const revealDelay = this.getStoryMapNodeRevealDelay(rowIndex);
        this.storyHeroSprite.y += 8;
        this.tweens.add({
            targets: this.storyHeroSprite,
            alpha: 1,
            y: heroPosition.y,
            delay: revealDelay + 60,
            duration: 180,
            ease: 'Sine.easeOut'
        });
    }

    getStoryMapNodeRevealDelay(rowIndex) {
        if (rowIndex <= 0) {
            return 0;
        }

        const lineDuration = 240;
        const lineGap = 40;
        const nodeDuration = 180;
        const nodeGap = 90;
        const perRowDelay = lineDuration + lineGap + nodeDuration + nodeGap;
        return rowIndex * perRowDelay;
    }

    playStoryHeroTravel(selectedNode, onComplete) {
        if (!this.storyHeroSprite?.active) {
            this.time.delayedCall(150, () => {
                if (onComplete) onComplete();
            });
            return;
        }

        const targetPosition = this.getStoryHeroIdlePosition(selectedNode.id);
        if (!targetPosition) {
            this.time.delayedCall(150, () => {
                if (onComplete) onComplete();
            });
            return;
        }

        const deltaX = targetPosition.x - this.storyHeroSprite.x;
        const isStraightDown = Math.abs(deltaX) < 8;

        if (isStraightDown) {
            this.storyHeroSprite.setFlipX(false);
            this.storyHeroSprite.play('story-hero-walk-down', true);
        } else {
            this.storyHeroSprite.setFlipX(deltaX < 0);
            this.storyHeroSprite.play('story-hero-walk-right', true);
        }

        this.tweens.add({
            targets: this.storyHeroSprite,
            x: targetPosition.x,
            y: targetPosition.y,
            duration: isStraightDown ? 420 : 520,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (!this.storyHeroSprite?.active) {
                    if (onComplete) onComplete();
                    return;
                }

                this.storyHeroSprite.setFlipX(false);
                this.storyHeroSprite.play('story-hero-idle-face', true);
                if (onComplete) onComplete();
            }
        });
    }

    createUiButton(x, y, width, height, label, fontSize = '16px') {
        const leftWidth = 18;
        const rightWidth = 18;
        const fillWidth = Math.max(8, width - leftWidth - rightWidth);
        const container = this.add.container(x, y).setDepth(12);
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
