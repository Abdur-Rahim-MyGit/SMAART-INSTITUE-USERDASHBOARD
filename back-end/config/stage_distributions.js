/**
 * Stage Assessment Distribution Configurations
 *
 * As of the Blueprint v1.0 alignment, stage rules live in editable CSV data
 * files under config/data/ and are assembled by config/stageConfigLoader.js.
 * This module is now a thin re-export so every existing call site
 * (require('../config/stage_distributions')) keeps working unchanged.
 *
 * To change question counts / quotient mix / weights / pass thresholds, edit:
 *   config/data/stage_test_config.csv
 *   config/data/stage_quotient_counts.csv
 *   config/data/stage_quotient_weights.csv
 *   config/data/stage_pass_thresholds.csv
 *
 * Quotients: CRQ, SRQ, LQ, SIQ, PEQ, DAQ, SEQ
 * Difficulty: easy (L1), medium (L2), hard (L3)
 */

module.exports = require('./stageConfigLoader');
