import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Comment from "@/models/comment";
import Video from "@/models/video";
import User from "@/models/user";
import { connectToDB } from "@/lib/db";

// Get comments for a video
export async function GET(req: NextRequest) {
    try {
        await connectToDB();
        
        const { searchParams } = new URL(req.url);
        const videoId = searchParams.get('videoId');
        
        if (!videoId) {
            return NextResponse.json({success: false, error: "Missing videoId" }, { status: 400 });
        }

        const comments = await Comment.find({ video: videoId })
            .populate('author', 'username displayName profilePicture')
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json({success: true, comments });
    } catch (error) {
        console.error("Get comments error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// Add a comment
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDB();
        
        const { content, videoId } = await req.json();
        
        if (!content || !videoId) {
            return NextResponse.json({success: false, error: "Missing content or videoId" }, { status: 400 });
        }

        // Find current user
        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) {
            return NextResponse.json({success: false, error: "User not found" }, { status: 404 });
        }

        // Create comment
        const comment = await Comment.create({
            content,
            author: currentUser._id,
            video: videoId
        });

        // Update video comments count
        await Video.findByIdAndUpdate(videoId, { $inc: { commentsCount: 1 } });

        // Populate author info for response
        await comment.populate('author', 'username displayName profilePicture');

        return NextResponse.json({ 
            success: true, 
            message: "Comment added",
            comment 
        });
    } catch (error) {
        console.error("Add comment error:", error);
        return NextResponse.json({success: false, error: "Server error" }, { status: 500 });
    }
}