import { DeprecatedProperty, SingleToken } from '@/types/tokens';

type DeprecationFields = Pick<SingleToken, 'deprecated'> & { $deprecated?: DeprecatedProperty | null };

/** Reads upstream metadata or the team's existing boolean/string without migrating stored tokens. */
export function getTokenDeprecation(token: DeprecationFields): DeprecatedProperty | undefined {
  if (token.$deprecated) return token.$deprecated;
  if (!token.deprecated) return undefined;
  return { severity: 'warning', message: typeof token.deprecated === 'string' ? token.deprecated : '' };
}

/** Keeps legacy edits compatible with figma2flutter; advanced metadata explicitly uses the upstream format. */
export function setTokenDeprecation<T extends DeprecationFields>(token: T, metadata: DeprecatedProperty | undefined): T {
  const usesLegacyFormat = !token.$deprecated && ('deprecated' in token || !('$deprecated' in token));
  if (usesLegacyFormat && (!metadata || (metadata.severity === 'warning' && !metadata.replacementToken && !metadata.removeAfter))) {
    return { ...token, deprecated: metadata ? metadata.message || true : undefined, $deprecated: undefined };
  }
  const { deprecated: legacyDeprecated, ...nativeToken } = token;
  return { ...nativeToken, $deprecated: metadata } as T;
}
