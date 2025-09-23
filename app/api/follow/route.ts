import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import Follow from "@/models/follow";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest){
    try{
        const session = await getServerSession(authOptions);
        if(!session?.user?.email){
            return NextResponse.json({success: false, error : 'Unauthorized'}, {status: 401});

        }

        await connectToDB()

        const { followingId } = await req.json()

        const currentUser = await User.findOne({email: session.user.email})
        if(!currentUser){
            return NextResponse.json({success: false, error : 'User not found'}, {status: 404});
        }

        // edge cases: 
        
        // can't follow myself
        if(currentUser._id.toString() ===followingId){
            return NextResponse.json({success: false, error : 'Cannot follow yourself'}, {status: 400});
        }

        // Check if the user to follow exists
        const userToFollow = await User.findById(followingId);
        if(!userToFollow){
            return NextResponse.json({success: false, error : 'User to follow not found'}, {status: 404});
        }

        // already following 
        const existingFollow = await Follow.findOne({
            follower: currentUser._id,
            following: followingId
        })

        if(existingFollow){
            return NextResponse.json({success: true, message : 'Already following', isFollowing: true}, {status: 200});
        }

        await Follow.create({
            follower: currentUser._id,
            following: followingId
        })

        await User.findByIdAndUpdate(currentUser._id, {$inc: {followingCount: 1}})
        await User.findByIdAndUpdate(followingId, {$inc: {followersCount: 1}})

        return NextResponse.json({success: true, message : "Followed Successfully"});


    } catch (err) {
        console.error('Error while following', err);
        return NextResponse.json({success: false, error: 'Server Error'}, {status: 500})
    }
}


export async function DELETE(req: NextRequest){
    try {
        const session = await getServerSession(authOptions)
        if(!session?.user?.email){
            return NextResponse.json({success: false, error: 'Unauthorized'}, {status: 401});
        }

        await connectToDB()

        const {searchParams} = new URL(req.url)
        const followingId = searchParams.get('followingId');

        if(!followingId){
            return NextResponse.json({success: false, error: 'Missing Following id'}, {status: 400});
        }

        const currentUser = await User.findOne({email: session.user.email})
        if(!currentUser){
            return NextResponse.json({success: false, error : 'User not found'}, {status: 404})

        }

        const deletedFollow = await Follow.findOneAndDelete({
            following: followingId,
            follower: currentUser._id,
        })
        
        if(!deletedFollow){
            return NextResponse.json({success: false, error: 'Not Following'}, {status: 400})

        }

        await User.findByIdAndUpdate(currentUser._id, {$inc: {followingCount: -1}})
        await User.findByIdAndUpdate(followingId, {$inc: {followersCount: -1}})

        return NextResponse.json({success: true, message: 'Unfollowed Successfully'}, {status: 200})


    
        
    } catch (err) {
        console.error(err);
        return NextResponse.json({success: false, error: 'Server Error'}, {status: 500})
    }
}