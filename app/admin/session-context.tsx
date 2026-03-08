'use client'

import { createContext, useContext } from 'react'

export type UserRole = 'super_admin' | 'admin' | 'social_admin' | 'crew'

export interface SessionData {
  username: string
  role: UserRole
  displayName: string
}

export const SessionContext = createContext<SessionData | null>(null)
export const useSession = () => useContext(SessionContext)
