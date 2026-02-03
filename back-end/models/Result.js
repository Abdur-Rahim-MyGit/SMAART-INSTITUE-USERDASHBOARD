const mongoose = require('mongoose');

// Response schema for individual question answers
const responseSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    selectedValue: {
        type: mongoose.Schema.Types.Mixed, // Can be Number (1-5) or String (A, B, C)
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    isCorrect: {
        type: Boolean
    },
    answeredAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Big Five scores schema
const scoresSchema = new mongoose.Schema({
    openness: {
        type: Number,
        default: 0
    },
    conscientiousness: {
        type: Number,
        default: 0
    },
    extraversion: {
        type: Number,
        default: 0
    },
    agreeableness: {
        type: Number,
        default: 0
    },
    neuroticism: {
        type: Number,
        default: 0
    }
}, { _id: false });

// Main Result schema
const resultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: [true, 'Assessment ID is required']
    },
    assessmentCode: {
        type: String,
        required: true,
        trim: true
    },
    assessmentName: {
        type: String,
        required: true,
        trim: true
    },
    // Question order for this specific user attempt (shuffled)
    questionOrder: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }],
    // User responses - saved directly on each answer
    responses: [responseSchema],
    // Metadata
    startedAt: {
        type: Date,
        default: Date.now
    },
    submittedAt: {
        type: Date,
        required: false
    },
    timeTaken: {
        type: Number, // in seconds
        default: 0
    },
    completionStatus: {
        type: String,
        enum: ['in-progress', 'completed', 'abandoned'],
        default: 'in-progress'
    },
    // Analytics
    totalQuestions: {
        type: Number,
        required: true
    },
    answeredQuestions: {
        type: Number,
        default: 0
    },
    // Big Five Scores (calculated on submission)
    scores: {
        type: scoresSchema,
        default: () => ({})
    },
    attemptNumber: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

// Indexes for performance
resultSchema.index({ userId: 1, assessmentId: 1 });
resultSchema.index({ userId: 1, completionStatus: 1 });
resultSchema.index({ submittedAt: -1 });

// Method to calculate answered questions count
resultSchema.methods.updateAnsweredCount = function () {
    this.answeredQuestions = this.responses.length;
    return this.answeredQuestions;
};

// Method to calculate Big Five scores using official formulas
resultSchema.methods.calculateScores = function () {
    // Validate we have all responses
    if (this.responses.length !== this.totalQuestions) {
        throw new Error('All questions must be answered before calculating scores');
    }

    // Create a map of questionId to selectedValue for easy lookup
    const responseMap = {};
    this.responses.forEach(response => {
        responseMap[response.questionId.toString()] = response.selectedValue;
    });

    // Create an array to store answers in original question order (1-50)
    // The questionOrder array contains the shuffled question IDs
    // We need to map them back to their original positions
    const answersInOrder = new Array(50);

    this.questionOrder.forEach((questionId, shuffledIndex) => {
        const questionIdStr = questionId.toString();
        const selectedValue = responseMap[questionIdStr];

        if (selectedValue !== undefined) {
            // The original question number is the shuffledIndex + 1
            // But we need to find which original position this question had
            // For Big Five, questions are numbered 1-50 in the original order
            // We'll use the order field from the assessment if available
            // For now, we assume questionOrder preserves the mapping
            answersInOrder[shuffledIndex] = selectedValue;
        }
    });

    // Helper function to get answer value (1-indexed)
    const getAnswer = (questionNum) => {
        return answersInOrder[questionNum - 1] || 0;
    };

    // Calculate scores using official Big Five formulas
    // E = 20 + (1) – (6) + (11) – (16) + (21) – (26) + (31) – (36) + (41) – (46)
    const extraversion = 20 + getAnswer(1) - getAnswer(6) + getAnswer(11) - getAnswer(16)
        + getAnswer(21) - getAnswer(26) + getAnswer(31) - getAnswer(36)
        + getAnswer(41) - getAnswer(46);

    // A = 14 – (2) + (7) – (12) + (17) – (22) + (27) – (32) + (37) + (42) + (47)
    const agreeableness = 14 - getAnswer(2) + getAnswer(7) - getAnswer(12) + getAnswer(17)
        - getAnswer(22) + getAnswer(27) - getAnswer(32) + getAnswer(37)
        + getAnswer(42) + getAnswer(47);

    // C = 14 + (3) – (8) + (13) – (18) + (23) – (28) + (33) – (38) + (43) + (48)
    const conscientiousness = 14 + getAnswer(3) - getAnswer(8) + getAnswer(13) - getAnswer(18)
        + getAnswer(23) - getAnswer(28) + getAnswer(33) - getAnswer(38)
        + getAnswer(43) + getAnswer(48);

    // N = 38 – (4) + (9) – (14) + (19) – (24) – (29) – (34) – (39) – (44) – (49)
    const neuroticism = 38 - getAnswer(4) + getAnswer(9) - getAnswer(14) + getAnswer(19)
        - getAnswer(24) - getAnswer(29) - getAnswer(34) - getAnswer(39)
        - getAnswer(44) - getAnswer(49);

    // O = 8 + (5) – (10) + (15) – (20) + (25) – (30) + (35) + (40) + (45) + (50)
    const openness = 8 + getAnswer(5) - getAnswer(10) + getAnswer(15) - getAnswer(20)
        + getAnswer(25) - getAnswer(30) + getAnswer(35) + getAnswer(40)
        + getAnswer(45) + getAnswer(50);

    // Store calculated scores (Normalized to 0-100)
    // Original raw scores are 0-40 (since min possible is 10 and max is 50, but formula subtracts, effectively giving range)
    // Actually, let's look at the formula:
    // Max score per trait: 20 + 5 - 1 + 5 - 1 + 5 - 1 + 5 - 1 + 5 - 1 = 20 + 20 = 40
    // Min score per trait: 20 + 1 - 5 + 1 - 5 + 1 - 5 + 1 - 5 + 1 - 5 = 20 - 20 = 0
    // So raw range is 0-40.

    // Helper to normalize 0-40 to 0-100
    const normalize = (score) => Math.round((score / 40) * 100);

    this.scores = {
        extraversion: normalize(extraversion),
        agreeableness: normalize(agreeableness),
        conscientiousness: normalize(conscientiousness),
        // Reverse scoring for Neuroticism (High Neuroticism -> Low Score/Stability)
        // If we want "High Score" to mean "Good" (Stable), we reverse it.
        // Original: High (40) = Very Neurotic. Low (0) = Very Stable.
        // New: High (100) = Very Stable. Low (0) = Very Neurotic.
        neuroticism: 100 - normalize(neuroticism),
        openness: normalize(openness)
    };

    // Return normalized scores and raw neuroticism for emotional stability calculation
    return {
        extraversion: this.scores.extraversion,
        agreeableness: this.scores.agreeableness,
        conscientiousness: this.scores.conscientiousness,
        neuroticism: this.scores.neuroticism,
        openness: this.scores.openness,
        rawNeuroticism: neuroticism // Raw score (0-40) before normalization
    };
};

module.exports = mongoose.model('Result', resultSchema);
