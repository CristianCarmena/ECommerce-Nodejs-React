import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, "Code is required"],
            unique: true,
            lowercase: true,
            trim: true
        }, 
        discountPercentage: {
            type: Number,
            required: [true, "Discount is required"],
            min: [0, "Discount must be greater than 0"],
            max: [100, "Discount must be less than 100"]
        },
        expirationDate: {
            type: Date,
            required: [true, "Expiry date is required"]
        },
        isActive: {
            type: Boolean,
            default: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            unique: true
        },

    }, 
    {timestamps: true});

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;

