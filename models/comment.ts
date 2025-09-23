import mongoose, { Schema, model, models } from "mongoose";

type ObjectId = mongoose.Types.ObjectId;

export interface IComment {
    _id?: ObjectId;
    content: string;
    author: ObjectId;
    video: ObjectId;
    likesCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const commentSchema = new Schema<IComment>({
    content: { 
        type: String, 
        required: true,
        maxlength: 200
    },
    author: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    video: { 
        type: Schema.Types.ObjectId, 
        ref: 'Video', 
        required: true 
    },
    likesCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Simple indexes
commentSchema.index({ video: 1, createdAt: -1 });

const Comment = models.Comment || model<IComment>("Comment", commentSchema);

export default Comment;