import { createStoreSlice } from "..";

type FishState = {
  count: number;
};

type FishActions = {
  increment: (qty: number) => void;
  decrement: (qty: number) => void;
};

export const fishSlice = createStoreSlice<FishState, FishActions>(
  (set, get) => ({
    count: 0,
    increment: (qty: number) => set((state) => ({ count: state.count + qty })),
    decrement: (qty: number) => set((state) => ({ count: state.count - qty })),
  })
);
