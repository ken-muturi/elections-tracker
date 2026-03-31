
import { NextResponse } from "next/server";
import { genSaltSync, hashSync } from 'bcrypt-ts';

import { pick } from "lodash";
import { handleReturnError } from "@/db/error-handling";

import { createUser } from "@/services/Users";
import { UserForm } from "@/components/Users/type";

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const salt = genSaltSync(10);
        const hash = hashSync(data.password, salt);
        const user = await createUser({
            email: data.email.toLowerCase(),
            password: hash,
            firstname: data.firstname,
            othernames: data.othernames,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            nationalId: data.nationalId,
            phone: data.phone,
            image: data.image ?? null,
        } as unknown as UserForm);
        return NextResponse.json({
            user: pick(user, ['id', 'email', 'firstname', 'othernames', 'role']),
        });
    } catch (e) {
        const message = handleReturnError(e);
        return new NextResponse(
            JSON.stringify({
                status: 'error',
                message: message,
            }),
            { status: 500 }
        );
    }
}