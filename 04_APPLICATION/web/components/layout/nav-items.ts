import { Bell, BookOpen, CalendarCheck, Network, CircleGauge, Compass, Home, Landmark, MessageCircle, Mic, ShieldCheck, Target, User, Accessibility } from "lucide-react";

export const NAV = [
  { key: "home", href: "/home", Icon: Home },
  { key: "assistant", href: "/assistant", Icon: MessageCircle },
  { key: "planning", href: "/planning", Icon: Compass },
  { key: "goals", href: "/goals", Icon: Target },
  { key: "shield", href: "/shield", Icon: ShieldCheck },
  { key: "schemes", href: "/schemes", Icon: Landmark },
  { key: "learn", href: "/learn", Icon: BookOpen },
  { key: "score", href: "/score", Icon: CircleGauge },
  { key: "lifegraph", href: "/life-graph", Icon: Network },
  { key: "voice", href: "/voice", Icon: Mic },
] as const;

export const SECONDARY = [
  { key: "reviews", href: "/reviews", Icon: CalendarCheck },
  { key: "notifications", href: "/notifications", Icon: Bell },
  { key: "profile", href: "/profile", Icon: User },
  { key: "accessibility", href: "/settings/accessibility", Icon: Accessibility },
] as const;

/** Mobile bottom navigation: Home, Goals, Ask VAAKYA, Learn, Profile (FR-DSH-05). */
export const BOTTOM = ["home", "goals", "assistant", "learn", "profile"] as const;
