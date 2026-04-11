class EnemyDefinitions {
    static getAll() {
        return {
            GOBLIN: {
                key: 'GOBLIN',
                label: 'Gobelin',
                style: 'OPPORTUNIST',
                behaviorKey: 'OPPORTUNIST',
                idleTexture: 'enemy-goblin-idle',
                briefingIdleTexture: 'enemy-goblin-briefing-idle',
                deathTexture: 'enemy-goblin-death',
                idleFrames: 4,
                deathFrames: 6,
                briefingIdleAssetPath: 'assets/images/enemies/goblin_idle_face.png'
            },
            SKULL: {
                key: 'SKULL',
                label: 'Squelette',
                style: 'BUILDER',
                behaviorKey: 'BUILDER',
                idleTexture: 'enemy-skull-idle',
                briefingIdleTexture: 'enemy-skull-briefing-idle',
                deathTexture: 'enemy-skull-death',
                idleFrames: 4,
                deathFrames: 10,
                briefingIdleAssetPath: 'assets/images/enemies/skull_idle_face.png'
            },
            WIZARD: {
                key: 'WIZARD',
                label: 'Sorcier',
                style: 'PERTURBATOR',
                behaviorKey: 'PERTURBATOR',
                idleTexture: 'enemy-wizard-idle',
                briefingIdleTexture: 'enemy-wizard-briefing-idle',
                deathTexture: 'enemy-wizard-death',
                idleFrames: 4,
                deathFrames: 9,
                briefingIdleAssetPath: 'assets/images/enemies/wizard_idle_face.png'
            },
            GOLEM: {
                key: 'GOLEM',
                label: 'Golem',
                style: 'AGGRESSIVE',
                behaviorKey: 'AGGRESSIVE',
                idleTexture: 'enemy-golem-idle',
                briefingIdleTexture: 'enemy-golem-briefing-idle',
                deathTexture: 'enemy-golem-death',
                idleFrames: 4,
                deathFrames: 8,
                frameWidth: 128,
                frameHeight: 128,
                idleAssetPath: 'assets/images/enemies/golem_idle.png',
                briefingIdleAssetPath: 'assets/images/enemies/golem_idle_face.png',
                deathAssetPath: 'assets/images/enemies/golem_death.png',
                isBoss: true
            },
            OGRE: {
                key: 'OGRE',
                label: 'Ogre',
                style: 'BERSERK',
                behaviorKey: 'BERSERK',
                idleTexture: 'enemy-ogre-idle',
                briefingIdleTexture: 'enemy-ogre-briefing-idle',
                deathTexture: 'enemy-ogre-death',
                idleFrames: 4,
                deathFrames: 8,
                frameWidth: 64,
                frameHeight: 64,
                idleAssetPath: 'assets/images/enemies/ogre_idle.png',
                briefingIdleAssetPath: 'assets/images/enemies/ogre_idle_face.png',
                deathAssetPath: 'assets/images/enemies/ogre_death.png',
                isBoss: true
            },
            SALAMANDER: {
                key: 'SALAMANDER',
                label: 'Salamandre',
                style: 'INCENDIARY',
                behaviorKey: 'INCENDIARY',
                idleTexture: 'enemy-salamander-idle',
                briefingIdleTexture: 'enemy-salamander-briefing-idle',
                deathTexture: 'enemy-salamander-death',
                idleFrames: 4,
                deathFrames: 7,
                frameWidth: 64,
                frameHeight: 64,
                idleAssetPath: 'assets/images/enemies/salamander_idle.png?v=20260329',
                briefingIdleAssetPath: 'assets/images/enemies/salamander_idle_face.png',
                deathAssetPath: 'assets/images/enemies/salamander_death.png?v=20260329',
                isBoss: true
            }
        };
    }

    static get(typeKey) {
        return EnemyDefinitions.getAll()[typeKey];
    }

    static getRandomTypeKeys(count) {
        const typeKeys = Object.values(EnemyDefinitions.getAll())
            .filter((enemy) => !enemy.isBoss)
            .map((enemy) => enemy.key);
        const selected = [];

        for (let index = 0; index < count; index++) {
            selected.push(typeKeys[Math.floor(Math.random() * typeKeys.length)]);
        }

        return selected;
    }

    static createAssignmentsFromTypeKeys(playerOrder, typeKeys = []) {
        const assignments = {};
        const aiColors = playerOrder.filter((color) => color !== 'ROUGE');

        assignments.ROUGE = null;
        aiColors.forEach((color, index) => {
            assignments[color] = EnemyDefinitions.get(typeKeys[index]);
        });

        return assignments;
    }

    static createAssignments(playerOrder) {
        const aiColors = playerOrder.filter((color) => color !== 'ROUGE');
        const randomTypes = EnemyDefinitions.getRandomTypeKeys(aiColors.length);
        return EnemyDefinitions.createAssignmentsFromTypeKeys(playerOrder, randomTypes);
    }
}
