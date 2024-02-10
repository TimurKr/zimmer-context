import { ContextProvider } from "./global_store";

export default async function ReactComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ContextProvider
      initStoreState={{
        fish: {
          count: 10,
        },
        bear: {
          count: 2,
        },
      }}
    >
      {children}
    </ContextProvider>
  );
}
