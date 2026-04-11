class GameBoardEndStatsView {
    constructor(endPanel) {
        this.endPanel = endPanel;
        this.hud = endPanel.hud;
        this.board = endPanel.board;
        this.scene = endPanel.scene;
    }

    buildEndStatsText() {
        const stats = this.scene.gameState.playerStats || {};
        const winThreshold = this.scene.getGoalGaugeThreshold?.()
            || GameLogic.getWinThreshold(this.board.GRID_SIZE, this.scene.gameState.playerOrder.length);
        const maxProgressPercent = Math.round(stats.maxProgressPercent || 0);
        const maxObjectiveProgressPercent = Math.round(stats.maxObjectiveProgressPercent || maxProgressPercent || 0);
        const objectivePercent = winThreshold > 0
            ? Math.min(100, Math.round((maxObjectiveProgressPercent / winThreshold) * 100))
            : 0;
        const totalCapturedTiles = Math.round(stats.totalCapturedTiles || 0);

        return [
            TranslationManager.t('stats.objective', { value: objectivePercent }),
            TranslationManager.t('stats.territory', { value: maxProgressPercent }),
            TranslationManager.t('stats.tiles', { value: totalCapturedTiles }),
            TranslationManager.t('stats.consumed')
        ].join('\n');
    }

    createPotionStatsRow(centerX, y, isNarrowViewport) {
        const container = this.scene.add.container(centerX, y).setDepth(41);
        const availablePotions = this.scene.gameState.progressPotions || [];
        const consumed = this.scene.gameState.playerStats?.consumedPotions || {};
        const iconSize = isNarrowViewport ? 39 : 45;
        const fontSize = isNarrowViewport ? '14px' : '16px';
        const itemSpacing = isNarrowViewport ? 82 : 98;
        const startX = -((availablePotions.length - 1) * itemSpacing) / 2;

        availablePotions.forEach((potion, index) => {
            const itemX = startX + index * itemSpacing;
            const countText = this.scene.add.text(itemX - (isNarrowViewport ? 20 : 24), 0, `${consumed[potion.id] || 0}`, {
                fontSize,
                fill: '#4a2d20',
                fontFamily: 'Vollkorn',
                fontStyle: 'bold'
            }).setOrigin(1, 0.5);
            const icon = this.scene.add.image(itemX + (isNarrowViewport ? 12 : 14), 0, potion.textureKey)
                .setOrigin(0.5)
                .setDisplaySize(iconSize, iconSize);

            container.add([countText, icon]);
        });

        return { container };
    }
}
