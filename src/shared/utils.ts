import { dynamicTailwindRecipes } from "./ui/dynamic-tailwind-recipes";

export function cx(...classes: Array<string | false | null | undefined>) {
  const expanded: string[] = [];
  for (const value of classes) {
    if (!value) continue;
    for (const className of value.split(/\s+/).filter(Boolean)) {
      expanded.push(className);
      const runtimeVariant = dynamicTailwindRecipes[className];
      if (runtimeVariant) expanded.push(runtimeVariant);
    }
  }
  return expanded.join(" ");
}
