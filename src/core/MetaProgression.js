class MetaProgression {
    static STORAGE_KEY = 'cascara_meta_progression_v1';
    static WELCOME_STARS = 25;

    static getDefaultState() {
        return {
            stars: 0,
            welcomeStarsGranted: false,
            astralFavorMerchantIntroSeen: false,
            luckyStarEventIntroSeen: false,
            astrolabePurchases: {},
            strategoSolvedPatterns: {},
            fightDefeatedEnemyKeys: {},
            fightBossUnlockMessageSeen: {}
        };
    }

    static load() {
        try {
            const raw = window.localStorage.getItem(MetaProgression.STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return {
                ...MetaProgression.getDefaultState(),
                ...(parsed && typeof parsed === 'object' ? parsed : {})
            };
        } catch (_error) {
            return MetaProgression.getDefaultState();
        }
    }

    static save(state = {}) {
        const nextState = {
            ...MetaProgression.getDefaultState(),
            ...(state && typeof state === 'object' ? state : {})
        };

        try {
            window.localStorage.setItem(MetaProgression.STORAGE_KEY, JSON.stringify(nextState));
        } catch (_error) {
            // Ignore storage failures gracefully.
        }

        return nextState;
    }

    static ensureInitialized() {
        const state = MetaProgression.load();
        state.astrolabePurchases = state.astrolabePurchases && typeof state.astrolabePurchases === 'object'
            ? state.astrolabePurchases
            : {};
        state.fightDefeatedEnemyKeys = state.fightDefeatedEnemyKeys && typeof state.fightDefeatedEnemyKeys === 'object'
            ? state.fightDefeatedEnemyKeys
            : {};
        state.fightBossUnlockMessageSeen = state.fightBossUnlockMessageSeen && typeof state.fightBossUnlockMessageSeen === 'object'
            ? state.fightBossUnlockMessageSeen
            : {};
        return MetaProgression.save(state);
    }

    static getStars() {
        return Math.max(0, Math.floor(MetaProgression.load().stars || 0));
    }

    static setStars(value) {
        const nextValue = Math.max(0, Math.floor(value || 0));
        const state = MetaProgression.load();
        state.stars = nextValue;
        MetaProgression.save(state);
        return nextValue;
    }

    static addStars(amount) {
        const safeAmount = Math.floor(amount || 0);
        return MetaProgression.setStars(MetaProgression.getStars() + safeAmount);
    }

    static shouldShowAstrolabeWelcome() {
        return !Boolean(MetaProgression.load().welcomeStarsGranted);
    }

    static grantAstrolabeWelcomeStars() {
        const state = MetaProgression.ensureInitialized();
        if (state.welcomeStarsGranted) {
            return Math.max(0, Math.floor(state.stars || 0));
        }

        state.stars = Math.max(0, Math.floor(state.stars || 0)) + MetaProgression.WELCOME_STARS;
        state.welcomeStarsGranted = true;
        MetaProgression.save(state);
        return state.stars;
    }

    static grantCheatStars() {
        const state = MetaProgression.ensureInitialized();
        state.stars = 999;
        state.welcomeStarsGranted = true;
        MetaProgression.save(state);
        return state.stars;
    }

    static shouldShowAstralFavorMerchantIntro() {
        const state = MetaProgression.ensureInitialized();
        return MetaProgression.hasAstrolabePurchase('ASTRAL_FAVOR')
            && !Boolean(state.astralFavorMerchantIntroSeen);
    }

    static markAstralFavorMerchantIntroSeen() {
        const state = MetaProgression.ensureInitialized();
        if (state.astralFavorMerchantIntroSeen) {
            return;
        }
        state.astralFavorMerchantIntroSeen = true;
        MetaProgression.save(state);
    }

    static shouldShowLuckyStarEventIntro() {
        const state = MetaProgression.ensureInitialized();
        return MetaProgression.hasAstrolabePurchase('LUCKY_STAR')
            && !Boolean(state.luckyStarEventIntroSeen);
    }

    static markLuckyStarEventIntroSeen() {
        const state = MetaProgression.ensureInitialized();
        if (state.luckyStarEventIntroSeen) {
            return;
        }
        state.luckyStarEventIntroSeen = true;
        MetaProgression.save(state);
    }

    static getAstrolabePurchases() {
        const purchases = MetaProgression.load().astrolabePurchases || {};
        return purchases && typeof purchases === 'object' ? { ...purchases } : {};
    }

    static getStrategoSolvedPatterns() {
        const solved = MetaProgression.load().strategoSolvedPatterns || {};
        return solved && typeof solved === 'object' ? { ...solved } : {};
    }

    static hasSolvedStrategoPattern(boardSize, patternId) {
        const key = `${boardSize}:${patternId}`;
        return Boolean(MetaProgression.getStrategoSolvedPatterns()[key]);
    }

    static getStrategoSolvedMoveCount(boardSize, patternId) {
        const entry = MetaProgression.getStrategoSolvedPatterns()[`${boardSize}:${patternId}`];
        if (entry && typeof entry === 'object' && Number.isFinite(entry.moveCount)) {
            return Math.max(0, Math.floor(entry.moveCount));
        }
        return null;
    }

    static markStrategoPatternSolved(boardSize, patternId) {
        MetaProgression.markStrategoPatternSolvedWithMoveCount(boardSize, patternId, null);
    }

    static markStrategoPatternSolvedWithMoveCount(boardSize, patternId, moveCount = null) {
        if (!boardSize || !patternId) {
            return;
        }

        const state = MetaProgression.ensureInitialized();
        const key = `${boardSize}:${patternId}`;
        const previousEntry = state.strategoSolvedPatterns?.[key];
        const previousMoveCount =
            previousEntry && typeof previousEntry === 'object' && Number.isFinite(previousEntry.moveCount)
                ? Math.max(0, Math.floor(previousEntry.moveCount))
                : null;
        const normalizedMoveCount = Number.isFinite(moveCount) ? Math.max(0, Math.floor(moveCount)) : null;
        const bestMoveCount =
            previousMoveCount === null
                ? normalizedMoveCount
                : (normalizedMoveCount === null ? previousMoveCount : Math.min(previousMoveCount, normalizedMoveCount));
        state.strategoSolvedPatterns = {
            ...(state.strategoSolvedPatterns || {}),
            [key]: {
                solved: true,
                moveCount: bestMoveCount
            }
        };
        MetaProgression.save(state);
    }

    static hasAstrolabePurchase(itemId) {
        return Boolean(MetaProgression.getAstrolabePurchases()[itemId]);
    }

    static getFightDefeatedEnemyKeys() {
        const defeated = MetaProgression.load().fightDefeatedEnemyKeys || {};
        return defeated && typeof defeated === 'object' ? { ...defeated } : {};
    }

    static hasDefeatedFightEnemy(enemyKey) {
        if (!enemyKey) {
            return false;
        }

        return Boolean(MetaProgression.getFightDefeatedEnemyKeys()[enemyKey]);
    }

    static markFightEnemyDefeated(enemyKey) {
        if (!enemyKey) {
            return;
        }

        const state = MetaProgression.ensureInitialized();
        state.fightDefeatedEnemyKeys = {
            ...(state.fightDefeatedEnemyKeys || {}),
            [enemyKey]: true
        };
        MetaProgression.save(state);
    }

    static hasSeenFightBossUnlockMessage(enemyKey) {
        if (!enemyKey) {
            return false;
        }

        const seen = MetaProgression.load().fightBossUnlockMessageSeen || {};
        return Boolean(seen[enemyKey]);
    }

    static markFightBossUnlockMessageSeen(enemyKey) {
        if (!enemyKey) {
            return;
        }

        const state = MetaProgression.ensureInitialized();
        state.fightBossUnlockMessageSeen = {
            ...(state.fightBossUnlockMessageSeen || {}),
            [enemyKey]: true
        };
        MetaProgression.save(state);
    }

    static purchaseAstrolabeItem(itemId, price) {
        if (!itemId || MetaProgression.hasAstrolabePurchase(itemId)) {
            return false;
        }

        const safePrice = Math.max(0, Math.floor(price || 0));
        const state = MetaProgression.ensureInitialized();
        const currentStars = Math.max(0, Math.floor(state.stars || 0));
        if (currentStars < safePrice) {
            return false;
        }

        state.stars = currentStars - safePrice;
        state.astrolabePurchases = {
            ...(state.astrolabePurchases || {}),
            [itemId]: true
        };
        MetaProgression.save(state);
        return true;
    }
}
