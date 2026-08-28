import React, { createContext, useContext, useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { getNormalizedBaseUrl } from "@/lib/axios"

interface SocketContextValue {
  socket: Socket | null
  isConnected: boolean
  lastEvent: { type: string; payload: any } | null
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  lastEvent: null,
})

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any } | null>(null)

  useEffect(() => {
    // Connect to backend server URL (guaranteed base origin without /api)
    const backendUrl = getNormalizedBaseUrl()

    const socketInstance: Socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      withCredentials: true,
    })

    socketInstance.on("connect", () => {
      console.log("🔌 Connected to Native WebSocket Gateway");
      setIsConnected(true)
    })

    socketInstance.on("disconnect", (reason) => {
      console.log(`🔌 Disconnected from Native WebSocket Gateway: ${reason}`);
      setIsConnected(false)
    })

    socketInstance.on("connect_error", (error) => {
      console.warn("⚠️ WebSocket connection retry in progress:", error.message);
      setIsConnected(false)
    })

    socketInstance.on("complaint:created", (payload) => {
      setLastEvent({ type: "COMPLAINT_CREATED", payload })
    })

    socketInstance.on("complaint:assigned", (payload) => {
      setLastEvent({ type: "COMPLAINT_ASSIGNED", payload })
    })

    socketInstance.on("complaint:resolved", (payload) => {
      setLastEvent({ type: "COMPLAINT_RESOLVED", payload })
    })

    socketInstance.on("complaint:status_updated", (payload) => {
      setLastEvent({ type: "STATUS_UPDATED", payload })
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.removeAllListeners()
      socketInstance.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected, lastEvent }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
