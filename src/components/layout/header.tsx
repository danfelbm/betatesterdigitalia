'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Menu, LogOut, User } from 'lucide-react'
import { MobileNav } from './mobile-nav'

interface HeaderProps {
  userEmail?: string
}

export function Header({ userEmail }: HeaderProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-muted-foreground lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Abrir menú</span>
          <Menu className="h-6 w-6" />
        </button>

        <div className="h-6 w-px bg-border lg:hidden" />

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex flex-1" />
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{userEmail}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </div>

      <MobileNav open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  )
}
