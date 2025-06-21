import { configureStore } from '@reduxjs/toolkit'
import { listesReducer } from './slices/listesSlice'
import { authReducer } from './slices/authSlice'
import { uiReducer } from './slices/uiSlice'
import { deliveryReducer } from './slices/deliverySlice'

export const store = configureStore({
  reducer: {
    listes: listesReducer,
    auth: authReducer,
    ui: uiReducer,
    delivery: deliveryReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore ces actions pour la vérification de sérialisation
        ignoredActions: ['delivery/setSelectedStore'],
      },
    }),
})
