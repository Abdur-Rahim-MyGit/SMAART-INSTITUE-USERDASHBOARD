const { STAGE_DISTRIBUTIONS } = require('./config/stage_distributions');

const testScoring = () => {
    // Mock quotientScores as built in results.js currently (with .total)
    const mockResultsJsOutput = {
        'CRQ': { earned: 5, total: 10 },
        'SRQ': { earned: 5, total: 10 },
        'LQ': { earned: 5, total: 10 },
        'SIQ': { earned: 5, total: 10 },
        'PEQ': { earned: 5, total: 10 },
        'DAQ': { earned: 5, total: 10 }
    };

    console.log("--- Testing T2 Formula with .total (Expected: 0) ---");
    const t2Score = STAGE_DISTRIBUTIONS.T2.weightedFormula(mockResultsJsOutput);
    console.log(`T2 Weighted Score: ${t2Score}`);

    // Mock quotientScores with .possible (What the formula expects)
    const fixedOutput = {
        'CRQ': { earned: 5, possible: 10 },
        'SRQ': { earned: 5, possible: 10 },
        'LQ': { earned: 5, possible: 10 },
        'SIQ': { earned: 5, possible: 10 },
        'PEQ': { earned: 5, possible: 10 },
        'DAQ': { earned: 5, possible: 10 }
    };

    console.log("\n--- Testing T2 Formula with .possible (Expected: 50) ---");
    const t2FixedScore = STAGE_DISTRIBUTIONS.T2.weightedFormula(fixedOutput);
    console.log(`T2 Weighted Score: ${t2FixedScore}`);
};

testScoring();
