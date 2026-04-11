class GameSceneModeHelper {
    static resolvePlayerOrder(scene) {
        if (scene.isStrategoMode) {
            return ['ROUGE'];
        }

        if (scene.isFightMode) {
            return ['ROUGE', 'BLEU'];
        }

        return ['ROUGE', 'BLEU', 'VERT', 'JAUNE'].slice(0, scene.aiCount + 1);
    }

    static resolveEnemyAssignments(scene, playerOrder) {
        if (scene.isStrategoMode) {
            return { ROUGE: null };
        }

        if (scene.isFightMode) {
            return {
                ROUGE: null,
                BLEU: EnemyDefinitions.get(scene.fightConfig?.enemyTypeKey || 'GOBLIN')
            };
        }

        return scene.preselectedEnemyAssignments || EnemyDefinitions.createAssignments(playerOrder);
    }

    static resolveBattleBackgroundKey(scene) {
        if (scene.storyContext?.source !== 'story') {
            const arcadeKingdom = ArcadeKingdomCatalog.getById(scene.arcadeKingdomId || 'VERDOMBRE');
            return arcadeKingdom?.battleBackgroundKey || 'forest-fight-bg';
        }

        const pathIndex = Math.max(0, Math.floor(scene.storyContext?.storyState?.currentPathIndex || 0));
        if (pathIndex === 1) {
            return 'cave-fight-bg';
        }
        if (pathIndex >= 2) {
            return 'dungeon-fight-bg';
        }
        return 'forest-fight-bg';
    }

    static createFightInitialGrid(gameLogic, gridSize) {
        const grid = gameLogic.gridFactory.initializeGrid();
        const leftBandWidth = 2;
        const rightBandStart = gridSize - 2;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const pion = grid[row][col];
                pion.color = 'GRIS';
                pion.specialOwnerColor = null;
                pion.specialType = null;
                pion.isFrozen = false;
                pion.frozenTurns = 0;
                pion.thawing = false;
                pion.frozenSourceRow = null;
                pion.frozenSourceCol = null;
                pion.isSwamp = false;
                pion.swampTurns = 0;
                pion.swampSourceRow = null;
                pion.swampSourceCol = null;
                pion.isBurning = false;
                pion.burningTurns = 0;
                pion.burningOwnerColor = null;
                pion.isShielded = false;
                pion.shieldTurns = 0;
                pion.shieldOwnerColor = null;
                pion.lockZoneId = null;
                pion.isLocked = false;
                pion.lockedOwnerColor = null;

                if (col < leftBandWidth) {
                    pion.color = 'ROUGE';
                } else if (col >= rightBandStart) {
                    pion.color = 'BLEU';
                }
            }
        }

        return grid;
    }
}
