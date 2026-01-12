import React from 'react';
import { useTranslation } from 'react-i18next';
import { SingleToken } from '@/types/tokens';
import { TokenTooltipContentValue } from './TokenTooltipContentValue';
import Box from '../Box';
import Stack from '../Stack';
import Text from '../Text';
import { TokensContext } from '@/context';
import NotFoundBadge from './NotFoundBadge';

type Props = {
  token: SingleToken;
};

export const TokenTooltipContent: React.FC<React.PropsWithChildren<React.PropsWithChildren<Props>>> = ({ token }) => {
  const { t } = useTranslation(['tokens']);
  const tokensContext = React.useContext(TokensContext);

  const failedToResolve = React.useMemo(() => (
    tokensContext.resolvedTokens.find((t) => t.name === token.name)?.failedToResolve
  ), [token, tokensContext.resolvedTokens]);

  return (
    <Stack direction="column" gap={1} css={{ background: '$tooltipBg', fontSize: '$xsmall' }}>
      <Stack
        direction="row"
        justify="start"
        align="center"
        gap={2}
        css={{
          fontWeight: '$sansBold',
          color: '$tooltipFg',
          position: 'relative',
        }}
      >
        {token.name.split('.')[token.name.split('.').length - 1]}  
        {failedToResolve ? <NotFoundBadge /> : null}
        {token.deprecated && (
          <Box
            css={{
              padding: '$1 $2',
              borderRadius: '$small',
              backgroundColor: '$warningBg',
              color: '$warningFg',
              fontSize: '$xsmall',
              fontWeight: '$sansBold',
            }}
          >
            {t('deprecated')}
          </Box>
        )} 
      </Stack>

      <Stack direction="column" align="start" gap={2} wrap>
        <TokenTooltipContentValue token={token} />
      </Stack>
      {token.description && <Box css={{ color: '$tooltipFgMuted', padding: '$1 $2' }}>{token.description}</Box>}
      {token.deprecated && typeof token.deprecated === 'string' && (
        <Box
          css={{
            color: '$warningFg',
            padding: '$1 $2',
            backgroundColor: '$warningBg',
            borderRadius: '$small',
            fontSize: '$xsmall',
            border: '1px solid $borderWarning',
          }}
        >
          <Text size="xsmall" bold css={{ marginBottom: '$1', display: 'block' }}>
            {t('deprecated')}:
          </Text>
          <Text size="xsmall">{token.deprecated}</Text>
        </Box>
      )}
    </Stack>
  );
};
