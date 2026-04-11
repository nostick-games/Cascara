class StoryEventRegistry {
    static getAll() {
        return [
            StoryEventDirtySword.getDefinition(),
            StoryEventAnnoyingMerchant.getDefinition(),
            StoryEventGnomeGambler.getDefinition(),
            StoryEventWetBeaverInn.getDefinition(),
            StoryEventStoneCircle.getDefinition(),
            StoryEventGoblinDie.getDefinition()
        ];
    }

    static getById(eventId) {
        return this.getAll().find((event) => event.id === eventId) || null;
    }

    static getRandomEvent(excludedIds = []) {
        const excludedIdSet = new Set(excludedIds || []);
        const allEvents = this.getAll();
        const availableEvents = allEvents.filter((event) => !excludedIdSet.has(event.id));
        const pool = availableEvents.length > 0 ? availableEvents : allEvents;
        return pool.length > 0 ? Phaser.Utils.Array.GetRandom(pool) : null;
    }

    static resolve(scene, eventId, choiceId, storyState) {
        if (eventId === 'dirty_sword') {
            return StoryEventDirtySword.resolve(scene, choiceId, storyState);
        }
        if (eventId === 'annoying_merchant') {
            return StoryEventAnnoyingMerchant.resolve(scene, choiceId, storyState);
        }
        if (eventId === 'gnome_gambler') {
            return StoryEventGnomeGambler.resolve(scene, choiceId, storyState);
        }
        if (eventId === 'wet_beaver_inn') {
            return StoryEventWetBeaverInn.resolve(scene, choiceId, storyState);
        }
        if (eventId === 'stone_circle') {
            return StoryEventStoneCircle.resolve(scene, choiceId, storyState);
        }
        if (eventId === 'goblin_die') {
            return StoryEventGoblinDie.resolve(scene, choiceId, storyState);
        }

        return {
            gold: storyState.gold || 0,
            fragments: StoryFragmentInventory.normalizeCounts(storyState.fragments || {}),
            unlockedPotionIds: [...(storyState.unlockedPotionIds || [])],
            resultText: ''
        };
    }
}
