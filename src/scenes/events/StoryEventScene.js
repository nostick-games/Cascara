class StoryEventScene extends Phaser.Scene {
    constructor(config = { key: 'StoryEventScene' }) {
        super(config);
        this.eventDefinition = null;
        this.selectedNodeId = null;
        this.storyState = null;
        this.resolved = false;
    }

    init(data) {
        if (data?.language) {
            TranslationManager.setLanguage(data.language);
        }
        this.selectedNodeId = data?.selectedNodeId || null;
        this.storyState = StoryEventState.rebuild(data?.storyState || {});
        this.eventDefinition = data?.eventId
            ? StoryEventRegistry.getById(data.eventId)
            : StoryEventRegistry.getRandomEvent(this.storyState.completedEventIds || []);
        this.resolved = false;
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
        const innerTopY = parchmentTopY + (isNarrowViewport ? 22 : 28);
        const innerBottomY = parchmentBottomY - (isNarrowViewport ? 18 : 24);
        const innerHeight = innerBottomY - innerTopY;

        this.add.image(centerX, bannerHeight / 2, 'merchant-banner')
            .setOrigin(0.5)
            .setDisplaySize(parchmentWidth, bannerHeight)
            .setDepth(4);
        this.add.text(centerX, isNarrowViewport ? 24 : 26, TranslationManager.t(this.eventDefinition.titleKey), {
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

        this.goldValueText = StoryMerchantRenderer.drawGoldCounter(
            this,
            centerX,
            bannerHeight - (isNarrowViewport ? 42 : 56),
            isNarrowViewport,
            this.storyState.gold ?? 100
        );
        this.displayedGoldValue = this.storyState.gold ?? 100;

        const content = this.add.container(contentLeftX, innerTopY).setDepth(12);
        const contentMaskShape = this.make.graphics({ x: 0, y: 0, add: false });
        contentMaskShape.fillStyle(0xffffff, 1);
        contentMaskShape.fillRect(contentLeftX - 6, innerTopY - 6, contentWidth + 12, innerHeight + 12);
        content.setMask(contentMaskShape.createGeometryMask());

        const introY = 0;
        const introStyle = {
            fontSize: isNarrowViewport ? '17px' : '21px',
            fill: '#4a2d20',
            fontFamily: 'Vollkorn',
            align: 'left',
            wordWrap: { width: contentWidth },
            lineSpacing: isNarrowViewport ? 8 : 10
        };
        const introMeasureText = this.add.text(0, introY, TranslationManager.t(this.eventDefinition.introKey), introStyle)
            .setOrigin(0, 0)
            .setVisible(false);
        const introLines = introMeasureText.getWrappedText(TranslationManager.t(this.eventDefinition.introKey));
        const introLineHeight = introMeasureText.height / Math.max(1, introLines.length);
        const introBlockHeight = introMeasureText.height;
        introMeasureText.destroy();

        const introLineTexts = introLines.map((line, index) => {
            const lineText = this.add.text(0, introY + index * introLineHeight, line, {
                fontSize: introStyle.fontSize,
                fill: '#4a2d20',
                fontFamily: 'Vollkorn',
                align: 'left'
            }).setOrigin(0, 0).setAlpha(0);
            content.add(lineText);
            return lineText;
        });

        const buttons = [];
        let currentY = introY + introBlockHeight + (isNarrowViewport ? 26 : 34);
        const introRevealDuration = 220;
        const introRevealStep = 120;
        const choiceButtonHeight = isNarrowViewport ? 44 : 48;
        const continueButtonHeight = 42;
        const getContentBottom = () => {
            const choiceButtonsBottom = buttons.length > 0
                ? Math.max(...buttons.map((button) => button.container.y + choiceButtonHeight / 2))
                : 0;
            const resultBottom = resultLineContainer.list.length > 0
                ? Math.max(...resultLineContainer.list.map((lineText) => lineText.y + lineText.height))
                : 0;
            const continueBottom = continueButton.container.visible
                ? continueButton.container.y + continueButtonHeight / 2
                : 0;
            return Math.max(choiceButtonsBottom, resultBottom, continueBottom) + (isNarrowViewport ? 18 : 22);
        };

        this.eventDefinition.choices.forEach((choice) => {
            const buttonLabel = TranslationManager.t(choice.labelKey);
            const buttonFontSize = isNarrowViewport ? '18px' : '22px';
            const buttonWidth = parchmentWidth - (isNarrowViewport ? 32 : 44);

            const button = StoryMerchantRenderer.createUiTextButton(
                this,
                contentWidth / 2,
                currentY + 20,
                buttonWidth,
                choiceButtonHeight,
                buttonLabel,
                buttonFontSize
            );
            button.container.setAlpha(0);
            button.hitArea.on('pointerover', () => {
                if (!this.resolved) button.setState(true);
            });
            button.hitArea.on('pointerout', () => button.setState(false));
            button.hitArea.on('pointerdown', () => {
                if (this.resolved) {
                    return;
                }
                this.resolveChoice(choice.id, buttons, resultTextMeasure, resultLineContainer, currentY + 10, resultStyle, continueButton, getContentBottom, scrollController, innerTopY, innerBottomY);
            });
            content.add(button.container);
            buttons.push(button);
            currentY += 56;
        });

        const resultY = currentY + 10;
        const resultStyle = {
            fontSize: isNarrowViewport ? '17px' : '21px',
            fill: '#5d3b2b',
            fontFamily: 'Vollkorn',
            align: 'left',
            wordWrap: { width: contentWidth },
            lineSpacing: isNarrowViewport ? 8 : 10
        };
        const resultTextMeasure = this.add.text(0, resultY, '', resultStyle)
            .setOrigin(0, 0)
            .setVisible(false);
        const resultLineContainer = this.add.container(0, 0);
        content.add(resultLineContainer);

        const continueButton = StoryMerchantRenderer.createUiTextButton(
            this,
            contentWidth / 2,
            resultY,
            isNarrowViewport ? 216 : 238,
            continueButtonHeight,
            TranslationManager.t('story.return_to_map'),
            isNarrowViewport ? '18px' : '20px'
        );
        continueButton.container.setVisible(false);
        continueButton.hitArea.on('pointerover', () => continueButton.setState(true));
        continueButton.hitArea.on('pointerout', () => continueButton.setState(false));
        continueButton.hitArea.on('pointerdown', () => {
            continueButton.setState(true);
            this.scene.start('StoryModePlaceholderScene', {
                language: TranslationManager.getLanguage(),
                storyState: StoryEventState.buildAdvanced(this.storyState, this.selectedNodeId, this.eventDefinition?.id || null)
            });
        });
        content.add(continueButton.container);
        const scrollController = VerticalScrollHelper.enable(this, {
            container: content,
            contentHeight: innerTopY + getContentBottom(),
            viewportHeight: innerBottomY,
            topPadding: innerTopY,
            bottomPadding: 0
        });

        introLineTexts.forEach((lineText, index) => {
            this.time.delayedCall(index * introRevealStep, () => {
                this.tweens.add({
                    targets: lineText,
                    alpha: 1,
                    y: lineText.y - 4,
                    duration: introRevealDuration,
                    ease: 'Quad.Out',
                    onComplete: () => {
                        lineText.setY(introY + index * introLineHeight);
                    }
                });
            });
        });

        const buttonsRevealStart = Math.max(0, (introLineTexts.length - 1) * introRevealStep + 120);
        buttons.forEach((button, index) => {
            this.time.delayedCall(buttonsRevealStart + index * 120, () => {
                this.tweens.add({
                    targets: button.container,
                    alpha: 1,
                    y: button.container.y - 6,
                    duration: 220,
                    ease: 'Quad.Out',
                    onComplete: () => {
                        button.container.setY(button.container.y + 6);
                    }
                });
            });
        });
    }

    resolveChoice(choiceId, buttons, resultTextMeasure, resultLineContainer, resultY, resultStyle, continueButton, getContentBottom, scrollController, innerTopY, innerBottomY) {
        const resolution = StoryEventRegistry.resolve(this, this.eventDefinition.id, choiceId, this.storyState);
        const previousGoldValue = this.displayedGoldValue ?? this.storyState.gold ?? 0;
        this.storyState.gold = resolution.gold;
        this.storyState.fragments = resolution.fragments;
        this.storyState.unlockedPotionIds = [...(resolution.unlockedPotionIds || this.storyState.unlockedPotionIds || [])];
        this.resolved = true;
        buttons.forEach((button) => {
            button.setDisabled(true);
            button.container.setAlpha(0.55);
            button.hitArea.disableInteractive();
        });

        resultLineContainer.removeAll(true);
        resultTextMeasure.setText(resolution.resultText);
        const resultLines = resultTextMeasure.getWrappedText(resolution.resultText);
        const resultLineHeight = resultTextMeasure.height / Math.max(1, resultLines.length);
        const revealStep = 120;
        const revealDuration = 220;

        resultLines.forEach((line, index) => {
            const lineText = this.add.text(0, resultY + index * resultLineHeight, line, {
                fontSize: resultStyle.fontSize,
                fill: resultStyle.fill,
                fontFamily: resultStyle.fontFamily,
                align: 'left'
            }).setOrigin(0, 0).setAlpha(0);
            resultLineContainer.add(lineText);

            this.time.delayedCall(index * revealStep, () => {
                this.tweens.add({
                    targets: lineText,
                    alpha: 1,
                    y: lineText.y - 4,
                    duration: revealDuration,
                    ease: 'Quad.Out',
                    onComplete: () => {
                        lineText.setY(resultY + index * resultLineHeight);
                    }
                });
            });
        });

        const responseRevealDelay = Math.max(0, (resultLines.length - 1) * revealStep + 180);
        const goldAnimationDelay = this.animateGoldCounter(previousGoldValue, this.storyState.gold);
        const continueRevealDelay = Math.max(responseRevealDelay, goldAnimationDelay + 120);
        this.time.delayedCall(continueRevealDelay, () => {
            const revealContinueButton = () => {
                const continueY = resultY + resultTextMeasure.height + (this.scale.width < 500 ? 34 : 40);
                continueButton.container.setY(continueY);
                continueButton.container.setVisible(true);
                continueButton.container.setAlpha(0);
                scrollController.refreshBounds(innerTopY + getContentBottom(), innerBottomY);
                this.tweens.add({
                    targets: continueButton.container,
                    alpha: 1,
                    y: continueButton.container.y - 6,
                    duration: 220,
                    ease: 'Quad.Out',
                    onComplete: () => {
                        continueButton.container.setY(continueButton.container.y + 6);
                    }
                });
            };

            if (resolution.showLuckyStarIntro) {
                this.showLuckyStarPrompt(() => {
                    revealContinueButton();
                });
                return;
            }

            revealContinueButton();
        });
    }

    animateGoldCounter(fromValue, toValue) {
        const startValue = Math.max(0, Math.floor(fromValue || 0));
        const endValue = Math.max(0, Math.floor(toValue || 0));
        this.displayedGoldValue = startValue;
        this.goldValueText.setText(`${startValue}`);

        if (startValue === endValue) {
            return 0;
        }

        const direction = endValue > startValue ? 1 : -1;
        const steps = Math.abs(endValue - startValue);
        const stepDelay = 26;

        for (let stepIndex = 1; stepIndex <= steps; stepIndex++) {
            this.time.delayedCall(stepIndex * stepDelay, () => {
                this.displayedGoldValue += direction;
                this.goldValueText.setText(`${this.displayedGoldValue}`);
            });
        }

        return steps * stepDelay;
    }

    showLuckyStarPrompt(onDismiss) {
        const isNarrowViewport = (this.scale.width || 800) < 500;
        CenteredPromptModal.show(this, {
            depth: 40,
            width: isNarrowViewport ? 286 : 372,
            height: isNarrowViewport ? 218 : 238,
            bodyText: TranslationManager.t('event.lucky_star_intro'),
            buttonLabel: TranslationManager.t('merchant.thanks'),
            onConfirm: () => {
                MetaProgression.markLuckyStarEventIntroSeen();
                if (typeof onDismiss === 'function') {
                    onDismiss();
                }
            }
        });
    }
}
