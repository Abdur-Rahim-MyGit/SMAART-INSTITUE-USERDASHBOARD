/**
 * Personal Learning Velocity Index (PLVI) — Blueprint v1.0
 *
 *   PLVI = (S_current − S_baseline) / T_days
 *
 * where S_baseline = T1 score, S_current = the current stage score (T2/T3/T4),
 * and T_days = calendar days between the T1 baseline and the current stage
 * submission (the interim denominator; a true "active learning days" metric is
 * a later phase). Bands come from config/data/plvi_config.csv:
 *   Fast 0.25–1.0 · Steady 0.12–0.249 · Developing 0.0–0.119
 *
 * Also exposes Total Growth Δ = S_current − S_baseline (used for the T4 report).
 */

const fs = require('fs');
const path = require('path');

const DAY_MS = 86_400_000;

function loadBands() {
    const file = path.join(__dirname, '..', 'config', 'data', 'plvi_config.csv');
    const raw = fs.readFileSync(file, 'utf8');
    const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1)
        .map(line => {
            const cells = line.split(',');
            const row = {};
            headers.forEach((h, i) => { row[h] = (cells[i] !== undefined ? cells[i].trim() : ''); });
            return { band: row.band, min: parseFloat(row.min), max: parseFloat(row.max) };
        })
        .sort((a, b) => b.min - a.min); // highest threshold first
}
const BANDS = loadBands();

// Highest band whose min threshold the PLVI reaches. Below the lowest band
// (e.g. flat or negative growth) falls to the lowest band.
function bandFor(plvi) {
    for (const b of BANDS) {
        if (plvi >= b.min) return b.band;
    }
    return BANDS.length ? BANDS[BANDS.length - 1].band : null;
}

/**
 * @param {number} baselineScore  T1 score
 * @param {number} currentScore   current stage score
 * @param {Date|string} baselineDate
 * @param {Date|string} currentDate
 * @param {number} [activeDays]    distinct active LEARNING days in the window.
 *   When > 0 it is used as the denominator (true velocity). When omitted/0/null,
 *   falls back to the calendar-day delta (backward compatible).
 * @returns {{plvi:number, band:string, tDays:number, tDaysBasis:'active'|'calendar'}|null}
 */
function computePLVI(baselineScore, currentScore, baselineDate, currentDate, activeDays) {
    if (baselineScore == null || currentScore == null || !baselineDate || !currentDate) return null;
    const ms = new Date(currentDate).getTime() - new Date(baselineDate).getTime();
    if (Number.isNaN(ms)) return null;

    const useActive = activeDays != null && activeDays > 0;
    const tDays = useActive ? Math.max(1, activeDays) : Math.max(1, Math.round(ms / DAY_MS));
    const plvi = Math.round(((currentScore - baselineScore) / tDays) * 1000) / 1000;
    return { plvi, band: bandFor(plvi), tDays, tDaysBasis: useActive ? 'active' : 'calendar' };
}

function totalGrowth(baselineScore, currentScore) {
    if (baselineScore == null || currentScore == null) return null;
    return currentScore - baselineScore;
}

module.exports = { computePLVI, totalGrowth, bandFor, BANDS };
