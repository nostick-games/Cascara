class StoryMapRenderer {
    static drawMap(scene, { centerX, topY, bottomY, width, isNarrowViewport, storyState, onNodeSelected }) {
        const laneOffsets = [-0.5, 0, 0.5];
        const laneX = laneOffsets.map((offset) => centerX + offset * width);
        const rowCount = storyState.rows.length;
        const rowSpacing = rowCount > 1 ? (bottomY - topY) / (rowCount - 1) : 0;
        const iconSize = isNarrowViewport ? 42 : 51;
        const selectableNodeIds = new Set(storyState.currentNodeIds || []);
        const completedNodeIds = new Set(storyState.completedNodeIds || []);

        const nodePositions = {};
        const rowNodeIcons = [];
        const rowNodeChecks = [];
        storyState.rows.forEach((rowNodes, rowIndex) => {
            const y = topY + rowIndex * rowSpacing;
            rowNodeIcons[rowIndex] = [];
            rowNodeChecks[rowIndex] = [];
            rowNodes.forEach((node) => {
                nodePositions[node.id] = {
                    x: laneX[node.lane] || centerX,
                    y
                };
            });
        });

        const rowConnections = storyState.rows.map(() => []);
        storyState.rows.forEach((rowNodes, rowIndex) => {
            if (rowIndex >= storyState.rows.length - 1) {
                return;
            }

            rowNodes.forEach((node) => {
                const from = nodePositions[node.id];
                node.nextIds.forEach((nextId) => {
                    const to = nodePositions[nextId];
                    if (from && to) {
                        rowConnections[rowIndex].push({ from, to });
                    }
                });
            });
        });
        const lineGraphicsByRow = rowConnections.map(() => scene.add.graphics().setDepth(11));

        storyState.rows.forEach((rowNodes, rowIndex) => {
            rowNodes.forEach((node) => {
                const position = nodePositions[node.id];
                const textureKey = this.getNodeTexture(node.type);
                const isSelectable = selectableNodeIds.has(node.id);
                const isCompleted = completedNodeIds.has(node.id);
                const targetAlpha = isCompleted
                    ? 0.92
                    : (!isSelectable ? (node.type === 'boss' ? 0.88 : 0.72) : 1);
                const icon = scene.add.image(position.x, position.y, textureKey)
                    .setDisplaySize(iconSize, iconSize)
                    .setDepth(12)
                    .setAlpha(0);
                const baseScaleX = icon.scaleX;
                const baseScaleY = icon.scaleY;

                if (!isCompleted && !isSelectable) {
                    icon.setTint(0x8f8f8f);
                } else if (isSelectable) {
                    icon.setInteractive({ useHandCursor: true });
                    icon.on('pointerover', () => {
                        scene.tweens.killTweensOf(icon);
                        scene.tweens.add({
                            targets: icon,
                            scaleX: baseScaleX * 1.05,
                            scaleY: baseScaleY * 1.05,
                            duration: 120,
                            ease: 'Sine.easeOut'
                        });
                    });
                    icon.on('pointerout', () => {
                        if (scene.selectedNodeId === node.id) {
                            return;
                        }
                        scene.tweens.killTweensOf(icon);
                        scene.tweens.add({
                            targets: icon,
                            scaleX: baseScaleX,
                            scaleY: baseScaleY,
                            duration: 120,
                            ease: 'Sine.easeOut'
                        });
                    });
                    icon.on('pointerdown', () => onNodeSelected(node, rowNodes));
                }

                node.icon = icon;
                node.baseScaleX = baseScaleX;
                node.baseScaleY = baseScaleY;
                node.targetAlpha = targetAlpha;
                rowNodeIcons[rowIndex].push(icon);

                const check = isCompleted
                    ? this.createCompletedNodeBadge(
                        scene,
                        position.x + (isNarrowViewport ? 12 : 15),
                        position.y - (isNarrowViewport ? 12 : 15),
                        isNarrowViewport
                    )
                    : null;
                rowNodeChecks[rowIndex].push(check);
            });
        });

        this.animateMapReveal(scene, storyState.rows, rowNodeIcons, rowNodeChecks, rowConnections, lineGraphicsByRow, isNarrowViewport);
    }

    static animateMapReveal(scene, rows, rowNodeIcons, rowNodeChecks, rowConnections, lineGraphicsByRow, isNarrowViewport) {
        const lineColor = 0x4a2d20;
        const lineAlpha = 0.65;
        const dashLength = isNarrowViewport ? 7 : 9;
        const gapLength = isNarrowViewport ? 4 : 5;
        const lineDuration = 240;
        const nodeDuration = 180;
        let cumulativeDelay = 0;

        const revealRowNodes = (rowIndex) => {
            const rowNodes = rows[rowIndex] || [];
            (rowNodeIcons[rowIndex] || []).forEach((icon, iconIndex) => {
                const node = rowNodes[iconIndex];
                const check = rowNodeChecks[rowIndex]?.[iconIndex] || null;
                icon.setAlpha(0);
                icon.y += 8;
                scene.tweens.add({
                    targets: icon,
                    alpha: node?.targetAlpha ?? 1,
                    y: icon.y - 8,
                    delay: 0,
                    duration: nodeDuration,
                    ease: 'Sine.easeOut'
                });

                if (check) {
                    check.setAlpha(0);
                    check.y += 8;
                    scene.tweens.add({
                        targets: check,
                        alpha: 1,
                        y: check.y - 8,
                        delay: 60,
                        duration: nodeDuration,
                        ease: 'Sine.easeOut'
                    });
                }
            });
        };

        revealRowNodes(0);
        cumulativeDelay += nodeDuration + 90;

        for (let rowIndex = 1; rowIndex < rowNodeIcons.length; rowIndex++) {
            const graphics = lineGraphicsByRow[rowIndex - 1];
            const connections = rowConnections[rowIndex - 1] || [];

            if (connections.length > 0) {
                scene.time.delayedCall(cumulativeDelay, () => {
                    scene.tweens.addCounter({
                        from: 0,
                        to: 1,
                        duration: lineDuration,
                        ease: 'Sine.easeOut',
                        onUpdate: (tween) => {
                            graphics.clear();
                            connections.forEach((connection) => {
                                this.drawDashedLine(
                                    graphics,
                                    connection.from.x,
                                    connection.from.y,
                                    connection.to.x,
                                    connection.to.y,
                                    lineColor,
                                    lineAlpha,
                                    dashLength,
                                    gapLength,
                                    tween.getValue()
                                );
                            });
                        }
                    });
                });
                cumulativeDelay += lineDuration + 40;
            }

            scene.time.delayedCall(cumulativeDelay, () => revealRowNodes(rowIndex));
            cumulativeDelay += nodeDuration + 90;
        }
    }

    static createCompletedNodeBadge(scene, x, y, isNarrowViewport) {
        const container = scene.add.container(x, y).setDepth(13).setAlpha(0);
        const circle = scene.add.circle(0, 0, isNarrowViewport ? 11 : 12, 0xe03131, 1)
            .setStrokeStyle(2, 0xf8dddd, 0.9);
        const text = scene.add.text(0, 0, '✔', {
            fontSize: isNarrowViewport ? '13px' : '14px',
            fill: '#fff8de',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([circle, text]);
        return container;
    }

    static drawLegend(scene, { centerX, centerY, width, isNarrowViewport }) {
        const entries = [
            { type: 'fight', label: TranslationManager.t('story.legend.fight') },
            { type: 'elite', label: TranslationManager.t('story.legend.elite') },
            { type: 'boss', label: TranslationManager.t('story.legend.boss') },
            { type: 'merchant', label: TranslationManager.t('story.legend.merchant') },
            { type: 'surprise', label: TranslationManager.t('story.legend.adventure') }
        ];
        const columns = isNarrowViewport ? 2 : 3;
        const rowGap = isNarrowViewport ? 28 : 30;
        const colWidth = width / columns;
        const startY = centerY - ((Math.ceil(entries.length / columns) - 1) * rowGap) / 2;
        const iconSize = isNarrowViewport ? 24 : 28;

        entries.forEach((entry, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const itemCenterX = centerX - width / 2 + colWidth * col + colWidth / 2;
            const itemY = startY + row * rowGap;

            scene.add.image(itemCenterX - (isNarrowViewport ? 42 : 50), itemY, this.getNodeTexture(entry.type))
                .setDisplaySize(iconSize, iconSize)
                .setDepth(12);
            scene.add.text(itemCenterX - (isNarrowViewport ? 24 : 30), itemY, entry.label, {
                fontSize: isNarrowViewport ? '14px' : '16px',
                fill: '#f3e8d2',
                fontFamily: 'Vollkorn'
            }).setOrigin(0, 0.5).setDepth(12);
        });
    }

    static drawGoldCounter(scene, { x, y, isNarrowViewport, gold }) {
        const iconSize = isNarrowViewport ? 22 : 26;
        scene.add.image(x, y, 'story-gold')
            .setOrigin(0, 0.5)
            .setDisplaySize(iconSize, iconSize)
            .setDepth(12);
        scene.add.text(x + iconSize + 8, y, `${gold ?? 100}`, {
            fontSize: isNarrowViewport ? '16px' : '18px',
            fill: '#3b2419',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(12);
    }

    static drawActivePotionsRow(scene, { leftLimit, rightX, y, isNarrowViewport, unlockedPotionIds }) {
        const label = scene.add.text(rightX, y, TranslationManager.t('story.active_potions'), {
            fontSize: isNarrowViewport ? '13px' : '15px',
            fill: '#3b2419',
            fontFamily: 'Vollkorn',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5).setDepth(12);

        const iconSize = isNarrowViewport ? 18 : 20;
        const iconGap = isNarrowViewport ? 4 : 6;
        const iconsWidth = unlockedPotionIds.length > 0
            ? (unlockedPotionIds.length * iconSize) + ((unlockedPotionIds.length - 1) * iconGap)
            : 0;
        const totalWidth = label.width + (iconsWidth > 0 ? 10 + iconsWidth : 0);
        const startX = Math.max(leftLimit, rightX - totalWidth);
        label.setX(startX + label.width);

        let currentX = startX + label.width + (iconsWidth > 0 ? 10 : 0);

        unlockedPotionIds.forEach((potionId) => {
            const textureKey = this.getPotionTexture(potionId);
            if (!textureKey) {
                return;
            }

            if (currentX + iconSize > rightX) {
                return;
            }

            scene.add.image(currentX + iconSize / 2, y, textureKey)
                .setDisplaySize(iconSize, iconSize)
                .setDepth(12);
            currentX += iconSize + iconGap;
        });
    }

    static getNodeTexture(type) {
        return {
            fight: 'story-node-fight',
            merchant: 'story-node-merchant',
            elite: 'story-node-elite',
            boss: 'story-node-boss',
            surprise: 'story-node-surprise'
        }[type] || 'story-node-fight';
    }

    static getPotionTexture(potionId) {
        return {
            ROSE: 'story-potion-rose',
            ORANGE: 'story-potion-orange',
            MENTHE: 'story-potion-menthe',
            MARRON: 'story-potion-marron',
            BLANCHE: 'story-potion-blanche',
            CYAN: 'story-potion-cyan'
        }[potionId] || null;
    }

    static drawDashedLine(graphics, x1, y1, x2, y2, color, alpha, dashLength, gapLength, progress = 1) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= 0) {
            return;
        }

        const unitX = dx / distance;
        const unitY = dy / distance;
        const targetDistance = distance * Phaser.Math.Clamp(progress, 0, 1);
        let drawn = 0;

        graphics.lineStyle(2, color, alpha);

        while (drawn < targetDistance) {
            const startX = x1 + unitX * drawn;
            const startY = y1 + unitY * drawn;
            const endDistance = Math.min(targetDistance, drawn + dashLength);
            const endX = x1 + unitX * endDistance;
            const endY = y1 + unitY * endDistance;

            graphics.beginPath();
            graphics.moveTo(startX, startY);
            graphics.lineTo(endX, endY);
            graphics.strokePath();

            drawn += dashLength + gapLength;
        }
    }
}
