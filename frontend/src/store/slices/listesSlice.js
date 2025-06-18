import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  listes: [],
  listePrincipale: null,
  currentListe: null,
  loading: false,
  error: null
}

export const listesSlice = createSlice({
  name: 'listes',
  initialState,
  reducers: {
    setListes: (state, action) => {
      state.listes = action.payload
      state.loading = false
      state.error = null
    },
    setListePrincipale: (state, action) => {
      state.listePrincipale = action.payload
      state.loading = false
    },
    setCurrentListe: (state, action) => {
      state.currentListe = action.payload
    },
    addListe: (state, action) => {
      state.listes.unshift(action.payload)
    },
    updateListe: (state, action) => {
      const index = state.listes.findIndex(l => l.id === action.payload.id)
      if (index !== -1) {
        state.listes[index] = action.payload
      }
      if (state.currentListe?.id === action.payload.id) {
        state.currentListe = action.payload
      }
    },
    deleteListe: (state, action) => {
      state.listes = state.listes.filter(l => l.id !== action.payload)
      if (state.currentListe?.id === action.payload) {
        state.currentListe = null
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload
      state.error = null
    },
    setError: (state, action) => {
      state.error = action.payload
      state.loading = false
    }
  }
})

export const {
  setListes,
  setListePrincipale,
  setCurrentListe,
  addListe,
  updateListe,
  deleteListe,
  setLoading,
  setError
} = listesSlice.actions

export const listesReducer = listesSlice.reducer
