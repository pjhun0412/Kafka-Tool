import { useLayoutStore } from "../../stores/ui/layoutStore";
import { resolveLanguage } from "../../i18n";

export function useAppLanguage() {
  const language = useLayoutStore((state) => state.language);
  return resolveLanguage(language);
}
