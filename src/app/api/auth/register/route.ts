
import { NextResponse } from "next/server";
import { genSaltSync, hashSync } from 'bcrypt-ts';
import { getServerSession } from "next-auth";
import { pick } from "lodash";
import { handleReturnError } from "@/db/error-handling";
import { createUser } from "@/services/Users";
import { UserForm } from "@/components/Users/type";
import { AuthOptions } from "@/app/auth";

export async function POST(request: Request) {
    try {
      // Only admins may create user accounts
      const session = await getServerSession(AuthOptions);
      const role = session?.user?.role?.toLowerCase() ?? "";
      if (!session || !["admin", "super admin"].includes(role)) {
        return NextResponse.json(
          { status: "error", message: "Unauthorized" },
          { status: 401 },
        );
      }

      const body = await request.json();

      // Allowlist accepted fields — never accept roleId from external input
      const allowed = pick(body, [
        "email",
        "password",
        "firstname",
        "othernames",
        "dateOfBirth",
        "gender",
        "nationalId",
        "phone",
        "image",
      ]) as {
        email?: string;
        password?: string;
        firstname?: string;
        othernames?: string;
        dateOfBirth?: string;
        gender?: string;
        nationalId?: string;
        phone?: string;
        image?: string;
      };

      if (!allowed.email || !allowed.password || !allowed.firstname) {
        return NextResponse.json(
          {
            status: "error",
            message: "email, password and firstname are required",
          },
          { status: 400 },
        );
      }

      const salt = genSaltSync(10);
      const hash = hashSync(allowed.password, salt);

      const user = await createUser({
        email: allowed.email.toLowerCase(),
        password: hash,
        firstname: allowed.firstname,
        othernames: allowed.othernames ?? "",
        dateOfBirth: allowed.dateOfBirth ?? "",
        gender: allowed.gender ?? "",
        nationalId: allowed.nationalId ?? "",
        phone: allowed.phone ?? "",
        image: allowed.image ?? null,
      } as unknown as UserForm);

      return NextResponse.json({
        user: pick(user, ["id", "email", "firstname", "othernames", "role"]),
      });
    } catch (e) {
        const message = handleReturnError(e);
        return new NextResponse(JSON.stringify({ status: "error", message }), {
          status: 500,
        });
    }
}