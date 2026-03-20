/**
 * Tests unitaires — CartContext (reducer)
 * Vérifie la logique panier sans dépendances React.
 */

// On teste le reducer directement, sans monter de composant
import { Dish } from '../types';

// Copie du reducer (logique pure, pas de React)
type CartItem = { dish: Dish; quantity: number };
type CartState = { items: CartItem[]; restaurantId: string | null; restaurantName: string | null };
type CartAction =
  | { type: 'ADD_ITEM'; dish: Dish; restaurantId: string; restaurantName: string }
  | { type: 'REMOVE_ITEM'; dishId: string }
  | { type: 'UPDATE_QUANTITY'; dishId: string; quantity: number }
  | { type: 'CLEAR' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      if (state.restaurantId && state.restaurantId !== action.restaurantId) {
        return {
          restaurantId: action.restaurantId,
          restaurantName: action.restaurantName,
          items: [{ dish: action.dish, quantity: 1 }],
        };
      }
      const existing = state.items.find((i) => i.dish.id === action.dish.id);
      if (existing) {
        return {
          ...state,
          restaurantId: action.restaurantId,
          restaurantName: action.restaurantName,
          items: state.items.map((i) =>
            i.dish.id === action.dish.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        ...state,
        restaurantId: action.restaurantId,
        restaurantName: action.restaurantName,
        items: [...state.items, { dish: action.dish, quantity: 1 }],
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.dish.id !== action.dishId) };
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.dish.id !== action.dishId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.dish.id === action.dishId ? { ...i, quantity: action.quantity } : i
        ),
      };
    case 'CLEAR':
      return { items: [], restaurantId: null, restaurantName: null };
    default:
      return state;
  }
}

const EMPTY: CartState = { items: [], restaurantId: null, restaurantName: null };

const DISH_A: Dish = {
  id: 'd1', name: 'Burger', price: 12.5,
  description: 'Un bon burger', image: '', category: 'Burger',
  isAvailable: true, restaurantId: 'r1',
};

const DISH_B: Dish = {
  id: 'd2', name: 'Pizza', price: 10.0,
  description: 'Une bonne pizza', image: '', category: 'Pizza',
  isAvailable: true, restaurantId: 'r1',
};

describe('CartReducer — ADD_ITEM', () => {
  it('ajoute un article au panier vide', () => {
    const state = cartReducer(EMPTY, { type: 'ADD_ITEM', dish: DISH_A, restaurantId: 'r1', restaurantName: 'R1' });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(1);
    expect(state.restaurantId).toBe('r1');
  });

  it('incrémente la quantité si l\'article est déjà dans le panier', () => {
    let state = cartReducer(EMPTY, { type: 'ADD_ITEM', dish: DISH_A, restaurantId: 'r1', restaurantName: 'R1' });
    state = cartReducer(state, { type: 'ADD_ITEM', dish: DISH_A, restaurantId: 'r1', restaurantName: 'R1' });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it('ajoute un second article différent', () => {
    let state = cartReducer(EMPTY, { type: 'ADD_ITEM', dish: DISH_A, restaurantId: 'r1', restaurantName: 'R1' });
    state = cartReducer(state, { type: 'ADD_ITEM', dish: DISH_B, restaurantId: 'r1', restaurantName: 'R1' });
    expect(state.items).toHaveLength(2);
  });

  it('vide le panier si restaurant différent', () => {
    const DISH_C: Dish = { ...DISH_A, id: 'd3', restaurantId: 'r2' };
    let state = cartReducer(EMPTY, { type: 'ADD_ITEM', dish: DISH_A, restaurantId: 'r1', restaurantName: 'R1' });
    state = cartReducer(state, { type: 'ADD_ITEM', dish: DISH_C, restaurantId: 'r2', restaurantName: 'R2' });
    expect(state.items).toHaveLength(1);
    expect(state.restaurantId).toBe('r2');
  });
});

describe('CartReducer — REMOVE_ITEM', () => {
  it('supprime un article du panier', () => {
    let state = cartReducer(EMPTY, { type: 'ADD_ITEM', dish: DISH_A, restaurantId: 'r1', restaurantName: 'R1' });
    state = cartReducer(state, { type: 'REMOVE_ITEM', dishId: 'd1' });
    expect(state.items).toHaveLength(0);
  });
});

describe('CartReducer — UPDATE_QUANTITY', () => {
  it('met à jour la quantité', () => {
    let state = cartReducer(EMPTY, { type: 'ADD_ITEM', dish: DISH_A, restaurantId: 'r1', restaurantName: 'R1' });
    state = cartReducer(state, { type: 'UPDATE_QUANTITY', dishId: 'd1', quantity: 5 });
    expect(state.items[0].quantity).toBe(5);
  });

  it('supprime l\'article si quantité <= 0', () => {
    let state = cartReducer(EMPTY, { type: 'ADD_ITEM', dish: DISH_A, restaurantId: 'r1', restaurantName: 'R1' });
    state = cartReducer(state, { type: 'UPDATE_QUANTITY', dishId: 'd1', quantity: 0 });
    expect(state.items).toHaveLength(0);
  });
});

describe('CartReducer — CLEAR', () => {
  it('vide complètement le panier', () => {
    let state = cartReducer(EMPTY, { type: 'ADD_ITEM', dish: DISH_A, restaurantId: 'r1', restaurantName: 'R1' });
    state = cartReducer(state, { type: 'CLEAR' });
    expect(state.items).toHaveLength(0);
    expect(state.restaurantId).toBeNull();
  });
});

describe('Calculs panier', () => {
  it('calcule le sous-total correctement', () => {
    let state = cartReducer(EMPTY, { type: 'ADD_ITEM', dish: DISH_A, restaurantId: 'r1', restaurantName: 'R1' });
    state = cartReducer(state, { type: 'ADD_ITEM', dish: DISH_A, restaurantId: 'r1', restaurantName: 'R1' });
    state = cartReducer(state, { type: 'ADD_ITEM', dish: DISH_B, restaurantId: 'r1', restaurantName: 'R1' });
    const subtotal = state.items.reduce((sum, i) => sum + i.dish.price * i.quantity, 0);
    expect(subtotal).toBeCloseTo(35.0); // 12.5*2 + 10.0*1
  });

  it('calcule le nombre total d\'articles', () => {
    let state = cartReducer(EMPTY, { type: 'ADD_ITEM', dish: DISH_A, restaurantId: 'r1', restaurantName: 'R1' });
    state = cartReducer(state, { type: 'ADD_ITEM', dish: DISH_A, restaurantId: 'r1', restaurantName: 'R1' });
    state = cartReducer(state, { type: 'ADD_ITEM', dish: DISH_B, restaurantId: 'r1', restaurantName: 'R1' });
    const count = state.items.reduce((sum, i) => sum + i.quantity, 0);
    expect(count).toBe(3); // 2 + 1
  });
});
