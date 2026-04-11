class BriefingFragmentCarousel {
    static create(scene, {
        centerX,
        topY,
        sectionWidth,
        isNarrowViewport,
        getAvailableFragments,
        selectedFragmentIndex,
        getStoryState,
        getRemainingChoiceCount,
        getChoiceLabel,
        onSelectionChange,
        onSelectCurrent
    }) {
        const container = scene.add.container(0, 0);
        const animatedTargets = [];
        const iconSpacing = isNarrowViewport ? 56 : 68;
        const maxVisibleSlotCount = 5;
        const centerSlotY = topY + (isNarrowViewport ? 26 : 30);
        const squareSize = isNarrowViewport ? 52 : 60;
        const iconSize = isNarrowViewport ? 32 : 38;

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
        const icons = Array.from({ length: maxVisibleSlotCount }, () => scene.add.image(centerX, centerSlotY, '__MISSING')
            .setOrigin(0.5)
            .setDisplaySize(iconSize, iconSize));
        const emptyText = scene.add.text(centerX, centerSlotY, TranslationManager.t('briefing.no_fragments'), {
            fontSize: isNarrowViewport ? '14px' : '16px',
            fill: '#d0c5b4',
            fontFamily: 'Vollkorn',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);
        const titleText = scene.add.text(centerX, topY + (isNarrowViewport ? 64 : 72), '', {
            fontSize: isNarrowViewport ? '17px' : '19px',
            fill: '#ffffff',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0);
        const titleBadge = scene.add.container(centerX, topY + (isNarrowViewport ? 76 : 84)).setVisible(false);
        const titleBadgeCircle = scene.add.circle(0, 0, isNarrowViewport ? 12 : 13, 0xe03131, 1)
            .setStrokeStyle(2, 0xf8dddd, 0.9);
        const titleBadgeText = scene.add.text(0, 0, '0', {
            fontSize: isNarrowViewport ? '12px' : '13px',
            fill: '#fff8de',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        titleBadge.add([titleBadgeCircle, titleBadgeText]);
        const descText = scene.add.text(centerX, topY + (isNarrowViewport ? 88 : 98), '', {
            fontSize: isNarrowViewport ? '12px' : '13px',
            fill: '#d0c5b4',
            fontFamily: 'Vollkorn',
            align: 'center',
            wordWrap: { width: sectionWidth }
        }).setOrigin(0.5, 0);

        const getCurrentIndex = () => selectedFragmentIndex();
        const getFragments = () => getAvailableFragments();

        const applyIconState = (icon, offset, fragment) => {
            icon.setTexture(fragment.textureKey);
            icon.setVisible(true);
            icon.setX(centerX + offset * iconSpacing);
            icon.setY(centerSlotY);
            icon.setAlpha(offset === 0 ? 1 : 0.62);
            icon.setScale(offset === 0 ? 1.15 : 0.92);
        };

        let chooseButtonRef = null;

        const updateCarousel = () => {
            const storyState = getStoryState() || {};
            const availableFragments = getFragments();
            const selectedFragmentIds = Array.isArray(storyState.activeFragmentIds) && storyState.activeFragmentIds.length > 0
                ? storyState.activeFragmentIds
                : [storyState.activeFragmentId].filter(Boolean);
            const noFragments = availableFragments.length === 0;
            const showNavigation = availableFragments.length > 1;
            centerHighlight.setVisible(!noFragments);
            leftArrow.setVisible(!noFragments && showNavigation);
            rightArrow.setVisible(!noFragments && showNavigation);
            leftHit.setVisible(!noFragments && showNavigation);
            rightHit.setVisible(!noFragments && showNavigation);
            leftHit.disableInteractive();
            rightHit.disableInteractive();
            if (!noFragments && showNavigation) {
                leftHit.setInteractive({ useHandCursor: true });
                rightHit.setInteractive({ useHandCursor: true });
            }
            emptyText.setVisible(noFragments);

            if (noFragments) {
                icons.forEach((icon) => icon.setVisible(false));
                titleText.setText('');
                titleBadge.setVisible(false);
                descText.setText('');
                if (chooseButtonRef) {
                    chooseButtonRef.container.setVisible(false);
                    chooseButtonRef.hitArea.disableInteractive();
                }
                return;
            }

            const fragmentCount = availableFragments.length;
            const visibleSlotCount = Math.min(maxVisibleSlotCount, fragmentCount);
            const visibleSlotIndexes = Array.from(
                { length: visibleSlotCount },
                (_, index) => index - Math.floor(visibleSlotCount / 2)
            );

            icons.forEach((icon, index) => {
                const offset = visibleSlotIndexes[index];
                if (offset === undefined) {
                    icon.setVisible(false);
                    return;
                }
                const fragmentIndex = (getCurrentIndex() + offset + fragmentCount) % fragmentCount;
                const fragment = availableFragments[fragmentIndex];
                applyIconState(icon, offset, fragment);
            });

            const currentFragment = availableFragments[getCurrentIndex()];
            const remainingChoiceCount = getRemainingChoiceCount();
            const fragmentAlreadySelected = selectedFragmentIds.includes(currentFragment?.id);
            const fragmentUnavailable = currentFragment?.id === 'PHOENIX';
            titleText.setText(TranslationManager.t(currentFragment.titleKey));
            const fragmentCountOwned = StoryFragmentInventory.getCount(storyState, currentFragment.id);
            titleBadgeText.setText(`${fragmentCountOwned}`);
            titleBadge.setVisible(fragmentCountOwned > 1);
            titleBadge.setPosition(
                centerX + titleText.width / 2 + (isNarrowViewport ? 18 : 20),
                topY + (isNarrowViewport ? 76 : 84)
            );
            descText.setText(TranslationManager.t(currentFragment.descKey));

            if (chooseButtonRef) {
                chooseButtonRef.container.setVisible(true);
                chooseButtonRef.label.setText(
                    fragmentUnavailable
                        ? TranslationManager.t('briefing.fragment_unavailable')
                        : (fragmentAlreadySelected
                            ? TranslationManager.t('briefing.fragment_already_selected')
                            : getChoiceLabel())
                );
                chooseButtonRef.setState(false);
                chooseButtonRef.hitArea.disableInteractive();
                if (remainingChoiceCount > 0 && !fragmentUnavailable && !fragmentAlreadySelected) {
                    chooseButtonRef.hitArea.setInteractive({ useHandCursor: true });
                }
                chooseButtonRef.container.setAlpha((remainingChoiceCount <= 0 || fragmentUnavailable || fragmentAlreadySelected) ? 0.7 : 1);
            }
        };

        const shiftSelection = (delta) => {
            const availableFragments = getFragments();
            if (availableFragments.length === 0) {
                return;
            }
            const fragmentCount = availableFragments.length;
            const nextIndex = (getCurrentIndex() + delta + fragmentCount) % fragmentCount;
            onSelectionChange(nextIndex);
            updateCarousel();
        };

        leftHit.on('pointerdown', () => shiftSelection(-1));
        rightHit.on('pointerdown', () => shiftSelection(1));

        container.add([
            centerHighlight,
            ...icons,
            leftArrow,
            rightArrow,
            leftHit,
            rightHit,
            emptyText,
            titleText,
            titleBadge,
            descText
        ]);
        animatedTargets.push(container);

        updateCarousel();

        return {
            container,
            animatedTargets,
            height: (isNarrowViewport ? 150 : 168),
            isChoiceDisabled: () => {
                const availableFragments = getFragments();
                const currentFragment = availableFragments[getCurrentIndex()];
                const storyState = getStoryState() || {};
                const selectedFragmentIds = Array.isArray(storyState.activeFragmentIds) && storyState.activeFragmentIds.length > 0
                    ? storyState.activeFragmentIds
                    : [storyState.activeFragmentId].filter(Boolean);
                return availableFragments.length === 0
                    || getRemainingChoiceCount() <= 0
                    || selectedFragmentIds.includes(currentFragment?.id)
                    || currentFragment?.id === 'PHOENIX';
            },
            selectCurrentFragment: () => {
                const availableFragments = getFragments();
                const currentFragment = availableFragments[getCurrentIndex()];
                if (!currentFragment || currentFragment.id === 'PHOENIX') {
                    return;
                }
                onSelectCurrent(currentFragment);
                updateCarousel();
            },
            setChooseButtonState: (button) => {
                chooseButtonRef = button;
                updateCarousel();
            }
        };
    }
}
