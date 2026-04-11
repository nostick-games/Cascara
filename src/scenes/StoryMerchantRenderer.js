class StoryMerchantRenderer {
    static drawGoldCounter(scene, centerX, y, isNarrowViewport, gold) {
        const iconSize = isNarrowViewport ? 26 : 30;
        const valueText = scene.add.text(0, y, `${gold ?? 100}`, {
            fontSize: isNarrowViewport ? '18px' : '21px',
            fill: '#fff3d5',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            stroke: '#4a2d20',
            strokeThickness: 2
        }).setOrigin(0, 0.5).setDepth(12);
        const totalWidth = iconSize + 8 + valueText.width;
        const iconX = centerX - totalWidth / 2;

        scene.add.image(iconX, y, 'story-gold')
            .setOrigin(0, 0.5)
            .setDisplaySize(iconSize, iconSize)
            .setDepth(12);
        valueText.setX(iconX + iconSize + 8);
        return valueText;
    }

    static createOwnedBadge(scene, x, y, count) {
        const container = scene.add.container(x, y).setDepth(12);
        const circle = scene.add.circle(0, 0, 14, 0xe03131, 1)
            .setStrokeStyle(2, 0xf8dddd, 0.9);
        const text = scene.add.text(0, 0, `${count}`, {
            fontSize: '15px',
            fill: '#fff8de',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add([circle, text]);

        return {
            container,
            setCount: (nextCount) => {
                text.setText(`${nextCount}`);
                container.setVisible(nextCount > 0);
            }
        };
    }

    static createUiTextButton(scene, x, y, width, height, label, fontSize = '16px', centerContent = false) {
        const leftWidth = 18;
        const rightWidth = 18;
        const fillWidth = Math.max(8, width - leftWidth - rightWidth);
        const container = scene.add.container(x, y).setDepth(12);
        const left = scene.add.image(-width / 2 + leftWidth / 2, 0, 'ui-button-left-off')
            .setDisplaySize(leftWidth, height)
            .setOrigin(0.5);
        const fill = scene.add.image(0, 0, 'ui-button-fill-off')
            .setDisplaySize(fillWidth, height)
            .setOrigin(0.5);
        const right = scene.add.image(width / 2 - rightWidth / 2, 0, 'ui-button-right-off')
            .setDisplaySize(rightWidth, height)
            .setOrigin(0.5);
        const text = scene.add.text(centerContent ? 0 : 1, 1, label, {
            fontSize,
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const hitArea = scene.add.zone(0, 0, width, height)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        container.add([left, fill, right, text, hitArea]);

        let disabled = false;
        const setState = (isOn) => {
            if (disabled) {
                return;
            }
            left.setTexture(isOn ? 'ui-button-left-on' : 'ui-button-left-off');
            fill.setTexture(isOn ? 'ui-button-fill-on' : 'ui-button-fill-off');
            right.setTexture(isOn ? 'ui-button-right-on' : 'ui-button-right-off');
            text.setColor(isOn ? '#fff8de' : '#f3e8d2');
        };

        return {
            container,
            hitArea,
            label: text,
            setState,
            isDisabled: () => disabled,
            setDisabled: (nextDisabled) => {
                disabled = nextDisabled;
                container.setAlpha(disabled ? 0.55 : 1);
                if (!disabled) {
                    setState(false);
                }
            }
        };
    }

    static createGoldPriceButton(scene, x, y, width, height, price) {
        const button = this.createUiTextButton(scene, x, y, width, height, `${price}`, '16px', true);
        const icon = scene.add.image(-18, 0, 'story-gold')
            .setOrigin(0.5)
            .setDisplaySize(18, 18);
        button.container.addAt(icon, 3);
        button.label.setX(8);
        return button;
    }

    static buildFragmentCard(scene, {
        centerX,
        y,
        width,
        isNarrowViewport,
        fragment,
        storyState,
        onPurchase
    }) {
        const container = scene.add.container(0, 0);
        const iconX = centerX - width / 2 + (isNarrowViewport ? 30 : 38);
        const iconSize = isNarrowViewport ? 56 : 68;
        const textX = iconX + (isNarrowViewport ? 40 : 52);
        const buttonWidth = isNarrowViewport ? 118 : 128;
        const badgeCount = StoryFragmentInventory.getCount(storyState, fragment.id);

        const icon = scene.add.image(iconX, y + (isNarrowViewport ? 28 : 30), fragment.textureKey)
            .setOrigin(0.5)
            .setDisplaySize(iconSize, iconSize);
        const title = scene.add.text(textX, y, TranslationManager.t(fragment.titleKey), {
            fontSize: isNarrowViewport ? '13px' : '21px',
            fill: '#3b2419',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            wordWrap: { width: width - (isNarrowViewport ? 116 : 144) }
        }).setOrigin(0, 0);
        const desc = scene.add.text(textX, y + title.height + 2, TranslationManager.t(fragment.descKey), {
            fontSize: isNarrowViewport ? '16px' : '19px',
            fill: '#5d3b2b',
            fontFamily: 'Vollkorn',
            wordWrap: { width: width - (isNarrowViewport ? 116 : 144) }
        }).setOrigin(0, 0);
        const buyButton = this.createGoldPriceButton(
            scene,
            textX + buttonWidth / 2,
            y + (isNarrowViewport ? 86 : 100),
            buttonWidth,
            34,
            fragment.price
        );
        const badge = this.createOwnedBadge(
            scene,
            textX + buttonWidth + 28,
            y + (isNarrowViewport ? 86 : 100),
            badgeCount
        );

        const refreshCardState = () => {
            const affordableNow = (storyState.gold || 0) >= fragment.price;
            buyButton.setDisabled(!affordableNow);
            badge.setCount(StoryFragmentInventory.getCount(storyState, fragment.id));
        };

        buyButton.hitArea.on('pointerover', () => {
            if (!buyButton.isDisabled()) buyButton.setState(true);
        });
        buyButton.hitArea.on('pointerout', () => buyButton.setState(false));
        buyButton.hitArea.on('pointerdown', () => {
            if (buyButton.isDisabled()) {
                return;
            }
            onPurchase(fragment);
        });

        refreshCardState();

        container.add([
            icon,
            title,
            desc,
            buyButton.container,
            badge.container
        ]);

        return { container, refreshCardState };
    }
}
