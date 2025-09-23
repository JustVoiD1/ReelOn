import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import Follow from "@/models/follow";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, {
                status: 401
            })
        }

        await connectToDB()
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId');
        if (!userId) {
            return NextResponse.json({
                success: false,
                error: 'Missing userId'
            }, {
                status: 404
            })
        }

        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, {
                status: 404
            })
        }

        const isFollowing = await Follow.findOne({
            follower: currentUser._id,
            following: userId
        })
        return NextResponse.json({
            success: true,
            // returns true if the object found rather than sending the whole object
            isFollowing: !!isFollowing
        }, {
            status: 200
        })
    } catch (err) {
        console.error('Check following error: ', err)
        return NextResponse.json({
            success: false,
            // returns true if the object found rather than sending the whole object
            error: 'Server error'
        }, {
            status: 500
        })
    }
}