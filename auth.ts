import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: '/sign-in',
    },
    callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async session({ session, user }: any) {
            if (session?.user) {
                session.user.id = user.id;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
