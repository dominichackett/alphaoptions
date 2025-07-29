import { useState, useEffect, useCallback } from 'react'
import { useWeb3Auth } from '@web3auth/modal/react'
import { supabase } from '../lib/supabase' // Fixed typo: superbase -> supabase
import { User } from '@supabase/supabase-js'

interface Web3AuthSupabaseUser {
  web3AuthUser: any
  supabaseUser: User | null
  loading: boolean
  error: string | null
}

export const useWeb3AuthSupabase = (): Web3AuthSupabaseUser & {
  signInWithSupabase: () => Promise<void>
  signOut: () => Promise<void>
} => {
  const {
     web3Auth,
     isConnected,
     user: web3AuthUserFromHook, // Rename this since it's not working
     logout: logout,
     status
   } = useWeb3Auth()
     
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false)
  const [web3AuthUser, setWeb3AuthUser] = useState<any>(null) // Our own user state

  // Manually fetch user when Web3Auth connects
  useEffect(() => {
    const fetchUser = async () => {
      if (web3Auth && web3Auth.connected && status === 'connected' && !web3AuthUser) {
        try {
          console.log('Fetching user data manually...')
          const userInfo = await web3Auth.getUserInfo()
          console.log('Manual fetch successful:', !!userInfo)
          setWeb3AuthUser(userInfo)
        } catch (error) {
          console.error('Manual user fetch failed:', error)
        }
      }
    }

    fetchUser()
  }, [web3Auth, status, isConnected, web3AuthUser])

  // Clear user when disconnected - BUT keep Supabase session
  useEffect(() => {
    if (!isConnected || status !== 'connected') {
      setWeb3AuthUser(null)
      // Don't clear Supabase user - let it persist
      // setSupabaseUser(null) // REMOVED
    }
  }, [isConnected, status])

  // Add debug logging to see what's happening with Web3Auth user
  console.log('=== useWeb3AuthSupabase Debug ===')
  console.log('isConnected:', isConnected)
  console.log('status:', status)
  console.log('web3AuthUserFromHook:', web3AuthUserFromHook)
  console.log('web3AuthUser (manual):', !!web3AuthUser)
  console.log('supabaseUser:', !!supabaseUser)
  console.log('loading:', loading)
  console.log('hasAttemptedAuth:', hasAttemptedAuth)
  
  // Check what isAuthenticated should be
  const shouldBeAuthenticated = !!(web3AuthUser && supabaseUser)
  console.log('Should be authenticated:', shouldBeAuthenticated)
  console.log('===================================')

 // Add this debugging to your signInWithSupabase function
