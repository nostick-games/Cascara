class ProgressPotionCatalog {
    static getDefinitions() {
        return [
            {
                id: 'ROSE',
                textureKey: 'progress-potion-rose',
                notchTextureKey: 'progress-notch-rose',
                unlockThreshold: 50,
                power: 2
            },
            {
                id: 'MENTHE',
                textureKey: 'progress-potion-menthe',
                notchTextureKey: 'progress-notch-menthe',
                unlockThreshold: 65,
                power: 3
            },
            {
                id: 'ORANGE',
                textureKey: 'progress-potion-orange',
                notchTextureKey: 'progress-notch-orange',
                unlockThreshold: 80,
                power: 2
            },
            {
                id: 'MARRON',
                textureKey: 'progress-potion-marron',
                notchTextureKey: 'progress-notch-marron',
                unlockThreshold: 90,
                power: 1
            },
            {
                id: 'BLANCHE',
                textureKey: 'progress-potion-blanche',
                notchTextureKey: 'progress-notch-blanche',
                unlockThreshold: 90,
                power: 2
            },
            {
                id: 'CYAN',
                textureKey: 'progress-potion-cyan',
                notchTextureKey: 'progress-notch-cyan',
                unlockThreshold: 90,
                power: 3
            }
        ];
    }

    static selectFromPool(allowedPotionIds = null) {
        const definitions = this.getDefinitions();
        const filteredDefinitions = Array.isArray(allowedPotionIds) && allowedPotionIds.length > 0
            ? definitions.filter((potion) => allowedPotionIds.includes(potion.id))
            : definitions;
        const availablePotions = Phaser.Utils.Array.Shuffle(filteredDefinitions.slice()).slice(0, 3);
        const thresholds = [50, 65, 80];

        return availablePotions
            .sort((left, right) => left.power - right.power)
            .map((potion, index) => ({
                ...potion,
                unlockThreshold: thresholds[index],
                active: false,
                consumed: false,
                cooldownTurnsRemaining: 0
            }));
    }
}
