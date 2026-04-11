class StoryFragmentInventory {
    static normalizeCounts(rawCounts = {}) {
        const normalized = {};
        Object.entries(rawCounts || {}).forEach(([fragmentId, count]) => {
            const safeCount = Math.max(0, Number.isFinite(count) ? Math.floor(count) : 0);
            if (safeCount > 0 && StoryFragmentCatalog.getById(fragmentId)) {
                normalized[fragmentId] = safeCount;
            }
        });
        return normalized;
    }

    static mergeCounts(baseCounts = {}, addedCounts = {}) {
        const merged = this.normalizeCounts(baseCounts);
        Object.entries(this.normalizeCounts(addedCounts)).forEach(([fragmentId, count]) => {
            merged[fragmentId] = (merged[fragmentId] || 0) + count;
        });
        return merged;
    }

    static incrementCount(baseCounts = {}, fragmentId, delta = 1) {
        return this.mergeCounts(baseCounts, { [fragmentId]: delta });
    }

    static decrementCount(baseCounts = {}, fragmentId, delta = 1) {
        const normalized = this.normalizeCounts(baseCounts);
        if (!fragmentId || !normalized[fragmentId]) {
            return normalized;
        }

        const nextCount = Math.max(0, normalized[fragmentId] - Math.max(1, delta));
        if (nextCount > 0) {
            normalized[fragmentId] = nextCount;
        } else {
            delete normalized[fragmentId];
        }

        return normalized;
    }

    static getCount(storyState, fragmentId) {
        return this.normalizeCounts(storyState?.fragments || {})[fragmentId] || 0;
    }

    static getOwnedIds(storyState) {
        return Object.keys(this.normalizeCounts(storyState?.fragments || {}));
    }

    static getOwnedFragments(storyState, preferredIds = null, maxCount = Infinity) {
        const counts = this.normalizeCounts(storyState?.fragments || {});
        const ownedIds = Object.keys(counts);
        const orderedIds = [];

        if (Array.isArray(preferredIds) && preferredIds.length > 0) {
            preferredIds.forEach((fragmentId) => {
                if (!orderedIds.includes(fragmentId)) {
                    orderedIds.push(fragmentId);
                }
            });
        }

        ownedIds.forEach((fragmentId) => {
            if (!orderedIds.includes(fragmentId)) {
                orderedIds.push(fragmentId);
            }
        });

        return orderedIds
            .map((fragmentId) => StoryFragmentCatalog.getById(fragmentId))
            .filter((fragment) => fragment && counts[fragment.id] > 0)
            .slice(0, Math.max(0, maxCount));
    }
}