const signInWithSupabase = useCallback(async () => {
  console.log('=== signInWithSupabase DEBUG ===')
  console.log('signInWithSupabase called', { isConnected, web3AuthUser: !!web3AuthUser, web3Auth: !!web3Auth, status })
  
  if (!isConnected || !web3AuthUser || !web3Auth) {
    const errorMsg = `Web3Auth not ready: connected=${isConnected}, user=${!!web3AuthUser}, instance=${!!web3Auth}, status=${status}`
    console.error(errorMsg)
    setError(errorMsg)
    return
  }

  try {
    setLoading(true)
    setError(null)
    console.log('Starting Supabase authentication...')

    const userEmail = web3AuthUser.email || `${web3AuthUser.sub}@web3auth.io`
    const userPassword = web3AuthUser.sub || 'web3auth-user'

    console.log('Attempting sign in with:', { email: userEmail, hasPassword: !!userPassword })

    // Try to sign in
    const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword,
    })

    console.log('Sign in result:', { 
      user: !!data?.user, 
      session: !!data?.session, 
      error: supabaseError?.message 
    })

    // If sign in fails, try to sign up
    if (supabaseError && supabaseError.message.includes('Invalid login credentials')) {
      console.log('User not found, creating account...')
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: userEmail,
        password: userPassword,
        options: {
          data: {
            name: web3AuthUser.name,
            picture: web3AuthUser.profileImage,
            web3auth_sub: web3AuthUser.sub,
            provider: web3AuthUser.typeOfLogin,
          }
        }
      })
      
      console.log('Sign up result:', { 
        user: !!signUpData?.user, 
        session: !!signUpData?.session, 
        error: signUpError?.message 
      })
      
      if (signUpError) {
        throw new Error(`Failed to create Supabase user: ${signUpError.message}`)
      }
      
      console.log('Setting supabase user from signup:', !!signUpData.user)
      setSupabaseUser(signUpData.user)
    } else if (supabaseError) {
      throw supabaseError
    } else {
      console.log('Setting supabase user from signin:', !!data.user)
      setSupabaseUser(data.user)
    }

    // IMPORTANT: Check if session was actually created
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    console.log('Current session after auth:', !!currentSession)
    
    setHasAttemptedAuth(true)
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Authentication failed'
    console.error('Web3Auth + Supabase integration error:', err)
    setError(errorMsg)
    setHasAttemptedAuth(true)
  } finally {
    setLoading(false)
    console.log('=== signInWithSupabase END ===')
  }
}, [web3Auth, web3AuthUser, isConnected, status])
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
             
      // Sign out from both Web3Auth and Supabase
      await Promise.all([
        logout(),
        supabase.auth.signOut()
      ])
             
      setSupabaseUser(null)
      setError(null)
      setHasAttemptedAuth(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed')
    } finally {
      setLoading(false)
    }
  }, [logout])

  // Auto-sign in to Supabase when Web3Auth user is available
  useEffect(() => {
    console.log('Auto sign-in effect triggered', { 
      isConnected, 
      web3AuthUser: !!web3AuthUser, 
      web3Auth: !!web3Auth, 
      supabaseUser: !!supabaseUser, 
      loading, 
      hasAttemptedAuth,
      status 
    })
    
    // If connected but no user, try to fetch user info manually
    if (isConnected && !web3AuthUser && web3Auth && web3Auth.connected && !loading) {
      console.log('Attempting to fetch user info manually...')
      const fetchUserInfo = async () => {
        try {
          const userInfo = await web3Auth.getUserInfo()
          console.log('Manual user info fetch successful:', !!userInfo)
        } catch (error) {
          console.error('Manual user info fetch failed:', error)
        }
      }
      fetchUserInfo()
    }
    
    if (isConnected && web3AuthUser && web3Auth && !supabaseUser && !loading && !hasAttemptedAuth) {
      console.log('Triggering auto sign-in...')
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        signInWithSupabase()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isConnected, web3AuthUser, web3Auth, supabaseUser, loading, hasAttemptedAuth, signInWithSupabase, status])

  // Listen for Supabase auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('=== SUPABASE AUTH STATE CHANGE ===')
        console.log('Event:', event)
        console.log('Session exists:', !!session)
        console.log('User exists:', !!session?.user)
        console.log('User email:', session?.user?.email)
        console.log('================================')
        
        setSupabaseUser(session?.user || null)
        
        // Clear error when successfully authenticated
        if (session?.user && error) {
          setError(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [error])

  // Also check for existing session on mount and restore Web3Auth if needed
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('=== CHECKING EXISTING SESSION ===')
      console.log('Existing session:', !!session)
      console.log('Existing user:', !!session?.user)
      console.log('================================')
      
      if (session?.user) {
        setSupabaseUser(session.user)
        
        // If we have a Supabase session but no Web3Auth user, restore from metadata
        if (!web3AuthUser && session.user.user_metadata) {
          console.log('Restoring Web3Auth user from Supabase metadata...')
          const restoredUser = {
            email: session.user.email,
            name: session.user.user_metadata.name,
            profileImage: session.user.user_metadata.picture,
            sub: session.user.user_metadata.web3auth_sub,
            typeOfLogin: session.user.user_metadata.provider,
          }
          setWeb3AuthUser(restoredUser)
        }
      }
    }
    
    checkExistingSession()
  }, [])

  return {
    web3AuthUser,
    supabaseUser,
    loading,
    error,
    signInWithSupabase,
    signOut,
  }
}