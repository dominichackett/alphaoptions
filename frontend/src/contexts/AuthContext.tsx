import React, { createContext, useContext, ReactNode } from 'react'
import { useWeb3AuthSupabase } from '../hooks/useWeb3AuthSupabase'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  web3AuthUser: any
  supabaseUser: User | null
  loading: boolean
  error: string | null
  signInWithSupabase: () => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const {
    web3AuthUser,
    supabaseUser,
    loading,
    error,
    signInWithSupabase,
    signOut,
  } = useWeb3AuthSupabase()

  const isAuthenticated = !!(web3AuthUser && supabaseUser)

  return (
    <AuthContext.Provider value={{
      web3AuthUser,
      supabaseUser,
      loading,
      error,
      signInWithSupabase,
      signOut,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  )
}