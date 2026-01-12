import { SingleToken } from '@/types/tokens';
import { AliasRegex } from '@/constants/AliasRegex';
import { findReferences } from './findReferences';
import { getPathName } from './getPathName';

/**
 * Resolves token references in deprecated description strings.
 * Supports {global.other.token} syntax to reference other tokens.
 * 
 * @param deprecated - The deprecated value (boolean or string)
 * @param allTokens - Array of all tokens to search for references
 * @param currentTokenName - Optional name of the current token (to avoid self-reference)
 * @returns The resolved deprecated description with token references replaced
 */
export function resolveDeprecatedDescription(
  deprecated: boolean | string | undefined,
  allTokens: SingleToken[] = [],
  currentTokenName?: string,
): boolean | string | undefined {
  // If deprecated is boolean or undefined, return as is
  if (typeof deprecated !== 'string') {
    return deprecated;
  }

  // Create a token map for quick lookup
  const tokenMap = new Map<string, SingleToken>();
  allTokens.forEach((token) => {
    if (token.name) {
      tokenMap.set(token.name, token);
    }
  });

  // Find all references in the deprecated string
  const references = findReferences(deprecated);
  if (!references || references.length === 0) {
    return deprecated;
  }

  let resolvedDescription = deprecated;

  // Resolve each reference
  for (const reference of references) {
    const tokenPath = getPathName(reference);
    
    // Skip self-reference
    if (currentTokenName && tokenPath === currentTokenName) {
      continue;
    }

    // Find the referenced token
    const referencedToken = tokenMap.get(tokenPath);
    
    if (referencedToken) {
      // Skip if the referenced token is also deprecated
      if (referencedToken.deprecated) {
        // Use the token name as fallback
        resolvedDescription = resolvedDescription.replace(
          `{${reference}}`,
          tokenPath,
        );
        continue;
      }

      // Resolve the reference - prefer token name, but can use value if it's a simple type
      let replacement: string;
      
      if (typeof referencedToken.value === 'string' || typeof referencedToken.value === 'number') {
        // For simple values, show both name and value
        replacement = `${tokenPath} (${referencedToken.value})`;
      } else {
        // For complex values, just show the name
        replacement = tokenPath;
      }

      resolvedDescription = resolvedDescription.replace(
        `{${reference}}`,
        replacement,
      );
    } else {
      // If token not found, keep the reference as is (or replace with path)
      resolvedDescription = resolvedDescription.replace(
        `{${reference}}`,
        tokenPath,
      );
    }
  }

  return resolvedDescription;
}
