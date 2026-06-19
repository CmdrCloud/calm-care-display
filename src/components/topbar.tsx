import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="shrink-0" />
      <div className="hidden min-w-0 flex-1 md:block">
        <h1 className="truncate text-lg font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="relative ml-auto hidden w-72 lg:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search patients, meds, devices…" className="h-9 rounded-full pl-9" />
      </div>
      <Button variant="ghost" size="icon" className="relative shrink-0 rounded-full">
        <Bell className="h-5 w-5" />
        <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]" variant="destructive">
          3
        </Badge>
      </Button>
      <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card pl-1 pr-3 py-1">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">ML</AvatarFallback>
        </Avatar>
        <div className="hidden text-left sm:block">
          <div className="text-xs font-medium leading-tight">Maria Lopez</div>
          <div className="text-[10px] text-muted-foreground leading-tight">Primary caregiver</div>
        </div>
      </div>
    </header>
  );
}
