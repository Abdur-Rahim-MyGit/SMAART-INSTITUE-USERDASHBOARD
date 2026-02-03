/**
 * Color utility functions for theme customization
 * Handles conversion between HEX and HSL color formats
 */

/**
 * Convert HEX color to HSL format
 * @param {string} hex - HEX color code (e.g., "#008081")
 * @returns {string} HSL values as string (e.g., "180 100% 25%")
 */
export function hexToHSL(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}

/**
 * Convert HSL to HEX color
 * @param {string} hsl - HSL values as string (e.g., "180 100% 25%")
 * @returns {string} HEX color code (e.g., "#008081")
 */
export function hslToHex(hsl) {
    const parts = hsl.split(' ');
    const h = parseInt(parts[0]) / 360;
    const s = parseInt(parts[1]) / 100;
    const l = parseInt(parts[2]) / 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (x) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Validate HEX color code
 * @param {string} hex - HEX color code
 * @returns {boolean} True if valid HEX color
 */
export function isValidHex(hex) {
    return /^#?[0-9A-Fa-f]{6}$/.test(hex);
}

/**
 * Ensure HEX color has # prefix
 * @param {string} hex - HEX color code
 * @returns {string} HEX color with # prefix
 */
export function normalizeHex(hex) {
    return hex.startsWith('#') ? hex : `#${hex}`;
}
