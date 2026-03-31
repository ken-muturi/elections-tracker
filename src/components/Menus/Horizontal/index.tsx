// Create a server component wrapper
import { AuthOptions } from "@/app/auth";
import { getServerSession } from "next-auth";
// import Menu from "./Menu";

export default async function Navigation() {
  const session = await getServerSession(AuthOptions);
    if (!session) {
        return <></>; // or redirect to login
    }
//   return (
//     <Menu user={session.user} />
//   );
 return <></>; 
}