"use client";

import { createGlobalStoreContext } from "..";
import { bearSlice } from "./bear_slice";
import { fishSlice } from "./fish_slice";

export const { ContextProvider, useStoreContext } = createGlobalStoreContext(
  {
    fish: fishSlice,
    bear: bearSlice,
  },
  {
    version: 1,
  }
);
