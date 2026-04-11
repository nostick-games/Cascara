class BossBlessingCatalog {
    static getAll() {
        return [
            {
                id: 'DISABLE_BOSS_CHAOS',
                titleKey: 'boss_blessing.disable_boss_chaos.title',
                descKey: 'boss_blessing.disable_boss_chaos.desc',
                textureKey: 'boss-blessing-shield'
            },
            {
                id: 'PLAYER_FAST_CHAOS',
                titleKey: 'boss_blessing.player_fast_chaos.title',
                descKey: 'boss_blessing.player_fast_chaos.desc',
                textureKey: 'boss-blessing-shoe'
            },
            {
                id: 'PLAYER_BOMB_ONLY',
                titleKey: 'boss_blessing.player_bomb_only.title',
                descKey: 'boss_blessing.player_bomb_only.desc',
                textureKey: 'bonus-bomb-icon'
            }
        ];
    }

    static getById(id) {
        return this.getAll().find((blessing) => blessing.id === id) || null;
    }
}
