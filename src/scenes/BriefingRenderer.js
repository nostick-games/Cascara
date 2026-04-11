class BriefingRenderer {
    static addCenteredText(scene, content, centerX, sectionWidth, text, y, size, color = '#ffffff') {
        const label = scene.add.text(centerX, y, text, {
            fontSize: size,
            fill: color,
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: sectionWidth }
        }).setOrigin(0.5, 0);
        content.add(label);
        return label;
    }

    static addEnemyRow(scene, content, centerX, sectionWidth, slotY, rowHeight, spriteScale, isNarrowViewport, enemy) {
        const spriteX = centerX - sectionWidth / 2 + (isNarrowViewport ? 32 : 42);
        const textX = spriteX + (isNarrowViewport ? 36 : 48);
        const sprite = scene.add.sprite(spriteX, slotY + rowHeight / 2 - 4, enemy.briefingIdleTexture || enemy.idleTexture, 0)
            .setOrigin(0.5)
            .setScale(spriteScale);
        const briefingAnimationKey = scene.getBriefingIdleAnimationKey
            ? scene.getBriefingIdleAnimationKey(enemy.key)
            : null;
        if (briefingAnimationKey && scene.anims.exists(briefingAnimationKey)) {
            sprite.play(briefingAnimationKey);
        }
        const enemyTitle = `${enemy.label} ${TranslationManager.t(`enemy.style.${enemy.style.toLowerCase()}`).toLowerCase()}`;
        const name = scene.add.text(textX, slotY, enemyTitle, {
            fontSize: isNarrowViewport ? '17px' : '19px',
            fill: '#ffffff',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        const desc = scene.add.text(textX, slotY + name.height + 2, TranslationManager.t(`enemy.desc.${enemy.style.toLowerCase()}`), {
            fontSize: isNarrowViewport ? '12px' : '13px',
            fill: '#d0c5b4',
            fontFamily: 'Vollkorn',
            wordWrap: { width: sectionWidth - (textX - (centerX - sectionWidth / 2)) }
        }).setOrigin(0, 0);
        content.add([sprite, name, desc]);
        return { sprite, name, desc, height: Math.max(rowHeight, desc.y + desc.height - slotY) };
    }

    static addPotionRow(scene, content, centerX, sectionWidth, slotY, rowHeight, isNarrowViewport, potion) {
        const iconX = centerX - sectionWidth / 2 + (isNarrowViewport ? 32 : 42);
        const textX = iconX + (isNarrowViewport ? 34 : 46);
        const icon = scene.add.image(iconX, slotY + (isNarrowViewport ? 18 : 20), potion.textureKey)
            .setOrigin(0.5)
            .setScale(isNarrowViewport ? 1.4 : 1.6);
        const name = scene.add.text(textX, slotY, TranslationManager.t(`potion.${potion.id.toLowerCase()}.title`), {
            fontSize: isNarrowViewport ? '16px' : '18px',
            fill: '#ffffff',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        const desc = scene.add.text(textX, slotY + name.height + 2, TranslationManager.t(`potion.${potion.id.toLowerCase()}.desc`), {
            fontSize: isNarrowViewport ? '12px' : '13px',
            fill: '#d0c5b4',
            fontFamily: 'Vollkorn',
            wordWrap: { width: sectionWidth - (textX - (centerX - sectionWidth / 2)) }
        }).setOrigin(0, 0);
        content.add([icon, name, desc]);
        return { icon, name, desc, height: Math.max(rowHeight, desc.y + desc.height - slotY) };
    }

    static createUiButton(scene, x, y, width, height, label, fontSize = '16px') {
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

        return { container, hitArea, label: text, setState };
    }
}
