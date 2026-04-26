
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { pick } from "lodash";
import { handleReturnError } from "@/db/error-handling";
import { createUser } from "@/services/Users";
import { UserForm } from "@/components/Users/type";
import { AuthOptions } from "@/app/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(AuthOptions);
    const role = session?.user?.role?.toLowerCase() ?? "";
    if (!session || !["admin", "super admin"].includes(role)) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

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
        { status: "error", message: "email, password and firstname are required" },
        { status: 400 },
      );
    }

    if (!EMAIL_RE.test(allowed.email)) {
      return NextResponse.json(
        { status: "error", message: "Invalid email address" },
        { status: 400 },
      );
    }

    if (allowed.password.length < 8) {
      return NextResponse.json(
        { status: "error", message: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const passwordHash = await hash(allowed.password, 10);

    const user = await createUser({
      email: allowed.email.toLowerCase().trim(),
      password: passwordHash,
      firstname: allowed.firstname.trim(),
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
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
