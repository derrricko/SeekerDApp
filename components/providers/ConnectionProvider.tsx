import React, {createContext, useContext, useMemo} from 'react';
import {Connection} from '@solana/web3.js';
import {RPC_URL} from '../../config/env';

interface ConnectionContextType {
  connection: Connection;
}

const ConnectionContext = createContext<ConnectionContextType>({
  connection: new Connection(RPC_URL, 'confirmed'),
});

export function useConnection(): Connection {
  return useContext(ConnectionContext).connection;
}

export function ConnectionProvider({children}: {children: React.ReactNode}) {
  const connection = useMemo(() => new Connection(RPC_URL, 'confirmed'), []);

  return (
    <ConnectionContext.Provider value={{connection}}>
      {children}
    </ConnectionContext.Provider>
  );
}
