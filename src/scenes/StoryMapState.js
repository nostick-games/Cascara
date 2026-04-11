class StoryMapState {
    static CAMPAIGN_PATHS = [
        { index: 0, difficulty: 'EASY', bossTypeKey: 'SALAMANDER' },
        { index: 1, difficulty: 'NORMAL', bossTypeKey: 'GOLEM' },
        { index: 2, difficulty: 'HARD', bossTypeKey: 'OGRE' }
    ];

    static getPathCount() {
        return this.CAMPAIGN_PATHS.length;
    }

    static getPathIndex(rawIndex = 0) {
        return Phaser.Math.Clamp(Math.floor(rawIndex || 0), 0, this.getPathCount() - 1);
    }

    static getPathConfig(rawIndex = 0) {
        return this.CAMPAIGN_PATHS[this.getPathIndex(rawIndex)] || this.CAMPAIGN_PATHS[0];
    }

    static getPathDifficulty(rawIndex = 0) {
        return this.getPathConfig(rawIndex).difficulty;
    }

    static generateRows() {
        const rowCount = 7;
        const nodesByRow = [];

        for (let row = 0; row < rowCount; row++) {
            let laneIndexes;
            if (row === 0) {
                laneIndexes = [1];
            } else if (row === 1) {
                laneIndexes = [0, 1, 2];
            } else {
                const lanePool = Phaser.Utils.Array.Shuffle([0, 1, 2]);
                const count = Phaser.Math.Between(2, 3);
                laneIndexes = lanePool.slice(0, count).sort((left, right) => left - right);
            }

            const rowNodes = laneIndexes.map((lane) => ({
                id: `row_${row}_lane_${lane}`,
                row,
                lane,
                type: row === 0 ? 'fight' : null,
                eventId: null,
                nextIds: [],
                previousIds: []
            }));
            nodesByRow.push(rowNodes);
        }

        for (let row = 0; row < rowCount - 1; row++) {
            const currentNodes = nodesByRow[row];
            const nextNodes = nodesByRow[row + 1];

            currentNodes.forEach((node) => {
                const adjacentNextNodes = nextNodes.filter((candidate) =>
                    Math.abs(candidate.lane - node.lane) <= 1
                );
                const sameLaneNode = adjacentNextNodes.find((candidate) => candidate.lane === node.lane);
                const preferredTargets = [];

                if (sameLaneNode) {
                    preferredTargets.push(sameLaneNode);
                }

                const otherTargets = Phaser.Utils.Array.Shuffle(
                    adjacentNextNodes.filter((candidate) => candidate !== sameLaneNode)
                );
                if (otherTargets[0] && Math.random() < 0.45) {
                    preferredTargets.push(otherTargets[0]);
                }

                const finalTargets = Array.from(new Set(preferredTargets));
                if (finalTargets.length === 0 && adjacentNextNodes[0]) {
                    finalTargets.push(adjacentNextNodes[0]);
                }

                finalTargets.forEach((targetNode) => {
                    if (!node.nextIds.includes(targetNode.id)) {
                        node.nextIds.push(targetNode.id);
                    }
                    if (!targetNode.previousIds.includes(node.id)) {
                        targetNode.previousIds.push(node.id);
                    }
                });
            });

            nextNodes.forEach((node) => {
                if (node.previousIds.length > 0) {
                    return;
                }

                const nearestPrevious = currentNodes
                    .slice()
                    .sort((left, right) =>
                        Math.abs(left.lane - node.lane) - Math.abs(right.lane - node.lane)
                    )[0];

                if (nearestPrevious) {
                    nearestPrevious.nextIds.push(node.id);
                    node.previousIds.push(nearestPrevious.id);
                }
            });
        }

        const bossNode = {
            id: 'boss_final',
            row: rowCount,
            lane: 1,
            type: 'boss',
            eventId: null,
            nextIds: [],
            previousIds: []
        };
        nodesByRow[rowCount - 1].forEach((node) => {
            node.nextIds.push(bossNode.id);
            bossNode.previousIds.push(node.id);
        });

        this.assignNodeTypes(nodesByRow);

        return [...nodesByRow, [bossNode]];
    }

    static createInitialState(unlockedPotionIds) {
        return this.buildPathState({
            unlockedPotionIds: [...unlockedPotionIds],
            gold: 100,
            fragments: {},
            activeBossBlessingId: null,
            briefingFragmentIds: [],
            bossBlessingChosenForBattle: false,
            forcedBossTypeKey: null,
            bossSequenceIndex: 0,
            currentPathIndex: 0
        }, 0);
    }

    static buildPathState(baseState = {}, rawPathIndex = 0) {
        const pathIndex = this.getPathIndex(rawPathIndex);
        const rows = this.generateRows();

        return {
            rows,
            currentNodeIds: [rows[0][0].id],
            completedNodeIds: [],
            completedEventIds: [...(baseState.completedEventIds || [])],
            unlockedPotionIds: [...(baseState.unlockedPotionIds || [])],
            gold: baseState.gold ?? 100,
            fragments: StoryFragmentInventory.normalizeCounts(baseState.fragments || {}),
            activeFragmentId: null,
            activeFragmentIds: [],
            activeBossBlessingId: null,
            briefingFragmentIds: [...(baseState.briefingFragmentIds || [])],
            bossBlessingChosenForBattle: false,
            confusedEnemyColor: null,
            forcedBossTypeKey: baseState.forcedBossTypeKey || null,
            bossSequenceIndex: pathIndex,
            currentPathIndex: pathIndex
        };
    }

    static rebuild(rawState, fallbackUnlockedPotionIds) {
        const rows = (rawState?.rows || []).map((rowNodes) =>
            rowNodes.map((node) => ({
                id: node.id,
                row: node.row,
                lane: node.lane,
                type: node.type,
                eventId: node.eventId || null,
                nextIds: [...(node.nextIds || [])],
                previousIds: [...(node.previousIds || [])]
            }))
        );
        const nodeById = {};
        rows.forEach((rowNodes) => {
            rowNodes.forEach((node) => {
                nodeById[node.id] = node;
            });
        });

        return {
            rows,
            nodeById,
            currentNodeIds: [...(rawState?.currentNodeIds || [])],
            completedNodeIds: [...(rawState?.completedNodeIds || [])],
            completedEventIds: [...(rawState?.completedEventIds || [])],
            unlockedPotionIds: [...(rawState?.unlockedPotionIds || fallbackUnlockedPotionIds)],
            gold: rawState?.gold ?? 100,
            fragments: StoryFragmentInventory.normalizeCounts(rawState?.fragments || {}),
            activeFragmentId: rawState?.activeFragmentId || null,
            activeFragmentIds: Array.isArray(rawState?.activeFragmentIds) ? [...rawState.activeFragmentIds] : [],
            activeBossBlessingId: rawState?.activeBossBlessingId || null,
            briefingFragmentIds: Array.isArray(rawState?.briefingFragmentIds) ? [...rawState.briefingFragmentIds] : [],
            bossBlessingChosenForBattle: Boolean(rawState?.bossBlessingChosenForBattle),
            confusedEnemyColor: rawState?.confusedEnemyColor || null,
            forcedBossTypeKey: rawState?.forcedBossTypeKey || null,
            bossSequenceIndex: Math.max(0, Math.floor(rawState?.bossSequenceIndex || 0)),
            currentPathIndex: this.getPathIndex(rawState?.currentPathIndex || 0)
        };
    }

    static serialize(storyState) {
        return {
            rows: storyState.rows.map((rowNodes) =>
                rowNodes.map((node) => ({
                    id: node.id,
                    row: node.row,
                    lane: node.lane,
                    type: node.type,
                    eventId: node.eventId || null,
                    nextIds: [...node.nextIds],
                    previousIds: [...node.previousIds]
                }))
            ),
            currentNodeIds: [...storyState.currentNodeIds],
            completedNodeIds: [...storyState.completedNodeIds],
            completedEventIds: [...(storyState.completedEventIds || [])],
            unlockedPotionIds: [...storyState.unlockedPotionIds],
            gold: storyState.gold ?? 100,
            fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {}),
            activeFragmentId: storyState.activeFragmentId || null,
            activeFragmentIds: [...(storyState.activeFragmentIds || [])],
            activeBossBlessingId: storyState.activeBossBlessingId || null,
            briefingFragmentIds: [...(storyState.briefingFragmentIds || [])],
            bossBlessingChosenForBattle: Boolean(storyState.bossBlessingChosenForBattle),
            confusedEnemyColor: storyState.confusedEnemyColor || null,
            forcedBossTypeKey: storyState.forcedBossTypeKey || null,
            bossSequenceIndex: Math.max(0, Math.floor(storyState.bossSequenceIndex || 0)),
            currentPathIndex: this.getPathIndex(storyState.currentPathIndex || 0)
        };
    }

    static getRandomNodeType(row, options = {}) {
        const pool = this.getWeightedTypePool(row, options);
        return Phaser.Utils.Array.GetRandom(pool);
    }

    static getWeightedTypePool(row, options = {}) {
        if (options.combatOnly) {
            const combatWeightedPools = [
                ['fight'],
                ['fight', 'fight', 'elite'],
                ['fight', 'fight', 'elite'],
                ['fight', 'elite', 'elite'],
                ['fight', 'elite', 'elite'],
                ['fight', 'elite', 'elite'],
                ['fight', 'elite', 'elite']
            ];
            return combatWeightedPools[row] || combatWeightedPools[combatWeightedPools.length - 1];
        }

        const weightedPools = [
            ['fight'],
            ['fight', 'fight', 'surprise', 'merchant', 'elite'],
            ['fight', 'fight', 'surprise', 'merchant', 'elite'],
            ['fight', 'fight', 'surprise', 'merchant', 'elite'],
            ['fight', 'surprise', 'merchant', 'elite', 'elite'],
            ['fight', 'surprise', 'merchant', 'elite', 'elite'],
            ['fight', 'merchant', 'elite', 'elite', 'surprise']
        ];
        return weightedPools[row] || weightedPools[weightedPools.length - 1];
    }

    static assignNodeTypes(nodesByRow) {
        nodesByRow.forEach((rowNodes, rowIndex) => {
            rowNodes.forEach((node) => {
                node.type = rowIndex === 0 ? 'fight' : this.getRandomNodeType(rowIndex, { combatOnly: true });
                node.eventId = null;
            });
        });

        const primaryPath = this.buildPrimaryPath(nodesByRow);
        const layout = Math.random() < 0.5
            ? {
                earlyMerchantRow: 1,
                lateMerchantRow: 5,
                surpriseRows: [2, 4, 6]
            }
            : {
                earlyMerchantRow: 2,
                lateMerchantRow: 6,
                surpriseRows: [1, 3, 5]
            };

        const primaryNodeByRow = {};
        primaryPath.forEach((node) => {
            primaryNodeByRow[node.row] = node;
        });

        const earlyMerchantNode = primaryNodeByRow[layout.earlyMerchantRow];
        const lateMerchantNode = primaryNodeByRow[layout.lateMerchantRow];
        const protectedNodeIds = new Set();
        if (earlyMerchantNode) {
            earlyMerchantNode.type = 'merchant';
            protectedNodeIds.add(earlyMerchantNode.id);
        }
        if (lateMerchantNode) {
            lateMerchantNode.type = 'merchant';
            protectedNodeIds.add(lateMerchantNode.id);
        }

        layout.surpriseRows.forEach((rowIndex) => {
            const surpriseNode = primaryNodeByRow[rowIndex];
            if (surpriseNode && surpriseNode.type !== 'merchant') {
                surpriseNode.type = 'surprise';
            }
        });

        for (let pass = 0; pass < 6; pass++) {
            this.ensureNoCombatOnlyPaths(nodesByRow);
            this.ensureMaxCombatStreak(nodesByRow, 2);
            this.ensureMaxUtilityStreak(nodesByRow, 2, protectedNodeIds);
        }
    }

    static buildPrimaryPath(nodesByRow) {
        const path = [nodesByRow[0][0]];

        for (let row = 1; row < nodesByRow.length; row++) {
            const previousNode = path[path.length - 1];
            const candidateNodes = nodesByRow[row].filter((node) => previousNode.nextIds.includes(node.id));
            const sortedCandidates = candidateNodes.slice().sort((left, right) => {
                const laneDistance = Math.abs(left.lane - previousNode.lane) - Math.abs(right.lane - previousNode.lane);
                if (laneDistance !== 0) {
                    return laneDistance;
                }

                return Math.abs(left.lane - 1) - Math.abs(right.lane - 1);
            });
            const preferredCandidates = sortedCandidates.slice(0, Math.min(2, sortedCandidates.length));
            const nextNode = Phaser.Utils.Array.GetRandom(preferredCandidates.length > 0 ? preferredCandidates : sortedCandidates);

            if (!nextNode) {
                break;
            }

            path.push(nextNode);
        }

        return path;
    }

    static ensureNoCombatOnlyPaths(nodesByRow) {
        const allPaths = this.getAllPaths(nodesByRow);
        allPaths.forEach((path) => {
            const hasUtilityNode = path.some((node) => node.type === 'merchant' || node.type === 'surprise');
            if (hasUtilityNode) {
                return;
            }

            const candidateRows = [4, 5, 3, 6, 2, 1];
            for (const rowIndex of candidateRows) {
                const candidateNode = path.find((node) => node.row === rowIndex);
                if (!candidateNode || candidateNode.type === 'merchant' || candidateNode.type === 'surprise') {
                    continue;
                }

                const preferredType = this.pickUtilityTypeForNode(nodesByRow, candidateNode);
                candidateNode.type = preferredType;
                return;
            }
        });
    }

    static ensureMaxCombatStreak(nodesByRow, maxStreak) {
        let attempts = 0;
        const maxAttempts = 24;

        while (attempts < maxAttempts) {
            attempts += 1;
            const allPaths = this.getAllPaths(nodesByRow);
            let updated = false;

            for (const path of allPaths) {
                const candidateNode = this.findCombatStreakBreakerCandidate(path, maxStreak);
                if (!candidateNode) {
                    continue;
                }

                candidateNode.type = this.pickUtilityTypeForNode(nodesByRow, candidateNode);
                updated = true;
                break;
            }

            if (!updated) {
                return;
            }
        }
    }

    static findCombatStreakBreakerCandidate(path, maxStreak) {
        let streak = 0;
        for (const node of path) {
            if (node.type === 'fight' || node.type === 'elite') {
                streak += 1;
            } else {
                streak = 0;
            }

            if (streak > maxStreak && node.row > 0) {
                return node;
            }
        }

        return null;
    }

    static ensureMaxUtilityStreak(nodesByRow, maxStreak, protectedNodeIds = new Set()) {
        let attempts = 0;
        const maxAttempts = 24;

        while (attempts < maxAttempts) {
            attempts += 1;
            const allPaths = this.getAllPaths(nodesByRow);
            let updated = false;

            for (const path of allPaths) {
                const candidateNode = this.findUtilityStreakBreakerCandidate(path, maxStreak, protectedNodeIds);
                if (!candidateNode) {
                    continue;
                }

                candidateNode.type = this.getRandomNodeType(candidateNode.row, { combatOnly: true });
                updated = true;
                break;
            }

            if (!updated) {
                return;
            }
        }
    }

    static findUtilityStreakBreakerCandidate(path, maxStreak, protectedNodeIds = new Set()) {
        let streak = 0;
        const streakNodes = [];
        for (let pathIndex = 0; pathIndex < path.length; pathIndex++) {
            const node = path[pathIndex];
            if (node.type === 'merchant' || node.type === 'surprise') {
                streak += 1;
                streakNodes.push({ node, pathIndex });
            } else {
                streak = 0;
                streakNodes.length = 0;
            }

            if (streak > maxStreak) {
                const orderedCandidates = streakNodes
                    .filter((entry) => entry.node.row > 0 && !protectedNodeIds.has(entry.node.id))
                    .map((entry, index) => ({
                        candidate: entry.node,
                        projectedCombatStreak: this.getProjectedCombatStreakIfCombat(path, entry.pathIndex),
                        distanceToCenter: Math.abs(index - ((streakNodes.length - 1) / 2))
                    }))
                    .sort((left, right) => {
                        if (left.projectedCombatStreak !== right.projectedCombatStreak) {
                            return left.projectedCombatStreak - right.projectedCombatStreak;
                        }
                        return left.distanceToCenter - right.distanceToCenter;
                    })
                    .map((entry) => entry.candidate);
                const reversibleNode = orderedCandidates[0];
                if (reversibleNode) {
                    return reversibleNode;
                }
            }
        }

        return null;
    }

    static getProjectedCombatStreakIfCombat(path, targetIndex) {
        let leftCount = 0;
        for (let index = targetIndex - 1; index >= 0; index--) {
            const candidate = path[index];
            if (candidate.type === 'fight' || candidate.type === 'elite') {
                leftCount += 1;
                continue;
            }
            break;
        }

        let rightCount = 0;
        for (let index = targetIndex + 1; index < path.length; index++) {
            const candidate = path[index];
            if (candidate.type === 'fight' || candidate.type === 'elite') {
                rightCount += 1;
                continue;
            }
            break;
        }

        return leftCount + 1 + rightCount;
    }

    static pickUtilityTypeForNode(nodesByRow, node) {
        const sameRowNodes = nodesByRow[node.row] || [];
        const previousRowNodes = nodesByRow[node.row - 1] || [];
        const nextRowNodes = nodesByRow[node.row + 1] || [];
        const previousHasMerchant = previousRowNodes.some((candidate) => candidate.type === 'merchant');
        const nextHasMerchant = nextRowNodes.some((candidate) => candidate.type === 'merchant');
        const sameRowHasMerchant = sameRowNodes.some((candidate) => candidate !== node && candidate.type === 'merchant');
        const previousHasSurprise = previousRowNodes.some((candidate) => candidate.type === 'surprise');
        const nextHasSurprise = nextRowNodes.some((candidate) => candidate.type === 'surprise');
        const sameRowHasSurprise = sameRowNodes.some((candidate) => candidate !== node && candidate.type === 'surprise');

        const canBeMerchant = !previousHasMerchant && !nextHasMerchant && !sameRowHasMerchant;
        const canBeSurprise = !previousHasSurprise && !nextHasSurprise && !sameRowHasSurprise;

        if (canBeSurprise) {
            return 'surprise';
        }
        if (canBeMerchant) {
            return 'merchant';
        }
        return 'surprise';
    }

    static getAllPaths(nodesByRow) {
        const nodeById = {};
        nodesByRow.forEach((rowNodes) => {
            rowNodes.forEach((node) => {
                nodeById[node.id] = node;
            });
        });

        const startNode = nodesByRow[0]?.[0];
        return startNode ? this.collectTerminalPaths(startNode, nodeById) : [];
    }

    static collectTerminalPaths(startNode, nodeById) {
        const paths = [];
        const visit = (node, currentPath) => {
            const nextPath = [...currentPath, node];
            const nextNodes = (node.nextIds || [])
                .map((nextId) => nodeById[nextId])
                .filter(Boolean);

            if (nextNodes.length === 0) {
                paths.push(nextPath);
                return;
            }

            nextNodes.forEach((nextNode) => {
                visit(nextNode, nextPath);
            });
        };

        visit(startNode, []);
        return paths;
    }
}
