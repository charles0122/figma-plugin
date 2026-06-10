import { AliasDollarRegex, AliasRegex } from '@/constants/AliasRegex';
import { SingleToken } from '@/types/tokens';

const OPENING_BRACE = '{';
const CLOSING_BRACE = '}';

export interface TokenReference {
  name: string;        // 引用方的 token 名称
  value: string;       // 引用方的原始值
  tokenSet: string;    // 所属 token set
}

export const findReferences = (tokenValue: string) => {
  const matches = tokenValue?.toString().match(AliasRegex);
  if (matches) {
    return matches.map((item) => {
      if (item.startsWith('{')) {
        return item.slice(1, item.length - 1);
      }
      return item.substring(1);
    });
  }
  return null;
};

export const findDollarReferences = (tokenValue: string) => tokenValue?.toString().match(AliasDollarRegex);

export const findMatchingReferences = (tokenValue: string, valueToLookFor: string) => {
  const references = findReferences(tokenValue);

  if (references) {
    return references.filter((ref) => {
      if (ref === valueToLookFor) return ref;
      return false;
    });
  }
  return [];
};

export const replaceReferences = (tokenValue: string, oldName: string, newName: string) => {
  try {
    if (tokenValue.includes(oldName)) {
      const references = findMatchingReferences(tokenValue, oldName);
      let newValue = tokenValue;
      references.forEach((reference) => {
        newValue = newValue.replace(reference, newName);
      });
      return newValue;
    }
  } catch (e) {
    console.log('Error replacing reference', tokenValue, oldName, newName, e);
  }

  return tokenValue;
};

export const getRootReferences = (tokenValue: string) => {
  const array:string[] = [];
  let depth = 0;
  let startIndex = 0;
  for (let i = 0; i < tokenValue.length; i += 1) {
    if (tokenValue[i] === OPENING_BRACE) {
      if (depth === 0) {
        startIndex = i;
      }
      depth += 1;
    }
    if (tokenValue[i] === CLOSING_BRACE && depth > 0) {
      depth -= 1;
      if (depth === 0) {
        array.push(tokenValue.substring(startIndex, i + 1));
      }
    }
  }

  return array.concat(findDollarReferences(tokenValue) || []);
};

/**
 * 递归获取值中的所有字符串，用于搜索引用
 */
const extractStringsFromValue = (value: unknown): string[] => {
  if (value === null || value === undefined) {
    return [];
  }
  if (typeof value === 'string') {
    return [value];
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap((v) => extractStringsFromValue(v));
  }
  if (typeof value === 'object') {
    return Object.values(value).flatMap((v) => extractStringsFromValue(v));
  }
  return [];
};

/**
 * 获取 token 值的字符串表示，用于搜索引用
 */
const getTokenValueString = (value: SingleToken['value']): string => extractStringsFromValue(value).join(' ');

/**
 * 检查 token 值中是否包含对指定 token 的引用
 * 优先使用 rawValue，因为 value 可能已经被解析
 */
const hasReferenceToToken = (token: SingleToken, tokenName: string): boolean => {
  // 优先使用 rawValue，因为它保留了原始的引用格式
  const valueToCheck = token.rawValue !== undefined ? token.rawValue : token.value;
  const strings = extractStringsFromValue(valueToCheck);
  return strings.some((str) => findMatchingReferences(str, tokenName).length > 0);
};

/**
 * 查找所有引用指定 token 的 tokens（反向引用）
 * @param tokenName 要查找的 token 名称
 * @param allTokens 所有 tokens 列表
 * @returns 引用该 token 的所有 token 信息
 */
export const findReverseReferences = (
  tokenName: string,
  allTokens: SingleToken[],
): TokenReference[] => {
  const references: TokenReference[] = [];

  allTokens.forEach((token) => {
    // 跳过自身
    if (token.name === tokenName) return;

    if (hasReferenceToToken(token, tokenName)) {
      const rawValueStr = token.rawValue !== undefined 
        ? getTokenValueString(token.rawValue as SingleToken['value']) 
        : getTokenValueString(token.value);
      references.push({
        name: token.name,
        value: rawValueStr,
        tokenSet: token.internal__Parent || '',
      });
    }
  });

  return references;
};
