import { createStoreSlice } from "..";

type BearState = {
  count: number;
};

type BearActions = {
  increment: (qty: number) => void;
  decrement: (qty: number) => void;
};

export const bearSlice = createStoreSlice<BearState, BearActions>(
  (set, get) => ({
    count: 0,
    increment: (qty: number) => set((state) => ({ count: state.count + qty })),
    decrement: (qty: number) => set((state) => ({ count: state.count - qty })),
  })
);
