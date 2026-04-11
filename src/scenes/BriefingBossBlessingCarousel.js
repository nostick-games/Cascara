class BriefingBossBlessingCarousel {
    static create(scene, {
        centerX,
        topY,
        sectionWidth,
        isNarrowViewport,
        getAvailableBlessings,
        selectedBlessingIndex,
        getStoryState,
        onSelectionChange,
        onSelectCurrent
    }) {
        const container = scene.add.container(0, 0);
        const animatedTargets = [];
        const iconSpacing = isNarrowViewport ? 56 : 68;
        const blessings = getAvailableBlessings();
        const slotCount = Math.min(5, Math.max(0, blessings.length));
        const slotIndexes = Array.from({ length: slotCount }, (_, index) => index - Math.floor(slotCount / 2));
        const centerSlotY = topY + (isNarrowViewport ? 26 : 30);
        const squareSize = isNarrowViewport ? 52 : 60;
        const iconSize = isNarrowViewport ? 34 : 40;
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
            const icon = scene.add.image(0, 0, 'bonus-bomb-icon')
                .setOrigin(0.5)
                .setDisplaySize(iconSize, iconSize);
            slot.add([square, icon]);
            return { slot, square, icon };
        });
        const titleText = scene.add.text(centerX, topY + (isNarrowViewport ? 64 : 72), '', {
            fontSize: isNarrowViewport ? '17px' : '19px',
            fill: '#ffffff',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0);
        const descText = scene.add.text(centerX, topY + (isNarrowViewport ? 88 : 98), '', {
            fontSize: isNarrowViewport ? '12px' : '13px',
            fill: '#d0c5b4',
            fontFamily: 'Vollkorn',
            align: 'center',
            wordWrap: { width: sectionWidth }
        }).setOrigin(0.5, 0);

        let chooseButtonRef = null;

        const getCurrentIndex = () => selectedBlessingIndex();
        const getBlessings = () => getAvailableBlessings();

        const applySlotState = (placeholder, offset, blessing) => {
            placeholder.slot.setVisible(true);
            placeholder.slot.setX(centerX + offset * iconSpacing);
            placeholder.slot.setY(centerSlotY);
            placeholder.slot.setAlpha(offset === 0 ? 1 : 0.62);
            placeholder.slot.setScale(offset === 0 ? 1.08 : 0.92);
            placeholder.square.setFillStyle(offset === 0 ? 0x7a543e : 0x5f4335, 0.95);
            placeholder.icon.setTexture(blessing.textureKey || 'bonus-bomb-icon');
        };

        const updateCarousel = () => {
            const storyState = getStoryState() || {};
            const availableBlessings = getBlessings();
            const noBlessings = availableBlessings.length === 0;
            const showNavigation = availableBlessings.length > 1;
            centerHighlight.setVisible(!noBlessings);
            leftArrow.setVisible(!noBlessings && showNavigation);
            rightArrow.setVisible(!noBlessings && showNavigation);
            leftHit.setVisible(!noBlessings && showNavigation);
            rightHit.setVisible(!noBlessings && showNavigation);
            leftHit.disableInteractive();
            rightHit.disableInteractive();
            if (!noBlessings && showNavigation) {
                leftHit.setInteractive({ useHandCursor: true });
                rightHit.setInteractive({ useHandCursor: true });
            }

            if (noBlessings) {
                placeholderSlots.forEach((slot) => slot.slot.setVisible(false));
                titleText.setText('');
                descText.setText('');
                if (chooseButtonRef) {
                    chooseButtonRef.container.setVisible(false);
                    chooseButtonRef.hitArea.disableInteractive();
                }
                return;
            }

            const blessingCount = availableBlessings.length;
            placeholderSlots.forEach((placeholder, index) => {
                const offset = slotIndexes[index];
                const blessingIndex = (getCurrentIndex() + offset + blessingCount) % blessingCount;
                const blessing = availableBlessings[blessingIndex];
                applySlotState(placeholder, offset, blessing);
            });

            const currentBlessing = availableBlessings[getCurrentIndex()];
            const blessingAlreadyChosen = Boolean(storyState.bossBlessingChosenForBattle);
            titleText.setText(TranslationManager.t(currentBlessing.titleKey));
            descText.setText(TranslationManager.t(currentBlessing.descKey));

            if (chooseButtonRef) {
                chooseButtonRef.container.setVisible(true);
                chooseButtonRef.label.setText(
                    blessingAlreadyChosen
                        ? TranslationManager.t('briefing.blessing_selected')
                        : TranslationManager.t('briefing.choose_blessing')
                );
                chooseButtonRef.hitArea.disableInteractive();
                if (!blessingAlreadyChosen) {
                    chooseButtonRef.hitArea.setInteractive({ useHandCursor: true });
                }
                chooseButtonRef.container.setAlpha(blessingAlreadyChosen ? 0.7 : 1);
            }
        };

        const shiftSelection = (delta) => {
            const availableBlessings = getBlessings();
            if (availableBlessings.length === 0) {
                return;
            }
            const blessingCount = availableBlessings.length;
            const nextIndex = (getCurrentIndex() + delta + blessingCount) % blessingCount;
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
            titleText,
            descText
        ]);
        animatedTargets.push(container);

        updateCarousel();

        return {
            container,
            animatedTargets,
            height: (isNarrowViewport ? 150 : 168),
            isChoiceDisabled: () => {
                const storyState = getStoryState() || {};
                return getBlessings().length === 0 || Boolean(storyState.bossBlessingChosenForBattle);
            },
            selectCurrentBlessing: () => {
                const availableBlessings = getBlessings();
                const currentBlessing = availableBlessings[getCurrentIndex()];
                if (!currentBlessing) {
                    return;
                }
                onSelectCurrent(currentBlessing);
                updateCarousel();
            },
            setChooseButtonState: (button) => {
                chooseButtonRef = button;
                updateCarousel();
            }
        };
    }
}
