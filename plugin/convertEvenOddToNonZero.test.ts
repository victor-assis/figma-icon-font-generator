import { describe, expect, it } from 'vitest';
import convertEvenOddToNonZero from './convertEvenOddToNonZero';

describe('convertEvenOddToNonZero', () => {
  it('converts evenodd paths to nonzero and reverses holes', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M0 0L10 0L10 10L0 10Z M2 2L8 2L8 8L2 8Z"/></svg>';
    const result = convertEvenOddToNonZero(svg) as string;
    expect(result).toContain('fill-rule="nonzero"');
    expect(result).not.toContain('fill-rule="evenodd"');
    expect(result).toContain('M2 8L8 8 8 2 2 2Z');
  });

  it('keeps independent subpaths untouched', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M0 0L10 0L10 10L0 10Z M20 0L30 0L30 10L20 10Z"/></svg>';
    const result = convertEvenOddToNonZero(svg) as string;
    expect(result).toContain('fill-rule="nonzero"');
    expect(result).toContain('M20 0L30 0L30 10L20 10Z');
  });
});
