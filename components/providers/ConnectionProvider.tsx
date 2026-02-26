import React, {createContext, useContext, useMemo} from 'react';
import {Connection, clusterApiUrl} from '@solana/web3.js';
import {SOLANA_CLUSTER} from '../../config/env';

interface ConnectionContextType {
  connection: Connection;
}

const ConnectionContext = createContext<ConnectionContextType>({
  connection: new Connection(clusterApiUrl('devnet')),
});

export function useConnection(): Connection {
  return useContext(ConnectionContext).connection;
}

export function ConnectionProvider({children}: {children: React.ReactNode}) {
  const connection = useMemo(
    () => new Connection(clusterApiUrl(SOLANA_CLUSTER), 'confirmed'),
    [],
  );

  return (
    <ConnectionContext.Provider value={{connection}}>
      {children}
    </ConnectionContext.Provider>
  );
}
