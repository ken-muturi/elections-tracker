import Details from "./Details"
import { Election } from "../types"

export default function Wards({ elections }: { elections: Election[] }) {
  return <Details elections={elections} />
}
