class BriefingBattleTransition {
    static play(scene, onComplete) {
        const transitionPlayers = [
            () => this.playSplitPanels(scene, onComplete),
            () => this.playHorizontalShutters(scene, onComplete),
            () => this.playDiagonalSlashes(scene, onComplete),
            () => this.playExpandingPulse(scene, onComplete)
        ];
        Phaser.Utils.Array.GetRandom(transitionPlayers)();
    }

    static playSplitPanels(scene, onComplete) {
        const width = scene.scale.width || 800;
        const height = scene.scale.height || 700;
        const centerX = width / 2;
        const centerY = height / 2;
        const topPanel = scene.add.rectangle(centerX, -height / 2, width, height, 0x120202, 1).setDepth(200);
        const bottomPanel = scene.add.rectangle(centerX, height + height / 2, width, height, 0x120202, 1).setDepth(200);
        const flare = scene.add.rectangle(centerX, centerY, width, height, 0xc42828, 0).setDepth(201);
        const cleanup = () => {
            topPanel.destroy();
            bottomPanel.destroy();
            flare.destroy();
            onComplete();
        };

        scene.cameras.main.shake(120, 0.003);
        scene.tweens.add({
            targets: [topPanel, bottomPanel],
            y: (target, key, value, targetIndex) => targetIndex === 0 ? centerY : centerY,
            duration: 320,
            ease: 'Cubic.In'
        });
        scene.tweens.add({
            targets: flare,
            alpha: { from: 0, to: 0.18 },
            duration: 180,
            yoyo: true,
            ease: 'Quad.Out'
        });
        scene.time.delayedCall(340, cleanup);
    }

    static playHorizontalShutters(scene, onComplete) {
        const width = scene.scale.width || 800;
        const height = scene.scale.height || 700;
        const stripeCount = 7;
        const stripeHeight = Math.ceil(height / stripeCount) + 4;
        const stripes = [];

        for (let index = 0; index < stripeCount; index++) {
            const fromLeft = index % 2 === 0;
            const stripe = scene.add.rectangle(
                fromLeft ? -width / 2 : width + width / 2,
                index * stripeHeight + stripeHeight / 2,
                width + 40,
                stripeHeight,
                index % 3 === 0 ? 0xaa1d1d : 0x090909,
                1
            ).setDepth(200);
            stripes.push(stripe);
            scene.tweens.add({
                targets: stripe,
                x: width / 2,
                duration: 180 + index * 35,
                ease: 'Cubic.Out'
            });
        }

        scene.cameras.main.shake(150, 0.004);
        scene.time.delayedCall(180 + stripeCount * 35 + 70, () => {
            stripes.forEach((stripe) => stripe.destroy());
            onComplete();
        });
    }

    static playDiagonalSlashes(scene, onComplete) {
        const width = scene.scale.width || 800;
        const height = scene.scale.height || 700;
        const slashCount = 5;
        const slashes = [];
        const centerX = width / 2;
        const centerY = height / 2;

        for (let index = 0; index < slashCount; index++) {
            const slash = scene.add.rectangle(
                index % 2 === 0 ? -140 : width + 140,
                centerY + (index - 2) * 36,
                width * 1.4,
                46,
                index % 2 === 0 ? 0x140303 : 0xb12626,
                1
            )
                .setAngle(-24)
                .setDepth(200);
            slashes.push(slash);
            scene.tweens.add({
                targets: slash,
                x: centerX,
                duration: 220 + index * 40,
                ease: 'Quart.Out'
            });
        }

        const flash = scene.add.rectangle(centerX, centerY, width, height, 0xffe4d6, 0).setDepth(201);
        scene.tweens.add({
            targets: flash,
            alpha: { from: 0, to: 0.12 },
            duration: 130,
            yoyo: true,
            repeat: 1,
            ease: 'Quad.Out'
        });
        scene.cameras.main.shake(170, 0.004);

        scene.time.delayedCall(220 + slashCount * 40 + 70, () => {
            slashes.forEach((slash) => slash.destroy());
            flash.destroy();
            onComplete();
        });
    }

    static playExpandingPulse(scene, onComplete) {
        const width = scene.scale.width || 800;
        const height = scene.scale.height || 700;
        const centerX = width / 2;
        const centerY = height / 2;
        const overlay = scene.add.rectangle(centerX, centerY, width, height, 0x000000, 0).setDepth(200);
        const pulse = scene.add.circle(centerX, centerY, 20, 0xd12f2f, 0.55).setDepth(201);
        const shockwave = scene.add.circle(centerX, centerY, 28, 0xffffff, 0.12).setDepth(202);
        const targetRadius = Math.max(width, height) * 0.92;
        const targetShockwaveRadius = Math.max(width, height) * 1.05;
        const pulseScale = targetRadius / 20;
        const shockwaveScale = targetShockwaveRadius / 28;

        scene.tweens.add({
            targets: overlay,
            alpha: { from: 0, to: 0.88 },
            duration: 260,
            ease: 'Quad.In'
        });
        scene.tweens.add({
            targets: pulse,
            scaleX: pulseScale,
            scaleY: pulseScale,
            alpha: 0,
            duration: 300,
            ease: 'Cubic.In'
        });
        scene.tweens.add({
            targets: shockwave,
            scaleX: shockwaveScale,
            scaleY: shockwaveScale,
            alpha: 0,
            duration: 360,
            ease: 'Cubic.Out'
        });
        scene.cameras.main.shake(140, 0.003);

        scene.time.delayedCall(340, () => {
            overlay.destroy();
            pulse.destroy();
            shockwave.destroy();
            onComplete();
        });
    }
}
