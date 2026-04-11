class BriefingArcadeKingdomCarousel {
    static create(scene, {
        centerX,
        topY,
        sectionWidth,
        isNarrowViewport,
        getAvailableKingdoms,
        selectedKingdomIndex,
        isKingdomChosen,
        onSelectionChange,
        onSelectCurrent
    }) {
        const container = scene.add.container(0, 0);
        const animatedTargets = [];
        const iconSpacing = isNarrowViewport ? 56 : 68;
        const kingdoms = getAvailableKingdoms();
        const slotCount = Math.min(5, Math.max(0, kingdoms.length));
        const slotIndexes = Array.from({ length: slotCount }, (_, index) => index - Math.floor(slotCount / 2));
        const centerSlotY = topY + (isNarrowViewport ? 26 : 30);
        const squareSize = isNarrowViewport ? 52 : 60;
        const centerHighlight = scene.add.rectangle(centerX, centerSlotY, squareSize, squareSize, 0xc86a20, 0.96)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xf3c37a, 1);
        const leftArrow = scene.add.text(centerX - sectionWidth / 2 + 8, centerSlotY, '◀︎', {
            fontSize: isNarrowViewport ? '22px' : '26px',
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        const rightArrow = scene.add.text(centerX + sectionWidth / 2 - 8, centerSlotY, '►', {
            fontSize: isNarrowViewport ? '22px' : '26px',
            fill: '#f3e8d2',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5);
        const leftHit = scene.add.zone(centerX - sectionWidth / 2 + 18, centerSlotY, 40, 40)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        const rightHit = scene.add.zone(centerX + sectionWidth / 2 - 18, centerSlotY, 40, 40)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        const placeholderSlots = slotIndexes.map((offset) => {
            const slotX = centerX + offset * iconSpacing;
            const slot = scene.add.container(slotX, centerSlotY);
            const square = scene.add.rectangle(0, 0, squareSize - 8, squareSize - 8, 0x6d4c41, 0.92)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0xe8c98b, 0.9);
            const preview = scene.add.image(0, 0, 'arcade-kingdom-verdombre')
                .setOrigin(0.5)
                .setDisplaySize(squareSize - 8, squareSize - 8);
            const label = scene.add.text(0, 1, 'VE', {
                fontSize: isNarrowViewport ? '18px' : '22px',
                fill: '#fff6df',
                fontFamily: 'Vollkorn',
                fontStyle: 'bold',
                align: 'center'
            }).setOrigin(0.5).setVisible(false);
            slot.add([square, preview, label]);
            return { slot, square, preview, label };
        });
        const titleText = scene.add.text(centerX, topY + (isNarrowViewport ? 64 : 72), '', {
            fontSize: isNarrowViewport ? '17px' : '19px',
            fill: '#ffffff',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0);

        let chooseButtonRef = null;

        const getCurrentIndex = () => selectedKingdomIndex();

        const applySlotState = (placeholder, offset, kingdom) => {
            placeholder.slot.setVisible(true);
            placeholder.slot.setX(centerX + offset * iconSpacing);
            placeholder.slot.setY(centerSlotY);
            placeholder.slot.setAlpha(offset === 0 ? 1 : 0.62);
            placeholder.slot.setScale(offset === 0 ? 1.08 : 0.92);
            placeholder.square.setVisible(offset === 0);
            if (offset === 0) {
                placeholder.square.setFillStyle(0x7a543e, 0.95);
            }
            if (kingdom.previewTextureKey) {
                placeholder.preview.setTexture(kingdom.previewTextureKey);
                placeholder.preview.setVisible(true);
                placeholder.label.setVisible(false);
            } else {
                placeholder.preview.setVisible(false);
                placeholder.label.setVisible(true);
                placeholder.label.setText(kingdom.placeholderLabel || '??');
            }
        };

        const updateCarousel = () => {
            const availableKingdoms = getAvailableKingdoms();
            const noKingdoms = availableKingdoms.length === 0;
            const showNavigation = availableKingdoms.length > 1;
            centerHighlight.setVisible(!noKingdoms);
            leftArrow.setVisible(!noKingdoms && showNavigation);
            rightArrow.setVisible(!noKingdoms && showNavigation);
            leftHit.setVisible(!noKingdoms && showNavigation);
            rightHit.setVisible(!noKingdoms && showNavigation);
            leftHit.disableInteractive();
            rightHit.disableInteractive();
            if (!noKingdoms && showNavigation) {
                leftHit.setInteractive({ useHandCursor: true });
                rightHit.setInteractive({ useHandCursor: true });
            }

            if (noKingdoms) {
                placeholderSlots.forEach((slot) => slot.slot.setVisible(false));
                titleText.setText('');
                if (chooseButtonRef) {
                    chooseButtonRef.container.setVisible(false);
                    chooseButtonRef.hitArea.disableInteractive();
                }
                return;
            }

            const kingdomCount = availableKingdoms.length;
            placeholderSlots.forEach((placeholder, index) => {
                const offset = slotIndexes[index];
                const kingdomIndex = (getCurrentIndex() + offset + kingdomCount) % kingdomCount;
                applySlotState(placeholder, offset, availableKingdoms[kingdomIndex]);
            });

            const currentKingdom = availableKingdoms[getCurrentIndex()];
            titleText.setText(TranslationManager.t(currentKingdom.titleKey));

            if (chooseButtonRef) {
                chooseButtonRef.container.setVisible(true);
                chooseButtonRef.label.setText(
                    isKingdomChosen()
                        ? TranslationManager.t('briefing.kingdom_selected')
                        : TranslationManager.t('briefing.choose_kingdom')
                );
                chooseButtonRef.setState(false);
                chooseButtonRef.hitArea.disableInteractive();
                if (!isKingdomChosen()) {
                    chooseButtonRef.hitArea.setInteractive({ useHandCursor: true });
                }
                chooseButtonRef.container.setAlpha(isKingdomChosen() ? 0.7 : 1);
            }
        };

        const shiftSelection = (delta) => {
            const availableKingdoms = getAvailableKingdoms();
            if (availableKingdoms.length === 0 || isKingdomChosen()) {
                return;
            }
            const kingdomCount = availableKingdoms.length;
            const nextIndex = (getCurrentIndex() + delta + kingdomCount) % kingdomCount;
            onSelectionChange(nextIndex);
            updateCarousel();
        };

        leftHit.on('pointerdown', () => shiftSelection(-1));
        rightHit.on('pointerdown', () => shiftSelection(1));

        container.add([
            centerHighlight,
            ...placeholderSlots.map((slot) => slot.slot),
            leftArrow,
            rightArrow,
            leftHit,
            rightHit,
            titleText
        ]);
        animatedTargets.push(container);
        updateCarousel();

        return {
            container,
            animatedTargets,
            height: (isNarrowViewport ? 114 : 126),
            isChoiceDisabled: () => getAvailableKingdoms().length === 0 || isKingdomChosen(),
            selectCurrentKingdom: () => {
                const availableKingdoms = getAvailableKingdoms();
                const currentKingdom = availableKingdoms[getCurrentIndex()];
                if (!currentKingdom) {
                    return;
                }
                onSelectCurrent(currentKingdom);
                updateCarousel();
            },
            setChooseButtonState: (button) => {
                chooseButtonRef = button;
                updateCarousel();
            }
        };
    }
}
