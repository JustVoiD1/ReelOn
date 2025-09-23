import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/lib/db"
import Video, { IVideo } from "@/models/video";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        await connectToDB();
        const videos = await Video.find({}).sort({ createdAt: -1 })
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
        const body: IVideo = await request.json();
        if (
            !body.title ||
            !body.description ||
            !body.videoUrl ||
            !body.thumbnailUrl
        ) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            )
        }

        const videoData = {
            ...body,
            controls: body.controls ?? true
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