import React from 'react';
import { TokensContext } from '@/context';
import { findReverseReferences, TokenReference } from '@/utils/findReferences';

export interface TokenReferencesResult {
  count: number;
  references: TokenReference[];
}

/**
 * Hook 用于获取指定 token 被引用的情况
 * @param tokenName 要查找的 token 名称
 * @returns 引用数量和引用列表
 */
export function useTokenReferences(tokenName: string): TokenReferencesResult {
  const tokensContext = React.useContext(TokensContext);

  return React.useMemo(() => {
    if (!tokenName) {
      return { count: 0, references: [] };
    }

    const references = findReverseReferences(
      tokenName,
      tokensContext.resolvedTokens,
    );

    return {
      count: references.length,
      references,
    };
  }, [tokenName, tokensContext.resolvedTokens]);
}
