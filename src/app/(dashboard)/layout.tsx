import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { UserProvider } from '@/contexts/user-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <UserProvider role={user.role}>
      <div>
        <Sidebar userRole={user.role} />
        <div className="lg:pl-64">
          <Header userEmail={user.email} userRole={user.role} />
          <main className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </UserProvider>
  )
}
