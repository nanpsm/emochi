import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AuthRedirect() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const { isNewUser, hasOnboarded } = session.user ?? {};

  if (isNewUser || !hasOnboarded) {
    redirect("/quiz");
  }

  redirect("/home");
}
