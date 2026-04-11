class GameBoardEndPanelWidgets {
    constructor(endPanel) {
        this.endPanel = endPanel;
        this.scene = endPanel.scene;
    }

    createStoryGoldRewardDisplay(centerX, y, isNarrowViewport, reward, initialValue = 0) {
        const container = this.scene.add.container(centerX, y).setDepth(41);
        const iconSize = isNarrowViewport ? 24 : 28;
        const icon = this.scene.add.image(-(isNarrowViewport ? 20 : 24), 0, 'story-gold')
            .setOrigin(0.5)
            .setDisplaySize(iconSize, iconSize);
        const amountText = this.scene.add.text(isNarrowViewport ? 0 : 4, 0, `${initialValue}`, {
            fontSize: isNarrowViewport ? '18px' : '22px',
            fill: '#3b2419',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        container.add([icon, amountText]);
        container.setVisible(false);
        let animationStarted = false;
        let currentValue = initialValue;

        return {
            container,
            setValue: (value) => {
                currentValue = Math.max(0, Math.round(value));
                amountText.setText(`${currentValue}`);
            },
            getValue: () => currentValue,
            setVisible: (visible) => {
                container.setVisible(visible);
                if (visible && reward > 0 && !animationStarted) {
                    animationStarted = true;
                    amountText.setText(`${initialValue}`);
                    this.scene.tweens.addCounter({
                        from: initialValue,
                        to: initialValue + reward,
                        duration: Math.min(1800, Math.max(700, reward * 35)),
                        ease: 'Sine.easeOut',
                        onUpdate: (tween) => {
                            currentValue = Math.round(tween.getValue());
                            amountText.setText(`${currentValue}`);
                        }
                    });
                }
            }
        };
    }

    createStoryStarRewardDisplay(centerX, y, isNarrowViewport, initialValue = 0) {
        const container = this.scene.add.container(centerX, y).setDepth(41);
        const iconSize = isNarrowViewport ? 24 : 28;
        const icon = this.scene.add.image(-(isNarrowViewport ? 20 : 24), 0, 'meta-star')
            .setOrigin(0.5)
            .setDisplaySize(iconSize, iconSize);
        const amountText = this.scene.add.text(isNarrowViewport ? 0 : 4, 0, `${initialValue}`, {
            fontSize: isNarrowViewport ? '18px' : '22px',
            fill: '#3b2419',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        container.add([icon, amountText]);
        container.setVisible(false);
        let currentValue = initialValue;
        let animationStarted = false;

        return {
            container,
            setVisible: (visible) => {
                container.setVisible(visible);
            },
            setValue: (value) => {
                currentValue = Math.max(0, Math.round(value));
                amountText.setText(`${currentValue}`);
            },
            getValue: () => currentValue,
            animateReward: (fromValue, toValue) => {
                if (animationStarted) {
                    return;
                }
                animationStarted = true;
                this.scene.tweens.addCounter({
                    from: fromValue,
                    to: toValue,
                    duration: Math.min(1800, Math.max(700, Math.abs(toValue - fromValue) * 120)),
                    ease: 'Sine.easeOut',
                    onUpdate: (tween) => {
                        currentValue = Math.round(tween.getValue());
                        amountText.setText(`${currentValue}`);
                    }
                });
            }
        };
    }

    animateGoldToStarsConversion(goldDisplay, starDisplay, totalGold, baseStars, onComplete = null) {
        const safeTotalGold = Math.max(0, Math.floor(totalGold || 0));
        const awardedStars = safeTotalGold > 0 ? Math.ceil(safeTotalGold / 10) : 0;

        goldDisplay.setValue(safeTotalGold);
        starDisplay.setValue(baseStars);

        if (safeTotalGold <= 0) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        const duration = Math.min(2600, Math.max(1000, safeTotalGold * 18));
        this.scene.tweens.addCounter({
            from: safeTotalGold,
            to: 0,
            duration,
            ease: 'Sine.easeOut',
            onUpdate: (tween) => {
                const currentGold = Math.max(0, Math.round(tween.getValue()));
                const convertedGold = safeTotalGold - currentGold;
                let gainedStars = Math.floor(convertedGold / 10);

                if (currentGold === 0 && safeTotalGold % 10 !== 0) {
                    gainedStars += 1;
                }

                goldDisplay.setValue(currentGold);
                starDisplay.setValue(baseStars + gainedStars);
            },
            onComplete: () => {
                goldDisplay.setValue(0);
                starDisplay.setValue(baseStars + awardedStars);
                if (onComplete) {
                    onComplete();
                }
            }
        });
    }

    createStoryRewardDisplay(centerX, y, maxWidth, isNarrowViewport, potionDefinition, fragmentDefinition = null) {
        const container = this.scene.add.container(centerX, y).setDepth(41);
        container.setVisible(false);

        const rewardDefinition = potionDefinition || fragmentDefinition;
        if (!rewardDefinition) {
            return {
                container,
                setVisible: () => {
                    container.setVisible(false);
                }
            };
        }

        const iconSize = isNarrowViewport ? 28 : 34;
        const icon = this.scene.add.image(-(maxWidth / 2) + (isNarrowViewport ? 22 : 30), 0, rewardDefinition.textureKey)
            .setOrigin(0.5)
            .setDisplaySize(iconSize, iconSize);
        const title = this.scene.add.text(
            -(maxWidth / 2) + (isNarrowViewport ? 44 : 56),
            -12,
            potionDefinition
                ? TranslationManager.t(`potion.${potionDefinition.id.toLowerCase()}.title`)
                : TranslationManager.t(fragmentDefinition.titleKey),
            {
                fontSize: isNarrowViewport ? '14px' : '17px',
                fill: '#3b2419',
                fontFamily: 'Vollkorn',
                fontStyle: 'bold',
                wordWrap: { width: maxWidth - (isNarrowViewport ? 54 : 70) }
            }
        ).setOrigin(0, 0.5);
        const desc = this.scene.add.text(
            -(maxWidth / 2) + (isNarrowViewport ? 44 : 56),
            12,
            potionDefinition
                ? TranslationManager.t(`potion.${potionDefinition.id.toLowerCase()}.desc`)
                : TranslationManager.t(fragmentDefinition.descKey),
            {
                fontSize: isNarrowViewport ? '12px' : '14px',
                fill: '#5d3b2b',
                fontFamily: 'Vollkorn',
                wordWrap: { width: maxWidth - (isNarrowViewport ? 54 : 70) }
            }
        ).setOrigin(0, 0.5);

        container.add([icon, title, desc]);

        return {
            container,
            setVisible: (visible) => {
                container.setVisible(visible);
            }
        };
    }

    createBossRushPotionPreview(centerX, y, isNarrowViewport, potions = []) {
        const container = this.scene.add.container(centerX, y).setDepth(41);
        container.setVisible(false);
        const spacing = isNarrowViewport ? 84 : 104;
        const iconSize = isNarrowViewport ? 38 : 46;

        (potions || []).slice(0, 3).forEach((potion, index) => {
            const x = (index - 1) * spacing;
            const icon = this.scene.add.image(x, -10, potion.textureKey)
                .setOrigin(0.5)
                .setDisplaySize(iconSize, iconSize);
            const label = this.scene.add.text(x, isNarrowViewport ? 18 : 24, TranslationManager.t(`potion.${potion.id.toLowerCase()}.title`), {
                fontSize: isNarrowViewport ? '11px' : '13px',
                fill: '#5d3b2b',
                fontFamily: 'Vollkorn',
                align: 'center',
                wordWrap: { width: isNarrowViewport ? 76 : 92 }
            }).setOrigin(0.5, 0);
            container.add([icon, label]);
        });

        return {
            container,
            setVisible: (visible) => {
                container.setVisible(visible);
            }
        };
    }

    createStyledMenuButton(x, y, width, height, label, fontSize = '15px', options = {}) {
        const leftWidth = 18;
        const rightWidth = 18;
        const fillWidth = Math.max(8, width - leftWidth - rightWidth);
        const fillTint = options.fillTint || null;
        const fillTintOn = options.fillTintOn || fillTint;
        const container = this.scene.add.container(x, y).setDepth(42);
        const left = this.scene.add.image(-width / 2 + leftWidth / 2, 0, 'ui-button-left-off')
            .setDisplaySize(leftWidth, height)
            .setOrigin(0.5);
        const fill = this.scene.add.image(0, 0, 'ui-button-fill-off')
            .setDisplaySize(fillWidth, height)
            .setOrigin(0.5);
        const right = this.scene.add.image(width / 2 - rightWidth / 2, 0, 'ui-button-right-off')
            .setDisplaySize(rightWidth, height)
            .setOrigin(0.5);
        const text = this.scene.add.text(0, 1, label, {
            fontSize,
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        const hitArea = this.scene.add.zone(0, 0, width, height)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        container.add([left, fill, right, text, hitArea]);

        const setState = (isOn) => {
            left.setTexture(isOn ? 'ui-button-left-on' : 'ui-button-left-off');
            fill.setTexture(isOn ? 'ui-button-fill-on' : 'ui-button-fill-off');
            right.setTexture(isOn ? 'ui-button-right-on' : 'ui-button-right-off');
            if (fillTint || fillTintOn) {
                const tintValue = isOn ? (fillTintOn || fillTint) : fillTint;
                [left, fill, right].forEach((part) => {
                    if (tintValue) {
                        part.setTint(tintValue);
                    } else {
                        part.clearTint();
                    }
                });
            }
            text.setColor(isOn ? '#fff8de' : '#f3e8d2');
        };

        setState(false);

        return { container, hitArea, setState };
    }
}
