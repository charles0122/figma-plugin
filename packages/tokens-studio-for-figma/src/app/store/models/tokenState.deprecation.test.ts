import { StorageProviderType } from '@/constants/StorageProviderType';
import { pushToTokensStudioOAuth } from '../providers/tokens-studio/tokensStudioOAuth';
import { createMockStore } from '../../../../tests/config/setupTest';
import { TokenTypes } from '@/constants/TokenTypes';
import { store as globalStore } from '@/app/store';
import { createMultipleTokens } from './effects/tokenState/createMultipleTokens';

jest.mock('../providers/tokens-studio/tokensStudioOAuth', () => ({
  pushToTokensStudioOAuth: jest.fn(),
}));

describe('legacy deprecation reducer compatibility', () => {
  const token = {
    name: 'old', value: '#000', type: TokenTypes.COLOR, deprecated: 'Use new',
  };

  it('removes the legacy field when the editor clears deprecation', () => {
    const store = createMockStore({ tokenState: { tokens: { global: [token] } } });
    store.dispatch.tokenState.editToken({
      parent: 'global', name: 'old', type: token.type, value: token.value, deprecated: undefined, $deprecated: undefined,
    });
    expect(store.getState().tokenState.tokens.global[0].deprecated).toBeUndefined();
  });

  it('copies legacy deprecation to each selected token set', () => {
    const store = createMockStore({ tokenState: { tokens: { global: [token], other: [] } } });
    store.dispatch.tokenState.duplicateToken({
      ...token, parent: 'global', oldName: 'old', newName: 'copy', tokenSets: ['global', 'other'],
    });
    ['global', 'other'].forEach((set) => {
      expect(store.getState().tokenState.tokens[set].find((item) => item.name === 'copy')?.deprecated).toBe('Use new');
    });
  });
});

describe('deprecation sync payloads', () => {
  const token = {
    name: 'old', value: '#000', type: TokenTypes.COLOR, deprecated: 'Use new',
  };
  beforeEach(() => jest.clearAllMocks());

  it.each(['createToken', 'duplicateToken'] as const)('includes legacy metadata when %s syncs to Studio', async (action) => {
    const store = createMockStore({
      uiState: { api: { provider: StorageProviderType.TOKENS_STUDIO_OAUTH, internalId: 'studio' } as any },
      tokenState: { tokens: { global: [token] }, tokenSetMetadata: { global: { id: 'set' } } as any },
    });
    if (action === 'createToken') {
      await store.dispatch.tokenState.createToken({ ...token, name: 'new', parent: 'global' });
    } else {
      await store.dispatch.tokenState.duplicateToken({
        ...token, parent: 'global', oldName: 'old', newName: 'new', tokenSets: ['global'],
      });
    }
    expect(pushToTokensStudioOAuth).toHaveBeenCalledWith(expect.objectContaining({
      action: 'CREATE_TOKEN', data: expect.objectContaining({ $deprecated: { severity: 'warning', message: 'Use new' } }),
    }));
  });

  it('includes legacy metadata in the batch import payload', async () => {
    const state = {
      uiState: { api: { provider: StorageProviderType.TOKENS_STUDIO_OAUTH, changeSetId: 'change' } },
      tokenState: { tokenSetMetadata: { global: { id: 'set' } } },
    };
    const getState = jest.spyOn(globalStore, 'getState').mockReturnValue(state as any);
    try {
      await createMultipleTokens({} as any)([{ ...token, parent: 'global' }], state);
      expect(pushToTokensStudioOAuth).toHaveBeenCalledWith(expect.objectContaining({
        action: 'BATCH_CREATE_TOKENS',
        data: [expect.objectContaining({ $deprecated: { severity: 'warning', message: 'Use new' } })],
      }));
    } finally {
      getState.mockRestore();
    }
  });
});
