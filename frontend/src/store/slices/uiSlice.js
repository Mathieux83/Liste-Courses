import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isOffline: false,
  darkMode: false,
  notifications: [],
  modal: {
    isOpen: false,
    type: null,
    props: null
  }
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setOffline: (state, action) => {
      state.isOffline = action.payload
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
    },
    addNotification: (state, action) => {
      state.notifications.push(action.payload)
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    openModal: (state, action) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        props: action.payload.props
      }
    },
    closeModal: (state) => {
      state.modal = {
        isOpen: false,
        type: null,
        props: null
      }
    }
  }
})

export const {
  setOffline,
  toggleDarkMode,
  addNotification,
  removeNotification,
  openModal,
  closeModal
} = uiSlice.actions

export const uiReducer = uiSlice.reducer
