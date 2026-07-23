/**
 * Stage Config Loader (Config-First Architecture)
 *
 * Builds the STAGE_DISTRIBUTIONS object from CSV data files instead of a
 * hardcoded object, so stage rules (question counts, quotient mix, weights,
 * pass thresholds) can be tuned as data. The output shape and the exported
 * helpers are IDENTICAL to the legacy config/stage_distributions.js, so all
 * existing call sites (resultController, routes/results, routes/stageresults,
 * utils/questionShuffler) keep working unchanged.
 *
 * Source files (back-end/config/data/):
 *   stage_test_config.csv      -> stage,code,name,totalQuestions,maxAttempts
 *   stage_quotient_counts.csv  -> stage,quotient,easy,medium,hard   (authoritative distribution)
 *   stage_quotient_weights.csv -> stage,quotient,weight             (absent stage => simple average)
 *   stage_pass_thresholds.csv  -> stage,passScore,distinctionScore
 *
 * Deferred (Phase 3, not yet loaded): certificate_issuance_rules.csv, plvi_config.csv
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Minimal, dependency-free CSV parser. These are controlled config files with
// no embedded commas/quotes, so a simple split is sufficient and deterministic.
function parseCsv(fileName) {
    const raw = fs.readFileSync(path.join(DATA_DIR, fileName), 'utf8');
    const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const cells = line.split(',');
        const row = {};
        headers.forEach((h, i) => { row[h] = (cells[i] !== undefined ? cells[i].trim() : ''); });
        return row;
    });
}

function buildWeightedFormula(weights) {
    // Weighted average over quotients actually present in the attempt
    // (data.possible > 0), renormalized by total weight. Quotients present in
    // the distribution but missing a weight fall back to 1/7 so their questions
    // still count. Identical maths to the legacy inline formulas.
    return (quotientScores) => {
        let weightedSum = 0, totalWeight = 0;
        for (const [key, data] of Object.entries(quotientScores)) {
            if (data.possible > 0) {
                const pct = Math.round((data.earned / data.possible) * 100);
                const w = (weights[key] !== undefined ? weights[key] : (1 / 7));
                weightedSum += pct * w;
                totalWeight += w;
            }
        }
        return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    };
}

function buildSimpleAverageFormula() {
    // Simple average of quotient percentages (used when a stage has no weights, e.g. T1).
    return (quotientScores) => {
        let sum = 0, count = 0;
        for (const [, data] of Object.entries(quotientScores)) {
            if (data.possible > 0) {
                sum += Math.round((data.earned / data.possible) * 100);
                count++;
            }
        }
        return count > 0 ? Math.round(sum / count) : 0;
    };
}

function buildDistributions() {
    const testConfig = parseCsv('stage_test_config.csv');
    const counts = parseCsv('stage_quotient_counts.csv');
    const weightsRows = parseCsv('stage_quotient_weights.csv');
    const thresholds = parseCsv('stage_pass_thresholds.csv');

    const distributions = {};

    // Base stage records
    for (const row of testConfig) {
        distributions[row.stage] = {
            code: row.code,
            name: row.name,
            totalQuestions: parseInt(row.totalQuestions, 10),
            maxAttempts: parseInt(row.maxAttempts, 10),
            passingPercentage: 70, // overwritten from thresholds below
            quotients: {},
            _weights: {}
        };
    }

    // Quotient distribution (per-quotient easy/medium/hard)
    for (const row of counts) {
        const stage = distributions[row.stage];
        if (!stage) continue;
        stage.quotients[row.quotient] = {
            easy: parseInt(row.easy || '0', 10),
            medium: parseInt(row.medium || '0', 10),
            hard: parseInt(row.hard || '0', 10)
        };
    }

    // Weights
    for (const row of weightsRows) {
        const stage = distributions[row.stage];
        if (!stage) continue;
        const w = parseFloat(row.weight);
        if (!Number.isNaN(w)) stage._weights[row.quotient] = w;
    }

    // Pass thresholds (+ optional distinction)
    for (const row of thresholds) {
        const stage = distributions[row.stage];
        if (!stage) continue;
        stage.passingPercentage = parseInt(row.passScore, 10);
        if (row.distinctionScore !== undefined && row.distinctionScore !== '') {
            stage.distinctionPercentage = parseInt(row.distinctionScore, 10);
        }
    }

    // Attach the correct formula and drop the internal _weights helper
    for (const stage of Object.values(distributions)) {
        const hasWeights = Object.keys(stage._weights).length > 0;
        stage.weightedFormula = hasWeights
            ? buildWeightedFormula(stage._weights)
            : buildSimpleAverageFormula();
        delete stage._weights;
    }

    return distributions;
}

const STAGE_DISTRIBUTIONS = buildDistributions();

// Helper to get stage config by assessment code
const getStageByCode = (code) => {
    for (const [stage, config] of Object.entries(STAGE_DISTRIBUTIONS)) {
        if (config.code === code) return { stage, ...config };
    }
    return null;
};

// Helper to get stage config by stage key
const getStageConfig = (stageKey) => {
    const key = stageKey.toUpperCase();
    return STAGE_DISTRIBUTIONS[key] || null;
};

module.exports = { STAGE_DISTRIBUTIONS, getStageByCode, getStageConfig };
