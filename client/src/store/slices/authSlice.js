import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  mainUser: {
    user: null,
    token: null,
    isAuthenticated: false
  },
  guest: {
    guestUsername: null,
    guestToken: null,
    partageToken: null, // pour savoir à quel partage il est lié
    isActive: false
  },
  loading: true,
  error: null
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setMainUser: (state, action) => {
      state.mainUser.user = action.payload.user;
      state.mainUser.token = action.payload.token;
      state.mainUser.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    setGuest: (state, action) => {
      state.guest.guestUsername = action.payload.guestUsername;
      state.guest.guestToken = action.payload.guestToken;
      state.guest.partageToken = action.payload.partageToken || null;
      state.guest.isActive = true;
      state.loading = false;
      state.error = null;
    },
    clearMainUser: (state) => {
      state.mainUser = { user: null, token: null, isAuthenticated: false };
      state.loading = false;
      state.error = null;
    },
    clearGuest: (state) => {
      state.guest = { guestUsername: null, guestToken: null, partageToken: null, isActive: false };
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
      state.loading = false
    },
    updateMainUser: (state, action) => {
      if (state.mainUser.user) {
        state.mainUser.user = { ...state.mainUser.user, ...action.payload };
      }
    }
  }
})

import { createSelector } from '@reduxjs/toolkit';

// Sélecteur pour l'état d'authentification de base
const selectAuthBase = state => state.auth;

// Sélecteur pour l'état de chargement
export const selectAuthLoading = createSelector(
  [selectAuthBase],
  auth => auth.loading
);

// Sélecteur pour l'état d'authentification complet
export const selectAuthState = createSelector(
  [selectAuthBase],
  (auth) => {
    if (auth.mainUser.isAuthenticated) {
      return {
        isAuthenticated: true,
        token: auth.mainUser.token,
        userId: auth.mainUser.user?._id,
        isGuest: false
      };
    } else if (auth.guest.isActive) {
      return {
        isAuthenticated: true,
        isGuest: true,
        token: auth.guest.guestToken,
        userId: auth.guest.guestUsername
      };
    }
    return {
      isAuthenticated: false,
      isGuest: false,
      token: null,
      userId: null
    };
  },
  {
    memoizeOptions: {
      resultEqualityCheck: (a, b) => 
        a.isAuthenticated === b.isAuthenticated && 
        a.token === b.token && 
        a.userId === b.userId &&
        a.isGuest === b.isGuest
    }
  }
);

// Sélecteur combiné pour l'application
export const selectAppAuthState = createSelector(
  [selectAuthState, selectAuthLoading],
  (auth, loading) => ({
    isAuthenticated: auth.isAuthenticated,
    loading
  })
);

export const {
  setMainUser,
  setGuestUsername,
  setGuest,
  clearMainUser,
  clearGuest,
  setLoading,
  setError,
  updateUser
} = authSlice.actions

export const authReducer = authSlice.reducer 
