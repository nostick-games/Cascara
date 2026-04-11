class StoryFragmentCatalog {
    static getAll() {
        return [
            {
                id: 'INITIATIVE',
                textureKey: 'story-fragment-initiative',
                price: 45,
                titleKey: 'fragment.initiative.title',
                descKey: 'fragment.initiative.desc'
            },
            {
                id: 'AMBITION',
                textureKey: 'story-fragment-ambition',
                price: 55,
                titleKey: 'fragment.ambition.title',
                descKey: 'fragment.ambition.desc'
            },
            {
                id: 'ALCHEMIST',
                textureKey: 'story-fragment-alchemist',
                price: 60,
                titleKey: 'fragment.alchemist.title',
                descKey: 'fragment.alchemist.desc'
            },
            {
                id: 'FIRE',
                textureKey: 'story-fragment-fire',
                price: 50,
                titleKey: 'fragment.fire.title',
                descKey: 'fragment.fire.desc'
            },
            {
                id: 'RUNE',
                textureKey: 'story-fragment-rune',
                price: 65,
                titleKey: 'fragment.rune.title',
                descKey: 'fragment.rune.desc'
            },
            {
                id: 'GUARDIAN',
                textureKey: 'story-fragment-guardian',
                price: 60,
                titleKey: 'fragment.guardian.title',
                descKey: 'fragment.guardian.desc'
            },
            {
                id: 'LOST',
                textureKey: 'story-fragment-lost',
                price: 75,
                titleKey: 'fragment.lost.title',
                descKey: 'fragment.lost.desc'
            },
            {
                id: 'PHOENIX',
                textureKey: 'story-fragment-phoenix',
                price: 110,
                titleKey: 'fragment.phoenix.title',
                descKey: 'fragment.phoenix.desc'
            }
        ];
    }

    static getById(fragmentId) {
        return this.getAll().find((fragment) => fragment.id === fragmentId) || null;
    }

    static getRandomSelection(count = 3, excludedIds = []) {
        const excludedIdSet = new Set(excludedIds);
        const candidates = this.getAll().filter((fragment) => !excludedIdSet.has(fragment.id));
        return Phaser.Utils.Array.Shuffle(candidates).slice(0, Math.min(count, candidates.length));
    }
}
