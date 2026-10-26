import React from 'react';
import { useIsProUser } from '@/app/hooks/useIsProUser';
import { render, resetStore, waitFor } from '../../../tests/config/setupTest';
import { store } from '../store';
import ProBadge from './ProBadge';

jest.mock('@/app/hooks/useIsProUser', () => ({ useIsProUser: jest.fn() }));
const mockUseIsProUser = useIsProUser as jest.MockedFunction<typeof useIsProUser>;
beforeEach(() => mockUseIsProUser.mockReturnValue(false));

describe('ProBadge', () => {
  beforeEach(() => {
    resetStore();
  });

  it('displays get pro badge if user is on free plan', () => {
    const { getByText } = render(<ProBadge campaign="test" />, { store });
    expect(getByText('getPro')).toBeInTheDocument();
  });

  it('displays pro badge if user is on pro plan', async () => {
    const { getByText, queryByText, rerender } = render(<ProBadge campaign="test" />, { store });
    mockUseIsProUser.mockReturnValue(true);
    store.dispatch.userState.setLicenseKey('test-key-123');
    rerender(<ProBadge campaign="test" />);

    await waitFor(() => {
      expect(queryByText('getPro')).not.toBeInTheDocument();
      expect(getByText('pro')).toBeInTheDocument();
    });
  });
});
