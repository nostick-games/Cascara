try {
    globalThis.CASCARA_SHOW_CHEATS = localStorage.getItem('cascara_show_cheats') === 'true';
} catch (error) {
    globalThis.CASCARA_SHOW_CHEATS = false;
}

function getViewportMetrics() {
    const visualViewport = window.visualViewport;
    if (visualViewport) {
        return {
            width: Math.round(visualViewport.width),
            height: Math.round(visualViewport.height)
        };
    }

    return {
        width: Math.round(window.innerWidth),
        height: Math.round(window.innerHeight)
    };
}

const initialViewport = getViewportMetrics();

// Configuration du jeu
const config = {
    type: Phaser.AUTO,
    width: initialViewport.width,
    height: initialViewport.height,
    backgroundColor: '#B47C43',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        WelcomeScene,
        MainMenuScene,
        AstrolabeScene,
        StrategoScene,
        FighterScene,
        BossRushScene,
        TileAnimationTestScene,
        TutorialScene,
        StoryIntroScene,
        StoryModePlaceholderScene,
        StoryMerchantScene,
        StoryEventScene,
        HowToPlayScene,
        TrophiesScene,
        IntroScene,
        BriefingScene,
        GameScene
    ],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

// Initialisation du jeu
const game = new Phaser.Game(config);

function applyViewportResize() {
    const viewport = getViewportMetrics();
    game.config.width = viewport.width;
    game.config.height = viewport.height;
    game.scale.resize(viewport.width, viewport.height);
}

window.addEventListener('resize', applyViewportResize);
window.addEventListener('orientationchange', applyViewportResize);
window.visualViewport?.addEventListener('resize', applyViewportResize);
window.visualViewport?.addEventListener('scroll', applyViewportResize);
