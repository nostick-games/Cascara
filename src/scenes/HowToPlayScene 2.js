class HowToPlayScene extends StoryModePlaceholderScene {
    constructor() {
        super({ key: 'HowToPlayScene' });
    }

    create() {
        this.createPlaceholderPage('menu.how_to_play', 'menu.how_to_play_placeholder');
    }
}
