# Complex state management using zustand and immer made simple

### Getting Started

In command line run:

```bash
npm install zimmer-context
```

### Using the package

It is dead simple, this library provides only 2 functions:

- `createStoreSlice` to define your slices
- `createGlobalStoreContext` to use your slices and get your `ContextProvider` and `useStoreContext` hook to use the store

I felt there was too much boilerplate when using zustand with immer and persits, especially as my projects grew, so I created this package. Everything is fully typed and as simple as possible.

#### 1. Creating slices

Create a file `store/fishSlice.ts`, where you define your slice with `createStoreSlice`. First define your state and actions. then inside the createStoreSlice define the default values and the functions. you have access to set and get fucnctions to retrieve and manipulate with the data in this slice. You cannot access data in another slices, as at the time of defining your slice, typescript doesn't know aobut the structure of other slices.

```typescript
import { createStoreSlice } from "zimmer-context";

type State = {
  count: number;
};

type Actions = {
  increment: (qty: number) => void;
  decrement: (qty: number) => void;
};

export const fishSlice = createStoreSlice<State, Actions>((set, get) => ({
  count: 0,
  increment: (qty: number) => set((state) => ({ count: state.count + qty })),
  decrement: (qty: number) => set((state) => ({ count: state.count - qty })),
}));
```

and another `store/bearSlice.ts` slice like so:

```typescript
import { createStoreSlice } from "zimmer-context";

type State = {
  count: number;
};

type Actions = {
  increment: (qty: number) => void;
  decrement: (qty: number) => void;
};

export const bearSlice = createStoreSlice<State, Actions>((set, get) => ({
  count: 0,
  increment: (qty: number) => set((state) => ({ count: state.count + qty })),
  decrement: (qty: number) => set((state) => ({ count: state.count - qty })),
}));
```

#### 2. Create your global store using slices

In another file (say `store/global_store.ts`) import all of the slices and create the global store:

```typescript
"use client";

import { createGlobalStoreContext } from "zimmer-context";
import { bearSlice } from "./bear_slice";
import { fishSlice } from "./fish_slice";

export const { ContextProvider, useStoreContext } = createGlobalStoreContext(
  {
    fish: fishSlice,
    bear: bearSlice,
  },
  1 // Persist version, change whenever there is a breaking change in the structure of the store
);
```

#### 3. Provide the context with `ContextProvider`

Here you can override the initial store state with your data, such as fetched one, or from URL search parameters.

```typescript
import { ContextProvider } from "store/global_store";

export default async function ReactComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ContextProvider
      initStoreState={{
        fish: { count: 10 },
      }}
    >
      {children}
    </ContextProvider>
  );
}
```

#### 4. Use the store with `useStoreContext`

Inside the ContextProvider you can get the state like so:

```typescript
import { useStoreContext } from "store/global_store";

export default async function DisplayCounts() {
  const { fish, bear } = useStoreContext((state) => state);
  return (
    <div>
      <div>fish: {fish.count}</div>
      <div>bear: {bear.count}</div>
    </div>
  );
}
```

### Contributing

Feel free to open issues and contribute by creating pull requests! I am open to any and all suggestions.
