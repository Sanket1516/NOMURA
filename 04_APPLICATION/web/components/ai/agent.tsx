import { BookOpenText, Compass, Landmark, ShieldCheck } from "lucide-react";
import type { AgentId } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export const AGENTS: Record<AgentId, { name: string; role: string; Icon: typeof ShieldCheck; tone: AgentId; chip: string; description: string }> = {
  educator: { name: "Educator", role: "Learn", Icon: BookOpenText, tone: "educator", chip: "bg-educator-soft text-educator", description: "Explains money topics in simple words, from trusted sources." },
  strategy: { name: "Strategy Builder", role: "Plan", Icon: Compass, tone: "strategy", chip: "bg-strategy-soft text-strategy", description: "Builds savings plans and goal roadmaps from your numbers." },
  sentinel: { name: "Sentinel", role: "Protect", Icon: ShieldCheck, tone: "sentinel", chip: "bg-sentinel-soft text-sentinel", description: "Checks messages, offers and screenshots for scam signs." },
  connector: { name: "Connector", role: "Grow", Icon: Landmark, tone: "connector", chip: "bg-connector-soft text-connector", description: "Finds government schemes and explains eligibility and steps." },
};

export function AgentBadge({ agent }: { agent: AgentId }) {
  const a = AGENTS[agent];
  return (
    <Badge tone={a.tone}>
      <a.Icon aria-hidden className="size-3.5" />
      {a.name}
    </Badge>
  );
}
