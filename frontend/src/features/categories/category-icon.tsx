import {
  Armchair,
  Baby,
  Cable,
  Cog,
  Drill,
  Footprints,
  Gem,
  Headphones,
  Lightbulb,
  Package,
  PenTool,
  Scissors,
  ShieldPlus,
  Shirt,
  Sprout,
  UtensilsCrossed,
  Bike,
  Dumbbell,
  Sparkles,
  CookingPot,
} from 'lucide-react';
import type { CategoryIcon } from '@/data/categories';

/**
 * Maps a category's icon key to a glyph.
 *
 * The mapping lives here rather than in `data/categories.ts` so the taxonomy
 * stays a pure data module — importable from a Server Component, a script or a
 * test without pulling React and an icon library along with it.
 */
const ICONS: Record<CategoryIcon, typeof Headphones> = {
  electronics: Headphones,
  mobile: Cable,
  apparel: Shirt,
  home: CookingPot,
  beauty: Sparkles,
  lighting: Lightbulb,
  packaging: Package,
  stationery: PenTool,
  footwear: Footprints,
  toys: Baby,
  hardware: Drill,
  auto: Bike,
  sports: Dumbbell,
  jewellery: Gem,
  textiles: Scissors,
  food: UtensilsCrossed,
  agriculture: Sprout,
  medical: ShieldPlus,
  furniture: Armchair,
  machinery: Cog,
};

export function CategoryGlyph({
  icon,
  size = 18,
  className,
}: {
  icon: CategoryIcon;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[icon] ?? Package;
  return <Icon size={size} strokeWidth={1.8} aria-hidden className={className} />;
}
