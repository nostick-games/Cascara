class AstrolabeCatalog {
    static getSections() {
        return [
            {
                id: 'cascara_crystal',
                titleKey: 'astrolabe.section.cascara',
                items: [
                    {
                        id: 'ASTRAL_FAVOR',
                        titleKey: 'astrolabe.item.astral_favor.title',
                        descKey: 'astrolabe.item.astral_favor.desc',
                        price: 60,
                        placeholderLabel: 'FA',
                        previewTextureKey: 'astrolabe-astral-favor'
                    },
                    {
                        id: 'LUCKY_STAR',
                        titleKey: 'astrolabe.item.lucky_star.title',
                        descKey: 'astrolabe.item.lucky_star.desc',
                        price: 75,
                        placeholderLabel: 'BE',
                        previewTextureKey: 'astrolabe-lucky-star'
                    }
                ]
            },
            {
                id: 'arcade_mode',
                titleKey: 'astrolabe.section.arcade',
                items: [
                    {
                        id: 'ARCADE_VULKARN',
                        titleKey: 'astrolabe.item.vulkarn.title',
                        descKey: 'astrolabe.item.vulkarn.desc',
                        price: 30,
                        placeholderLabel: 'VU',
                        previewTextureKey: 'arcade-kingdom-vulkarn'
                    },
                    {
                        id: 'ARCADE_DRAZHUL',
                        titleKey: 'astrolabe.item.drazhul.title',
                        descKey: 'astrolabe.item.drazhul.desc',
                        price: 60,
                        placeholderLabel: 'DR',
                        previewTextureKey: 'arcade-kingdom-drazhul'
                    }
                ]
            },
            {
                id: 'minigames',
                titleKey: 'astrolabe.section.minigames',
                items: [
                    {
                        id: 'MINIGAME_STRATEGO',
                        titleKey: 'astrolabe.item.stratego.title',
                        descKey: 'astrolabe.item.stratego.desc',
                        price: 120,
                        placeholderLabel: 'ST',
                        previewTextureKey: 'astrolabe-minigame-stratego',
                        previewAnimationKey: 'astrolabe-minigame-stratego-idle'
                    },
                    {
                        id: 'MINIGAME_FIGHTER',
                        titleKey: 'astrolabe.item.fighter.title',
                        descKey: 'astrolabe.item.fighter.desc',
                        price: 120,
                        placeholderLabel: 'FI',
                        previewTextureKey: 'astrolabe-minigame-fighter',
                        previewAnimationKey: 'astrolabe-minigame-fighter-idle'
                    },
                    {
                        id: 'MINIGAME_BOSS_RUSH',
                        titleKey: 'astrolabe.item.boss_rush.title',
                        descKey: 'astrolabe.item.boss_rush.desc',
                        price: 180,
                        placeholderLabel: 'BR',
                        previewTextureKey: 'astrolabe-minigame-boss-rush',
                        previewAnimationKey: 'astrolabe-minigame-boss-rush-idle'
                    }
                ]
            }
        ];
    }
}
