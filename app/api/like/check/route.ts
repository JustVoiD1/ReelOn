import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import Like from "@/models/like";
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
        const videoId = searchParams.get('videoId');
        const commentId = searchParams.get('commentId');
        if (!videoId && !commentId) {
            return NextResponse.json({
                success: false,
                error: 'Missing videoId or CommentId'
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
        let isLiked = false;
        if (videoId) {
            const like = await Like.findOne({
                user: currentUser._id,
                video: videoId
            })
            isLiked = !!like
        }
        else if(commentId) {
            const like = await Like.findOne({
                user: currentUser._id,
                comment: commentId
            })
            isLiked = !!like
            
        }

        return NextResponse.json({
            success: true,
            // returns true if the object found rather than sending the whole object
            isLiked
        }, {
            status: 200
        })
    } catch (err) {
        console.error('Check Like error: ', err)
        return NextResponse.json({
            success: false,
            // returns true if the object found rather than sending the whole object
            error: 'Server error'
        }, {
            status: 500
        })
    }
}