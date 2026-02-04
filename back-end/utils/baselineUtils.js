const getLevel = (score) => {
    if (score >= 81) return 'Advanced';
    if (score >= 61) return 'Strong';
    if (score >= 41) return 'Progressing';
    if (score >= 21) return 'Developing';
    return 'Emerging';
};

const calculateBaseLineProfile = (assessment, result) => {
    // 1. Map questions for fast lookup
    const qMap = new Map();
    assessment.questions.forEach(q => qMap.set(q._id.toString(), q));

    // 2. Initialize profile
    const profile = {
        CRQ: { earned: 0, possible: 0 },
        SRQ: { earned: 0, possible: 0 },
        LQ: { earned: 0, possible: 0 },
        SIQ: { earned: 0, possible: 0 },
        PEQ: { earned: 0, possible: 0 },
        DAQ: { earned: 0, possible: 0 }
    };

    let totalCorrectOverall = 0;
    let questionsAnsweredCount = 0;

    // 3. Process each response
    result.responses.forEach(resp => {
        const question = qMap.get(resp.questionId.toString());
        if (!question) return;

        questionsAnsweredCount++;
        const quotientKey = question.quotient || 'CRQ'; // Default to CRQ if missing

        // Check if quotient exists in our profile object
        if (!profile[quotientKey]) {
            profile[quotientKey] = { earned: 0, possible: 0 };
        }

        const isCorrect = (question.correctAnswer === resp.selectedValue);
        profile[quotientKey].possible += 1;
        if (isCorrect) {
            profile[quotientKey].earned += 1;
            totalCorrectOverall += 1;
        }

        // Add correct info to response for convenience
        resp.isCorrect = isCorrect;
    });

    // 4. Finalize quotient scores
    const finalizedProfile = {};
    let sumOfQuotientScores = 0;
    let validQuotientCount = 0;

    Object.keys(profile).forEach(key => {
        const { earned, possible } = profile[key];
        const rawScore = possible > 0 ? Math.round((earned / possible) * 100) : 0;

        finalizedProfile[key] = {
            rawScore,
            level: getLevel(rawScore),
            earned,
            possible
        };

        if (possible > 0) {
            sumOfQuotientScores += rawScore;
            validQuotientCount++;
        }
    });

    // 5. Calculate overall baseline score
    const baselineScore = validQuotientCount > 0
        ? Math.round(sumOfQuotientScores / validQuotientCount)
        : 0;

    return {
        baselineScore,
        stageBand: getLevel(baselineScore),
        t1Profile: finalizedProfile,
        score: totalCorrectOverall,
        totalScore: questionsAnsweredCount,
        percentage: questionsAnsweredCount > 0 ? Math.round((totalCorrectOverall / questionsAnsweredCount) * 100) : 0
    };
};

module.exports = {
    getLevel,
    calculateBaseLineProfile
};
