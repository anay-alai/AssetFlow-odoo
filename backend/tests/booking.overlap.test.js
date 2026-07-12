const { rangesOverlap, validateWindow } = require('../src/services/booking.service');

// Existing booking: 09:00 - 10:00 on a fixed day.
const E_START = '2026-01-01T09:00:00Z';
const E_END = '2026-01-01T10:00:00Z';
const ov = (ns, ne) => rangesOverlap(E_START, E_END, ns, ne);

describe('booking overlap matrix (existing 09:00–10:00)', () => {
    test('exact match -> conflict', () => {
        expect(ov('2026-01-01T09:00:00Z', '2026-01-01T10:00:00Z')).toBe(true);
    });
    test('new inside existing -> conflict', () => {
        expect(ov('2026-01-01T09:15:00Z', '2026-01-01T09:45:00Z')).toBe(true);
    });
    test('existing inside new -> conflict', () => {
        expect(ov('2026-01-01T08:30:00Z', '2026-01-01T10:30:00Z')).toBe(true);
    });
    test('partial overlap at start -> conflict', () => {
        expect(ov('2026-01-01T08:30:00Z', '2026-01-01T09:30:00Z')).toBe(true);
    });
    test('partial overlap at end -> conflict', () => {
        expect(ov('2026-01-01T09:30:00Z', '2026-01-01T10:30:00Z')).toBe(true);
    });
    test('back-to-back before (…–09:00) -> NO conflict', () => {
        expect(ov('2026-01-01T08:00:00Z', '2026-01-01T09:00:00Z')).toBe(false);
    });
    test('back-to-back after (10:00–…) -> NO conflict', () => {
        expect(ov('2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z')).toBe(false);
    });
    test('no overlap same day -> NO conflict', () => {
        expect(ov('2026-01-01T14:00:00Z', '2026-01-01T15:00:00Z')).toBe(false);
    });
    test('no overlap different day -> NO conflict', () => {
        expect(ov('2026-01-02T09:00:00Z', '2026-01-02T10:00:00Z')).toBe(false);
    });
});

describe('validateWindow', () => {
    test('rejects missing times', () => {
        expect(validateWindow(null, E_END).valid).toBe(false);
    });
    test('rejects end <= start', () => {
        expect(validateWindow(E_END, E_START).valid).toBe(false);
    });
    test('accepts a valid window', () => {
        expect(validateWindow(E_START, E_END).valid).toBe(true);
    });
});
