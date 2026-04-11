class ThoughtSequenceController {
    constructor(board) {
        this.board = board;
        this.scene = board.scene;
    }

    queueThinking(color, onShown = null) {
        if (!color) return;

        if (this.board.thoughtSequenceActive) {
            this.board.pendingThought = { color, onShown };
            return;
        }

        this.startThinking(color, onShown);
    }

    clearAll() {
        Object.values(this.board.thoughtStartTimers).forEach((timer) => timer?.remove(false));
        this.board.thoughtStartTimers = {};

        Object.values(this.board.thoughtBubbleTweens).forEach((tween) => tween?.stop());
        this.board.thoughtBubbleTweens = {};

        Object.values(this.board.playerHudSlots).forEach((slot) => {
            if (slot.thoughtBubble) {
                slot.thoughtBubble.setVisible(false).setAlpha(1);
            }
            if (slot.thoughtEmoji) {
                slot.thoughtEmoji.setVisible(false).setText('').setAlpha(1).setScale(1);
            }
        });

        this.board.pendingThought = null;
        this.board.thoughtSequenceActive = false;
    }

    stopThinking(color) {
        if (this.board.thoughtStartTimers[color]) {
            this.board.thoughtStartTimers[color].remove(false);
            this.board.thoughtStartTimers[color] = null;
        }

        if (this.board.thoughtBubbleTweens[color]) {
            this.board.thoughtBubbleTweens[color].stop();
            this.board.thoughtBubbleTweens[color] = null;
        }

        const slot = this.board.playerHudSlots[color];
        if (!slot) return;

        if (slot.thoughtBubble) {
            slot.thoughtBubble.setVisible(false).setAlpha(1);
        }
        if (slot.thoughtEmoji) {
            slot.thoughtEmoji.setVisible(false).setText('').setAlpha(1).setScale(1);
        }
    }

    startThinking(color, onShown = null) {
        const slot = this.board.playerHudSlots[color];
        if (!slot) return;

        Object.keys(this.board.playerHudSlots).forEach((playerColor) => {
            if (playerColor !== color) {
                this.stopThinking(playerColor);
            }
        });

        this.stopThinking(color);
        this.board.thoughtSequenceActive = false;
        this.board.pendingThought = null;

        if (!slot.thoughtBubble || !slot.thoughtEmoji) {
            if (onShown) onShown();
            return;
        }

        const launchThinking = () => {
            slot.thoughtBubble.setVisible(true).setAlpha(1);
            slot.thoughtEmoji.setVisible(false).setText('').setAlpha(1).setScale(1);
            this.board.thoughtBubbleTweens[color] = this.scene.tweens.add({
                targets: slot.thoughtBubble,
                alpha: 0.35,
                duration: 520,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            this.board.thoughtStartTimers[color] = null;
            if (onShown) onShown();
        };

        this.board.thoughtStartTimers[color] = this.scene.time.delayedCall(
            this.board.THINKING_BUBBLE_DELAY_MS || 0,
            launchThinking
        );
    }

    revealThought(color, onComplete) {
        this.revealThoughtWithEmoji(color, Phaser.Utils.Array.GetRandom(['💡', '😓', '🙌', '☠️', '👀', '🧩']), onComplete);
    }

    revealThoughtWithEmoji(color, emoji, onComplete) {
        const slot = this.board.playerHudSlots[color];
        if (!slot) {
            if (onComplete) onComplete();
            this.board.thoughtSequenceActive = false;
            this.flushPendingThinking();
            return;
        }

        if (!slot.thoughtBubble || !slot.thoughtEmoji) {
            if (onComplete) onComplete();
            this.board.thoughtSequenceActive = false;
            this.flushPendingThinking();
            return;
        }

        this.board.thoughtSequenceActive = true;
        this.stopThinking(color);

        slot.thoughtBubble.setVisible(true).setAlpha(1);
        slot.thoughtEmoji
            .setText(emoji)
            .setVisible(true)
            .setAlpha(1)
            .setScale(0.9);

        this.scene.tweens.add({
            targets: slot.thoughtEmoji,
            scale: 1.08,
            duration: this.board.EUREKA_PULSE_DURATION_MS || 170,
            yoyo: true,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: [slot.thoughtBubble, slot.thoughtEmoji],
                    alpha: 0,
                    duration: this.board.THOUGHT_FADE_DURATION_MS || 340,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        slot.thoughtBubble.setVisible(false).setAlpha(1);
                        slot.thoughtEmoji.setVisible(false).setText('').setAlpha(1).setScale(1);
                        if (onComplete) onComplete();
                        this.board.thoughtSequenceActive = false;
                        this.flushPendingThinking();
                    }
                });
            }
        });
    }

    flushPendingThinking() {
        const pendingThought = this.board.pendingThought;
        if (!pendingThought) return;

        this.board.pendingThought = null;
        if (this.scene.gameState.gameOver) return;
        if (this.scene.gameState.currentPlayer !== pendingThought.color) return;

        this.startThinking(pendingThought.color, pendingThought.onShown);
    }
}
