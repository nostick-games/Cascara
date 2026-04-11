class StoryEventState {
    static rebuild(rawState) {
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
            unlockedPotionIds: [...(rawState?.unlockedPotionIds || ['ROSE', 'ORANGE'])],
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
            currentPathIndex: StoryMapState.getPathIndex(rawState?.currentPathIndex || 0)
        };
    }

    static buildAdvanced(storyState, selectedNodeId, completedEventId = null) {
        const rows = storyState.rows.map((rowNodes) =>
            rowNodes.map((node) => ({
                    id: node.id,
                    row: node.row,
                    lane: node.lane,
                    type: node.type,
                    eventId: node.eventId || null,
                    nextIds: [...node.nextIds],
                    previousIds: [...node.previousIds]
                }))
        );
        const nodeById = {};
        rows.forEach((rowNodes) => {
            rowNodes.forEach((node) => {
                nodeById[node.id] = node;
            });
        });
        const selectedNode = nodeById[selectedNodeId];
        const completedNodeIds = Array.from(new Set([
            ...(storyState.completedNodeIds || []),
            ...(selectedNodeId ? [selectedNodeId] : [])
        ]));
        const completedEventIds = Array.from(new Set([
            ...(storyState.completedEventIds || []),
            ...(completedEventId ? [completedEventId] : [])
        ]));

        return {
            rows,
            currentNodeIds: selectedNode ? [...selectedNode.nextIds] : [...(storyState.currentNodeIds || [])],
            completedNodeIds,
            completedEventIds,
            unlockedPotionIds: [...(storyState.unlockedPotionIds || [])],
            gold: storyState.gold ?? 100,
            fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {}),
            activeFragmentId: storyState.activeFragmentId || null,
            activeFragmentIds: [...(storyState.activeFragmentIds || [])],
            activeBossBlessingId: storyState.activeBossBlessingId || null,
            briefingFragmentIds: [...(storyState.briefingFragmentIds || [])],
            bossBlessingChosenForBattle: Boolean(storyState.bossBlessingChosenForBattle),
            confusedEnemyColor: null,
            forcedBossTypeKey: storyState.forcedBossTypeKey || null,
            bossSequenceIndex: Math.max(0, Math.floor(storyState.bossSequenceIndex || 0)),
            currentPathIndex: StoryMapState.getPathIndex(storyState.currentPathIndex || 0)
        };
    }
}
