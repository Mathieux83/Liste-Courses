import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  availableServices: [],
  selectedService: null,
  selectedStore: null,
  loading: false,
  error: null,
  currentOrder: null
}

export const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    setAvailableServices: (state, action) => {
      state.availableServices = action.payload
      state.loading = false
    },
    setSelectedService: (state, action) => {
      state.selectedService = action.payload
    },
    setSelectedStore: (state, action) => {
      state.selectedStore = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
      state.error = null
    },
    setError: (state, action) => {
      state.error = action.payload
      state.loading = false
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload
    },
    clearDelivery: (state) => {
      state.selectedService = null
      state.selectedStore = null
      state.currentOrder = null
    }
  }
})

export const {
  setAvailableServices,
  setSelectedService,
  setSelectedStore,
  setLoading,
  setError,
  setCurrentOrder,
  clearDelivery
} = deliverySlice.actions

export const deliveryReducer = deliverySlice.reducer
