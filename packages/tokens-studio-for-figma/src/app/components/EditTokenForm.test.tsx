import React from 'react';
import { Provider } from 'react-redux';
import {
  createMockStore, fireEvent, render, resetStore,
} from '../../../tests/config/setupTest';
import { EditTokenObject, TokenTypeSchema } from '@/types/tokens';
import { EditTokenFormStatus } from '@/constants/EditTokenFormStatus';
import { TokenTypes } from '@/constants/TokenTypes';
import EditTokenForm from './EditTokenForm';

const mockCreateSingleToken = jest.fn();
const mockEditSingleToken = jest.fn();
jest.mock('../store/useManageTokens', () => jest.fn(() => ({
  createSingleToken: mockCreateSingleToken,
  editSingleToken: mockEditSingleToken,
})));

describe('EditTokenForm', () => {
  beforeEach(() => {
    resetStore();
  });
  it('should render editTokenForm', () => {
    const mockStore = createMockStore({
      uiState: {
        showEditForm: true,
        showAutoSuggest: true,
        editToken: {
          initialName: '',
          name: '',
          status: EditTokenFormStatus.CREATE,
          schema: {
            type: TokenTypes.SIZING,
            value: {
              type: 'string',
            },
          } as unknown as TokenTypeSchema,
        } as EditTokenObject,
      },
    });

    const result = render(
      <Provider store={mockStore}>
        <EditTokenForm resolvedTokens={[]} />
      </Provider>,
    );

    expect(result.getByText('create')).toBeInTheDocument();
    result.unmount();
  });

  it('should create a new token', () => {
    const mockStore = createMockStore({
      uiState: {
        showEditForm: true,
        showAutoSuggest: true,
        editToken: {
          initialName: '',
          name: '',
          status: EditTokenFormStatus.CREATE,
          schema: {
            type: TokenTypes.SIZING,
            value: {
              type: 'string',
            },
          } as unknown as TokenTypeSchema,
        } as EditTokenObject,
      },
      tokenState: {
        tokens: {
          global: [],
        },
      },
    });

    const result = render(
      <Provider store={mockStore}>
        <EditTokenForm resolvedTokens={[]} />
      </Provider>,
    );

    const nameInputElement = result.getByTestId('input-name');
    const valueInputElement = result.getByTestId('mention-input-value');
    fireEvent.change(nameInputElement, { target: { value: 'size-token' } });
    fireEvent.change(valueInputElement, { target: { value: '12' } });
    const createButton = result.getByText('create');
    createButton.click();
    expect(mockCreateSingleToken).toBeCalledTimes(1);
  });

  it('keeps a legacy deprecation message when editing a token', () => {
    const token = {
      name: 'old-size',
      initialName: 'old-size',
      value: '12',
      type: TokenTypes.SIZING,
      deprecated: 'Old message',
      status: EditTokenFormStatus.EDIT,
      schema: { type: TokenTypes.SIZING, value: { type: 'string' } },
    } as EditTokenObject;
    const mockStore = createMockStore({
      uiState: { showEditForm: true, editToken: token },
      tokenState: { tokens: { global: [token] } },
    });
    const result = render(<Provider store={mockStore}><EditTokenForm resolvedTokens={[]} /></Provider>);
    fireEvent.change(result.getByDisplayValue('Old message'), { target: { value: 'Use new-size' } });
    fireEvent.click(result.getByText('save'));
    expect(mockEditSingleToken).toHaveBeenCalledWith(expect.objectContaining({ deprecated: 'Use new-size' }));
    expect(mockEditSingleToken.mock.calls[0][0].$deprecated).toBeUndefined();
  });
});
