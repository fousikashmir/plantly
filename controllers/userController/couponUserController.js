
const session = require('express-session');
const coupon = require("../../models/couponModel")
const users = require('../../models/userModel')
const cart = require('../../models/cartModel')
const applyCoupon = async (req, res) => {
    try {
        const { couponCode,amount } = req.body;
        console.log('Coupon Code:', couponCode);
        console.log('amo:', amount);


        const session = req.session.user_id;
        console.log('User ID in session:', req.session.user_id);

        
        
        const couponData = await coupon.findOne({ code: couponCode });
        console.log("dat",couponData)
        
        
        if (!couponData || couponData.status !== 'Active' || couponData.expiryDate <= Date.now()) {
            return res.status(400).json({ message: "Invalid or expired coupon" });
        }
        
        
        console.log("Users who have used this coupon:", couponData.user);


        
const user = await users.findOne({ _id: session });
const cartTotalData = await cart.aggregate([
    { $match: { userId: user._id } },
    { $unwind: "$products" },
    { $project: { price: "$products.productPrice", quantity: "$products.quantity" } },
    { $group: { _id: null, total: { $sum: { $multiply: ["$price", "$quantity"] } } } }
]);

const cartTotal = cartTotalData[0]?.total || 0; // Get the total or default to 0
console.log("Calculated Cart Total:", cartTotal);
console.log("Discount Amount from couponData:", couponData.discountAmount);
console.log("Discount Type from couponData:", couponData.discountType);

 // Initialize discountAmount

// if (couponData.discountType === 'percentage') {
//     // Calculate percentage discount
//     discountAmount = cartTotal * (couponData.discountAmount / 100);
    
//     // Check if there's a maximum discount limit
//     if (couponData.maxDiscountAmount != null) {
//         discountAmount = Math.min(discountAmount, couponData.maxDiscountAmount); // Apply max limit
//     }
    
// } else 

   let discountAmount = couponData.discountAmount; // Just set it directly for testing
    console.log("Directly set discount amount:", discountAmount);



// Log the calculated discount amount
console.log("Calculated discount amount:", discountAmount);
let finalTotal = cartTotal-discountAmount;
console.log("TF",finalTotal)


        // Store the applied coupon in the session
        req.session.appliedCoupon = {
            _id:couponData._id,
            code: couponCode,
            discountAmount:couponData.discountAmount,
            type: couponData.discountType,
            finalTotal
        };
        
        
        await coupon.updateOne(
            { code: couponCode },
            { $push: { user: session } }
        );
        console.log("Coupon usage updated successfully");
        
        // Send a success response with the discount amount
        res.json({ success: true, discountAmount,finalTotal });
        
    } catch (error) {
        console.error("Error applying coupon:", error.message);
    
        console.error(error);
        res.status(500).json({ message: "An error occurred while applying the coupon." });
    }
};



const removeCoupon = async (req, res) => {
    try {

        if (!req.session.appliedCoupon) {
        
            return res.json({ success: false, message: "No coupon to remove" });
        }

        const code = req.session.appliedCoupon.code;
        const userId = req.session.user_id;

        
        await coupon.updateOne(
            { code: code },
            { $pull: { user: userId }, $inc: { maxUsers: 1 } }
        );


        
        req.session.appliedCoupon = null;
        
        const totalAmount = req.session.originalTotalAmount;  


        res.json({ success: true, totalAmount: totalAmount });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false });
    }
};

module.exports = {
    applyCoupon,
    removeCoupon
}


