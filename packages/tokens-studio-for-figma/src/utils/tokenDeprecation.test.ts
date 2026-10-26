import { TokenTypes } from '@/constants/TokenTypes';
import { TokenFormatOptions, setFormat } from '@/plugin/TokenFormatStoreClass';
import { singleTokenSchema } from '@/storage/schemas/singleTokenSchema';
import { getTokenDeprecation, setTokenDeprecation } from './tokenDeprecation';
import convertToTokenArray from './convertTokens';
import { convertTokenToFormat } from './convertTokenToFormat';
import stringifyTokens from './stringifyTokens';
import { updateTokenPayloadToSingleToken } from './updateTokenPayloadToSingleToken';

const metadata = {
  severity: 'warning' as const,
  message: 'Use {color.new} instead',
  replacementToken: '{color.new}',
  removeAfter: 'v3.0',
};
const token = { name: 'old', type: TokenTypes.COLOR, value: '#000000' };

describe('team deprecation compatibility', () => {
  afterEach(() => setFormat(TokenFormatOptions.DTCG));

  it.each([TokenFormatOptions.Legacy, TokenFormatOptions.DTCG])('round trips old values in %s format', (format) => {
    setFormat(format);
    [true, false, 'Use {color.new} instead'].forEach((deprecated) => {
      const input = convertTokenToFormat({ ...token, deprecated });
      const parsed = convertToTokenArray({ tokens: { old: JSON.parse(JSON.stringify(input)) } });
      expect(parsed[0].deprecated).toBe(deprecated);
      expect(convertTokenToFormat(parsed[0])).toEqual(input);
      const json = JSON.parse(stringifyTokens({ global: parsed }, 'global'));
      expect(json.old[format === TokenFormatOptions.DTCG ? '$deprecated' : 'deprecated']).toBe(deprecated);
    });
  });

  it.each([TokenFormatOptions.Legacy, TokenFormatOptions.DTCG])('preserves native metadata in %s format', (format) => {
    setFormat(format);
    const input = convertTokenToFormat({ ...token, $deprecated: metadata });
    expect(singleTokenSchema.safeParse(input).success).toBe(true);
    const parsed = convertToTokenArray({ tokens: { old: JSON.parse(JSON.stringify(input)) } });
    expect(parsed[0].$deprecated).toEqual(metadata);
    expect(convertTokenToFormat(parsed[0])).toEqual(input);
  });

  it('gives upstream metadata priority over a legacy value', () => {
    setFormat(TokenFormatOptions.DTCG);
    const mixed = { ...token, deprecated: 'old message', $deprecated: metadata };
    expect(convertTokenToFormat(mixed).$deprecated).toEqual(metadata);
    expect(getTokenDeprecation(mixed)).toEqual(metadata);
  });

  it.each([true, 'Use a newer token'])('reads legacy %s as warning metadata without changing it', (deprecated) => {
    const original = { ...token, deprecated };
    expect(getTokenDeprecation(original)).toEqual({ severity: 'warning', message: typeof deprecated === 'string' ? deprecated : '' });
    expect(original).toEqual({ ...token, deprecated });
  });

  it.each([false, undefined, ''])('does not mark legacy %s as deprecated', (deprecated) => {
    expect(getTokenDeprecation({ ...token, deprecated })).toBeUndefined();
  });

  it('edits and toggles legacy metadata without migrating the file format', () => {
    const original = { ...token, deprecated: 'Old message' };
    const edited = setTokenDeprecation(original, { severity: 'warning', message: 'New message' });
    expect(edited.deprecated).toBe('New message');
    expect(edited.$deprecated).toBeUndefined();
    const cleared = setTokenDeprecation(edited, undefined);
    expect(getTokenDeprecation(cleared)).toBeUndefined();
    expect(setTokenDeprecation(cleared, { severity: 'warning', message: '' }).deprecated).toBe(true);
    expect(original.deprecated).toBe('Old message');
  });

  it('uses native metadata when a legacy token explicitly adds advanced fields', () => {
    const edited = setTokenDeprecation({ ...token, deprecated: true }, metadata);
    expect(edited.$deprecated).toEqual(metadata);
    expect(edited.deprecated).toBeUndefined();
  });

  it('clears both representations when native deprecation is disabled', () => {
    const cleared = setTokenDeprecation({ ...token, deprecated: true, $deprecated: metadata }, undefined);
    expect(cleared.$deprecated).toBeUndefined();
    expect(cleared.deprecated).toBeUndefined();
  });
  it('keeps native metadata native after toggling off and on', () => {
    const original = { ...token, $deprecated: metadata };
    const cleared = setTokenDeprecation(original, undefined);
    const enabled = setTokenDeprecation(cleared, { severity: 'warning', message: '' });
    expect(enabled.$deprecated).toEqual({ severity: 'warning', message: '' });
    expect(enabled.deprecated).toBeUndefined();
  });
  it('keeps simple deprecation compatible after clearing, saving and reloading a legacy token', () => {
    const cleared = setTokenDeprecation({ ...token, deprecated: 'Old message' }, undefined);
    const saved = updateTokenPayloadToSingleToken({ ...cleared, parent: 'global' });
    const reloaded = JSON.parse(JSON.stringify(saved));
    const enabled = setTokenDeprecation(reloaded, { severity: 'warning', message: 'Use new' });
    expect(enabled.deprecated).toBe('Use new');
    expect(enabled.$deprecated).toBeUndefined();
  });
});
