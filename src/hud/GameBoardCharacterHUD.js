class GameBoardCharacterHUD {
    constructor(hud) {
        this.hud = hud;
        this.board = hud.board;
        this.scene = hud.scene;
    }

    createTurnIndicator() {
        const isNarrowViewport = this.scene.scale.width < 500;
        const backgroundWidth = this.scene.config.battleBackgroundWidth || this.board.GAUGE_WIDTH;
        const backgroundCenterX = this.scene.config.battleBackgroundX || (this.board.GRID_OFFSET_X + this.board.GAUGE_WIDTH / 2);
        const backgroundLeft = backgroundCenterX - backgroundWidth / 2;
        const indicatorY = isNarrowViewport ? 142 : 240;
        const playerOrder = this.scene.gameState.playerOrder;
        const spriteY = isNarrowViewport ? 100 : 180;
        const heroX = this.scene.isStrategoMode
            ? backgroundCenterX
            : backgroundLeft + backgroundWidth * (isNarrowViewport ? 0.16 : 0.18);
        const enemyColors = playerOrder.filter((color) => color !== 'ROUGE');
        const enemyPositions = this.computeEnemyPositions(
            heroX,
            backgroundLeft,
            backgroundWidth,
            enemyColors.length,
            isNarrowViewport
        );

        this.board.playerHudSlots = {};
        this.board.playerHudContainer = this.scene.add.container(0, 0);

        playerOrder.forEach((color) => {
            const isHero = color === 'ROUGE';
            const enemyIndex = enemyColors.indexOf(color);
            const x = isHero ? heroX : enemyPositions[enemyIndex];
            const sparkleY = spriteY - (isNarrowViewport ? 60 : 80);
            const thoughtX = x + 10;
            const thoughtY = spriteY - (isNarrowViewport ? 65 : 80);
            const selector = this.scene.add.text(x - 20, sparkleY, '✦', {
                fontSize: isNarrowViewport ? '28px' : '34px',
                fill: '#ffd84d',
                fontFamily: 'Vollkorn',
                stroke: '#fff7b2',
                strokeThickness: isNarrowViewport ? 3 : 4
            }).setOrigin(0.5).setVisible(false).setDepth(16);
            selector.setShadow(0, 0, '#ffe680', 12, true, true);
            this.board.playerHudContainer.add(selector);
            const thoughtBubble = this.scene.isStrategoMode
                ? null
                : this.scene.add.text(thoughtX, thoughtY, '💭', {
                    fontSize: isNarrowViewport ? '40px' : '50px',
                    fontFamily: 'Vollkorn'
                }).setOrigin(0.5).setVisible(false).setDepth(16);
            const thoughtEmoji = this.scene.isStrategoMode
                ? null
                : this.scene.add.text(thoughtX, thoughtY - 5, '', {
                    fontSize: isNarrowViewport ? '18px' : '22px',
                    fontFamily: 'Vollkorn'
                }).setOrigin(0.5).setVisible(false).setDepth(17);
            if (thoughtBubble) {
                this.board.playerHudContainer.add(thoughtBubble);
            }
            if (thoughtEmoji) {
                this.board.playerHudContainer.add(thoughtEmoji);
            }

            this.board.playerHudSlots[color] = {
                x,
                y: indicatorY,
                gaugeX: x,
                spriteX: x,
                heroSpriteX: x,
                heroSpriteY: spriteY - 15,
                spriteY,
                selector,
                thoughtBubble,
                thoughtEmoji
            };
        });
    }

    computeEvenlySpacedPositions(startX, endX, count) {
        if (count <= 0) return [];
        if (count === 1) return [Math.round((startX + endX) / 2)];

        const spacing = (endX - startX) / (count - 1);
        return Array.from({ length: count }, (_, index) => Math.round(startX + spacing * index));
    }

    computeEnemyPositions(heroX, backgroundLeft, backgroundWidth, count, isNarrowViewport) {
        if (count <= 0) return [];

        const ratiosByCount = {
            1: [1 - (isNarrowViewport ? 0.16 : 0.18)],
            2: isNarrowViewport ? [0.58, 0.79] : [0.60, 0.80],
            3: isNarrowViewport ? [0.46, 0.64, 0.82] : [0.48, 0.66, 0.82]
        };
        const ratios = ratiosByCount[count];

        if (ratios) {
            return ratios.map((ratio) => Math.round(backgroundLeft + backgroundWidth * ratio));
        }

        const fallbackStart = heroX + backgroundWidth * 0.26;
        const fallbackEnd = backgroundLeft + backgroundWidth * 0.82;
        return this.computeEvenlySpacedPositions(fallbackStart, fallbackEnd, count);
    }

    updateTurnIndicator(currentPlayer, playerOrder) {
        playerOrder.forEach((color) => {
            const slot = this.board.playerHudSlots[color];
            if (!slot) return;
            slot.selector.setVisible(false).setAlpha(1);
        });
    }

    animateStartingPlayerSelection(playerOrder, onComplete) {
        this.clearStartingPlayerAnimation();

        const selectedPlayer = Phaser.Utils.Array.GetRandom(playerOrder);
        const selectedIndex = playerOrder.indexOf(selectedPlayer);
        const totalSteps = playerOrder.length * 3 + selectedIndex;
        let currentStep = 0;

        const advanceHighlight = () => {
            const color = playerOrder[currentStep % playerOrder.length];
            playerOrder.forEach((playerColor) => {
                const slot = this.board.playerHudSlots[playerColor];
                if (!slot) return;
                slot.selector.setVisible(playerColor === color).setAlpha(1);
            });

            if (currentStep >= totalSteps) {
                const selectedSelector = this.board.playerHudSlots[selectedPlayer]?.selector;
                const selectedTargets = [
                    selectedSelector,
                    this.board.bonusIconTexts[selectedPlayer]
                ].filter(Boolean);

                this.board.startSelectionTween = this.scene.tweens.add({
                    targets: selectedTargets,
                    alpha: 0.25,
                    duration: 180,
                    yoyo: true,
                    repeat: 5,
                    onComplete: () => {
                        if (this.board.playerHudSlots[selectedPlayer]) {
                            this.board.playerHudSlots[selectedPlayer].selector.setAlpha(1);
                        }
                        if (this.board.bonusIconTexts[selectedPlayer]) {
                            this.board.bonusIconTexts[selectedPlayer].setAlpha(1);
                        }
                        this.updateTurnIndicator(selectedPlayer, playerOrder);
                        this.board.startSelectionTween = this.scene.tweens.add({
                            targets: selectedSelector,
                            alpha: 0,
                            duration: 320,
                            ease: 'Sine.easeOut',
                            onComplete: () => {
                                if (selectedSelector) {
                                    selectedSelector.setVisible(false);
                                    selectedSelector.setAlpha(1);
                                }
                                this.board.startSelectionTween = null;
                                onComplete(selectedPlayer);
                            }
                        });
                    }
                });
                return;
            }

            currentStep++;
            const delay = currentStep > totalSteps - playerOrder.length ? 190 : 110;
            const timer = this.scene.time.delayedCall(delay, advanceHighlight);
            this.board.startSelectionTimers.push(timer);
        };

        advanceHighlight();
    }

    clearStartingPlayerAnimation() {
        for (const timer of this.board.startSelectionTimers) {
            if (timer && !timer.hasDispatched) {
                timer.remove(false);
            }
        }
        this.board.startSelectionTimers = [];

        if (this.board.startSelectionTween) {
            this.board.startSelectionTween.stop();
            this.board.startSelectionTween = null;
        }

        Object.values(this.board.playerHudSlots).forEach((slot) => {
            slot.selector.setAlpha(1);
            slot.selector.setVisible(false);
            if (slot.thoughtBubble) {
                slot.thoughtBubble.setVisible(false).setAlpha(1);
            }
            if (slot.thoughtEmoji) {
                slot.thoughtEmoji.setVisible(false).setAlpha(1).setText('').setScale(1);
            }
        });
        Object.values(this.board.turnIndicatorTweens).forEach((tween) => tween?.stop());
        this.board.turnIndicatorTweens = {};
        this.board.lastTurnIndicatorColor = null;
        this.board.clearThoughts();
        Object.values(this.board.bonusIconTexts).forEach((text) => {
            text.setAlpha(1);
        });
        Object.values(this.board.bonusIconImages).forEach((image) => {
            image.setAlpha(1);
        });
    }

    createEnemySprites() {
        this.board.enemySprites = {};
        this.board.enemyPulseTweens = {};
        const scale = this.scene.scale.width < 500 ? 2 : 2.7;

        Object.entries(this.scene.enemyAssignments || {}).forEach(([color, enemy]) => {
            if (!enemy || color === 'ROUGE') return;

            const slot = this.board.playerHudSlots[color];
            if (!slot) return;

            const sprite = this.scene.add.sprite(slot.spriteX, slot.spriteY, enemy.idleTexture, 0)
                .setScale(scale)
                .setOrigin(0.5);
            sprite.baseScale = scale;
            sprite.play(this.getIdleAnimationKey(enemy.key));
            sprite.setInteractive({ useHandCursor: true });
            sprite.on('pointerdown', () => {
                this.scene.handleEnemyIntentClick(color);
            });
            this.board.enemySprites[color] = sprite;
            this.board.enemyPulseTweens[color] = null;
        });
    }

    createHeroSprite() {
        const slot = this.board.playerHudSlots.ROUGE;
        if (!slot) return;

        const scale = this.scene.isStrategoMode
            ? (this.scene.scale.width < 500 ? 2.5 : 3.2)
            : (this.scene.scale.width < 500 ? 2.2 : 3);
        const heroY = this.scene.isStrategoMode
            ? slot.spriteY
            : (slot.heroSpriteY || slot.spriteY);
        const textureKey = this.scene.isStrategoMode ? 'hero-idle-face' : 'hero-idle';
        const animationKey = this.scene.isStrategoMode ? 'hero-idle-face' : 'hero-idle';
        const sprite = this.scene.add.sprite(slot.heroSpriteX, heroY, textureKey, 0)
            .setScale(scale)
            .setOrigin(0.5);
        sprite.play(animationKey);
        this.board.heroSprite = sprite;
    }

    updateEnemySprites(activePlayers, scoreData) {
        if (this.scene.isFightMode) {
            Object.entries(this.board.enemySprites).forEach(([color, sprite]) => {
                const isActive = activePlayers.includes(color);
                sprite.setAlpha(isActive ? 1 : 0.32);
                this.stopEnemyPulse(color, sprite);
            });
            return;
        }

        const winThreshold = GameLogic.getWinThreshold(this.board.GRID_SIZE, this.scene.gameState.playerOrder.length);
        const pulseThreshold = Math.max(0, winThreshold - 5);
        Object.entries(this.board.enemySprites).forEach(([color, sprite]) => {
            const isActive = activePlayers.includes(color);
            const isNearVictory = (scoreData?.percentages?.[color] || 0) >= pulseThreshold;
            sprite.setAlpha(isActive ? 1 : 0.32);

            if (isActive && isNearVictory) {
                this.ensureEnemyPulse(color, sprite);
                return;
            }

            this.stopEnemyPulse(color, sprite);
        });
    }

    playEnemyDeathAnimations() {
        if (this.board.enemyDeathPlayed) return;
        this.board.enemyDeathPlayed = true;

        Object.entries(this.board.enemySprites).forEach(([color, sprite]) => {
            const enemy = this.scene.enemyAssignments?.[color];
            if (!enemy) return;

            this.stopEnemyPulse(color, sprite);
            sprite.play(this.getDeathAnimationKey(enemy.key));
        });
    }

    ensureEnemyPulse(color, sprite) {
        if (this.board.enemyPulseTweens?.[color]) {
            return;
        }

        this.board.enemyPulseTweens[color] = this.scene.tweens.add({
            targets: sprite,
            scaleX: (sprite.baseScale || sprite.scaleX) * 1.12,
            scaleY: (sprite.baseScale || sprite.scaleY) * 1.12,
            duration: 260,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    stopEnemyPulse(color, sprite) {
        if (this.board.enemyPulseTweens?.[color]) {
            this.board.enemyPulseTweens[color].stop();
            this.board.enemyPulseTweens[color] = null;
        }

        if (sprite) {
            const baseScale = sprite.baseScale || 1;
            sprite.setScale(baseScale);
        }
    }

    playHeroDefeatAnimation() {
        if (this.board.heroDeathPlayed || !this.board.heroSprite) return;
        this.board.heroDeathPlayed = true;

        this.scene.tweens.add({
            targets: this.board.heroSprite,
            scaleX: 0.35,
            scaleY: 0.2,
            angle: 12,
            alpha: 0.7,
            duration: 240,
            ease: 'Back.easeIn'
        });
    }

    getIdleAnimationKey(enemyType) {
        return `enemy-${enemyType.toLowerCase()}-idle`;
    }

    getDeathAnimationKey(enemyType) {
        return `enemy-${enemyType.toLowerCase()}-death`;
    }
}
