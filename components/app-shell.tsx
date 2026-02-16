"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  BookOpen,
  Handshake,
  Trophy,
  ClipboardCheck,
  Menu,
  ChevronRight,
  Settings,
  LogOut,
} from "lucide-react"

// Navigation config
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Academic Research", href: "/academic-research/submission", icon: BookOpen },
  { name: "Partnerships", href: "/institutional-relations/partnerships", icon: Handshake },
  { name: "Rankings & Accreditations", href: "/accreditations-rankings", icon: Trophy },
  { name: "Review & Publish", href: "/review", icon: ClipboardCheck },
]

// Helper for badge colors
function roleBadgeVariant(role: string) {
  switch (role) {
    case "admin":
    case "academic_director":
      return "default"
    case "reviewer":
    case "department_head":
      return "secondary"
    default:
      return "outline"
  }
}

// Sidebar Component
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <span className="text-sm font-bold text-sidebar-primary-foreground">Ai</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-sidebar-primary-foreground">Aivancity</h1>
          <p className="text-xs text-sidebar-foreground/60">Data Portal</p>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.name}
                {isActive && <ChevronRight className="ml-auto h-3 w-3" />}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <p className="text-xs text-sidebar-foreground/50">Aivancity Paris-Cachan</p>
        <p className="text-xs text-sidebar-foreground/40">AI, Business & Ethics</p>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userEmail, setUserEmail] = useState("Loading...")
  const [userRole, setUserRole] = useState("")

  // Fetch real user data from Supabase
  useEffect(() => {
    async function fetchRealUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", user.email)
          .maybeSingle()
        
        if (data && data.role) {
          setUserRole(data.role.trim().toLowerCase())
        } else {
          setUserRole("author")
        }
      } else {
        setUserEmail("Guest")
        setUserRole("author")
      }
    }
    fetchRealUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  // Generate initials for the avatar
  const initials = userEmail !== "Loading..." && userEmail !== "Guest" 
    ? userEmail.substring(0, 2).toUpperCase() 
    : "U"

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-40"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
          <div className="lg:hidden w-10" />
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <Badge variant={roleBadgeVariant(userRole)} className="hidden sm:inline-flex uppercase tracking-wider">
              {userRole || "Loading..."}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {initials}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline truncate max-w-[150px]">
                    {userEmail}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium truncate">{userEmail}</p>
                  <p className="text-xs text-muted-foreground uppercase">{userRole}</p>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                {/* THE NEW SETTINGS BUTTON */}
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4 text-slate-500" />
                    Settings
                  </DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="mx-auto max-w-7xl p-4 lg:p-6 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}