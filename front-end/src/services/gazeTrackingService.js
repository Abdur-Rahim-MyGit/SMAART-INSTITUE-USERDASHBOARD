/**
 * gazeTrackingService.js
 *
 * Real-time 3D head pose and gaze vector calculation module.
 * Analyzes relative spatial relationships between eyes, nose, and mouth keypoints.
 */

/**
 * Calculate precise 3D Head Pose and Gaze Direction from 5 facial keypoints.
 *
 * @param {Array<Array<number>>} landmarks - [[x,y] for left_eye, right_eye, nose, left_mouth, right_mouth]
 * @returns {{ direction: string, yaw: number, pitch: number, roll: number, isCentered: boolean }}
 */
export const calculateGazeAndPose = (landmarks) => {
  if (!landmarks || landmarks.length < 5) {
    return { direction: 'center', yaw: 0, pitch: 0, roll: 0, isCentered: true };
  }

  const [lEye, rEye, nose, lMouth, rMouth] = landmarks;

  const lEyeX = lEye.x !== undefined ? lEye.x : lEye[0];
  const lEyeY = lEye.y !== undefined ? lEye.y : lEye[1];
  const rEyeX = rEye.x !== undefined ? rEye.x : rEye[0];
  const rEyeY = rEye.y !== undefined ? rEye.y : rEye[1];
  const noseX = nose.x !== undefined ? nose.x : nose[0];
  const noseY = nose.y !== undefined ? nose.y : nose[1];
  const lMouthY = lMouth.y !== undefined ? lMouth.y : lMouth[1];
  const rMouthY = rMouth.y !== undefined ? rMouth.y : rMouth[1];

  // 1. Roll (Head tilt side-to-side)
  const dY = rEyeY - lEyeY;
  const dX = rEyeX - lEyeX;
  const rollRad = Math.atan2(dY, dX);
  const rollDeg = (rollRad * 180) / Math.PI;

  // 2. Yaw (Head turn left/right)
  const eyeMidX = (lEyeX + rEyeX) / 2;
  const eyeSpan = Math.abs(rEyeX - lEyeX) || 1e-6;
  const yawOffset = (noseX - eyeMidX) / eyeSpan;
  const yawDeg = yawOffset * 90;

  // 3. Pitch (Head tilt up/down)
  const eyeMidY = (lEyeY + rEyeY) / 2;
  const mouthMidY = (lMouthY + rMouthY) / 2;
  const faceH = Math.abs(mouthMidY - eyeMidY) || 1e-6;
  const pitchOffset = (noseY - eyeMidY) / faceH - 0.5;
  const pitchDeg = pitchOffset * 60;

  // 4. Direction Categorization with calibrated thresholds
  let direction = 'center';
  if (yawDeg > 25) {
    direction = 'looking_right';
  } else if (yawDeg < -25) {
    direction = 'looking_left';
  } else if (pitchDeg > 22) {
    direction = 'looking_down';
  } else if (pitchDeg < -22) {
    direction = 'looking_up';
  }

  return {
    direction,
    yaw: Math.round(yawDeg),
    pitch: Math.round(pitchDeg),
    roll: Math.round(rollDeg),
    isCentered: direction === 'center',
  };
};
