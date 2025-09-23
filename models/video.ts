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
    creator: ObjectId
    likesCount: number,
    commentsCount: number,
    viewsCount: number

    hashtags: string[],

    isPublic: boolean,
    allowComments: boolean,

    createdAt?: Date;
    updatedAt?: Date;


}

const videoSchema = new Schema<IVideo>({
    title: { type: String, required: true , maxlength: 100},
    description: { type: String, required: true, maxlength: 300 },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    controls: { type: Boolean, default: true },
    creator: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    likesCount: {type: Number, default: 0},
    commentsCount: {type: Number, default: 0},

    hashtags: [{type: String, lowercase: true}],

    isPublic: {type: Boolean, default: true},
    allowComments: {type : Boolean, default : true},
}, { 
    timestamps: true 
})

videoSchema.index({ createdAt: -1 });
videoSchema.index({ hashtags: 1 });
videoSchema.index({ creator: 1, createdAt: -1 });

const Video = models.Video || model<IVideo>("Video", videoSchema)

export default Video;