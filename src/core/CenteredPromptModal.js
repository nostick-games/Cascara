class CenteredPromptModal {
    static show(scene, options = {}) {
        const viewportWidth = scene.scale.width || 800;
        const viewportHeight = scene.scale.height || 700;
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        const isNarrowViewport = viewportWidth < 500;
        const panelWidth = options.width || (isNarrowViewport ? 286 : 372);
        const panelHeight = options.height || (isNarrowViewport ? 218 : 238);
        const overlayAlpha = options.overlayAlpha ?? 0.62;
        const depth = options.depth ?? 40;
        const iconTextureKey = options.iconTextureKey || null;
        const iconSize = options.iconSize || (isNarrowViewport ? 48 : 60);
        const titleText = options.titleText || null;
        const titleIconTextureKey = options.titleIconTextureKey || null;
        const titleIconSize = options.titleIconSize || (isNarrowViewport ? 26 : 30);
        const bodyText = options.bodyText || '';
        const buttonLabel = options.buttonLabel || '';
        const onConfirm = typeof options.onConfirm === 'function' ? options.onConfirm : null;

        const overlay = scene.add.container(0, 0).setDepth(depth);
        const blocker = scene.add.rectangle(centerX, centerY, viewportWidth, viewportHeight, 0x000000, overlayAlpha)
            .setInteractive();
        const panel = scene.add.container(centerX, centerY).setAlpha(0);
        const background = scene.add.rectangle(0, 0, panelWidth, panelHeight, 0xc86a20, 0.96)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xf3c37a, 1);

        const children = [background];
        let currentY = -panelHeight / 2 + (isNarrowViewport ? 22 : 26);

        if (titleText) {
            const titleStyle = {
                fontSize: isNarrowViewport ? '18px' : '22px',
                fill: '#fff6df',
                fontFamily: 'Vollkorn',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: { width: panelWidth - 38 }
            };

            if (titleIconTextureKey) {
                const titleRow = scene.add.container(0, currentY);
                const titleMeasure = scene.add.text(0, 0, titleText, titleStyle)
                    .setOrigin(0, 0)
                    .setVisible(false);
                const rowWidth = titleIconSize + 10 + titleMeasure.width;
                const iconX = -rowWidth / 2 + titleIconSize / 2;
                const textX = iconX + titleIconSize / 2 + 10;

                const titleIcon = scene.add.image(iconX, titleMeasure.height / 2, titleIconTextureKey)
                    .setOrigin(0.5)
                    .setDisplaySize(titleIconSize, titleIconSize);
                const title = scene.add.text(textX, 0, titleText, titleStyle).setOrigin(0, 0);

                titleRow.add([titleIcon, title]);
                children.push(titleRow);
                currentY += Math.max(title.height, titleIconSize) + (iconTextureKey ? 14 : 10);
                titleMeasure.destroy();
            } else {
                const title = scene.add.text(0, currentY, titleText, titleStyle).setOrigin(0.5, 0);
                children.push(title);
                currentY += title.height + (iconTextureKey ? 14 : 10);
            }
        }

        if (iconTextureKey) {
            const icon = scene.add.image(0, currentY + iconSize / 2, iconTextureKey)
                .setOrigin(0.5)
                .setDisplaySize(iconSize, iconSize);
            children.push(icon);
            currentY += iconSize + (isNarrowViewport ? 12 : 16);
        }

        const body = scene.add.text(0, currentY, bodyText, {
            fontSize: isNarrowViewport ? '17px' : '20px',
            fill: '#fff6df',
            fontFamily: 'Vollkorn',
            align: 'center',
            wordWrap: { width: panelWidth - 34 }
        }).setOrigin(0.5, 0);
        children.push(body);

        const button = this.createActionButton(
            scene,
            0,
            panelHeight / 2 - (isNarrowViewport ? 34 : 40),
            options.buttonWidth || (isNarrowViewport ? 154 : 170),
            40,
            buttonLabel,
            isNarrowViewport ? '18px' : '20px'
        );
        button.hitArea.on('pointerover', () => button.setState(true));
        button.hitArea.on('pointerout', () => button.setState(false));
        button.hitArea.on('pointerdown', () => {
            button.setState(true);
            blocker.disableInteractive();
            scene.time.delayedCall(120, () => {
                scene.tweens.add({
                    targets: panel,
                    alpha: 0,
                    y: centerY - 14,
                    duration: 180,
                    ease: 'Quad.In',
                    onComplete: () => {
                        overlay.destroy(true);
                        if (onConfirm) {
                            onConfirm();
                        }
                    }
                });
            });
        });

        children.push(button.container);
        panel.add(children);
        overlay.add([blocker, panel]);

        scene.tweens.add({
            targets: panel,
            alpha: 1,
            y: centerY + 10,
            duration: 220,
            ease: 'Quad.Out',
            onComplete: () => {
                panel.setY(centerY);
            }
        });

        return { overlay, panel, blocker };
    }

    static createActionButton(scene, x, y, width, height, label, fontSize = '18px') {
        const leftWidth = 18;
        const rightWidth = 18;
        const fillWidth = Math.max(8, width - leftWidth - rightWidth);
        const container = scene.add.container(x, y);
        const left = scene.add.image(-width / 2 + leftWidth / 2, 0, 'ui-button-left-off')
            .setDisplaySize(leftWidth, height)
            .setOrigin(0.5);
        const fill = scene.add.image(0, 0, 'ui-button-fill-off')
            .setDisplaySize(fillWidth, height)
            .setOrigin(0.5);
        const right = scene.add.image(width / 2 - rightWidth / 2, 0, 'ui-button-right-off')
            .setDisplaySize(rightWidth, height)
            .setOrigin(0.5);
        const text = scene.add.text(0, 1, label, {
            fontSize,
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const hitArea = scene.add.zone(0, 0, width, height)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        container.add([left, fill, right, text, hitArea]);

        const setState = (isOn) => {
            left.setTexture(isOn ? 'ui-button-left-on' : 'ui-button-left-off');
            fill.setTexture(isOn ? 'ui-button-fill-on' : 'ui-button-fill-off');
            right.setTexture(isOn ? 'ui-button-right-on' : 'ui-button-right-off');
            text.setColor(isOn ? '#fff8de' : '#f3e8d2');
        };

        return { container, hitArea, setState };
    }
}
