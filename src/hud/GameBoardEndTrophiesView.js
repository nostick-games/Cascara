class GameBoardEndTrophiesView {
    constructor(endPanel) {
        this.endPanel = endPanel;
        this.hud = endPanel.hud;
        this.board = endPanel.board;
        this.scene = endPanel.scene;
    }

    createTrophyScrollArea(centerX, topY, width, height, isNarrowViewport) {
        const container = this.scene.add.container(0, 0).setDepth(41);
        const content = this.scene.add.container(centerX - width / 2, topY);
        const clipZone = this.scene.add.zone(centerX, topY + height / 2, width, height)
            .setOrigin(0.5)
            .setInteractive();
        const maskGraphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        maskGraphics.fillStyle(0xffffff, 1);
        maskGraphics.fillRect(centerX - width / 2, topY, width, height);
        const mask = maskGraphics.createGeometryMask();
        content.setMask(mask);

        const unlockedIds = new Set(this.scene.gameState.playerStats?.trophyTracker?.unlockedTrophies || []);
        const trophies = TrophyManager.getDefinitions();
        let currentY = 0;
        let currentCategory = null;

        trophies.forEach((trophy) => {
            if (trophy.categoryKey !== currentCategory) {
                currentCategory = trophy.categoryKey;
                const categoryText = this.scene.add.text(0, currentY, TranslationManager.t(trophy.categoryKey), {
                    fontSize: isNarrowViewport ? '17px' : '21px',
                    fill: '#3b2419',
                    fontFamily: 'Vollkorn',
                    fontStyle: 'bold'
                }).setOrigin(0, 0);
                content.add(categoryText);
                currentY += categoryText.height + 10;
            }

            const isUnlocked = unlockedIds.has(trophy.id);
            const iconSize = isNarrowViewport ? 42 : 52;
            const icon = this.scene.add.image(iconSize / 2, currentY + iconSize / 2, trophy.imageKey)
                .setOrigin(0.5)
                .setDisplaySize(iconSize, iconSize);
            const textX = iconSize + 10;
            const title = this.scene.add.text(textX, currentY - 2, TranslationManager.t(trophy.titleKey), {
                fontSize: isNarrowViewport ? '15px' : '18px',
                fill: '#3b2419',
                fontFamily: 'Vollkorn',
                fontStyle: 'bold',
                wordWrap: { width: width - iconSize - 16 }
            }).setOrigin(0, 0);
            const desc = this.scene.add.text(textX, currentY + title.height + 2, TranslationManager.t(trophy.descKey), {
                fontSize: isNarrowViewport ? '12px' : '14px',
                fill: '#3b2419',
                fontFamily: 'Vollkorn',
                wordWrap: { width: width - iconSize - 16 }
            }).setOrigin(0, 0);

            if (!isUnlocked) {
                icon.setTintFill(0x8a8a8a);
                icon.setAlpha(0.55);
            }

            content.add([icon, title, desc]);
            currentY += Math.max(iconSize, title.height + desc.height + 4) + 12;
        });

        const contentHeight = currentY;
        const maxScroll = Math.max(0, contentHeight - height);
        let scrollY = 0;
        let dragStartY = 0;
        let dragStartScroll = 0;

        const applyScroll = () => {
            content.y = topY - scrollY;
        };

        const setScroll = (nextScroll) => {
            scrollY = Phaser.Math.Clamp(nextScroll, 0, maxScroll);
            applyScroll();
        };

        clipZone.on('pointerdown', (pointer) => {
            dragStartY = pointer.y;
            dragStartScroll = scrollY;
        });

        clipZone.on('pointermove', (pointer) => {
            if (!pointer.isDown || maxScroll <= 0) {
                return;
            }
            setScroll(dragStartScroll - (pointer.y - dragStartY));
        });

        this.scene.input.on('wheel', (_pointer, _objects, _deltaX, deltaY) => {
            if (!container.visible || maxScroll <= 0) {
                return;
            }
            setScroll(scrollY + deltaY * 0.4);
        });

        applyScroll();
        container.add([content, clipZone]);
        return {
            setVisible: (visible) => {
                container.setVisible(visible);
                content.setVisible(visible);
                clipZone.setVisible(visible);
                clipZone.input.enabled = visible;
            }
        };
    }
}
