import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react';
import { createMockStore } from '../../../tests/config/setupTest';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useIsProUser } from './useIsProUser';

describe('team Pro debug behavior', () => {
  it('keeps the team override without a license or subscription', () => {
    useAuthStore.setState({ isPro: false });
    const store = createMockStore({ userState: { licenseKey: undefined, licenseError: undefined } });
    const result = renderHook(() => useIsProUser(), {
      wrapper: ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>,
    });
    expect(result.result.current).toBe(true);
  });
});
