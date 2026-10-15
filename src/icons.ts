/**
 * Icon registry for the schedule.
 *
 * The schedule source names an icon per segment, for example `Dumbbell` or
 * `Calculator`, so a row can carry the picture that fits it instead of one
 * picture per activity kind. The names are looked up here, which keeps the data
 * free of code and lets an unknown name fall back instead of breaking a page.
 */

import type {ComponentType, SVGProps} from 'react';
import {
  Bike,
  BookOpen,
  Brain,
  Calculator,
  CalendarCheck,
  CircleHelp,
  Clapperboard,
  ClipboardCheck,
  ClipboardList,
  Coffee,
  Dumbbell,
  FlaskConical,
  Footprints,
  Globe,
  GraduationCap,
  Laptop,
  Landmark,
  Languages,
  Leaf,
  Moon,
  NotebookPen,
  Palette,
  PenLine,
  ShowerHead,
  Sparkles,
  Sunrise,
  Target,
  Users,
  Utensils,
} from 'lucide-react';

/** Component shape Astryx accepts for the `icon` prop. */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** Every icon the schedule may name, keyed by the name used in the data. */
const ICON_REGISTRY: Record<string, IconComponent> = {
  Bike,
  BookOpen,
  Brain,
  Calculator,
  CalendarCheck,
  Clapperboard,
  ClipboardCheck,
  ClipboardList,
  Coffee,
  Dumbbell,
  FlaskConical,
  Footprints,
  Globe,
  GraduationCap,
  Laptop,
  Landmark,
  Languages,
  Leaf,
  Moon,
  NotebookPen,
  Palette,
  PenLine,
  ShowerHead,
  Sparkles,
  Sunrise,
  Target,
  Users,
  Utensils,
};

/** Icon shown when the schedule names something the registry does not know. */
const FALLBACK_ICON: IconComponent = CircleHelp;

/**
 * Every icon name the schedule may use, in a stable order.
 *
 * The edit page offers these as choices, so the list is built once here instead
 * of at each call site.
 *
 * @returns The known icon names, alphabetically.
 */
export function getIconNames(): string[] {
  return Object.keys(ICON_REGISTRY).sort((left, right) => left.localeCompare(right));
}

/**
 * Look up the icon of a segment.
 *
 * @param name Icon name from the schedule data.
 * @returns The icon component, or a question mark when the name is unknown.
 */
export function resolveIcon(name: string): IconComponent {
  return ICON_REGISTRY[name] ?? FALLBACK_ICON;
}
