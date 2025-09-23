import mongoose, { Schema, model, models } from "mongoose";

type ObjectId = mongoose.Types.ObjectId;

export interface IFollow {
    _id?: ObjectId;
    follower: ObjectId;
    following: ObjectId;
    createdAt?: Date;
}

const followSchema = new Schema<IFollow>({
    follower: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    following: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }
}, {
    timestamps: true
});

// Unique follow relationship
followSchema.index({ follower: 1, following: 1 }, { unique: true });

const Follow = models.Follow || model<IFollow>("Follow", followSchema);

export default Follow;