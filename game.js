try {
    globalThis.CASCARA_SHOW_CHEATS = localStorage.getItem('cascara_show_cheats') === 'true';
} catch (error) {
    globalThis.CASCARA_SHOW_CHEATS = false;
}

// Configuration du jeu
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
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
