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
    get: () => State & Actions,
    store: StoreApi<object>
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

    const slice = { ...sliceTemplate(set, get, fullStore), ...initialOverride };
    return slice as State & Actions;
  };
}

/**
 * Creates a global store context with the specified slices and optional version.
 * @template Slices - The type of the slices object.
 * @template StoreState - The type of the store state object.
 * @param slices - An object containing slice generators.
 * @param options - An optional object specifying options for the global store.
 * @param options.persist.version - An optional version number for the global store. Change this to not use the persist storage next time.
 * @returns
 */
function createGlobalStoreContext<
  Slices extends { [K in keyof Slices]: SliceGenerator<object, object> },
  StoreState extends { [K in keyof Slices]: ReturnType<Slices[K]> }
>(slices: Slices, options?: { persist?: { version?: number } }) {
  type InitialState = Partial<{
    [K in keyof Slices]: Parameters<Slices[K]>[2];
  }>;
  const createGlobalStore = (initStoreState?: InitialState) => {
    const storeBuilder = <T1, T2, T3>(set: T1, get: T2, store: T3) => {
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
    };

    if (options?.persist) {
      return createStore<StoreState>()(
        persist(immer(storeBuilder), {
          name: "dashboard-store",
          version: options.persist.version,
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
        })
      );
    }
    return createStore<StoreState>()(immer(storeBuilder));
  };

  type Store = ReturnType<typeof createGlobalStore>;

  const Context = createContext<Store | null>(null);

  /**
   * Use this function inside the context provider to access the store state.
   * @param selector - A function which takes the full store state and returns a subset of it.
   * @returns Full store state, or a subset of the store state.
   */
  function useStoreContext(): Store;
  /**
   * Use this function inside the context provider to access the store object. Use this to clear the persist storage and more.
   * @returns The store object.
   */
  function useStoreContext<S>(selector: (state: StoreState) => S): S;
  function useStoreContext(selector?: any) {
    const store = useContext(Context);
    if (!store) {
      throw new Error("useContextStore must be used within ContextProvider");
    }
    if (!selector) {
      return store;
    }
    return useStore(store, selector);
  }

  return {
    /**
     * A context provider for the global store.
     * @param children - The children to render.
     * @param initStoreState - An optional partial initial state object to initialize the store with.
     */
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

    useStoreContext: useStoreContext,
  };
}

export { type SliceGenerator, createStoreSlice, createGlobalStoreContext };
