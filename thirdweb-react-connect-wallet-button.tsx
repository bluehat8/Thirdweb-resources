import React from 'react';
import { ConnectButton } from "thirdweb/react";
import { useLanguage } from '@/contexts/LanguageContext';

interface LocalizedConnectButtonProps {
  client: any;
  chain?: any;
  theme?: "dark" | "light";
  connectButton?: {
    style?: React.CSSProperties;
  };
}

export const LocalizedConnectButton: React.FC<LocalizedConnectButtonProps> = ({
  client,
  chain,
  theme,
  connectButton,
  ...props
}) => {
  const { t } = useLanguage();

  return (
    <ConnectButton
      client={client}
      chain={chain}
      theme={theme}
      connectButton={{
        ...connectButton,
        label: t('wallet.connectWallet')
      }}
      {...props}
    />
  );
}; 
