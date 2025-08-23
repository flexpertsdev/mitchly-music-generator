import { defineStore } from 'pinia'
import { account, databases, Query, ID } from '@/lib/appwrite'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    loading: true
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userId: (state) => state.user?.$id || null
  },

  actions: {
    async init() {
      try {
        const session = await account.getSession('current')
        if (session) {
          const user = await account.get()
          this.user = user
          this.session = session
        }
      } catch (error) {
        // Not logged in
        console.log('No active session')
      } finally {
        this.loading = false
      }
    },

    async login(email, password) {
      try {
        const session = await account.createEmailSession(email, password)
        const user = await account.get()
        this.user = user
        this.session = session
        return { success: true }
      } catch (error) {
        console.error('Login error:', error)
        return { success: false, error: error.message }
      }
    },

    async register(email, password, name) {
      try {
        const user = await account.create(ID.unique(), email, password, name)
        await this.login(email, password)
        return { success: true, user }
      } catch (error) {
        console.error('Registration error:', error)
        return { success: false, error: error.message }
      }
    },

    async logout() {
      try {
        await account.deleteSession('current')
        this.user = null
        this.session = null
      } catch (error) {
        console.error('Logout error:', error)
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
    paths: ['user']
  }
})
