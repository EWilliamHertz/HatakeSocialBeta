import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function usePokemonSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to the custom server's pokemon socket path
    const socketIo = io({
      path: '/pokemon/socket.io',
      autoConnect: true,
    });

    socketIo.on('connect', () => {
      console.log('Connected to Pokemon Engine');
      setConnected(true);
    });

    socketIo.on('disconnect', () => {
      console.log('Disconnected from Pokemon Engine');
      setConnected(false);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  return { socket, connected };
}
