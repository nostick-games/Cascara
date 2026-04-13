class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' });
        this.gridSize = 8;
        this.grid = [];
        this.cellSprites = [];
        this.currentTarget = null;
        this.currentTargetSet = null;
        this.currentStep = null;
        this.isBusy = false;
        this.objectiveProgress = 0;
        this.displayedObjectiveProgress = 0;
        this.chaosCharge = 0;
        this.displayedChaosCharge = 0;
        this.activeChaosBonus = null;
        this.orangePotionArmed = false;
        this.orangePotionActive = false;
        this.modalOpen = false;
        this.activeModalHandle = null;
        this.modalBackdrop = null;
        this.pendingPressedCellKey = null;
    }

    init(data) {
        if (data?.language) {
            TranslationManager.setLanguage(data.language);
        }
        this.returnSceneKey = data?.returnSceneKey || 'MainMenuScene';
        this.returnSceneData = data?.returnSceneData || { language: TranslationManager.getLanguage() };
    }

    preload() {
        this.load.spritesheet('hero-idle-face', 'assets/images/hero/idle_face.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.image('tutorial-fight-bg', 'assets/images/maps/forest_fight.png');
        this.load.image('tutorial-roof', 'assets/images/UI/decor_roof.png');
        this.load.image('tutorial-books', 'assets/images/UI/decor_books.png');
        this.load.image('tutorial-skull', 'assets/images/UI/decor_skull.png');
        this.load.image('ui-goal-gauge-empty', 'assets/images/UI/jauge_vide.png');
        this.load.image('ui-goal-gauge-full', 'assets/images/UI/jauge_pleine.png');
        this.load.image('tutorial-potion-orange', 'assets/images/bonus/potion_orange.png');
        this.load.image('tutorial-potion-menthe', 'assets/images/bonus/potion_menthe.png');
        this.load.image('tutorial-potion-marron', 'assets/images/bonus/potion_marron.png');
        this.load.image('tutorial-potion-shadow', 'assets/images/bonus/potion_shadow.png');
        this.load.image('tutorial-bonus-place-bomb', 'assets/images/bonus/bomb_icon.png');
        this.load.image('tutorial-bonus-bomb', 'assets/images/bonus/explosion_icon.png');
        this.load.image('tutorial-bonus-ice', 'assets/images/bonus/ice_icon.png');
        this.load.image('tutorial-bonus-swamp', 'assets/images/bonus/swamp_icon.png');
        this.load.audio('tile-clap', 'assets/sounds/clap.mp3');

        this.load.image('tutorial-tile-red-idle', 'assets/images/tiles/tile_red.png');
        this.load.image('tutorial-tile-grey-idle', 'assets/images/tiles/tile_grey.png');
        this.load.spritesheet('tutorial-tile-red-off', 'assets/images/tiles/tile_red_off.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tutorial-tile-red-on', 'assets/images/tiles/tile_red_on.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tutorial-tile-grey-off', 'assets/images/tiles/tile_grey_off.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.load.spritesheet('tutorial-tile-grey-on', 'assets/images/tiles/tile_grey_on.png', {
            frameWidth: 13,
            frameHeight: 13
        });

        this.load.image('ui-button-left-off', 'assets/images/UI/bouton_bord_gauche_off.png');
        this.load.image('ui-button-fill-off', 'assets/images/UI/bouton_fond_off.png');
        this.load.image('ui-button-right-off', 'assets/images/UI/bouton_bord_droite_off.png');
        this.load.image('ui-button-left-on', 'assets/images/UI/bouton_bord_gauche_on.png');
        this.load.image('ui-button-fill-on', 'assets/images/UI/bouton_fond_on.png');
        this.load.image('ui-button-right-on', 'assets/images/UI/bouton_bord_droite_on.png');
    }

    create() {
        this.viewportWidth = this.scale.width || 800;
        this.viewportHeight = this.scale.height || 700;
        this.isNarrowViewport = this.viewportWidth < 500;
        this.centerX = this.viewportWidth / 2;

        this.cameras.main.setBackgroundColor('#AF7E4C');
        this.ensureAnimations();
        this.buildInitialGrid();
        this.buildLayout();
        this.renderBoard();
        this.renderObjectiveGauge(0);
        this.renderChaosGauge(0);
        this.renderPotions();
        this.animateBoardReveal(() => {
            this.showModal(
                TranslationManager.t('tutorial.modal_intro'),
                TranslationManager.t('tutorial.button_intro'),
                () => {
                    this.revealRedTerritory(() => {
                        this.showModal(
                            TranslationManager.t('tutorial.modal_first_capture'),
                            TranslationManager.t('tutorial.button_first_capture'),
                            () => {
                                this.enterStep('capture_corner');
                            }
                        );
                    });
                }
            );
        });
    }

    enterStep(stepId) {
        this.currentStep = stepId;
        this.orangePotionArmed = false;
        this.clearPotionPulse();

        switch (stepId) {
            case 'capture_corner':
                this.currentTarget = { row: 2, col: 2 };
                this.currentTargetSet = null;
                break;
            case 'capture_gauge':
                this.currentTarget = { row: 0, col: 3 };
                this.currentTargetSet = null;
                this.showObjectiveGauge(25);
                break;
            case 'capture_chaos':
                this.currentTarget = { row: 4, col: 4 };
                this.currentTargetSet = null;
                this.showChaosGauge();
                this.animateObjectiveGaugeTo(75);
                this.animateChaosGaugeTo(92);
                break;
            case 'orange_potion_select':
                this.currentTarget = null;
                this.currentTargetSet = null;
                this.showPotions();
                this.setPotionStates([true, true, false]);
                this.pulsePotion(0);
                break;
            case 'orange_potion_target':
                this.currentTarget = { row: 6, col: 1 };
                this.currentTargetSet = null;
                this.orangePotionArmed = true;
                break;
            default:
                this.currentTarget = null;
                this.currentTargetSet = null;
                break;
        }

        this.refreshHighlights();
    }
}

Object.assign(TutorialScene.prototype, TutorialSceneHudMixin, TutorialSceneBoardMixin);
