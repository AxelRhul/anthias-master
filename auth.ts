import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { clearFailures, isLimited, recordFailure } from "@/lib/rate-limit";

let cachedDummyHash: string | undefined;
const dummyHash = () => (cachedDummyHash ??= bcrypt.hashSync("anthias-master-dummy-password", 12));

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

// The adapter's declared client type does not match Prisma 7's generated client, hence the cast
const baseAdapter = PrismaAdapter(prisma as unknown as Parameters<typeof PrismaAdapter>[0]);
type LinkedAccount = Parameters<NonNullable<typeof baseAdapter.linkAccount>>[0];
const PROVIDER_TOKEN_FIELDS = new Set([
    "access_token", "refresh_token", "id_token", "expires_at", "ext_expires_in", "token_type", "scope", "session_state",
]);
const adapter = {
    ...baseAdapter,
    // Sessions are JWT-only and the Microsoft tokens are never used afterwards: do not store them in the database
    linkAccount: (account: LinkedAccount) => {
        const identity = Object.fromEntries(
            Object.entries(account).filter(([key]) => !PROVIDER_TOKEN_FIELDS.has(key))
        ) as LinkedAccount;
        return baseAdapter.linkAccount!(identity);
    },
};

export const authOptions: NextAuthOptions = {
    adapter: adapter as unknown as NextAuthOptions["adapter"],
    // Short lifetime bounds how long the role stored in the cookie (read by the proxy) can be stale
    session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
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
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) return null;

                const rawEmail = credentials.email.trim();
                const email = rawEmail.toLowerCase();
                // nginx appends the real client address last in X-Forwarded-For
                const forwarded = req?.headers?.["x-forwarded-for"];
                const ip = (typeof forwarded === "string" ? forwarded.split(",").pop()?.trim() : "") || "unknown";
                const emailKey = `email:${email}`;
                const ipKey = `ip:${ip}`;

                if (isLimited(emailKey, 5) || isLimited(ipKey, 30)) {
                    throw new Error("TooManyAttempts");
                }

                const user = await prisma.user.findFirst({
                    where: { OR: [{ email }, { email: rawEmail }] },
                });

                // Always run bcrypt so response time does not reveal whether the account exists
                const valid = await bcrypt.compare(credentials.password, user?.passwordHash ?? dummyHash());
                if (!user?.passwordHash || !valid) {
                    recordFailure(emailKey);
                    recordFailure(ipKey);
                    return null;
                }

                clearFailures(emailKey);
                return { id: user.id, email: user.email!, name: user.name };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider !== "azure-ad") return true;

            // The token must come from the configured tenant
            const tid = (profile as { tid?: unknown } | undefined)?.tid;
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
                session.user.id = token.sub ?? "";
                session.user.role = token.role ?? "PENDING";
            }
            return session;
        },
    },
};
