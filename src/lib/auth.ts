import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Define UserType enum locally since it's not exported from @prisma/client
enum UserType {
  CUSTOMER = 'CUSTOMER',
  RESTAURANT = 'RESTAURANT',
  ADMIN = 'ADMIN'
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      userType: UserType
      location: string
      postalCode: string
      balance: number
      address?: string
      profilePicture?: string
    }
  }

  interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    userType: UserType
    location: string
    postalCode: string
    balance: number
    address?: string
    profilePicture?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    userType: UserType
    firstName: string
    lastName: string
    location: string
    postalCode: string
    balance: number
    address?: string
    profilePicture?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        userType: { label: 'User Type', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.userType) {
          return null
        }

        try {
          const userType = credentials.userType.toUpperCase() as UserType
          
          const user = await prisma.user.findFirst({
            where: {
              email: credentials.email,
              userType: userType
            },
            include: {
              customer: true
            }
          })

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            userType: user.userType as UserType,
            location: user.location,
            postalCode: user.postalCode,
            balance: user.balance,
            address: user.customer?.address || undefined,
            profilePicture: user.profilePicture || undefined
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.userType = user.userType
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.location = user.location
        token.postalCode = user.postalCode
        token.balance = user.balance
        token.address = user.address
        token.profilePicture = user.profilePicture
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.userType = token.userType
        session.user.firstName = token.firstName
        session.user.lastName = token.lastName
        session.user.location = token.location
        session.user.postalCode = token.postalCode
        session.user.balance = token.balance
        session.user.address = token.address
        session.user.profilePicture = token.profilePicture
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login'
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET
} 