import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      userType: string
      location: string
      postalCode: string
      balance: number
      address?: string
    }
  }

  interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    userType: string
    location: string
    postalCode: string
    balance: number
    address?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    firstName: string
    lastName: string
    userType: string
    location: string
    postalCode: string
    balance: number
    address?: string
  }
} 