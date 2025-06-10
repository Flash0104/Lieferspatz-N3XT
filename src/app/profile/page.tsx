'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    // Redirect to appropriate profile based on user type
    switch (session.user.userType) {
      case 'CUSTOMER':
        router.push('/profile/customer')
        break
      case 'RESTAURANT':
        router.push('/profile/restaurant')
        break
      case 'ADMIN':
        router.push('/profile/admin')
        break
      default:
        router.push('/')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return null
} 