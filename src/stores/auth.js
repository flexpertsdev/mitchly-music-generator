import { defineStore } from 'pinia'
import { account, databases, Query, ID } from '@/lib/appwrite'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    loading: true,
    initialized: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user && !!state.session,
    userId: (state) => state.user?.$id || null
  },

  actions: {
    async init() {
      // Prevent multiple initializations
      if (this.initialized) {
        return
      }
      
      try {
        this.loading = true
        const session = await account.getSession('current')
        if (session) {
          const user = await account.get()
          this.user = user
          this.session = session
        }
      } catch (error) {
        // Not logged in
        console.log('No active session:', error.message)
        this.user = null
        this.session = null
      } finally {
        this.loading = false
        this.initialized = true
      }
    },
    
    setAuth(user, session) {
      // Method to directly set auth state (useful for OAuth callbacks)
      this.user = user
      this.session = session
      this.loading = false
      this.initialized = true
    },

    async login(email, password) {
      try {
        console.log('Attempting login for:', email)
        
        // Check if there's already a session
        try {
          const existingSession = await account.getSession('current')
          if (existingSession) {
            console.log('Session already exists, fetching user data')
            const user = await account.get()
            this.user = user
            this.session = existingSession
            console.log('Using existing session for:', user.email)
            return { success: true }
          }
        } catch (err) {
          // No existing session, proceed with login
          console.log('No existing session, creating new one')
        }
        
        const session = await account.createEmailPasswordSession(email, password)
        const user = await account.get()
        this.user = user
        this.session = session
        console.log('Login successful:', user.email)
        return { success: true }
      } catch (error) {
        console.error('Login error details:', {
          message: error.message,
          code: error.code,
          type: error.type,
          response: error.response
        })
        
        // Handle session already exists error specifically
        if (error.type === 'user_session_already_exists') {
          // Try to just get the current user instead
          try {
            const user = await account.get()
            const session = await account.getSession('current')
            this.user = user
            this.session = session
            console.log('Used existing session for:', user.email)
            return { success: true }
          } catch (fallbackError) {
            console.error('Failed to recover from session conflict:', fallbackError)
          }
        }
        
        // Provide more specific error messages
        let errorMessage = 'Login failed'
        if (error.code === 401) {
          errorMessage = 'Invalid email or password'
        } else if (error.code === 429) {
          errorMessage = 'Too many attempts. Please try again later'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        return { success: false, error: errorMessage }
      }
    },

    async register(email, password, name) {
      try {
        console.log('Attempting registration for:', email)
        
        // First, check if there's an existing session and delete it
        try {
          await account.deleteSession('current')
          console.log('Cleared existing session before registration')
        } catch (err) {
          // No existing session, which is fine
          console.log('No existing session to clear')
        }
        
        // Create the user account
        const user = await account.create(ID.unique(), email, password, name)
        console.log('User created successfully:', user.email)
        
        // After registration, Appwrite might auto-create a session
        // Try to get the current session first
        try {
          const session = await account.getSession('current')
          if (session) {
            console.log('Session already exists after registration, fetching user data')
            const currentUser = await account.get()
            this.user = currentUser
            this.session = session
            return { success: true, user: currentUser }
          }
        } catch (err) {
          console.log('No auto-session created, attempting manual login')
        }
        
        // If no session exists, manually log them in
        const loginResult = await this.login(email, password)
        
        if (!loginResult.success) {
          // If login fails after registration, return partial success
          console.warn('Auto-login failed after registration:', loginResult.error)
          return { 
            success: true, 
            user, 
            warning: 'Account created successfully! Please log in with your credentials.' 
          }
        }
        
        return { success: true, user }
      } catch (error) {
        console.error('Registration error details:', {
          message: error.message,
          code: error.code,
          type: error.type,
          response: error.response
        })
        
        // Provide more specific error messages
        let errorMessage = 'Registration failed'
        if (error.code === 409) {
          errorMessage = 'An account with this email already exists'
        } else if (error.code === 400) {
          errorMessage = 'Invalid email or password format'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        return { success: false, error: errorMessage }
      }
    },

    async logout() {
      console.log('Auth store logout initiated')
      try {
        // Attempt to delete the session from Appwrite
        await account.deleteSession('current')
        console.log('Session deleted successfully')
      } catch (error) {
        console.error('Error deleting session:', error)
        // Continue with local cleanup even if API call fails
      } finally {
        // Always clear local state
        this.user = null
        this.session = null
        this.initialized = false
        console.log('Local auth state cleared')
      }
    },

    async updateProfile(data) {
      try {
        if (data.name) {
          await account.updateName(data.name)
        }
        if (data.email) {
          await account.updateEmail(data.email, data.password)
        }
        if (data.password && data.newPassword) {
          await account.updatePassword(data.newPassword, data.password)
        }
        
        // Refresh user data
        this.user = await account.get()
        return { success: true }
      } catch (error) {
        console.error('Update profile error:', error)
        return { success: false, error: error.message }
      }
    }
  },

  persist: {
    paths: ['user', 'session', 'initialized']
  }
})
