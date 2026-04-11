class VerticalScrollHelper {
    static enable(scene, {
        container,
        contentHeight,
        viewportHeight,
        topPadding = 0,
        bottomPadding = 16,
        wheelFactor = 0.55
    }) {
        if (!scene || !container) {
            return { refreshBounds: () => {}, destroy: () => {} };
        }

        let dragPointerId = null;
        let lastPointerY = 0;
        let maxY = topPadding;
        let minY = Math.min(topPadding, viewportHeight - contentHeight - bottomPadding);

        const clampY = (nextY) => Phaser.Math.Clamp(nextY, minY, maxY);
        const setY = (nextY) => {
            container.y = clampY(nextY);
        };

        const refreshBounds = (nextContentHeight = contentHeight, nextViewportHeight = viewportHeight) => {
            contentHeight = nextContentHeight;
            viewportHeight = nextViewportHeight;
            maxY = topPadding;
            minY = Math.min(topPadding, viewportHeight - contentHeight - bottomPadding);
            setY(container.y);
        };

        const onWheel = (_pointer, _gameObjects, _deltaX, deltaY) => {
            if (contentHeight <= viewportHeight - topPadding - bottomPadding) {
                return;
            }
            setY(container.y - deltaY * wheelFactor);
        };

        const onPointerDown = (pointer) => {
            dragPointerId = pointer.id;
            lastPointerY = pointer.y;
        };

        const onPointerMove = (pointer) => {
            if (!pointer.isDown || dragPointerId !== pointer.id) {
                return;
            }
            if (contentHeight <= viewportHeight - topPadding - bottomPadding) {
                return;
            }
            const deltaY = pointer.y - lastPointerY;
            lastPointerY = pointer.y;
            setY(container.y + deltaY);
        };

        const onPointerUp = (pointer) => {
            if (dragPointerId === pointer.id) {
                dragPointerId = null;
            }
        };

        scene.input.on('wheel', onWheel);
        scene.input.on('pointerdown', onPointerDown);
        scene.input.on('pointermove', onPointerMove);
        scene.input.on('pointerup', onPointerUp);
        scene.input.on('pointerupoutside', onPointerUp);

        scene.events.once('shutdown', () => {
            scene.input.off('wheel', onWheel);
            scene.input.off('pointerdown', onPointerDown);
            scene.input.off('pointermove', onPointerMove);
            scene.input.off('pointerup', onPointerUp);
            scene.input.off('pointerupoutside', onPointerUp);
        });

        refreshBounds(contentHeight, viewportHeight);

        return {
            refreshBounds,
            destroy: () => {
                scene.input.off('wheel', onWheel);
                scene.input.off('pointerdown', onPointerDown);
                scene.input.off('pointermove', onPointerMove);
                scene.input.off('pointerup', onPointerUp);
                scene.input.off('pointerupoutside', onPointerUp);
            }
        };
    }
}
