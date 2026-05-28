import { redirect } from "next/navigation"

/** Body Lab lives at /body-lab (single source of truth for account-linked photo + measurements). */
export default function AccountBodyLabRedirect() {
  redirect("/body-lab")
}
