import mongoose, { Schema, model, models } from "mongoose";
// import bcrypt from "bcryptjs";
type ObjectId = mongoose.Types.ObjectId

//only reel dimensions

export const VIDEO_DIMENSIONS = {
    width: 1080,
    height: 1920,
}

export interface IVideo {
    _id?: ObjectId,
    title: string,
    description: string,
    videoUrl: string,
    thumbnailUrl: string,
    controls?: boolean,
    
    createdAt?: Date;
    updatedAt?: Date;


}

const videoSchema = new Schema<IVideo>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    controls: { type: Boolean, default: true },
    createdAt: Date,
    updatedAt: Date,
},
    { timestamps: true })

const Video = models.Video || model<IVideo>("Video", videoSchema)

export default Video;