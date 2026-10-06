import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const AZURE_TENANT = process.env.AZURE_AD_TENANT_ID?.trim();

// Microsoft login is only enabled for ONE specific tenant (a GUID). "common" / "organizations" accept
// accounts from any organization, whose email claim is not trustworthy for account linking.
const azureEnabled = Boolean(
    process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && AZURE_TENANT && GUID.test(AZURE_TENANT)
);
if (!azureEnabled) {
    console.warn("[auth] Microsoft login disabled: set AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET and AZURE_AD_TENANT_ID (tenant GUID).");
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    session: { strategy: "jwt" },
    pages: { signIn: "/login" },
    providers: [
        ...(azureEnabled
            ? [
                  AzureADProvider({
                      clientId: process.env.AZURE_AD_CLIENT_ID!,
                      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
                      tenantId: AZURE_TENANT,
                      // Safe only because sign-in is restricted to a single tenant (see signIn callback)
                      allowDangerousEmailAccountLinking: true,
                  }),
              ]
            : []),
        CredentialsProvider({
            name: "Email",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Mot de passe", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });
                if (!user?.passwordHash) return null;
                const valid = await bcrypt.compare(credentials.password, user.passwordHash);
                if (!valid) return null;
                return { id: user.id, email: user.email!, name: user.name };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider !== "azure-ad") return true;

            // The token must come from the configured tenant
            const tid = (profile as any)?.tid;
            if (typeof tid !== "string" || tid.toLowerCase() !== AZURE_TENANT?.toLowerCase()) return false;

            // The SUPER_ADMIN is never linked to a Microsoft identity through its email address
            const email = user.email?.trim();
            if (email) {
                const existing = await prisma.user.findFirst({
                    where: { OR: [{ email }, { email: email.toLowerCase() }] },
                    select: { id: true, role: true },
                });
                if (existing?.role === "SUPER_ADMIN") {
                    const linked = await prisma.account.findFirst({
                        where: { userId: existing.id, provider: "azure-ad" },
                        select: { id: true },
                    });
                    if (!linked) return false;
                }
            }
            return true;
        },
        async jwt({ token }) {
            if (token.sub) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.sub },
                    select: { role: true, name: true, email: true },
                });
                token.role = dbUser?.role ?? "PENDING";
                token.name = dbUser?.name;
                token.email = dbUser?.email;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.sub;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
};
