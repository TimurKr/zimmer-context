"use client";

import { Draft } from "immer";
import { Mutate, StoreApi, createStore, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createContext, useContext, useRef } from "react";

declare type Updater<T> = (updater: T | ((draft: Draft<T>) => void)) => void;

declare type SliceGenerator<S extends object, A extends object> = ReturnType<
  typeof createStoreSlice<S, A>
>;

/**
 * Creates a store slice with the given slice template.
 *
 * @template State - The type of the state object.
 * @template Actions - The type of the actions object.
 * @param sliceTemplate - The slice template function that defines the state and actions of the store slice. Accepts set and get functions and returns the state and actions object.
 * @returns The created store slice function.
 */
function createStoreSlice<State extends object, Actions extends object>(
  sliceTemplate: (
    set: Updater<State & Actions>,
    get: () => State & Actions
  ) => State & Actions
) {
  return <
    MS extends Mutate<
      StoreApi<{ [P in K]: State & Actions }>,
      [["zustand/persist", unknown], ["zustand/immer", unknown]]
    >,
    K extends keyof ReturnType<MS["getState"]> & string
  >(
    fullStore: MS,
    key: K,
    initialOverride?: Partial<State>
  ): State & Actions => {
    type S = ReturnType<MS["getState"]>;
    const set: Updater<State & Actions> = (updater) => {
      if (typeof updater === "function") {
        fullStore.setState((state) =>
          updater((state as S)[key] as Draft<State & Actions>)
        );
      } else {
        fullStore.setState({ [key]: updater } as Record<K, State & Actions>);
      }
    };
    const get = () => fullStore.getState()[key];

    const slice = { ...sliceTemplate(set, get), ...initialOverride };
    return slice as State & Actions;
  };
}

/**
 * Creates a global store context with the specified slices and optional version.
 * @template Slices - The type of the slices object.
 * @template StoreState - The type of the store state object.
 * @param slices - An object containing slice generators.
 * @param version - An optional version number for the store, used for persist middleware. Change the version number to reset the persisted state.
 * @returns An object containing the ContextProvider and useStoreContext functions.
 */
function createGlobalStoreContext<
  Slices extends { [K in keyof Slices]: SliceGenerator<object, object> },
  StoreState extends { [K in keyof Slices]: ReturnType<Slices[K]> }
>(slices: Slices, version?: number) {
  type InitialState = Partial<{
    [K in keyof Slices]: Parameters<Slices[K]>[2];
  }>;
  const createGlobalStore = (initStoreState?: InitialState) => {
    return createStore<StoreState>()(
      persist(
        immer((set, get, store) => {
          const result: Partial<StoreState> = {};

          for (const key in slices) {
            const typedKey = key as keyof Slices;
            // @ts-expect-error - we know the return value from slices is assignable to result[typedKey]
            result[typedKey] = slices[typedKey](
              // @ts-expect-error - we know store is the right type
              store,
              typedKey,
              initStoreState?.[typedKey]
            );
          }

          return result as StoreState;
        }),
        {
          name: "dashboard-store",
          version: version,
          merge: (persistedState, currentState) => {
            if (!persistedState || typeof persistedState !== "object") {
              return currentState;
            }

            let resultState: StoreState = { ...currentState };
            const keys = Object.keys(currentState) as (keyof StoreState)[];

            keys.forEach((key) => {
              if (key in persistedState) {
                const state = (persistedState as Partial<StoreState>)[key];
                if (state) {
                  resultState = {
                    ...resultState,
                    [key]: { ...currentState[key], ...state },
                  };
                }
              }
            });

            return resultState;
          },
        }
      )
    );
  };

  type Store = ReturnType<typeof createGlobalStore>;

  const Context = createContext<Store | null>(null);

  return {
    ContextProvider: ({
      children,
      initStoreState,
    }: {
      children:
        | JSX.Element
        | ((state: StoreState) => JSX.Element)
        | React.ReactNode;
      initStoreState?: InitialState;
    }) => {
      "use client";

      const store = useRef(createGlobalStore(initStoreState)).current;
      const state = useStore(store, (state) => state);

      return (
        <Context.Provider value={store}>
          {typeof children === "function" ? children(state) : children}
        </Context.Provider>
      );
    },

    useStoreContext: function useContextStore<U>(
      selector: (state: StoreState) => U
    ) {
      const store = useContext(Context);
      if (!store) {
        throw new Error("useContextStore must be used within ContextProvider");
      }
      return useStore(store, selector);
    },
  };
}

export { type SliceGenerator, createStoreSlice, createGlobalStoreContext };
