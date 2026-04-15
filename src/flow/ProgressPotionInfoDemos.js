class ProgressPotionInfoDemos {
    static buildOrangeDemo(scene, context, refs = {}, options = {}) {
        return this.buildCaptureDemo(scene, context, refs, {
            ...options,
            targetPositions: [
                '0,0', '0,1', '0,2',
                '1,0', '1,1', '1,2',
                '2,0', '2,1', '2,2'
            ]
        });
    }

    static buildMentheDemo(scene, context, refs = {}, options = {}) {
        return this.buildCaptureDemo(scene, context, refs, {
            ...options,
            targetPositions: [
                '0,1',
                '1,0', '1,1', '1,2',
                '2,1'
            ]
        });
    }

    static buildCyanDemo(scene, context, refs = {}, options = {}) {
        const potionTextureKey = options.potionTextureKey;
        const gameBoard = options.gameBoard;
        const tileSourceSize = 13;
        const tileGap = 0;
        const demoScale = context.isNarrowViewport ? 3 : 3.5;
        const gridSourceSize = tileSourceSize * 3 + tileGap * 2;
        const startX = -gridSourceSize / 2 + tileSourceSize / 2;
        const startY = tileSourceSize / 2;
        const container = scene.add.container(0, 0);
        const demoTopOffset = context.isNarrowViewport ? 4 : 6;
        const demoContainer = scene.add.container(0, demoTopOffset).setScale(demoScale);
        const background = scene.add.rectangle(
            0,
            gridSourceSize / 2,
            gridSourceSize,
            gridSourceSize,
            0x141013,
            1
        ).setOrigin(0.5);
        demoContainer.add(background);

        const tiles = [];
        const shields = [];
        const titleIcon = refs.titleIcon || null;
        const titleRow = refs.titleRow || null;
        const titleIconWidth = titleIcon?.displayWidth || refs.titleIconSize || 16;
        const titleIconHeight = titleIcon?.displayHeight || refs.titleIconSize || 16;
        const titleIconStartX = titleRow && titleIcon
            ? titleRow.x + titleIcon.x
            : -Math.round(gridSourceSize * demoScale * 0.72);
        const titleIconStartY = titleRow && titleIcon
            ? (titleRow.y + titleIcon.y) - context.currentY
            : -Math.round(gridSourceSize * demoScale * 0.42);
        const potionIcon = scene.add.image(titleIconStartX, titleIconStartY, potionTextureKey)
            .setOrigin(0.5)
            .setDisplaySize(titleIconWidth, titleIconHeight)
            .setAlpha(0);
        const placementOverlay = scene.add.rectangle(
            0,
            startY + tileSourceSize,
            tileSourceSize,
            tileSourceSize,
            0x000000,
            0.42
        ).setOrigin(0.5);
        const demoCenterX = 0;
        const demoCenterY = demoTopOffset + (gridSourceSize / 2) * demoScale;
        const redOnTexture = gameBoard.getTileAnimationTextureKey('ROUGE', 'on');
        const redTexture = gameBoard.getTileTextureKey('ROUGE');
        const frameDuration = 90;
        const getFrameCount = (textureKey) => Math.max(1, (scene.textures.get(textureKey)?.frameTotal || 1) - 1);
        const redOnFrameCount = getFrameCount(redOnTexture);
        const redOnSequence = [];
        const finalRedHoldDuration = 1000;
        const fadeToBlackDuration = 620;
        const potionFlightDuration = 820;
        const potionImpactDuration = 220;

        for (let frame = 0; frame < redOnFrameCount; frame++) {
            redOnSequence.push({ texture: redOnTexture, frame });
        }

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const x = startX + col * (tileSourceSize + tileGap);
                const y = startY + row * (tileSourceSize + tileGap);
                const tile = scene.add.sprite(x, y, redOnTexture, 0)
                    .setOrigin(0.5)
                    .setScale(1);
                const shield = scene.add.text(x, y, '🛡️', {
                    fontSize: '10px',
                    align: 'center'
                }).setOrigin(0.5).setAlpha(0);
                demoContainer.add(tile);
                demoContainer.add(shield);
                tiles.push({ image: tile });
                shields.push(shield);
            }
        }

        demoContainer.add(placementOverlay);
        container.add([demoContainer, potionIcon]);

        let loopTimer = null;
        let isDestroyed = false;
        const pendingTimers = [];

        const scheduleLoop = (delay, callback) => {
            loopTimer = scene.time.delayedCall(delay, () => {
                if (isDestroyed) {
                    return;
                }
                callback();
            });
        };

        const scheduleStep = (delay, callback) => {
            const timer = scene.time.delayedCall(delay, () => {
                if (isDestroyed) {
                    return;
                }
                callback();
            });
            pendingTimers.push(timer);
            return timer;
        };

        const playGameStyleSequence = (image, sequence, startDelay = 0, onComplete = null) => {
            sequence.forEach((frameState, index) => {
                scheduleStep(startDelay + index * frameDuration, () => {
                    image
                        .setTexture(frameState.texture, frameState.frame)
                        .setScale(1)
                        .setAlpha(1);
                });
            });

            if (onComplete) {
                scheduleStep(startDelay + sequence.length * frameDuration, onComplete);
            }
        };

        const resetDemo = () => {
            pendingTimers.splice(0).forEach((timer) => timer.remove(false));
            tiles.forEach(({ image }) => {
                image
                    .setAlpha(0)
                    .setScale(1);
                if (image.clearTint) {
                    image.clearTint();
                }
                playGameStyleSequence(image, redOnSequence, 0, () => {
                    image
                        .setTexture(redTexture)
                        .setScale(1)
                        .setAlpha(1);
                });
            });
            shields.forEach((shield) => {
                shield
                    .setAlpha(0)
                    .setScale(1);
                if (shield.clearTint) {
                    shield.clearTint();
                }
            });
            placementOverlay
                .setScale(0, 0)
                .setAlpha(0.42);
            potionIcon
                .setPosition(titleIconStartX, titleIconStartY)
                .setDisplaySize(titleIconWidth, titleIconHeight)
                .setScale(1)
                .setAlpha(0);
        };

        const runLoop = () => {
            resetDemo();
            scheduleLoop(redOnFrameCount * frameDuration + 120, () => {
                scene.tweens.add({
                    targets: placementOverlay,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 280,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        if (titleIcon) {
                            titleIcon.setAlpha(0);
                        }
                        potionIcon
                            .setPosition(titleIconStartX, titleIconStartY)
                            .setDisplaySize(titleIconWidth, titleIconHeight)
                            .setScale(1)
                            .setAlpha(1);
                        scene.tweens.add({
                            targets: potionIcon,
                            duration: potionFlightDuration,
                            ease: 'Cubic.easeInOut',
                            interpolation: (values, k) => Phaser.Math.Interpolation.CatmullRom(values, k),
                            x: [titleIconStartX, titleIconStartX - 10, demoCenterX - 8, demoCenterX],
                            y: [titleIconStartY, titleIconStartY + 28, demoCenterY - 10, demoCenterY],
                            onComplete: () => {
                                scene.tweens.add({
                                    targets: potionIcon,
                                    scaleX: 1.7,
                                    scaleY: 1.7,
                                    alpha: 0,
                                    duration: potionImpactDuration,
                                    ease: 'Quad.easeOut',
                                    onComplete: () => {
                                        potionIcon
                                            .setAlpha(0)
                                            .setScale(1);

                                        scene.tweens.add({
                                            targets: placementOverlay,
                                            alpha: 0,
                                            duration: 140,
                                            ease: 'Sine.easeOut'
                                        });

                                        shields.forEach((shield) => {
                                            shield.setScale(0.6);
                                            scene.tweens.add({
                                                targets: shield,
                                                alpha: 1,
                                                scaleX: 1,
                                                scaleY: 1,
                                                duration: 220,
                                                ease: 'Back.easeOut'
                                            });
                                        });

                                        scheduleLoop(520 + finalRedHoldDuration, () => {
                                            tiles.forEach(({ image }) => {
                                                scene.tweens.addCounter({
                                                    from: 0,
                                                    to: 255,
                                                    duration: fadeToBlackDuration,
                                                    ease: 'Sine.easeInOut',
                                                    onUpdate: (tween) => {
                                                        const shade = 255 - Math.round(tween.getValue());
                                                        const tint = Phaser.Display.Color.GetColor(shade, shade, shade);
                                                        image.setTint(tint);
                                                    }
                                                });
                                            });
                                            shields.forEach((shield) => {
                                                scene.tweens.add({
                                                    targets: shield,
                                                    alpha: 0,
                                                    duration: fadeToBlackDuration,
                                                    ease: 'Sine.easeInOut'
                                                });
                                            });

                                            scheduleLoop(fadeToBlackDuration + 80, () => {
                                                if (titleIcon) {
                                                    titleIcon.setAlpha(1);
                                                }
                                                runLoop();
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            });
        };

        runLoop();

        return {
            displayObject: container,
            height: Math.round(gridSourceSize * demoScale) + (context.isNarrowViewport ? 18 : 22),
            onDestroy: () => {
                isDestroyed = true;
                if (loopTimer) {
                    loopTimer.remove(false);
                    loopTimer = null;
                }
                pendingTimers.splice(0).forEach((timer) => timer.remove(false));
                tiles.forEach(({ image }) => scene.tweens.killTweensOf(image));
                shields.forEach((shield) => scene.tweens.killTweensOf(shield));
                scene.tweens.killTweensOf(potionIcon);
                scene.tweens.killTweensOf(placementOverlay);
                if (titleIcon) {
                    titleIcon.setAlpha(1);
                }
            }
        };
    }

    static buildRoseDemo(scene, context, refs = {}, options = {}) {
        const potionTextureKey = options.potionTextureKey;
        const gameBoard = options.gameBoard;
        const tileSourceSize = 13;
        const tileGap = 0;
        const demoScale = context.isNarrowViewport ? 3 : 3.5;
        const gridSourceSize = tileSourceSize * 3 + tileGap * 2;
        const startX = -gridSourceSize / 2 + tileSourceSize / 2;
        const startY = tileSourceSize / 2;
        const container = scene.add.container(0, 0);
        const demoTopOffset = context.isNarrowViewport ? 4 : 6;
        const demoContainer = scene.add.container(0, demoTopOffset).setScale(demoScale);
        const background = scene.add.rectangle(
            0,
            gridSourceSize / 2,
            gridSourceSize,
            gridSourceSize,
            0x141013,
            1
        ).setOrigin(0.5);
        demoContainer.add(background);

        const tiles = [];
        const titleIcon = refs.titleIcon || null;
        const titleRow = refs.titleRow || null;
        const titleIconWidth = titleIcon?.displayWidth || refs.titleIconSize || 16;
        const titleIconHeight = titleIcon?.displayHeight || refs.titleIconSize || 16;
        const titleIconStartX = titleRow && titleIcon
            ? titleRow.x + titleIcon.x
            : -Math.round(gridSourceSize * demoScale * 0.72);
        const titleIconStartY = titleRow && titleIcon
            ? (titleRow.y + titleIcon.y) - context.currentY
            : -Math.round(gridSourceSize * demoScale * 0.42);
        const potionIcon = scene.add.image(titleIconStartX, titleIconStartY, potionTextureKey)
            .setOrigin(0.5)
            .setDisplaySize(titleIconWidth, titleIconHeight)
            .setAlpha(0);
        const placementOverlay = scene.add.rectangle(
            -gridSourceSize / 2,
            gridSourceSize,
            gridSourceSize,
            gridSourceSize,
            0x000000,
            0.42
        ).setOrigin(0, 1);
        const demoCenterX = 0;
        const demoCenterY = demoTopOffset + (gridSourceSize / 2) * demoScale;
        const blueOnTexture = gameBoard.getTileAnimationTextureKey('BLEU', 'on');
        const blueOffTexture = gameBoard.getTileAnimationTextureKey('BLEU', 'off');
        const greyOnTexture = gameBoard.getTileAnimationTextureKey('GRIS', 'on');
        const greyTexture = gameBoard.getTileTextureKey('GRIS');
        const blueTexture = gameBoard.getTileTextureKey('BLEU');
        const redOnTexture = gameBoard.getTileAnimationTextureKey('ROUGE', 'on');
        const redTexture = gameBoard.getTileTextureKey('ROUGE');
        const frameDuration = 90;
        const getFrameCount = (textureKey) => Math.max(1, (scene.textures.get(textureKey)?.frameTotal || 1) - 1);
        const blueOnFrameCount = getFrameCount(blueOnTexture);
        const blueOffFrameCount = getFrameCount(blueOffTexture);
        const greyOnFrameCount = getFrameCount(greyOnTexture);
        const redOnFrameCount = getFrameCount(redOnTexture);
        const finalRedHoldDuration = 1000;
        const fadeToBlackDuration = 620;
        const potionFlightDuration = 820;
        const potionImpactDuration = 220;
        const ringPositions = new Set([
            '0,0', '0,1', '0,2',
            '1,0', '1,2',
            '2,0', '2,1', '2,2'
        ]);

        const blueOnSequence = [];
        for (let frame = 0; frame < blueOnFrameCount; frame++) {
            blueOnSequence.push({ texture: blueOnTexture, frame });
        }

        const ringConversionSequence = [];
        for (let frame = 0; frame < blueOffFrameCount; frame++) {
            ringConversionSequence.push({ texture: blueOffTexture, frame });
        }
        for (let frame = 0; frame < greyOnFrameCount; frame++) {
            ringConversionSequence.push({ texture: greyOnTexture, frame });
        }

        const centerConversionSequence = [];
        for (let frame = 0; frame < blueOffFrameCount; frame++) {
            centerConversionSequence.push({ texture: blueOffTexture, frame });
        }
        for (let frame = 0; frame < redOnFrameCount; frame++) {
            centerConversionSequence.push({ texture: redOnTexture, frame });
        }

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const x = startX + col * (tileSourceSize + tileGap);
                const y = startY + row * (tileSourceSize + tileGap);
                const tile = scene.add.sprite(x, y, blueOnTexture, 0)
                    .setOrigin(0.5)
                    .setScale(1);
                demoContainer.add(tile);
                tiles.push({
                    image: tile,
                    isCenter: row === 1 && col === 1,
                    isRing: ringPositions.has(`${row},${col}`)
                });
            }
        }

        demoContainer.add(placementOverlay);
        container.add([demoContainer, potionIcon]);

        let loopTimer = null;
        let isDestroyed = false;
        const pendingTimers = [];

        const scheduleLoop = (delay, callback) => {
            loopTimer = scene.time.delayedCall(delay, () => {
                if (isDestroyed) {
                    return;
                }
                callback();
            });
        };

        const scheduleStep = (delay, callback) => {
            const timer = scene.time.delayedCall(delay, () => {
                if (isDestroyed) {
                    return;
                }
                callback();
            });
            pendingTimers.push(timer);
            return timer;
        };

        const playGameStyleSequence = (image, sequence, startDelay = 0, onComplete = null) => {
            sequence.forEach((frameState, index) => {
                scheduleStep(startDelay + index * frameDuration, () => {
                    image
                        .setTexture(frameState.texture, frameState.frame)
                        .setScale(1)
                        .setAlpha(1);
                });
            });

            if (onComplete) {
                scheduleStep(startDelay + sequence.length * frameDuration, onComplete);
            }
        };

        const resetDemo = () => {
            pendingTimers.splice(0).forEach((timer) => timer.remove(false));
            tiles.forEach(({ image }) => {
                image
                    .setAlpha(0)
                    .setScale(1);
                if (image.clearTint) {
                    image.clearTint();
                }
                playGameStyleSequence(image, blueOnSequence, 0, () => {
                    image
                        .setTexture(blueTexture)
                        .setScale(1)
                        .setAlpha(1);
                });
            });
            placementOverlay
                .setScale(0, 0)
                .setAlpha(0.42);
            potionIcon
                .setPosition(titleIconStartX, titleIconStartY)
                .setDisplaySize(titleIconWidth, titleIconHeight)
                .setScale(1)
                .setAlpha(0);
        };

        const runLoop = () => {
            resetDemo();
            scheduleLoop(blueOnFrameCount * frameDuration + 120, () => {
                scene.tweens.add({
                    targets: placementOverlay,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 280,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        if (titleIcon) {
                            titleIcon.setAlpha(0);
                        }
                        potionIcon
                            .setPosition(titleIconStartX, titleIconStartY)
                            .setDisplaySize(titleIconWidth, titleIconHeight)
                            .setScale(1)
                            .setAlpha(1);
                        scene.tweens.add({
                            targets: potionIcon,
                            duration: potionFlightDuration,
                            ease: 'Cubic.easeInOut',
                            interpolation: (values, k) => Phaser.Math.Interpolation.CatmullRom(values, k),
                            x: [titleIconStartX, titleIconStartX - 10, demoCenterX - 8, demoCenterX],
                            y: [titleIconStartY, titleIconStartY + 28, demoCenterY - 10, demoCenterY],
                            onComplete: () => {
                                scene.tweens.add({
                                    targets: potionIcon,
                                    scaleX: 1.7,
                                    scaleY: 1.7,
                                    alpha: 0,
                                    duration: potionImpactDuration,
                                    ease: 'Quad.easeOut',
                                    onComplete: () => {
                                        potionIcon
                                            .setAlpha(0)
                                            .setScale(1);

                                        tiles.forEach(({ image, isCenter, isRing }) => {
                                            if (isCenter) {
                                                playGameStyleSequence(image, centerConversionSequence, 0, () => {
                                                    image
                                                        .setTexture(redTexture)
                                                        .setScale(1)
                                                        .setAlpha(1);
                                                });
                                                return;
                                            }

                                            if (isRing) {
                                                playGameStyleSequence(image, ringConversionSequence, 0, () => {
                                                    image
                                                        .setTexture(greyTexture)
                                                        .setScale(1)
                                                        .setAlpha(1);
                                                });
                                            }
                                        });

                                        scene.tweens.add({
                                            targets: placementOverlay,
                                            alpha: 0,
                                            duration: 140,
                                            ease: 'Sine.easeOut'
                                        });

                                        const conversionDuration = Math.max(
                                            centerConversionSequence.length,
                                            ringConversionSequence.length
                                        ) * frameDuration;

                                        scheduleLoop(520 + conversionDuration + finalRedHoldDuration, () => {
                                            tiles.forEach(({ image }) => {
                                                scene.tweens.addCounter({
                                                    from: 0,
                                                    to: 255,
                                                    duration: fadeToBlackDuration,
                                                    ease: 'Sine.easeInOut',
                                                    onUpdate: (tween) => {
                                                        const shade = 255 - Math.round(tween.getValue());
                                                        const tint = Phaser.Display.Color.GetColor(shade, shade, shade);
                                                        image.setTint(tint);
                                                    }
                                                });
                                            });

                                            scheduleLoop(fadeToBlackDuration + 80, () => {
                                                if (titleIcon) {
                                                    titleIcon.setAlpha(1);
                                                }
                                                runLoop();
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            });
        };

        runLoop();

        return {
            displayObject: container,
            height: Math.round(gridSourceSize * demoScale) + (context.isNarrowViewport ? 18 : 22),
            onDestroy: () => {
                isDestroyed = true;
                if (loopTimer) {
                    loopTimer.remove(false);
                    loopTimer = null;
                }
                pendingTimers.splice(0).forEach((timer) => timer.remove(false));
                tiles.forEach(({ image }) => scene.tweens.killTweensOf(image));
                scene.tweens.killTweensOf(potionIcon);
                scene.tweens.killTweensOf(placementOverlay);
                if (titleIcon) {
                    titleIcon.setAlpha(1);
                }
            }
        };
    }

    static buildBlancheDemo(scene, context, refs = {}, options = {}) {
        const potionTextureKey = options.potionTextureKey;
        const gameBoard = options.gameBoard;
        const tileSourceSize = 13;
        const tileGap = 0;
        const demoScale = context.isNarrowViewport ? 3 : 3.5;
        const gridSourceSize = tileSourceSize * 3 + tileGap * 2;
        const startX = -gridSourceSize / 2 + tileSourceSize / 2;
        const startY = tileSourceSize / 2;
        const container = scene.add.container(0, 0);
        const demoTopOffset = context.isNarrowViewport ? 4 : 6;
        const demoContainer = scene.add.container(0, demoTopOffset).setScale(demoScale);
        const background = scene.add.rectangle(
            0,
            gridSourceSize / 2,
            gridSourceSize,
            gridSourceSize,
            0x141013,
            1
        ).setOrigin(0.5);
        demoContainer.add(background);

        const tiles = [];
        const titleIcon = refs.titleIcon || null;
        const titleRow = refs.titleRow || null;
        const titleIconWidth = titleIcon?.displayWidth || refs.titleIconSize || 16;
        const titleIconHeight = titleIcon?.displayHeight || refs.titleIconSize || 16;
        const titleIconStartX = titleRow && titleIcon
            ? titleRow.x + titleIcon.x
            : -Math.round(gridSourceSize * demoScale * 0.72);
        const titleIconStartY = titleRow && titleIcon
            ? (titleRow.y + titleIcon.y) - context.currentY
            : -Math.round(gridSourceSize * demoScale * 0.42);
        const potionIcon = scene.add.image(titleIconStartX, titleIconStartY, potionTextureKey)
            .setOrigin(0.5)
            .setDisplaySize(titleIconWidth, titleIconHeight)
            .setAlpha(0);
        const placementOverlay = scene.add.rectangle(
            -gridSourceSize / 2,
            gridSourceSize,
            gridSourceSize,
            gridSourceSize,
            0x000000,
            0.42
        ).setOrigin(0, 1);
        const demoCenterX = 0;
        const demoCenterY = demoTopOffset + (gridSourceSize / 2) * demoScale;
        const blueOnTexture = gameBoard.getTileAnimationTextureKey('BLEU', 'on');
        const blueTexture = gameBoard.getTileTextureKey('BLEU');
        const frameDuration = 90;
        const getFrameCount = (textureKey) => Math.max(1, (scene.textures.get(textureKey)?.frameTotal || 1) - 1);
        const blueOnFrameCount = getFrameCount(blueOnTexture);
        const blueOnSequence = [];
        const finalHoldDuration = 1000;
        const fadeToBlackDuration = 620;
        const potionFlightDuration = 820;
        const potionImpactDuration = 220;
        const bombIcon = scene.add.image(0, startY + tileSourceSize, 'bonus-bomb-icon')
            .setOrigin(0.5)
            .setDisplaySize(tileSourceSize, tileSourceSize)
            .setAlpha(0);

        for (let frame = 0; frame < blueOnFrameCount; frame++) {
            blueOnSequence.push({ texture: blueOnTexture, frame });
        }

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const x = startX + col * (tileSourceSize + tileGap);
                const y = startY + row * (tileSourceSize + tileGap);
                const tile = scene.add.sprite(x, y, blueOnTexture, 0)
                    .setOrigin(0.5)
                    .setScale(1);
                demoContainer.add(tile);
                tiles.push({ image: tile });
            }
        }

        demoContainer.add(bombIcon);
        demoContainer.add(placementOverlay);
        container.add([demoContainer, potionIcon]);

        let loopTimer = null;
        let isDestroyed = false;
        const pendingTimers = [];

        const scheduleLoop = (delay, callback) => {
            loopTimer = scene.time.delayedCall(delay, () => {
                if (isDestroyed) {
                    return;
                }
                callback();
            });
        };

        const scheduleStep = (delay, callback) => {
            const timer = scene.time.delayedCall(delay, () => {
                if (isDestroyed) {
                    return;
                }
                callback();
            });
            pendingTimers.push(timer);
            return timer;
        };

        const playGameStyleSequence = (image, sequence, startDelay = 0, onComplete = null) => {
            sequence.forEach((frameState, index) => {
                scheduleStep(startDelay + index * frameDuration, () => {
                    image
                        .setTexture(frameState.texture, frameState.frame)
                        .setScale(1)
                        .setAlpha(1);
                });
            });

            if (onComplete) {
                scheduleStep(startDelay + sequence.length * frameDuration, onComplete);
            }
        };

        const resetDemo = () => {
            pendingTimers.splice(0).forEach((timer) => timer.remove(false));
            tiles.forEach(({ image }) => {
                image
                    .setAlpha(0)
                    .setScale(1);
                if (image.clearTint) {
                    image.clearTint();
                }
                playGameStyleSequence(image, blueOnSequence, 0, () => {
                    image
                        .setTexture(blueTexture)
                        .setScale(1)
                        .setAlpha(1);
                });
            });
            bombIcon
                .setAlpha(0)
                .setScale(1);
            scheduleStep(blueOnFrameCount * frameDuration + 80, () => {
                bombIcon.setAlpha(1);
            });
            placementOverlay
                .setDisplaySize(tileSourceSize, tileSourceSize)
                .setScale(0, 0)
                .setAlpha(0.42);
            potionIcon
                .setPosition(titleIconStartX, titleIconStartY)
                .setDisplaySize(titleIconWidth, titleIconHeight)
                .setScale(1)
                .setAlpha(0);
        };

        const runLoop = () => {
            resetDemo();
            scheduleLoop(blueOnFrameCount * frameDuration + 280, () => {
                scene.tweens.add({
                    targets: placementOverlay,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 280,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        if (titleIcon) {
                            titleIcon.setAlpha(0);
                        }
                        potionIcon
                            .setPosition(titleIconStartX, titleIconStartY)
                            .setDisplaySize(titleIconWidth, titleIconHeight)
                            .setScale(1)
                            .setAlpha(1);
                        scene.tweens.add({
                            targets: potionIcon,
                            duration: potionFlightDuration,
                            ease: 'Cubic.easeInOut',
                            interpolation: (values, k) => Phaser.Math.Interpolation.CatmullRom(values, k),
                            x: [titleIconStartX, titleIconStartX - 10, demoCenterX - 8, demoCenterX],
                            y: [titleIconStartY, titleIconStartY + 28, demoCenterY - 10, demoCenterY],
                            onComplete: () => {
                                scene.tweens.add({
                                    targets: potionIcon,
                                    scaleX: 1.7,
                                    scaleY: 1.7,
                                    alpha: 0,
                                    duration: potionImpactDuration,
                                    ease: 'Quad.easeOut',
                                    onComplete: () => {
                                        potionIcon
                                            .setAlpha(0)
                                            .setScale(1);

                                        scene.tweens.add({
                                            targets: [placementOverlay, bombIcon],
                                            alpha: 0,
                                            duration: 160,
                                            ease: 'Sine.easeOut'
                                        });

                                        scheduleLoop(520 + finalHoldDuration, () => {
                                            tiles.forEach(({ image }) => {
                                                scene.tweens.addCounter({
                                                    from: 0,
                                                    to: 255,
                                                    duration: fadeToBlackDuration,
                                                    ease: 'Sine.easeInOut',
                                                    onUpdate: (tween) => {
                                                        const shade = 255 - Math.round(tween.getValue());
                                                        const tint = Phaser.Display.Color.GetColor(shade, shade, shade);
                                                        image.setTint(tint);
                                                    }
                                                });
                                            });

                                            scheduleLoop(fadeToBlackDuration + 80, () => {
                                                if (titleIcon) {
                                                    titleIcon.setAlpha(1);
                                                }
                                                runLoop();
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            });
        };

        runLoop();

        return {
            displayObject: container,
            height: Math.round(gridSourceSize * demoScale) + (context.isNarrowViewport ? 18 : 22),
            onDestroy: () => {
                isDestroyed = true;
                if (loopTimer) {
                    loopTimer.remove(false);
                    loopTimer = null;
                }
                pendingTimers.splice(0).forEach((timer) => timer.remove(false));
                tiles.forEach(({ image }) => scene.tweens.killTweensOf(image));
                scene.tweens.killTweensOf(bombIcon);
                scene.tweens.killTweensOf(potionIcon);
                scene.tweens.killTweensOf(placementOverlay);
                if (titleIcon) {
                    titleIcon.setAlpha(1);
                }
            }
        };
    }

    static buildMarronDemo(scene, context, refs = {}, options = {}) {
        const potionTextureKey = options.potionTextureKey;
        const gameBoard = options.gameBoard;
        const tileSourceSize = 13;
        const tileGap = 0;
        const demoScale = context.isNarrowViewport ? 3 : 3.5;
        const gridSourceSize = tileSourceSize * 3 + tileGap * 2;
        const startX = -gridSourceSize / 2 + tileSourceSize / 2;
        const startY = tileSourceSize / 2;
        const container = scene.add.container(0, 0);
        const demoTopOffset = context.isNarrowViewport ? 4 : 6;
        const demoContainer = scene.add.container(0, demoTopOffset).setScale(demoScale);
        const background = scene.add.rectangle(
            0,
            gridSourceSize / 2,
            gridSourceSize,
            gridSourceSize,
            0x141013,
            1
        ).setOrigin(0.5);
        demoContainer.add(background);

        const tiles = [];
        const titleIcon = refs.titleIcon || null;
        const titleRow = refs.titleRow || null;
        const titleIconWidth = titleIcon?.displayWidth || refs.titleIconSize || 16;
        const titleIconHeight = titleIcon?.displayHeight || refs.titleIconSize || 16;
        const titleIconStartX = titleRow && titleIcon
            ? titleRow.x + titleIcon.x
            : -Math.round(gridSourceSize * demoScale * 0.72);
        const titleIconStartY = titleRow && titleIcon
            ? (titleRow.y + titleIcon.y) - context.currentY
            : -Math.round(gridSourceSize * demoScale * 0.42);
        const potionIcon = scene.add.image(titleIconStartX, titleIconStartY, potionTextureKey)
            .setOrigin(0.5)
            .setDisplaySize(titleIconWidth, titleIconHeight)
            .setAlpha(0);
        const placementOverlay = scene.add.rectangle(
            -gridSourceSize / 2,
            gridSourceSize,
            gridSourceSize,
            gridSourceSize,
            0x000000,
            0.42
        ).setOrigin(0, 1);
        const demoCenterX = 0;
        const demoCenterY = demoTopOffset + (gridSourceSize / 2) * demoScale;
        const blueOnTexture = gameBoard.getTileAnimationTextureKey('BLEU', 'on');
        const blueOffTexture = gameBoard.getTileAnimationTextureKey('BLEU', 'off');
        const blueTexture = gameBoard.getTileTextureKey('BLEU');
        const redOnTexture = gameBoard.getTileAnimationTextureKey('ROUGE', 'on');
        const redTexture = gameBoard.getTileTextureKey('ROUGE');
        const frameDuration = 90;
        const getFrameCount = (textureKey) => Math.max(1, (scene.textures.get(textureKey)?.frameTotal || 1) - 1);
        const blueOnFrameCount = getFrameCount(blueOnTexture);
        const blueOffFrameCount = getFrameCount(blueOffTexture);
        const redOnFrameCount = getFrameCount(redOnTexture);
        const firstWaveTargets = new Set(['0,0', '0,1', '1,0', '1,1', '2,0', '2,1']);
        const allTargets = new Set([
            '0,0', '0,1', '0,2',
            '1,0', '1,1', '1,2',
            '2,0', '2,1', '2,2'
        ]);
        const finalHoldDuration = 1000;
        const fadeToBlackDuration = 620;
        const potionFlightDuration = 820;
        const potionImpactDuration = 220;

        const blueOnSequence = [];
        for (let frame = 0; frame < blueOnFrameCount; frame++) {
            blueOnSequence.push({ texture: blueOnTexture, frame });
        }

        const conversionSequence = [];
        for (let frame = 0; frame < blueOffFrameCount; frame++) {
            conversionSequence.push({ texture: blueOffTexture, frame });
        }
        for (let frame = 0; frame < redOnFrameCount; frame++) {
            conversionSequence.push({ texture: redOnTexture, frame });
        }

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const x = startX + col * (tileSourceSize + tileGap);
                const y = startY + row * (tileSourceSize + tileGap);
                const tile = scene.add.sprite(x, y, blueOnTexture, 0)
                    .setOrigin(0.5)
                    .setScale(1);
                demoContainer.add(tile);
                tiles.push({
                    image: tile,
                    key: `${row},${col}`,
                    isFirstWave: firstWaveTargets.has(`${row},${col}`),
                    isSecondWave: allTargets.has(`${row},${col}`)
                });
            }
        }

        demoContainer.add(placementOverlay);
        container.add([demoContainer, potionIcon]);

        let loopTimer = null;
        let isDestroyed = false;
        const pendingTimers = [];

        const scheduleLoop = (delay, callback) => {
            loopTimer = scene.time.delayedCall(delay, () => {
                if (isDestroyed) {
                    return;
                }
                callback();
            });
        };

        const scheduleStep = (delay, callback) => {
            const timer = scene.time.delayedCall(delay, () => {
                if (isDestroyed) {
                    return;
                }
                callback();
            });
            pendingTimers.push(timer);
            return timer;
        };

        const playGameStyleSequence = (image, sequence, startDelay = 0, onComplete = null) => {
            sequence.forEach((frameState, index) => {
                scheduleStep(startDelay + index * frameDuration, () => {
                    image
                        .setTexture(frameState.texture, frameState.frame)
                        .setScale(1)
                        .setAlpha(1);
                });
            });

            if (onComplete) {
                scheduleStep(startDelay + sequence.length * frameDuration, onComplete);
            }
        };

        const resetDemo = () => {
            pendingTimers.splice(0).forEach((timer) => timer.remove(false));
            tiles.forEach(({ image }) => {
                image
                    .setAlpha(0)
                    .setScale(1);
                if (image.clearTint) {
                    image.clearTint();
                }
                playGameStyleSequence(image, blueOnSequence, 0, () => {
                    image
                        .setTexture(blueTexture)
                        .setScale(1)
                        .setAlpha(1);
                });
            });
            placementOverlay
                .setScale(0, 0)
                .setAlpha(0.42);
            potionIcon
                .setPosition(titleIconStartX, titleIconStartY)
                .setDisplaySize(titleIconWidth, titleIconHeight)
                .setScale(1)
                .setAlpha(0);
            if (titleIcon) {
                titleIcon.setAlpha(1);
            }
        };

        const animatePotionDrop = (onComplete) => {
            if (titleIcon) {
                titleIcon.setAlpha(0);
            }
            potionIcon
                .setPosition(titleIconStartX, titleIconStartY)
                .setDisplaySize(titleIconWidth, titleIconHeight)
                .setScale(1)
                .setAlpha(1);
            scene.tweens.add({
                targets: potionIcon,
                duration: potionFlightDuration,
                ease: 'Cubic.easeInOut',
                interpolation: (values, k) => Phaser.Math.Interpolation.CatmullRom(values, k),
                x: [titleIconStartX, titleIconStartX - 10, demoCenterX - 8, demoCenterX],
                y: [titleIconStartY, titleIconStartY + 28, demoCenterY - 10, demoCenterY],
                onComplete: () => {
                    scene.tweens.add({
                        targets: potionIcon,
                        scaleX: 1.7,
                        scaleY: 1.7,
                        alpha: 0,
                        duration: potionImpactDuration,
                        ease: 'Quad.easeOut',
                        onComplete: () => {
                            potionIcon
                                .setAlpha(0)
                                .setScale(1);
                            if (onComplete) {
                                onComplete();
                            }
                        }
                    });
                }
            });
        };

        const applyWave = (selector) => {
            tiles.forEach(({ image, isFirstWave, isSecondWave }) => {
                const shouldConvert = selector === 'first' ? isFirstWave : isSecondWave;
                if (!shouldConvert) {
                    image
                        .setTexture(image.texture.key === redTexture ? redTexture : blueTexture)
                        .setScale(1)
                        .setAlpha(1);
                    return;
                }
                playGameStyleSequence(image, conversionSequence, 0, () => {
                    image
                        .setTexture(redTexture)
                        .setScale(1)
                        .setAlpha(1);
                });
            });
        };

        const runLoop = () => {
            resetDemo();
            scheduleLoop(blueOnFrameCount * frameDuration + 120, () => {
                scene.tweens.add({
                    targets: placementOverlay,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 280,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        animatePotionDrop(() => {
                            applyWave('first');
                            scene.tweens.add({
                                targets: placementOverlay,
                                alpha: 0,
                                duration: 140,
                                ease: 'Sine.easeOut'
                            });

                            const firstWaveDuration = conversionSequence.length * frameDuration;
                            scheduleLoop(520 + firstWaveDuration, () => {
                                if (titleIcon) {
                                    titleIcon.setAlpha(1);
                                }
                                placementOverlay
                                    .setAlpha(0.42)
                                    .setScale(0, 0);
                                scene.tweens.add({
                                    targets: placementOverlay,
                                    scaleX: 1,
                                    scaleY: 1,
                                    duration: 280,
                                    ease: 'Sine.easeInOut',
                                    onComplete: () => {
                                        animatePotionDrop(() => {
                                            applyWave('second');
                                            scene.tweens.add({
                                                targets: placementOverlay,
                                                alpha: 0,
                                                duration: 140,
                                                ease: 'Sine.easeOut'
                                            });

                                            const secondWaveDuration = conversionSequence.length * frameDuration;
                                            scheduleLoop(520 + secondWaveDuration + finalHoldDuration, () => {
                                                tiles.forEach(({ image }) => {
                                                    scene.tweens.addCounter({
                                                        from: 0,
                                                        to: 255,
                                                        duration: fadeToBlackDuration,
                                                        ease: 'Sine.easeInOut',
                                                        onUpdate: (tween) => {
                                                            const shade = 255 - Math.round(tween.getValue());
                                                            const tint = Phaser.Display.Color.GetColor(shade, shade, shade);
                                                            image.setTint(tint);
                                                        }
                                                    });
                                                });

                                                scheduleLoop(fadeToBlackDuration + 80, () => {
                                                    if (titleIcon) {
                                                        titleIcon.setAlpha(1);
                                                    }
                                                    runLoop();
                                                });
                                            });
                                        });
                                    }
                                });
                            });
                        });
                    }
                });
            });
        };

        runLoop();

        return {
            displayObject: container,
            height: Math.round(gridSourceSize * demoScale) + (context.isNarrowViewport ? 18 : 22),
            onDestroy: () => {
                isDestroyed = true;
                if (loopTimer) {
                    loopTimer.remove(false);
                    loopTimer = null;
                }
                pendingTimers.splice(0).forEach((timer) => timer.remove(false));
                tiles.forEach(({ image }) => scene.tweens.killTweensOf(image));
                scene.tweens.killTweensOf(potionIcon);
                scene.tweens.killTweensOf(placementOverlay);
                if (titleIcon) {
                    titleIcon.setAlpha(1);
                }
            }
        };
    }

    static buildCaptureDemo(scene, context, refs = {}, options = {}) {
        const potionTextureKey = options.potionTextureKey;
        const gameBoard = options.gameBoard;
        const targetPositionSet = new Set(options.targetPositions || []);
        const tileSourceSize = 13;
        const tileGap = 0;
        const demoScale = context.isNarrowViewport ? 3 : 3.5;
        const gridSourceSize = tileSourceSize * 3 + tileGap * 2;
        const startX = -gridSourceSize / 2 + tileSourceSize / 2;
        const startY = tileSourceSize / 2;
        const container = scene.add.container(0, 0);
        const demoTopOffset = context.isNarrowViewport ? 4 : 6;
        const demoContainer = scene.add.container(0, demoTopOffset).setScale(demoScale);
        const background = scene.add.rectangle(
            0,
            gridSourceSize / 2,
            gridSourceSize,
            gridSourceSize,
            0x141013,
            1
        ).setOrigin(0.5);
        demoContainer.add(background);

        const tiles = [];
        const titleIcon = refs.titleIcon || null;
        const titleRow = refs.titleRow || null;
        const titleIconWidth = titleIcon?.displayWidth || refs.titleIconSize || 16;
        const titleIconHeight = titleIcon?.displayHeight || refs.titleIconSize || 16;
        const titleIconStartX = titleRow && titleIcon
            ? titleRow.x + titleIcon.x
            : -Math.round(gridSourceSize * demoScale * 0.72);
        const titleIconStartY = titleRow && titleIcon
            ? (titleRow.y + titleIcon.y) - context.currentY
            : -Math.round(gridSourceSize * demoScale * 0.42);
        const potionIcon = scene.add.image(titleIconStartX, titleIconStartY, potionTextureKey)
            .setOrigin(0.5)
            .setDisplaySize(titleIconWidth, titleIconHeight)
            .setAlpha(0);
        const placementOverlay = scene.add.rectangle(
            -gridSourceSize / 2,
            gridSourceSize,
            gridSourceSize,
            gridSourceSize,
            0x000000,
            0.42
        ).setOrigin(0, 1);
        const fadeOverlay = scene.add.rectangle(
            0,
            gridSourceSize / 2,
            gridSourceSize,
            gridSourceSize,
            0x000000,
            0
        ).setOrigin(0.5);
        const demoCenterX = 0;
        const demoCenterY = demoTopOffset + (gridSourceSize / 2) * demoScale;
        const greyOnTexture = gameBoard.getTileAnimationTextureKey('GRIS', 'on');
        const greyOffTexture = gameBoard.getTileAnimationTextureKey('GRIS', 'off');
        const redOnTexture = gameBoard.getTileAnimationTextureKey('ROUGE', 'on');
        const greyTexture = gameBoard.getTileTextureKey('GRIS');
        const redTexture = gameBoard.getTileTextureKey('ROUGE');
        const frameDuration = 90;
        const getFrameCount = (textureKey) => Math.max(1, (scene.textures.get(textureKey)?.frameTotal || 1) - 1);
        const greyOnFrameCount = getFrameCount(greyOnTexture);
        const greyOffFrameCount = getFrameCount(greyOffTexture);
        const redOnFrameCount = getFrameCount(redOnTexture);
        const conversionDuration = (greyOffFrameCount * frameDuration) + (redOnFrameCount * frameDuration);
        const finalRedHoldDuration = 1000;
        const fadeToBlackDuration = 620;
        const potionFlightDuration = 820;
        const potionImpactDuration = 220;

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const x = startX + col * (tileSourceSize + tileGap);
                const y = startY + row * (tileSourceSize + tileGap);
                const tile = scene.add.sprite(x, y, greyOnTexture, 0)
                    .setOrigin(0.5)
                    .setScale(1);
                demoContainer.add(tile);
                tiles.push({
                    image: tile,
                    isTarget: targetPositionSet.has(`${row},${col}`)
                });
            }
        }

        demoContainer.add(placementOverlay);
        demoContainer.add(fadeOverlay);
        container.add([demoContainer, potionIcon]);

        let loopTimer = null;
        let isDestroyed = false;
        const pendingTimers = [];

        const scheduleLoop = (delay, callback) => {
            loopTimer = scene.time.delayedCall(delay, () => {
                if (isDestroyed) {
                    return;
                }
                callback();
            });
        };

        const scheduleStep = (delay, callback) => {
            const timer = scene.time.delayedCall(delay, () => {
                if (isDestroyed) {
                    return;
                }
                callback();
            });
            pendingTimers.push(timer);
            return timer;
        };

        const playGameStyleSequence = (image, sequence, startDelay = 0, onComplete = null) => {
            sequence.forEach((frameState, index) => {
                scheduleStep(startDelay + index * frameDuration, () => {
                    image
                        .setTexture(frameState.texture, frameState.frame)
                        .setScale(1)
                        .setAlpha(1);
                });
            });

            if (onComplete) {
                scheduleStep(startDelay + sequence.length * frameDuration, onComplete);
            }
        };

        const greyOnSequence = [];
        for (let frame = 0; frame < greyOnFrameCount; frame++) {
            greyOnSequence.push({ texture: greyOnTexture, frame });
        }

        const conversionSequence = [];
        for (let frame = 0; frame < greyOffFrameCount; frame++) {
            conversionSequence.push({ texture: greyOffTexture, frame });
        }
        for (let frame = 0; frame < redOnFrameCount; frame++) {
            conversionSequence.push({ texture: redOnTexture, frame });
        }

        const resetDemo = () => {
            pendingTimers.splice(0).forEach((timer) => timer.remove(false));
            tiles.forEach(({ image }) => {
                image
                    .setAlpha(0)
                    .setScale(1);
                if (image.clearTint) {
                    image.clearTint();
                }
                playGameStyleSequence(image, greyOnSequence, 0, () => {
                    image
                        .setTexture(greyTexture)
                        .setScale(1)
                        .setAlpha(1);
                });
            });
            placementOverlay
                .setScale(0, 0)
                .setAlpha(0.42);
            fadeOverlay.setAlpha(0);
            potionIcon
                .setPosition(titleIconStartX, titleIconStartY)
                .setDisplaySize(titleIconWidth, titleIconHeight)
                .setScale(1)
                .setAlpha(0);
        };

        const runLoop = () => {
            resetDemo();
            scheduleLoop(greyOnFrameCount * frameDuration + 120, () => {
                scene.tweens.add({
                    targets: placementOverlay,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 280,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        if (titleIcon) {
                            titleIcon.setAlpha(0);
                        }
                        potionIcon
                            .setPosition(titleIconStartX, titleIconStartY)
                            .setDisplaySize(titleIconWidth, titleIconHeight)
                            .setScale(1)
                            .setAlpha(1);
                        scene.tweens.add({
                            targets: potionIcon,
                            duration: potionFlightDuration,
                            ease: 'Cubic.easeInOut',
                            interpolation: (values, k) => Phaser.Math.Interpolation.CatmullRom(values, k),
                            x: [titleIconStartX, titleIconStartX - 10, demoCenterX - 8, demoCenterX],
                            y: [titleIconStartY, titleIconStartY + 28, demoCenterY - 10, demoCenterY],
                            onComplete: () => {
                                scene.tweens.add({
                                    targets: potionIcon,
                                    scaleX: 1.7,
                                    scaleY: 1.7,
                                    alpha: 0,
                                    duration: potionImpactDuration,
                                    ease: 'Quad.easeOut',
                                    onComplete: () => {
                                        potionIcon
                                            .setAlpha(0)
                                            .setScale(1);
                                        tiles.forEach(({ image, isTarget }) => {
                                            if (!isTarget) {
                                                image
                                                    .setTexture(greyTexture)
                                                    .setScale(1)
                                                    .setAlpha(1);
                                                return;
                                            }

                                            playGameStyleSequence(image, conversionSequence, 0, () => {
                                                image
                                                    .setTexture(redTexture)
                                                    .setScale(1)
                                                    .setAlpha(1);
                                            });
                                        });

                                        scene.tweens.add({
                                            targets: placementOverlay,
                                            alpha: 0,
                                            duration: 140,
                                            ease: 'Sine.easeOut'
                                        });

                                        scheduleLoop(520 + conversionDuration + finalRedHoldDuration, () => {
                                            tiles.forEach(({ image }) => {
                                                scene.tweens.addCounter({
                                                    from: 0,
                                                    to: 255,
                                                    duration: fadeToBlackDuration,
                                                    ease: 'Sine.easeInOut',
                                                    onUpdate: (tween) => {
                                                        const shade = 255 - Math.round(tween.getValue());
                                                        const tint = Phaser.Display.Color.GetColor(shade, shade, shade);
                                                        image.setTint(tint);
                                                    }
                                                });
                                            });

                                            scheduleLoop(fadeToBlackDuration + 80, () => {
                                                if (titleIcon) {
                                                    titleIcon.setAlpha(1);
                                                }
                                                runLoop();
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            });
        };

        runLoop();

        return {
            displayObject: container,
            height: Math.round(gridSourceSize * demoScale) + (context.isNarrowViewport ? 18 : 22),
            onDestroy: () => {
                isDestroyed = true;
                if (loopTimer) {
                    loopTimer.remove(false);
                    loopTimer = null;
                }
                pendingTimers.splice(0).forEach((timer) => timer.remove(false));
                tiles.forEach(({ image }) => scene.tweens.killTweensOf(image));
                scene.tweens.killTweensOf(potionIcon);
                scene.tweens.killTweensOf(placementOverlay);
                scene.tweens.killTweensOf(fadeOverlay);
                if (titleIcon) {
                    titleIcon.setAlpha(1);
                }
            }
        };
    }
}
