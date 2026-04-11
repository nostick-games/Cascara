class ArcadeKingdomCatalog {
    static getAll() {
        return [
            {
                id: 'VERDOMBRE',
                titleKey: 'kingdom.verdombre',
                battleBackgroundKey: 'forest-fight-bg',
                placeholderLabel: 'VE',
                previewTextureKey: 'arcade-kingdom-verdombre'
            },
            {
                id: 'VULKARN',
                titleKey: 'astrolabe.item.vulkarn.title',
                battleBackgroundKey: 'cave-fight-bg',
                placeholderLabel: 'VU',
                previewTextureKey: 'arcade-kingdom-vulkarn',
                unlockPurchaseId: 'ARCADE_VULKARN'
            },
            {
                id: 'DRAZHUL',
                titleKey: 'astrolabe.item.drazhul.title',
                battleBackgroundKey: 'dungeon-fight-bg',
                placeholderLabel: 'DR',
                previewTextureKey: 'arcade-kingdom-drazhul',
                unlockPurchaseId: 'ARCADE_DRAZHUL'
            }
        ];
    }

    static getUnlockedForArcade() {
        return this.getAll().filter((kingdom) =>
            !kingdom.unlockPurchaseId || MetaProgression.hasAstrolabePurchase(kingdom.unlockPurchaseId)
        );
    }

    static getById(kingdomId) {
        return this.getAll().find((kingdom) => kingdom.id === kingdomId) || this.getAll()[0];
    }
}
