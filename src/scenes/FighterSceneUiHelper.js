class FighterSceneUiHelper {
    constructor(scene) {
        this.scene = scene;
    }

    getAvailableEnemies() {
        const unlockedTrophies = new Set(TrophyManager.loadUnlockedIds());
        const baseEnemies = ['GOBLIN', 'SKULL', 'WIZARD'];
        const bossRequirements = [
            { key: 'SALAMANDER', trophyId: 'tro_0701' },
            { key: 'GOLEM', trophyId: 'tro_0702' },
            { key: 'OGRE', trophyId: 'tro_0703' }
        ];

        const keys = [
            ...baseEnemies,
            ...bossRequirements
                .filter((entry) => unlockedTrophies.has(entry.trophyId))
                .map((entry) => entry.key)
        ];

        return keys.map((key) => EnemyDefinitions.get(key)).filter(Boolean);
    }

    ensureEnemyAnimations() {
        Object.values(EnemyDefinitions.getAll()).forEach((enemy) => {
            const animationKey = `fighter-${enemy.key.toLowerCase()}-briefing-idle`;
            const textureKey = enemy.briefingIdleTexture || enemy.idleTexture;
            if (this.scene.anims.exists(animationKey)) {
                return;
            }

            this.scene.anims.create({
                key: animationKey,
                frames: this.scene.anims.generateFrameNumbers(textureKey, {
                    start: 0,
                    end: (enemy.idleFrames || 4) - 1
                }),
                frameRate: 7,
                repeat: -1
            });
        });
    }

    createEnemyCarousel(centerX, centerY, isNarrowViewport, availableEnemies, getSelectedIndex) {
        const container = this.scene.add.container(0, 0);
        const sectionWidth = Math.min(isNarrowViewport ? this.scene.scale.width - 52 : 360, this.scene.scale.width - 36);
        const iconSpacing = isNarrowViewport ? 58 : 70;
        const maxVisibleSlotCount = 5;
        const centerSlotY = centerY;
        const squareSize = isNarrowViewport ? 64 : 76;
        const centerHighlight = this.scene.add.rectangle(centerX, centerSlotY, squareSize, squareSize, 0xc86a20, 0.96)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xf3c37a, 1);
        const leftArrow = this.scene.add.text(centerX - sectionWidth / 2 + 8, centerSlotY, '◀︎', {
            fontSize: isNarrowViewport ? '22px' : '26px',
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        const rightArrow = this.scene.add.text(centerX + sectionWidth / 2 - 8, centerSlotY, '►', {
            fontSize: isNarrowViewport ? '22px' : '26px',
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5);
        const leftHit = this.scene.add.zone(centerX - sectionWidth / 2 + 18, centerSlotY, 40, 40)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        const rightHit = this.scene.add.zone(centerX + sectionWidth / 2 - 18, centerSlotY, 40, 40)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        const firstEnemy = availableEnemies[0];
        const icons = Array.from({ length: maxVisibleSlotCount }, () => this.scene.add.sprite(
            centerX,
            centerSlotY,
            firstEnemy.briefingIdleTexture || firstEnemy.idleTexture,
            0
        ).setOrigin(0.5));
        const nameText = this.scene.add.text(centerX, centerY + (isNarrowViewport ? 60 : 72), '', {
            fontSize: isNarrowViewport ? '18px' : '21px',
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add([centerHighlight, ...icons, leftArrow, rightArrow, leftHit, rightHit, nameText]);

        return {
            container,
            leftButton: { hitArea: leftHit },
            rightButton: { hitArea: rightHit },
            bottomY: centerY + (isNarrowViewport ? 84 : 98),
            update: () => {
                const enemyCount = availableEnemies.length;
                const visibleSlotCount = Math.min(maxVisibleSlotCount, enemyCount);
                const visibleSlotIndexes = Array.from(
                    { length: visibleSlotCount },
                    (_, index) => index - Math.floor(visibleSlotCount / 2)
                );

                icons.forEach((icon, index) => {
                    const offset = visibleSlotIndexes[index];
                    if (offset === undefined) {
                        icon.setVisible(false);
                        return;
                    }

                    const enemyIndex = (getSelectedIndex() + offset + enemyCount) % enemyCount;
                    const enemy = availableEnemies[enemyIndex];
                    icon.setVisible(true);
                    icon.setTexture(enemy.briefingIdleTexture || enemy.idleTexture);
                    icon.play(`fighter-${enemy.key.toLowerCase()}-briefing-idle`, true);
                    icon.setX(centerX + offset * iconSpacing);
                    icon.setY(centerSlotY);
                    icon.setAlpha(offset === 0 ? 1 : 0.62);
                    icon.setScale(offset === 0 ? (isNarrowViewport ? 1.7 : 2) : (isNarrowViewport ? 1.15 : 1.35));
                });

                nameText.setText(availableEnemies[getSelectedIndex()].label);
            }
        };
    }

    createKingdomCarousel(centerX, centerY, isNarrowViewport, kingdoms, getSelectedIndex) {
        const container = this.scene.add.container(0, 0);
        const sectionWidth = Math.min(isNarrowViewport ? this.scene.scale.width - 52 : 360, this.scene.scale.width - 36);
        const iconSpacing = isNarrowViewport ? 56 : 68;
        const maxVisibleSlotCount = Math.min(5, kingdoms.length);
        const centerSlotY = centerY;
        const squareSize = isNarrowViewport ? 52 : 60;
        const centerHighlight = this.scene.add.rectangle(centerX, centerSlotY, squareSize, squareSize, 0xc86a20, 0.96)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xf3c37a, 1);
        const leftArrow = this.scene.add.text(centerX - sectionWidth / 2 + 8, centerSlotY, '◀︎', {
            fontSize: isNarrowViewport ? '22px' : '26px',
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        const rightArrow = this.scene.add.text(centerX + sectionWidth / 2 - 8, centerSlotY, '►', {
            fontSize: isNarrowViewport ? '22px' : '26px',
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5);
        const leftHit = this.scene.add.zone(centerX - sectionWidth / 2 + 18, centerSlotY, 40, 40)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        const rightHit = this.scene.add.zone(centerX + sectionWidth / 2 - 18, centerSlotY, 40, 40)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        const previews = Array.from({ length: maxVisibleSlotCount }, () => {
            const slot = this.scene.add.container(centerX, centerSlotY);
            const square = this.scene.add.rectangle(0, 0, squareSize - 8, squareSize - 8, 0x6d4c41, 0.92)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0xe8c98b, 0.9);
            const preview = this.scene.add.image(0, 0, kingdoms[0].previewTextureKey)
                .setOrigin(0.5)
                .setDisplaySize(squareSize - 8, squareSize - 8);
            slot.add([square, preview]);
            return { slot, square, preview };
        });
        const nameText = this.scene.add.text(centerX, centerY + (isNarrowViewport ? 52 : 62), '', {
            fontSize: isNarrowViewport ? '17px' : '20px',
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add([centerHighlight, ...previews.map((entry) => entry.slot), leftArrow, rightArrow, leftHit, rightHit, nameText]);

        return {
            container,
            leftButton: { hitArea: leftHit },
            rightButton: { hitArea: rightHit },
            bottomY: centerY + (isNarrowViewport ? 74 : 86),
            update: () => {
                const kingdomCount = kingdoms.length;
                const visibleSlotIndexes = Array.from(
                    { length: maxVisibleSlotCount },
                    (_, index) => index - Math.floor(maxVisibleSlotCount / 2)
                );

                previews.forEach((entry, index) => {
                    const offset = visibleSlotIndexes[index];
                    const kingdomIndex = (getSelectedIndex() + offset + kingdomCount) % kingdomCount;
                    const kingdom = kingdoms[kingdomIndex];
                    entry.slot.setVisible(true);
                    entry.slot.setX(centerX + offset * iconSpacing);
                    entry.slot.setY(centerSlotY);
                    entry.slot.setAlpha(offset === 0 ? 1 : 0.62);
                    entry.slot.setScale(offset === 0 ? 1.08 : 0.92);
                    entry.square.setVisible(offset === 0);
                    if (offset === 0) {
                        entry.square.setFillStyle(0x7a543e, 0.95);
                    }
                    entry.preview.setTexture(kingdom.previewTextureKey);
                });

                nameText.setText(TranslationManager.t(kingdoms[getSelectedIndex()].titleKey));
            }
        };
    }

    createUiButton(x, y, width, height, label, fontSize = '16px') {
        const leftWidth = 18;
        const rightWidth = 18;
        const fillWidth = Math.max(8, width - leftWidth - rightWidth);
        const container = this.scene.add.container(x, y);
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
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const hitArea = this.scene.add.zone(0, 0, width, height)
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
