import { useStoreContext } from "./global_store";

export default async function DisplayCounts() {
  const { fish, bear } = useStoreContext((state) => state);
  return (
    <div>
      <div>fish: {fish.count}</div>
      <div>bear: {bear.count}</div>
      <button
        onClick={() => {
          fish.decrement(1);
        }}
      >
        Bear eats fish
      </button>
    </div>
  );
}
