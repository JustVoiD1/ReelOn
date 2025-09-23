import bcrypt from "bcryptjs";
import mongoose, { model, models, Schema } from "mongoose";

type ObjectId = mongoose.Types.ObjectId

export interface IUser {
    email: string,
    username: string,
    password: string,
    _id?: ObjectId,
    
    displayName?: string,
    bio?: string,
    profilePicture?: string,

    followersCount: number,
    followingCount: number,
    videosCount: number,

    isActive: boolean,
    isVerified?: boolean,
    
    createdAt?: Date,
    updatedAt?: Date,
}

const userSchema = new Schema<IUser>({
    email: {type : String, required: true, unique: true, lowercase: true, trim: true},
    username: {type : String, required: true, maxlength: 20, minlength: 5, unique: true, lowercase: true, trim: true},
    password: {type: String, required: true, minlength: 6},
    displayName:{type: String, trim: true, maxlength: 50},
    bio: {type: String, maxlength: 150},
    profilePicture: String,
    followersCount: {type : Number, default : 0},
    followingCount: {type : Number, default : 0},
    videosCount: {type : Number, default: 0},
    isVerified: {type: Boolean, default: false},
    isActive: {type: Boolean, default: true},

}, {
    timestamps: true
})

const saltRounds = 10

userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, saltRounds)
    }
    next();
})

const User = models.User || model<IUser>("User", userSchema);

export default User;
