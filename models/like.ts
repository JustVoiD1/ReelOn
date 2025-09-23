import mongoose, { Schema, model, models } from "mongoose";

type ObjectId = mongoose.Types.ObjectId;

export interface ILike {
    _id?: ObjectId;
    user: ObjectId;
    video?: ObjectId;
    comment?: ObjectId;
    createdAt?: Date;
}

const likeSchema = new Schema<ILike>({
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    video: { 
        type: Schema.Types.ObjectId, 
        ref: 'Video' 
    },
    comment: { 
        type: Schema.Types.ObjectId, 
        ref: 'Comment' 
    }
}, {
    timestamps: true
});

// Ensure unique likes - conditional indexes
likeSchema.index(
    { user: 1, video: 1 }, 
    { 
        unique: true, 
        partialFilterExpression: { video: { $exists: true, $ne: null } }
    }
);
likeSchema.index(
    { user: 1, comment: 1 }, 
    { 
        unique: true, 
        partialFilterExpression: { comment: { $exists: true, $ne: null } }
    }
);

const Like = models.Like || model<ILike>("Like", likeSchema);

export default Like;