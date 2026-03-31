/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { DefaultSession, NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/db';
import { pick } from "lodash";
import { compare } from 'bcrypt-ts';
import { getLoginUser } from "@/services/Users";

// https://codevoweb.com/setup-and-use-nextauth-in-nextjs-13-app-directory/
export interface User {
  id: string;
  name: string;
  // email: string;
  active: boolean;
  roleId: string;
  organizationId: string;
  role: string;
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}
const DEFAULT_MAX_AGE = 30 * 60 * 2; // 60 minutes

export const AuthOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: DEFAULT_MAX_AGE,
    updateAge: DEFAULT_MAX_AGE,
  },
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma as any),
  providers: [
    CredentialsProvider({
      name: "Sign in",
      id: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "example@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        try {
          if (!credentials?.email || !credentials.password) {
            return null;
          }

          const { email, password } = credentials;
          const user = await getLoginUser(email, true);
          if (user) {
            const passwordsMatch = await compare(password, user.password);
            // console.log("User passwordsMatch:", passwordsMatch);
            if (passwordsMatch) {
              return {
                id: user.id,
                name: `${user.firstname} ${user.othernames}`,
                role: user.role.title.toLowerCase(),
                active: Boolean(user.emailVerified),
              };
            }
          }
          return null;
        } catch (e) {
          console.log(e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as unknown as any;
        return {
          ...token,
          ...u,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.accessToken) session.accessToken = token.accessToken;

      return {
        ...session,
        user: {
          ...session.user,
          ...pick(token, [
            "id",
            "firstname",
            "othernames:",
            "role",
            "email",
            "roleId",
          ]),
        },
      };
    },
  },
  pages: {
    signIn: "/",
  },
};