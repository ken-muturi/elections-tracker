import PartiesManager from "@/components/Parties/PartiesManager"
import { getParties } from "@/services/Parties"

export default async function PartiesPage() {
  const parties = await getParties()
  return <PartiesManager initialParties={parties} />
}
