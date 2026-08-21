// Server-side mirror of the curriculum ordering/gating rules defined in
// front-end/src/data/courseStructureData.js and front-end/src/utils/courseUnlock.js.
// Keep both in sync when the curriculum structure changes — this is what
// backend routes check against so progression gates can't be bypassed by
// calling the API directly (the frontend gate is UI-only otherwise).

const STAGE_1_NUMBERS = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10'];
const STAGE_2_NUMBERS = ['S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19'];
const STAGE_3_NUMBERS = ['S20', 'S21', 'S22', 'S23', 'S24', 'S25'];
const PIQ_NUMBERS = ['PIQ01', 'PIQ02', 'PIQ03', 'PIQ04', 'PIQ05'];
const AIQ_NUMBERS = ['AIQ01', 'AIQ02', 'AIQ03', 'AIQ04', 'AIQ05'];
const SQ_NUMBERS = ['SQ01', 'SQ02', 'SQ03', 'SQ04', 'SQ05'];
const BC_NUMBERS = ['BC01', 'BC02', 'BC03', 'BC04', 'BC05'];

const STAGES = [
  { type: 'stage', id: 1, category: 'Capacity', numbers: STAGE_1_NUMBERS, unlockAfter: null, assessmentGate: null },
  { type: 'stage', id: 2, category: 'Capability', numbers: STAGE_2_NUMBERS, unlockAfter: 'S10', assessmentGate: 'T2' },
  { type: 'stage', id: 3, category: 'Leadership', numbers: STAGE_3_NUMBERS, unlockAfter: 'S19', assessmentGate: 'T3' },
];

const TRACKS = [
  { type: 'track', id: 'PIQ', numbers: PIQ_NUMBERS, unlockAfter: 'S05' },
  { type: 'track', id: 'AIQ', numbers: AIQ_NUMBERS, unlockAfter: 'S15' },
  { type: 'track', id: 'SQ', numbers: SQ_NUMBERS, unlockAfter: 'S21' },
  { type: 'track', id: 'British Council', numbers: BC_NUMBERS, unlockAfter: 'S01' },
];

module.exports = { STAGES, TRACKS };
