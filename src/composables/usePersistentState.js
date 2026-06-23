import { ref, watch } from "vue";

export function usePersistentState(key, fallback) {
  let initialValue = fallback;
  try {
    const saved = localStorage.getItem(key);
    if (saved !== null) initialValue = JSON.parse(saved);
  } catch {
    initialValue = fallback;
  }

  const state = ref(initialValue);
  watch(state, (value) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, { deep: true });

  return state;
}
