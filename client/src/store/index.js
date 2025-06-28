// store/index.js - CORRIGÉ
import { configureStore } from '@reduxjs/toolkit'
import { authReducer } from './slices/authSlice'
import { uiReducer } from './slices/uiSlice'
import { deliveryReducer } from './slices/deliverySlice'
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import { persistConfig } from './persistConfig';
import { combineReducers } from 'redux';

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  delivery: deliveryReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // IMPORTANT : Ignorer les actions Redux Persist ET delivery
        ignoredActions: [
          FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
          'delivery/setSelectedStore'
        ],
      },
    }),
});

export const persistor = persistStore(store);


// Pour intégrer la persistance dans l'app :
//
// import { PersistGate } from 'redux-persist/integration/react';
// import { store, persistor } from './store';
//
// <Provider store={store}>
//   <PersistGate loading={null} persistor={persistor}>
//     <App />
//   </PersistGate>
// </Provider>
