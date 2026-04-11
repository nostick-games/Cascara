class GameBoardCheatPanel {
    constructor(hud) {
        this.hud = hud;
        this.board = hud.board;
        this.scene = hud.scene;
    }

    createPotionCheatPanel() {
        if (this.scene.isStrategoMode) {
            return;
        }

        if (this.board.potionCheatPanel) {
            this.board.potionCheatPanel.destroy(true);
        }

        const isNarrowViewport = this.scene.scale.width < 500;
        const definitions = this.scene.setup.getProgressPotionDefinitions();
        const iconSpacingX = isNarrowViewport ? 34 : 38;
        const cheatButtonWidth = isNarrowViewport ? 34 : 38;
        const totalColumns = definitions.length + 2;
        const contentWidth = ((totalColumns - 1) * iconSpacingX) + cheatButtonWidth;
        const panelWidth = contentWidth + (isNarrowViewport ? 28 : 34);
        const panelHeight = isNarrowViewport ? 50 : 54;
        const panelX = this.scene.scale.width - panelWidth / 2 - (isNarrowViewport ? 10 : 18);
        const panelY = isNarrowViewport ? 28 : 32;
        const iconScale = isNarrowViewport ? 1.05 : 1.15;
        const rowY = panelY;

        const panel = this.scene.add.container(0, 0);
        const background = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x25131A, 0.72)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x895A45, 1)
            .setDepth(18);
        panel.add(background);

        this.board.potionCheatSprites = [];

        definitions.forEach((potion, index) => {
            const x = panelX - Math.floor(((totalColumns - 1) * iconSpacingX) / 2) + index * iconSpacingX;
            const y = rowY;
            const icon = this.scene.add.image(x, y, potion.textureKey)
                .setOrigin(0.5)
                .setScale(iconScale)
                .setDepth(19);
            const hitArea = this.scene.add.zone(x, y, isNarrowViewport ? 42 : 36, isNarrowViewport ? 42 : 36)
                .setOrigin(0.5)
                .setDepth(20)
                .setInteractive({ useHandCursor: true });

            hitArea.on('pointerdown', () => {
                this.scene.triggerCheatPotion(potion.id);
            });

            panel.add(icon);
            panel.add(hitArea);
            this.board.potionCheatSprites.push(icon);
        });

        const defeatButton = this.createCheatActionButton(
            panelX - Math.floor(((totalColumns - 1) * iconSpacingX) / 2) + definitions.length * iconSpacingX,
            rowY,
            isNarrowViewport ? 34 : 38,
            isNarrowViewport ? 26 : 28,
            'D',
            () => this.scene.triggerCheatDefeat()
        );
        const victoryButton = this.createCheatActionButton(
            panelX - Math.floor(((totalColumns - 1) * iconSpacingX) / 2) + (definitions.length + 1) * iconSpacingX,
            rowY,
            isNarrowViewport ? 34 : 38,
            isNarrowViewport ? 26 : 28,
            'V',
            () => this.scene.triggerCheatVictory()
        );

        panel.add(defeatButton.container);
        panel.add(victoryButton.container);

        this.board.potionCheatPanel = panel;
    }

    createCheatActionButton(x, y, width, height, label, onClick) {
        const container = this.scene.add.container(0, 0);
        const background = this.scene.add.rectangle(0, 0, width, height, 0x3a251d, 0.92)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x895A45, 1);
        const text = this.scene.add.text(0, 0, label, {
            fontSize: '13px',
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const hitArea = this.scene.add.zone(0, 0, width, height)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        const setState = (isOn) => {
            background.setFillStyle(isOn ? 0x6f4634 : 0x3a251d, 0.92);
            text.setColor(isOn ? '#fff8de' : '#f3e8d2');
        };

        hitArea.on('pointerover', () => setState(true));
        hitArea.on('pointerout', () => setState(false));
        hitArea.on('pointerdown', () => {
            setState(true);
            onClick();
        });

        container.setPosition(x, y);
        container.add([background, text, hitArea]);
        return { container };
    }
}
