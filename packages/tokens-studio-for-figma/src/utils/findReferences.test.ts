import { findMatchingReferences, findReferences, replaceReferences, findReverseReferences } from './findReferences';
import { TokenTypes } from '@/constants/TokenTypes';
import { SingleToken } from '@/types/tokens';

describe('findReferences', () => {
  it('returns references in a string', () => {
    expect(findReferences('$colors.blue')).toEqual(['colors.blue']);
    expect(findReferences('{colors.blue}')).toEqual(['colors.blue']);
    expect(findReferences('rgba({colors.blue})')).toEqual(['colors.blue']);
    expect(findReferences('{colors.blue} * 2')).toEqual(['colors.blue']);
    expect(findReferences('{colors.blue} * {colors.red}')).toEqual(['colors.blue', 'colors.red']);
    expect(findReferences('{colors.the one with spacing} * {colors.red}')).toEqual([
      'colors.the one with spacing',
      'colors.red',
    ]);
  });
});

describe('findMatchingReferences', () => {
  it('returns references in a string that match token name', () => {
    expect(findMatchingReferences('$colors.blue', 'colors.blue')).toEqual(['colors.blue']);
    expect(findMatchingReferences('{colors.blue}', 'colors.blue')).toEqual(['colors.blue']);
    expect(findMatchingReferences('rgba({colors.blue})', 'colors.blue')).toEqual(['colors.blue']);
    expect(findMatchingReferences('{colors.blue} * 2', 'colors.blue')).toEqual(['colors.blue']);
    expect(findMatchingReferences('{colors.blue} * {colors.red}', 'colors.blue')).toEqual(['colors.blue']);
  });

  it('returns empty if it doesnt match', () => {
    expect(findMatchingReferences('$colors.blue', 'colors.red')).toEqual([]);
    expect(findMatchingReferences('{colors.blue}', 'colors.red')).toEqual([]);
    expect(findMatchingReferences('rgba({colors.blue})', 'colors.red')).toEqual([]);
    expect(findMatchingReferences('{colors.blue} * 2', 'colors.red')).toEqual([]);
    expect(findMatchingReferences('{colors.blue} * {colors.red}', 'colors.yellow')).toEqual([]);
  });
});

describe('replaceReferences', () => {
  it('replaces references with new name', () => {
    expect(replaceReferences('{colors.blue}', 'colors.blue', 'colors.yellow')).toEqual('{colors.yellow}');
    expect(replaceReferences('rgba({colors.blue})', 'colors.blue', 'colors.yellow')).toEqual(
      'rgba({colors.yellow})',
    );
    expect(replaceReferences('{colors.blue} * 2', 'colors.blue', 'colors.yellow')).toEqual('{colors.yellow} * 2');
    expect(replaceReferences('{colors.blue} * {colors.red}', 'colors.blue', 'colors.yellow')).toEqual(
      '{colors.yellow} * {colors.red}',
    );
  });

  it('replaces references with new name and changes alias syntax', () => {
    expect(replaceReferences('$colors.blue', 'colors.blue', 'colors.yellow')).toEqual('$colors.yellow');
  });

  it('doesnt replace anything if it doesnt match empty if it doesnt match', () => {
    expect(replaceReferences('$colors.blue', 'colors.other', 'colors.yellow')).toEqual('$colors.blue');
    expect(replaceReferences('{colors.blue}', 'colors.other', 'colors.yellow')).toEqual('{colors.blue}');
    expect(replaceReferences('rgba({colors.blue})', 'colors.other', 'colors.yellow')).toEqual(
      'rgba({colors.blue})',
    );
    expect(replaceReferences('{colors.blue} * 2', 'colors.other', 'colors.yellow')).toEqual('{colors.blue} * 2');
    expect(replaceReferences('{colors.blue} * {colors.red}', 'colors.other', 'colors.yellow')).toEqual(
      '{colors.blue} * {colors.red}',
    );
  });
});

describe('findReverseReferences', () => {
  const mockTokens: SingleToken[] = [
    { name: 'colors.primary', value: '#ff0000', type: TokenTypes.COLOR, internal__Parent: 'global' },
    { name: 'colors.secondary', value: '{colors.primary}', type: TokenTypes.COLOR, internal__Parent: 'global' },
    { name: 'colors.tertiary', value: 'rgba({colors.primary}, 0.5)', type: TokenTypes.COLOR, internal__Parent: 'global' },
    { name: 'spacing.small', value: '8px', type: TokenTypes.SPACING, internal__Parent: 'global' },
    { name: 'typography.heading', value: { fontFamily: '{fonts.primary}', fontSize: '16px' }, type: TokenTypes.TYPOGRAPHY, internal__Parent: 'theme' },
  ] as SingleToken[];

  it('finds tokens that reference the specified token', () => {
    const references = findReverseReferences('colors.primary', mockTokens);
    expect(references).toHaveLength(2);
    expect(references.map((r) => r.name)).toContain('colors.secondary');
    expect(references.map((r) => r.name)).toContain('colors.tertiary');
  });

  it('returns empty array when no references exist', () => {
    const references = findReverseReferences('spacing.small', mockTokens);
    expect(references).toHaveLength(0);
  });

  it('excludes self from results', () => {
    const references = findReverseReferences('colors.secondary', mockTokens);
    expect(references.map((r) => r.name)).not.toContain('colors.secondary');
  });

  it('finds references in complex token values like typography', () => {
    const tokensWithFontRef: SingleToken[] = [
      { name: 'fonts.primary', value: 'Inter', type: TokenTypes.FONT_FAMILIES, internal__Parent: 'global' },
      { name: 'typography.heading', value: { fontFamily: '{fonts.primary}', fontSize: '16px' }, type: TokenTypes.TYPOGRAPHY, internal__Parent: 'theme' },
    ] as SingleToken[];

    const references = findReverseReferences('fonts.primary', tokensWithFontRef);
    expect(references).toHaveLength(1);
    expect(references[0].name).toBe('typography.heading');
    expect(references[0].tokenSet).toBe('theme');
  });

  it('includes tokenSet in the result', () => {
    const references = findReverseReferences('colors.primary', mockTokens);
    expect(references.every((r) => r.tokenSet === 'global')).toBe(true);
  });
});
