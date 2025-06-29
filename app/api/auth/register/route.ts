import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/user";

export async function POST(request: NextRequest) {

    try {
        const { email, username, password } = await request.json();
        if (!email || !username || !password) {
            return NextResponse.json({
                error: "Email, username, and password are required",
            },
                {
                    status: 400,
                }

            )
        }

        await connectToDB();
        const existingUser = await User.findOne({ 
            $or: [
                { email },
                { username }
            ]
        });
        if (existingUser) {
            if (existingUser.email === email) {
                return NextResponse.json({
                    error: "Email already registered",
                },
                    {
                        status: 400,
                    }
                )
            } else {
                return NextResponse.json({
                    error: "Username already taken",
                },
                    {
                        status: 400,
                    }
                )
            }
        }
        await User.create({
            email,
            username,
            password
        })

        return NextResponse.json({
            error: "Successfully registered",
        },
            {
                status: 201,
            }

        )

    } catch (error) {
        return NextResponse.json({
                error: "Failed to register",
            },
                {
                    status: 500,
                }

            )
    }

}


//through frontend

// const result = await fetch('/api/auth/register', {
//     method: "POST",
//     headers: {"Content-type": "application/json"},
//     body: JSON.stringify({email, password})
// })

// result.json();