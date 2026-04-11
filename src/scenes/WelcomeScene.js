class WelcomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WelcomeScene' });
    }

    preload() {
        this.load.image('ui-gridfall-logo', 'assets/images/UI/logo_gridfall.png');
        this.load.image('ui-button-left-off', 'assets/images/UI/bouton_bord_gauche_off.png');
        this.load.image('ui-button-fill-off', 'assets/images/UI/bouton_fond_off.png');
        this.load.image('ui-button-right-off', 'assets/images/UI/bouton_bord_droite_off.png');
        this.load.image('ui-button-left-on', 'assets/images/UI/bouton_bord_gauche_on.png');
        this.load.image('ui-button-fill-on', 'assets/images/UI/bouton_fond_on.png');
        this.load.image('ui-button-right-on', 'assets/images/UI/bouton_bord_droite_on.png');
    }

    create() {
        const viewportWidth = this.scale.width || 800;
        const viewportHeight = this.scale.height || 700;
        const centerX = viewportWidth / 2;
        const isNarrowViewport = viewportWidth < 500;
        const logoY = isNarrowViewport ? 48 : 60;
        const buttonWidth = isNarrowViewport ? 220 : 260;
        const buttonHeight = isNarrowViewport ? 54 : 60;
        const firstButtonY = isNarrowViewport ? 430 : 470;
        const buttonGap = isNarrowViewport ? 74 : 82;

        this.cameras.main.setBackgroundColor('#000000');

        const sourceWidth = 800;
        const sourceHeight = 510;
        const maxLogoWidth = viewportWidth * (isNarrowViewport ? 0.70 : 0.40);
        const maxLogoHeight = viewportHeight * (isNarrowViewport ? 0.40 : 0.45);
        const logoScale = Math.min(maxLogoWidth / sourceWidth, maxLogoHeight / sourceHeight);
        const logoColor = this.add.image(centerX, logoY, 'ui-gridfall-logo')
            .setOrigin(0.5, 0)
            .setScale(logoScale)
            .setAlpha(0)
            .setDepth(2);
        const logoGray = this.add.image(centerX, logoY, 'ui-gridfall-logo')
            .setOrigin(0.5, 0)
            .setScale(logoScale)
            .setTint(0x9f9f9f)
            .setAlpha(1)
            .setDepth(3);

        const logoTweenTargets = [logoColor, logoGray];
        this.tweens.add({
            targets: logoTweenTargets,
            scaleX: logoScale * 1.04,
            scaleY: logoScale * 1.04,
            duration: 1400,
            ease: 'Sine.easeOut'
        });
        this.tweens.add({
            targets: logoColor,
            alpha: 1,
            duration: 1250,
            ease: 'Sine.easeOut'
        });
        this.tweens.add({
            targets: logoGray,
            alpha: 0,
            duration: 1250,
            ease: 'Sine.easeOut'
        });

        const englishButton = this.createLanguageButton(
            centerX,
            firstButtonY,
            buttonWidth,
            buttonHeight,
            TranslationManager.t('welcome.english'),
            'en'
        );
        const frenchButton = this.createLanguageButton(
            centerX,
            firstButtonY + buttonGap,
            buttonWidth,
            buttonHeight,
            TranslationManager.t('welcome.french'),
            'fr'
        );

        [englishButton.container, frenchButton.container].forEach((container) => {
            container.setAlpha(0);
        });

        this.time.delayedCall(480, () => {
            this.tweens.add({
                targets: [englishButton.container, frenchButton.container],
                alpha: 1,
                duration: 420,
                ease: 'Sine.easeOut'
            });
        });

        this.createCheatToggle(viewportWidth, viewportHeight, isNarrowViewport);
    }

    createLanguageButton(x, y, width, height, label, language) {
        const leftWidth = 18;
        const rightWidth = 18;
        const fillWidth = Math.max(8, width - leftWidth - rightWidth);
        const container = this.add.container(x, y).setDepth(6);
        const left = this.add.image(-width / 2 + leftWidth / 2, 0, 'ui-button-left-off')
            .setDisplaySize(leftWidth, height)
            .setOrigin(0.5);
        const fill = this.add.image(0, 0, 'ui-button-fill-off')
            .setDisplaySize(fillWidth, height)
            .setOrigin(0.5);
        const right = this.add.image(width / 2 - rightWidth / 2, 0, 'ui-button-right-off')
            .setDisplaySize(rightWidth, height)
            .setOrigin(0.5);
        const text = this.add.text(0, 1, label, {
            fontSize: this.scale.width < 500 ? '24px' : '28px',
            color: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: '700'
        }).setOrigin(0.5);
        const hitArea = this.add.zone(0, 0, width, height)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        container.add([left, fill, right, text, hitArea]);

        const setState = (isOn) => {
            left.setTexture(isOn ? 'ui-button-left-on' : 'ui-button-left-off');
            fill.setTexture(isOn ? 'ui-button-fill-on' : 'ui-button-fill-off');
            right.setTexture(isOn ? 'ui-button-right-on' : 'ui-button-right-off');
            text.setColor(isOn ? '#fff8de' : '#f3e8d2');
        };

        hitArea.on('pointerover', () => {
            setState(true);
        });

        hitArea.on('pointerout', () => {
            setState(false);
        });

        hitArea.on('pointerdown', () => {
            setState(true);
            hitArea.disableInteractive();
            this.time.delayedCall(140, () => {
                TranslationManager.setLanguage(language);
                this.scene.start('MainMenuScene', { language });
            });
        });

        return { container, setState };
    }

    createCheatToggle(viewportWidth, viewportHeight, isNarrowViewport) {
        const label = this.add.text(
            viewportWidth - (isNarrowViewport ? 10 : 14),
            viewportHeight - (isNarrowViewport ? 10 : 14),
            this.getCheatToggleLabel(),
            {
                fontSize: isNarrowViewport ? '11px' : '13px',
                color: Boolean(globalThis.CASCARA_SHOW_CHEATS) ? '#f0d98a' : '#7f7f7f',
                fontFamily: 'Vollkorn',
                fontStyle: '700',
                backgroundColor: '#000000'
            }
        )
            .setOrigin(1, 1)
            .setAlpha(0.72)
            .setDepth(8)
            .setPadding(6, 3, 6, 3)
            .setInteractive({ useHandCursor: true });

        label.on('pointerover', () => {
            label.setAlpha(1);
        });

        label.on('pointerout', () => {
            label.setAlpha(0.72);
        });

        label.on('pointerdown', () => {
            const nextValue = !Boolean(globalThis.CASCARA_SHOW_CHEATS);
            globalThis.CASCARA_SHOW_CHEATS = nextValue;

            if (nextValue) {
                MetaProgression.grantCheatStars();
            }

            try {
                localStorage.setItem('cascara_show_cheats', String(nextValue));
            } catch (error) {
                // Keep the runtime toggle even if persistence is unavailable.
            }

            label.setText(this.getCheatToggleLabel());
            label.setColor(nextValue ? '#f0d98a' : '#7f7f7f');
            label.setAlpha(1);
        });
    }

    getCheatToggleLabel() {
        return Boolean(globalThis.CASCARA_SHOW_CHEATS)
            ? TranslationManager.t('welcome.cheats_on')
            : TranslationManager.t('welcome.cheats_off');
    }
}
