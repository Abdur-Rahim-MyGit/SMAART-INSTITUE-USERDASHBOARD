import React, { useMemo } from 'react';

/**
 * Lightweight, zero-dependency standalone QR Code generator.
 * Encodes ASCII / UTF-8 strings into standard QR Model 2 matrix.
 */

// Byte mode polynomial generator & Galois Field (GF 256) tables
const GF256 = (() => {
  const exp = new Uint8Array(512);
  const log = new Uint8Array(256);
  let val = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = val;
    exp[i + 255] = val;
    log[val] = i;
    val = (val << 1) ^ (val & 128 ? 0x11d : 0);
  }
  return { exp, log };
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF256.exp[GF256.log[a] + GF256.log[b]];
}

function polyMul(p1, p2) {
  const res = new Uint8Array(p1.length + p2.length - 1);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      res[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return res;
}

function getGeneratorPoly(degree) {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    poly = polyMul(poly, new Uint8Array([1, GF256.exp[i]]));
  }
  return poly;
}

function calculateECC(data, eccCount) {
  const gen = getGeneratorPoly(eccCount);
  const info = new Uint8Array(data.length + eccCount);
  info.set(data);
  for (let i = 0; i < data.length; i++) {
    const factor = info[i];
    if (factor !== 0) {
      for (let j = 0; j < gen.length; j++) {
        info[i + j] ^= gfMul(gen[j], factor);
      }
    }
  }
  return info.slice(data.length);
}

// Simple standard QR Matrix Builder for Version 1 to 10
function createQRMatrix(text) {
  // Convert string to UTF-8 bytes
  const encoder = new TextEncoder();
  const utf8Bytes = Array.from(encoder.encode(text));
  const dataLen = utf8Bytes.length;

  // Select minimum QR version that fits data (Level M error correction)
  // Version capacities for Level M:
  const capacities = [0, 14, 26, 42, 62, 84, 106, 122, 152, 180, 213, 251, 287, 331, 362, 412, 450, 504, 560, 624, 666];
  let version = 1;
  while (version < capacities.length && capacities[version] < dataLen) {
    version++;
  }
  if (version >= capacities.length) version = 20;

  const size = 17 + version * 4;
  const matrix = Array.from({ length: size }, () => Array(size).fill(null));
  const isReserved = Array.from({ length: size }, () => Array(size).fill(false));

  // 1. Finder patterns at (0,0), (size-7, 0), (0, size-7)
  const drawFinder = (r0, c0) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = r0 + r;
        const col = c0 + c;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          isReserved[row][col] = true;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBlack = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
            matrix[row][col] = isBlack;
          } else {
            matrix[row][col] = false;
          }
        }
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) {
      matrix[6][i] = i % 2 === 0;
      isReserved[6][i] = true;
    }
    if (matrix[i][6] === null) {
      matrix[i][6] = i % 2 === 0;
      isReserved[i][6] = true;
    }
  }

  // Dark module
  matrix[size - 8][8] = true;
  isReserved[size - 8][8] = true;

  // 3. Encode data: Mode (0100 for Byte) + Count + Data + Terminator + Padding
  const bitStream = [];
  const pushBits = (val, count) => {
    for (let i = count - 1; i >= 0; i--) {
      bitStream.push((val >> i) & 1);
    }
  };

  pushBits(4, 4); // 0100 Byte Mode
  pushBits(dataLen, version <= 9 ? 8 : 16); // Character count indicator
  utf8Bytes.forEach((b) => pushBits(b, 8));

  // Terminator
  const totalDataBits = capacities[version] * 8;
  const termLen = Math.min(4, totalDataBits - bitStream.length);
  pushBits(0, termLen);

  // Pad to multiple of 8
  while (bitStream.length % 8 !== 0) bitStream.push(0);

  // Pad bytes 0xEC, 0x11
  let padToggle = false;
  while (bitStream.length < totalDataBits) {
    pushBits(padToggle ? 0x11 : 0xec, 8);
    padToggle = !padToggle;
  }

  // Convert bitstream to bytes
  const dataBytes = [];
  for (let i = 0; i < bitStream.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bitStream[i + b];
    }
    dataBytes.push(byte);
  }

  // Generate Error Correction Codewords
  const eccCount = Math.max(10, Math.floor(capacities[version] * 0.35));
  const eccBytes = Array.from(calculateECC(dataBytes, eccCount));
  const allCodewords = [...dataBytes, ...eccBytes];

  // Convert all codewords to bit sequence
  const finalBits = [];
  allCodewords.forEach((cw) => {
    for (let b = 7; b >= 0; b--) {
      finalBits.push((cw >> b) & 1);
    }
  });

  // 4. Place bits in zigzag upward/downward pattern
  let bitIdx = 0;
  let upward = true;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip vertical timing column

    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (!isReserved[row][c]) {
          const rawBit = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
          // Apply Standard Mask Pattern 0: (row + column) % 2 === 0
          const mask = (row + c) % 2 === 0;
          matrix[row][c] = mask ? !rawBit : !!rawBit;
        }
      }
    }
    upward = !upward;
  }

  return matrix;
}

const QRCodeSVG = ({
  value = "",
  size = 180,
  fgColor = "#0d1f4e",
  bgColor = "#ffffff",
  className = ""
}) => {
  const matrix = useMemo(() => {
    try {
      return createQRMatrix(String(value || "SMAART-PASS"));
    } catch (e) {
      console.warn("QR Matrix fallback", e);
      return Array.from({ length: 21 }, () => Array(21).fill(false));
    }
  }, [value]);

  const n = matrix.length;
  const cellSize = 10;
  const padding = 20;
  const totalSvgSize = n * cellSize + padding * 2;

  return (
    <svg
      viewBox={`0 0 ${totalSvgSize} ${totalSvgSize}`}
      width={size}
      height={size}
      className={`rounded-xl shadow-sm ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <rect width={totalSvgSize} height={totalSvgSize} fill={bgColor} rx={12} />
      {matrix.map((row, r) =>
        row.map((isDark, c) => {
          if (!isDark) return null;
          return (
            <rect
              key={`${r}-${c}`}
              x={padding + c * cellSize}
              y={padding + r * cellSize}
              width={cellSize - 0.2}
              height={cellSize - 0.2}
              fill={fgColor}
              rx={1.5}
            />
          );
        })
      )}
    </svg>
  );
};

export default QRCodeSVG;
