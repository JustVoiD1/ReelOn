import mongoose, {Schema, model, models} from "mongoose";
import bcrypt from "bcryptjs";
type ObjectId = mongoose.Types.ObjectId

export interface IUser {
    email: string;
    username: string;
    password: string;
    _id?: ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const userSchema = new Schema<IUser>({
    email: {type: String, required: true, unique: true},
    username: {type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20},
    password: {type: String, required: true},
    },
    {timestamps: true}
);
//just before the data is processed and saved
userSchema.pre("save", async function(next){
    //whatever declared before, can be accessed by this
    //hash the modified passowrd
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 5)
    }
    next();
})
//handle if model already exists
const User = models?.User || model<IUser>("User", userSchema);

export default User;