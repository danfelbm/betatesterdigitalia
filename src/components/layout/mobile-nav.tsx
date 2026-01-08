'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'
import {
  LayoutDashboard,
  FileStack,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  X,
} from 'lucide-react'

interface MobileNavProps {
  open: boolean
  onClose: () => void
  userRole: UserRole
}

export function MobileNav({ open, onClose, userRole }: MobileNavProps) {
  const pathname = usePathname()
  const isAdmin = userRole === 'admin'

  // Items base que todos ven
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Materiales', href: '/materials', icon: FileStack },
  ]

  // Items solo para admin
  if (isAdmin) {
    navigation.push(
      { name: 'Estados', href: '/settings/states', icon: Settings },
      { name: 'Etiquetas', href: '/settings/tags', icon: Tags },
      { name: 'Usuarios', href: '/settings/users', icon: Users },
    )
  }

  if (!open) return null

  return (
    <div className="relative z-50 lg:hidden">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xs overflow-y-auto bg-background px-6 py-6 border-r">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <span className="text-lg font-semibold">Botilito Testers</span>
          </div>
          <button
            type="button"
            className="-m-2.5 rounded-md p-2.5 text-muted-foreground"
            onClick={onClose}
          >
            <span className="sr-only">Cerrar menú</span>
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-6">
          <ul role="list" className="-mx-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                      isActive
                        ? 'bg-muted text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}
