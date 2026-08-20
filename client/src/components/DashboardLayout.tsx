import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { BriefcaseBusiness, Headphones, LayoutDashboard, LogOut, PanelLeft, PhoneOutgoing, ShieldCheck, UsersRound } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Control centre", path: "/" },
  { icon: PhoneOutgoing, label: "Outbound", path: "/outbound" },
  { icon: Headphones, label: "Inbound support", path: "/inbound" },
  { icon: BriefcaseBusiness, label: "Delegated task", path: "/delegated" },
  { icon: UsersRound, label: "Contacts & consent", path: "/contacts" },
];

const SIDEBAR_WIDTH_KEY = "voice-agent-sidebar-width";
const DEFAULT_WIDTH = 268;
const MIN_WIDTH = 228;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()), [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-[#f5f7fb] px-5 py-10 text-[#10213b] flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-[#dce4ee] bg-white p-9 text-center shadow-[0_16px_46px_rgba(24,47,79,0.10)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#0d6e6e] text-white"><ShieldCheck className="h-6 w-6" /></div>
          <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em]">Private calling operations</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#5c6d83]">Sign in to manage policies and run the browser-only demonstration workspace.</p>
          <Button onClick={() => startLogin()} size="lg" className="mt-7 w-full bg-[#0d6e6e] text-white hover:bg-[#095d5d]">Sign in securely</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const activeItem = menuItems.find(item => item.path === location) ?? menuItems[0];

  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const next = event.clientX - left;
      if (next >= MIN_WIDTH && next <= MAX_WIDTH) setSidebarWidth(next);
    };
    const up = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-[#1b3555] bg-[#102a46] text-[#eaf1fa]" onMouseEnter={() => undefined}>
          <SidebarHeader className="h-[86px] justify-center border-b border-[#1b3555] px-3">
            <div className="flex w-full items-center gap-3">
              <button onClick={() => setCollapsed(!collapsed)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#9bb1c9] transition-colors hover:bg-[#173957] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#62c4bd]" aria-label="Toggle navigation"><PanelLeft className="h-4 w-4" /></button>
              {!collapsed && <div className="min-w-0"><div className="text-[15px] font-semibold tracking-[-0.025em] text-white">Voice Control</div><div className="mt-0.5 text-[11px] font-medium tracking-[0.08em] text-[#8da4bd]">OPERATIONS CONSOLE</div></div>}
            </div>
          </SidebarHeader>
          <SidebarContent className="bg-[#102a46] px-2 py-4">
            <SidebarMenu className="gap-1">
              {menuItems.map(item => {
                const active = item.path === location;
                return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={active} onClick={() => setLocation(item.path)} tooltip={item.label} className={`h-10 rounded-lg text-[13px] font-medium transition-colors ${active ? "bg-[#1a4763] text-white hover:bg-[#1a4763]" : "text-[#a8bdd1] hover:bg-[#173957] hover:text-white"}`}><item.icon className={`h-[17px] w-[17px] ${active ? "text-[#64d2c8]" : ""}`} strokeWidth={1.7} /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>;
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t border-[#1b3555] bg-[#102a46] p-3">
            <DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-2.5 rounded-lg p-1 text-left transition-colors hover:bg-[#173957] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#62c4bd]"><Avatar className="h-8 w-8 shrink-0 border border-[#315371]"><AvatarFallback className="bg-[#1b4564] text-xs font-semibold text-[#d9f2ef]">{user?.name?.charAt(0).toUpperCase() ?? "O"}</AvatarFallback></Avatar>{!collapsed && <div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{user?.name || "Operator"}</p><p className="mt-0.5 truncate text-[11px] text-[#91a9bf]">Secure workspace</p></div>}</button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        {!collapsed && <div className="absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition-colors hover:bg-[#64d2c8]/40" onMouseDown={() => setIsResizing(true)} />}
      </div>
      <SidebarInset className="bg-[#f5f7fb]">
        {isMobile && <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[#dce4ee] bg-[#f5f7fb]/95 px-4 backdrop-blur"><SidebarTrigger className="h-9 w-9 rounded-lg border border-[#dce4ee] bg-white" /><span className="text-sm font-semibold text-[#10213b]">{activeItem.label}</span></div>}
        <main className="min-h-[100dvh] flex-1 p-4 lg:p-7">{children}</main>
      </SidebarInset>
    </>
  );
}
