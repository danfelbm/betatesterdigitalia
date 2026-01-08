'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { UserRole } from '@/types/database'

interface UserContextType {
  role: UserRole
  isAdmin: boolean
  isRegular: boolean
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({
  children,
  role
}: {
  children: ReactNode
  role: UserRole
}) {
  const value: UserContextType = {
    role,
    isAdmin: role === 'admin',
    isRegular: role === 'regular',
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export function useIsAdmin() {
  const { isAdmin } = useUser()
  return isAdmin
}
