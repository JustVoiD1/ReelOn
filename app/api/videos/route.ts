import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/lib/db"
import Video, { IVideo } from "@/models/video";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { VideoFormData } from "@/lib/types";
import User from "@/models/user";
export async function GET() {
    try {
        await connectToDB();
        // const videos = await Video.find({}).sort({ createdAt: -1 })
        const videos = await Video.find({}).populate('creator' ,'username displayName, profilePicture')
        .sort({createdAt: -1})
        if (!videos || videos.length === 0) {
            return NextResponse.json([], { status: 200 })
        }
        return NextResponse.json(videos)
    } catch (err) {
        console.error('Video fetch error: ', err)
        return NextResponse.json(
            { error: "Failed to fetch videos" },
            { status: 400 }
        )
    }


}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            )
        }
        await connectToDB();
        const {title, description, videoUrl, thumbnailUrl}: VideoFormData = await request.json();
        if (
            !title ||
            !description ||
            !videoUrl ||
            !thumbnailUrl
        ) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            )
        }

        const currentUser = await User.findOne({email: session.user.email})
        if(!currentUser){
            return NextResponse.json({
                success: false,
                error: 'User Not found'
            }, {
                status: 404
            })
        }

        const videoData : Omit<IVideo, '_id'> = {
            title,
            description,
            videoUrl,
            thumbnailUrl,
            controls: true,
            creator: currentUser._id,
            likesCount: 0,
            commentsCount: 0,
            viewsCount: 0,
            // default no tags
            hashtags: [],
            isPublic: true,
            allowComments: false
        }
        const newVideo = await Video.create(videoData)
        return NextResponse.json(newVideo)



    } catch (err) {
        console.error('Video Creation Error: ',err)
        return NextResponse.json(
            { error: "Failed to create a video" },
            { status: 400 },
        )
    }
}