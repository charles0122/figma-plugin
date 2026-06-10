import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Heading, Stack } from '@tokens-studio/ui';
import Box from './Box';
import Text from './Text';
import { TokenReference } from '@/utils/findReferences';
import { styled } from '@/stitches.config';

const StyledReferenceItem = styled('div', {
  padding: '$2 $3',
  backgroundColor: '$bgSubtle',
  borderRadius: '$small',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  '&:hover': {
    backgroundColor: '$bgDefault',
  },
});

const StyledToggleButton = styled('button', {
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
  background: 'none',
  border: 'none',
  padding: '$2 0',
  cursor: 'pointer',
  color: '$fgDefault',
  width: '100%',
  textAlign: 'left',
  '&:hover': {
    color: '$fgMuted',
  },
});

type Props = {
  references: TokenReference[];
  onReferenceClick?: (reference: TokenReference) => void;
};

export const TokenReferencesList: React.FC<Props> = ({
  references,
  onReferenceClick,
}) => {
  const { t } = useTranslation(['tokens']);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleToggle = React.useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleReferenceClick = React.useCallback((reference: TokenReference) => {
    if (onReferenceClick) {
      onReferenceClick(reference);
    }
  }, [onReferenceClick]);

  if (references.length === 0) {
    return null;
  }

  return (
    <Box>
      <StyledToggleButton type="button" onClick={handleToggle}>
        {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        <Heading size="small">
          {t('references')}
          {' '}
          ({references.length})
        </Heading>
      </StyledToggleButton>
      {isExpanded && (
        <Stack direction="column" gap={2} css={{ marginTop: '$2' }}>
          {references.map((reference) => (
            <StyledReferenceItem
              key={`${reference.tokenSet}-${reference.name}`}
              onClick={() => handleReferenceClick(reference)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleReferenceClick(reference);
                }
              }}
            >
              <Text size="small" bold css={{ color: '$fgDefault', display: 'block' }}>
                {reference.name}
              </Text>
              {reference.tokenSet && (
                <Text size="xsmall" css={{ color: '$fgMuted', display: 'block', marginTop: '$1' }}>
                  {reference.tokenSet}
                </Text>
              )}
            </StyledReferenceItem>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default TokenReferencesList;
