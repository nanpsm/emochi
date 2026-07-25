import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { randomUUID } from "crypto";
import { getPool, sql } from "@/lib/db";

async function upsertUser({ email, name }) {
  const pool = await getPool();

  const existing = await pool
    .request()
    .input("email", sql.NVarChar, email)
    .query("SELECT id, personality_type FROM users WHERE email = @email");

  if (existing.recordset.length > 0) {
    const user = existing.recordset[0];
    return { id: user.id, isNew: false, hasOnboarded: !!user.personality_type };
  }

  // Derive a username from the email local part, ensure it's unique
  const base =
    email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase() || "user";
  let username = base;
  let suffix = 1;

  while (true) {
    const taken = await pool
      .request()
      .input("username", sql.NVarChar, username)
      .query("SELECT id FROM users WHERE username = @username");
    if (taken.recordset.length === 0) break;
    username = `${base}${suffix++}`;
  }

  const id = randomUUID();

  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("username", sql.NVarChar, username)
    .input("email", sql.NVarChar, email)
    .input("display_name", sql.NVarChar, name ?? null)
    .query(`
      INSERT INTO users (id, username, email, display_name, created_at, updated_at)
      VALUES (@id, @username, @email, @display_name, SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET())
    `);

  return { id, isNew: true, hasOnboarded: false };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  ],
  callbacks: {
    async jwt({ token, profile, account }) {
      if (account && profile) {
        try {
          const { id, isNew, hasOnboarded } = await upsertUser({
            email: profile.email ?? token.email,
            name: profile.name ?? token.name,
          });
          token.dbId = id;
          token.isNewUser = isNew;
          token.hasOnboarded = hasOnboarded;
        } catch (err) {
          console.error("Failed to upsert user:", err);
        }
      } else if (!token.dbId && token.email) {
        // Backfill dbId for sessions created before this field was added
        try {
          const pool = await getPool();
          const res = await pool.request()
            .input("email", sql.NVarChar, token.email)
            .query("SELECT id, personality_type FROM users WHERE email = @email");
          if (res.recordset.length > 0) {
            token.dbId = res.recordset[0].id;
            token.hasOnboarded = !!res.recordset[0].personality_type;
          }
        } catch (err) {
          console.error("Failed to backfill dbId:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.dbId && session.user) {
        session.user.dbId = token.dbId;
        session.user.isNewUser = token.isNewUser ?? false;
        session.user.hasOnboarded = token.hasOnboarded ?? true;
      }
      return session;
    },
  },
});
