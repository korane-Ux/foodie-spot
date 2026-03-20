// =============================================================
// contexts/cart-context.tsx
// Gestion globale du panier avec un reducer
// reducer plutôt que useState, plus propre pour gérer plusieurs actions
// =============================================================

import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { CartItem, Dish } from '@/types';
import { storage, STORAGE_KEYS } from '@/services/storage';

// --- Types ---

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
}

const INITIAL_STATE: CartState = {
  items: [],
  restaurantId: null,
  restaurantName: null,
};

type CartAction =
  | { type: 'ADD_ITEM'; dish: Dish; restaurantId: string; restaurantName: string }
  | { type: 'REMOVE_ITEM'; dishId: string }
  | { type: 'UPDATE_QUANTITY'; dishId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; state: CartState };

// --- Reducer ---
// transformations d'état pure

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {

    case 'ADD_ITEM': {
      // Si l'utilisateur commande dans un AUTRE restaurant, on vide le panier
      // (on ne peut pas mélanger deux restaurants)
      if (state.restaurantId && state.restaurantId !== action.restaurantId) {
        return {
          restaurantId: action.restaurantId,
          restaurantName: action.restaurantName,
          items: [{ dish: action.dish, quantity: 1 }],
        };
      }

      // Si le plat est déjà dans le panier, on augmente juste la quantité
      const existing = state.items.find((i) => i.dish.id === action.dish.id);
      if (existing) {
        return {
          ...state,
          restaurantId: action.restaurantId,
          restaurantName: action.restaurantName,
          items: state.items.map((i) =>
            i.dish.id === action.dish.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }

      // Nouveau plat : on l'ajoute à la liste
      return {
        ...state,
        restaurantId: action.restaurantId,
        restaurantName: action.restaurantName,
        items: [...state.items, { dish: action.dish, quantity: 1 }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.dish.id !== action.dishId),
        // Si le panier est vide après suppression, on remet restaurantId à null
        restaurantId: state.items.length <= 1 ? null : state.restaurantId,
        restaurantName: state.items.length <= 1 ? null : state.restaurantName,
      };

    case 'UPDATE_QUANTITY':
      // Quantité à 0 ou moins = on supprime l'article
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.dish.id !== action.dishId),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.dish.id === action.dishId ? { ...i, quantity: action.quantity } : i
        ),
      };

    case 'CLEAR':
      // TODO: demander confirmation avant de vider ? À voir avec l'UX
      return INITIAL_STATE;

    case 'LOAD':
      return action.state;

    default:
      return state;
  }
}

// --- Context ---

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  itemCount: number;
  subtotal: number;
  addItem: (dish: Dish, restaurantId: string, restaurantName: string) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (dishId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, INITIAL_STATE);

  // Restaurer le panier depuis AsyncStorage au démarrage
  // Comme ça si l'utilisateur ferme l'app, son panier est sauvegardé
  useEffect(() => {
    storage.getItem<CartState>(STORAGE_KEYS.CART).then((saved) => {
      if (saved && saved.items?.length > 0) {
        dispatch({ type: 'LOAD', state: saved });
      }
    });
  }, []);

  // Sauvegarder le panier à chaque changement
  useEffect(() => {
    storage.setItem(STORAGE_KEYS.CART, state);
  }, [state]);

  const addItem = useCallback(
    (dish: Dish, restaurantId: string, restaurantName: string) => {
      dispatch({ type: 'ADD_ITEM', dish, restaurantId, restaurantName });
    },
    []
  );

  const removeItem = useCallback((dishId: string) => {
    dispatch({ type: 'REMOVE_ITEM', dishId });
  }, []);

  const updateQuantity = useCallback((dishId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', dishId, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const getItemQuantity = useCallback(
    (dishId: string) => state.items.find((i) => i.dish.id === dishId)?.quantity ?? 0,
    [state.items]
  );

  // calculs
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.dish.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        restaurantId: state.restaurantId,
        restaurantName: state.restaurantName,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans un CartProvider');
  return ctx;
}
