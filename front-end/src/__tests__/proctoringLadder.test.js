import { describe, it, expect, beforeEach } from 'vitest';
import createLadder, { COLOUR, LADDER } from '@/services/proctoringLadder';

describe('proctoringLadder service suite', () => {
  let ladder;

  beforeEach(() => {
    ladder = createLadder();
  });

  describe('Exports and configurations', () => {
    it('exports the COLOUR constants with green, amber, red', () => {
      expect(COLOUR).toEqual({
        GREEN: 'green',
        AMBER: 'amber',
        RED: 'red',
      });
    });

    it('exports LADDER with all defined proctoring violation types', () => {
      const expectedTypes = [
        'face_absent',
        'face_covered',
        'multiple_faces',
        'face_mismatch',
        'gaze_away',
        'eyes_closed',
        'fullscreen_exit',
        'looking_down',
        'phone_detected',
        'book_detected',
        'laptop_detected',
      ];

      for (const type of expectedTypes) {
        expect(LADDER[type]).toBeDefined();
        expect(Array.isArray(LADDER[type])).toBe(true);
        expect(LADDER[type].length).toBeGreaterThan(0);
      }
    });
  });

  describe('createLadder instance behavior', () => {
    it('returns green for unknown or undefined violation types', () => {
      const result = ladder.observe('unknown_violation_xyz', 1000);
      expect(result).toEqual({
        colour: COLOUR.GREEN,
        message: '',
        elapsedSeconds: 0,
        fire: null,
      });
    });

    it('returns green when elapsed time is below the first stage threshold', () => {
      // face_absent amber threshold is 2 seconds
      const t0 = 10000;
      const res1 = ladder.observe('face_absent', t0); // 0s elapsed
      expect(res1.colour).toBe(COLOUR.GREEN);
      expect(res1.fire).toBeNull();

      const res2 = ladder.observe('face_absent', t0 + 1500); // 1.5s elapsed
      expect(res2.colour).toBe(COLOUR.GREEN);
      expect(res2.elapsedSeconds).toBe(1.5);
      expect(res2.fire).toBeNull();
    });

    it('reaches AMBER stage when threshold is crossed without firing server event', () => {
      const t0 = 10000;
      ladder.observe('face_absent', t0);

      // Exactly at 2 seconds
      const res = ladder.observe('face_absent', t0 + 2000);
      expect(res.colour).toBe(COLOUR.AMBER);
      expect(res.message).toBe('Center your face in the frame');
      expect(res.fire).toBeNull(); // Amber has no server event
    });

    it('escalates to RED stage and fires event once threshold is reached', () => {
      const t0 = 10000;
      ladder.observe('face_absent', t0);

      // Below 20s red threshold (19.9s)
      const resAmber = ladder.observe('face_absent', t0 + 19900);
      expect(resAmber.colour).toBe(COLOUR.AMBER);
      expect(resAmber.fire).toBeNull();

      // Exactly at 20.0s red threshold
      const resRed = ladder.observe('face_absent', t0 + 20000);
      expect(resRed.colour).toBe(COLOUR.RED);
      expect(resRed.message).toBe("We can't see you in the camera");
      expect(resRed.fire).toBe('face_absent');
    });

    it('does not re-fire the same stage event within the same continuous episode', () => {
      const t0 = 10000;
      ladder.observe('face_absent', t0);

      // First crossing of 20s
      const firstRed = ladder.observe('face_absent', t0 + 20000);
      expect(firstRed.fire).toBe('face_absent');

      // Subsequent observation at 25s should stay RED but not fire again
      const nextRed = ladder.observe('face_absent', t0 + 25000);
      expect(nextRed.colour).toBe(COLOUR.RED);
      expect(nextRed.fire).toBeNull();
    });

    it('progresses to extended red stage and fires secondary event', () => {
      const t0 = 10000;
      ladder.observe('face_absent', t0);
      ladder.observe('face_absent', t0 + 20000);

      // Advance to 60 seconds (extended stage)
      const resExtended = ladder.observe('face_absent', t0 + 60000);
      expect(resExtended.colour).toBe(COLOUR.RED);
      expect(resExtended.message).toBe('Please return to your assessment');
      expect(resExtended.fire).toBe('student_absent_extended');
    });

    it('immediately reports furthest reached stage if multiple thresholds are jumped', () => {
      const t0 = 10000;
      // Start episode
      ladder.observe('face_absent', t0);

      // Jump directly to 65 seconds (past both 20s and 60s stages)
      const resJumped = ladder.observe('face_absent', t0 + 65000);
      expect(resJumped.colour).toBe(COLOUR.RED);
      expect(resJumped.fire).toBe('student_absent_extended');
    });

    it('tolerates temporary detector flicker within CLEAR_GRACE_MS (2500ms)', () => {
      const t0 = 10000;
      ladder.observe('phone_detected', t0); // 0s amber
      ladder.observe('phone_detected', t0 + 2000); // 2s amber

      // Condition disappears for 1500ms (less than 2500ms grace period)
      ladder.clear('phone_detected', t0 + 3500);

      // Condition returns at 4000ms -> episode should STILL be active with startedAt = t0!
      // Total elapsed from t0 is 4.0s (>= 3s red threshold for phone_detected)
      const resAfterFlicker = ladder.observe('phone_detected', t0 + 4000);
      expect(resAfterFlicker.colour).toBe(COLOUR.RED);
      expect(resAfterFlicker.fire).toBe('phone_detected');
    });

    it('completely clears episode when absent for >= CLEAR_GRACE_MS', () => {
      const t0 = 10000;
      ladder.observe('phone_detected', t0);
      ladder.observe('phone_detected', t0 + 3000); // Fires red

      // Clear after 3000ms (> 2500ms grace period)
      ladder.clear('phone_detected', t0 + 6000);

      // New observation starts a brand new episode
      const newT0 = t0 + 7000;
      const resNew = ladder.observe('phone_detected', newT0);
      expect(resNew.elapsedSeconds).toBe(0);
      expect(resNew.colour).toBe(COLOUR.AMBER);
      expect(resNew.fire).toBeNull();
    });

    it('clear() does nothing if the type has no active episode', () => {
      expect(() => ladder.clear('non_existent', Date.now())).not.toThrow();
    });

    it('clearAll() removes all ongoing episodes immediately', () => {
      const t0 = 10000;
      ladder.observe('phone_detected', t0);
      ladder.observe('book_detected', t0);

      expect(ladder.active()).toHaveLength(2);

      ladder.clearAll();
      expect(ladder.active()).toHaveLength(0);
    });

    it('active() returns currently active episodes sorted by startedAt ascending (longest running first)', () => {
      ladder.observe('book_detected', 10000);
      ladder.observe('phone_detected', 5000); // started earlier
      ladder.observe('gaze_away', 15000); // started later

      const activeList = ladder.active();
      expect(activeList).toEqual(['phone_detected', 'book_detected', 'gaze_away']);
    });

    it('accepts a custom ladder configuration', () => {
      const customConfig = {
        custom_violation: [
          { afterSeconds: 1, colour: COLOUR.AMBER, message: 'Custom Amber' },
          { afterSeconds: 5, colour: COLOUR.RED, event: 'custom_alert', message: 'Custom Red' },
        ],
      };

      const customLadder = createLadder(customConfig);
      expect(customLadder.observe('custom_violation', 1000).colour).toBe(COLOUR.GREEN);
      expect(customLadder.observe('custom_violation', 2000).colour).toBe(COLOUR.AMBER);
      expect(customLadder.observe('custom_violation', 6000).fire).toBe('custom_alert');
    });
  });
});
