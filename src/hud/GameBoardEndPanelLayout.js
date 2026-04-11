class GameBoardEndPanelLayout {
    constructor(endPanel) {
        this.endPanel = endPanel;
        this.board = endPanel.board;
    }

    buildParchmentLayout({ centerX, centerY, isNarrowViewport, viewportWidth, viewportHeight }) {
        const parchmentMaxWidth = isNarrowViewport
            ? viewportWidth - 22
            : Math.min(viewportWidth - 88, this.board.GAUGE_WIDTH + 90);
        const parchmentMaxHeight = isNarrowViewport
            ? viewportHeight - 28
            : Math.min(viewportHeight - 72, viewportHeight * 0.78);
        const parchmentScale = Math.min(
            parchmentMaxWidth / 320,
            parchmentMaxHeight / 480
        ) * (isNarrowViewport ? 1 : 0.85);
        const parchmentWidth = 320 * parchmentScale;
        const parchmentHeight = 480 * parchmentScale;

        return {
            centerX,
            centerY,
            parchmentScale,
            parchmentWidth,
            parchmentHeight,
            parchmentTopY: centerY - parchmentHeight / 2,
            parchmentBottomY: centerY + parchmentHeight / 2,
            parchmentTextWidth: Math.max(180, parchmentWidth - (isNarrowViewport ? 54 : 74))
        };
    }

    buildEndPanelContentLayout({
        centerY,
        isNarrowViewport,
        resultType,
        hasBossVictoryMessage,
        shouldConvertGoldToStars,
        shouldShowFightBossUnlockMessage,
        strategoVictoryFollowup,
        bossRushVictoryFollowup
    }) {
        const messageY = hasBossVictoryMessage
            ? centerY - (isNarrowViewport ? 104 : 122)
            : centerY - (isNarrowViewport ? 72 : 82);
        const footerY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 18 : 8)
            : centerY - (isNarrowViewport ? 22 : 28);
        const goldRewardTextY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 26 : 20)
            : centerY - (isNarrowViewport ? 22 : 28);
        const goldRewardDisplayY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 58 : 64)
            : centerY + (isNarrowViewport ? 12 : 16);
        const rewardTitleY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 92 : 104)
            : centerY + (isNarrowViewport ? 44 : 52);
        const rewardDisplayY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 138 : 154)
            : centerY + (isNarrowViewport ? 90 : 104);
        const conversionTextY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 92 : 104)
            : centerY + (isNarrowViewport ? 44 : 52);
        const starDisplayY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 128 : 144)
            : centerY + (isNarrowViewport ? 86 : 98);
        const rewardSummaryY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 26 : 20)
            : centerY - (isNarrowViewport ? 22 : 28);
        const countersRowY = hasBossVictoryMessage
            ? centerY + (isNarrowViewport ? 58 : 64)
            : centerY + (isNarrowViewport ? 12 : 16);
        const shouldLowerDefeatRewardSummary =
            resultType === 'defeat' &&
            !hasBossVictoryMessage;
        const adjustedRewardSummaryY = shouldLowerDefeatRewardSummary
            ? rewardSummaryY + (isNarrowViewport ? 38 : 44)
            : rewardSummaryY;
        const adjustedCountersRowY = shouldLowerDefeatRewardSummary
            ? countersRowY + (isNarrowViewport ? 38 : 44)
            : countersRowY;
        const ogreConversionSpacing = shouldConvertGoldToStars
            ? (isNarrowViewport ? 42 : 50)
            : 0;
        const fightBossUnlockSpacing = shouldShowFightBossUnlockMessage
            ? (isNarrowViewport ? 34 : 42)
            : 0;
        const strategoVictorySpacing = strategoVictoryFollowup
            ? (isNarrowViewport ? 32 : 40)
            : 0;
        const bossRushVictorySpacing = bossRushVictoryFollowup
            ? (isNarrowViewport ? 26 : 32)
            : 0;
        const adjustedRewardTitleY = rewardTitleY + fightBossUnlockSpacing;
        const adjustedRewardDisplayY = rewardDisplayY + fightBossUnlockSpacing;

        return {
            messageY,
            footerY,
            goldRewardTextY,
            goldRewardDisplayY,
            rewardTitleY,
            rewardDisplayY,
            conversionTextY,
            starDisplayY,
            adjustedRewardSummaryY,
            adjustedCountersRowY,
            ogreConversionSpacing,
            fightBossUnlockSpacing,
            strategoVictorySpacing,
            bossRushVictorySpacing,
            adjustedRewardTitleY,
            adjustedRewardDisplayY,
            fightBossUnlockTextY: Math.round((adjustedCountersRowY + adjustedRewardTitleY) / 2) + 8,
            bossRushNextPotionsTitleY: rewardTitleY,
            bossRushNextPotionsDisplayY: rewardDisplayY + (isNarrowViewport ? 8 : 12)
        };
    }
}
