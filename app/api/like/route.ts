import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import Comment from "@/models/comment";
import Like from "@/models/like";
import User from "@/models/user";
import Video from "@/models/video";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        await connectToDB()


        const {videoId, commentId} = await req.json();

        const currentUser = await User.findOne({email: session.user.email})
        if(!currentUser){
            return NextResponse.json({ success: false, error: 'No user found' }, { status: 404 })
        }
        if(videoId){
            const existingLike = await Like.findOne({
                user: currentUser._id,
                video: videoId
            })

            if(existingLike){
                // toggle like
                await Like.findByIdAndDelete(existingLike._id)
                await Video.findByIdAndUpdate(videoId, {$inc: {likesCount: -1}})
                return NextResponse.json({ liked: false, message: 'video unliked' }, { status: 200 })
                
            }
            else {
                await Like.create({
                    user: currentUser._id,
                    video: videoId
                })

                await Video.findByIdAndUpdate(videoId, {$inc: {
                    likesCount: 1
                }})
                return NextResponse.json({
                    liked: true,
                    message: "video liked"
                })
            }
        }
        else if(commentId){
            const existingLike = await Like.findOne({
                user: currentUser._id,
                comment: commentId
            })

            if(existingLike){
                await Like.findByIdAndDelete(existingLike._id)
                await Comment.findByIdAndUpdate(commentId, {$inc: {likesCount: -1}})
                return NextResponse.json({
                    liked: false,
                    message: 'Comment unliked',
                })
            }
            else {
                await Like.create({
                    user: currentUser._id,
                    comment: commentId
                    
                })
                await Comment.findByIdAndUpdate(commentId, {$inc: {
                    likesCount: 1
                }})
                return NextResponse.json({liked: true, message: 'comment liked'})
            }
        }
        return NextResponse.json({
            success: false,
            error : 'Invalid Request, missing context' 
        }, {status: 400})
    } catch (err) {
        console.error(err);
        return NextResponse.json({
            success: false,
            error : 'Server Error' 
        }, {status: 500})
    }


}