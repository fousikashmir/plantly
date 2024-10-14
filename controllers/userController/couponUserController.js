
const session = require('express-session');
const coupon = require("../../models/couponModel")


const applyCoupon = async (req, res) => {
    try {
        const code = req.body.code;
        const amount = Number(req.body.amount);
        const userExist = await coupon.findOne({ code: code, user: { $in: [req.session.user_id] } });
        if (userExist) {
            res.json({ user: true });
        } else {
            const couponData = await coupon.findOne({ code: code });
            // console.log(couponData);
            if (couponData) {
                if (couponData.maxUsers <= 0) {
                    res.json({ limit: true });
                } else {
                    if (couponData.status == false) {
                        res.json({ status: true })
                    } else {
                        if (couponData.expiryDate <= new Date()) {
                            res.json({ date: true });
                        } else {
                            if (couponData.maxCartAmount >= amount) {
                                res.json({ cartAmount: true });
                            } else {
                                await coupon.findByIdAndUpdate({ _id: couponData._id }, { $push: { user: req.session.user_id } });
                                await coupon.findByIdAndUpdate({ _id: couponData._id }, { $inc: { maxUsers: -1 } });
                                if (couponData.discountType == "Fixed") {
                                    const disAmount = couponData.discountAmount;
                                    if (disAmount > amount) {
                                        disAmount = amount;  
                                    }
                                    const disTotal = Math.round(amount - disAmount);
                                    return res.json({ amountOkey: true, disAmount, disTotal });
                                } else if (couponData.discountType == "Percentage Type") {
                                    const perAmount = (amount * couponData.discountAmount) / 100;
                                    if (perAmount <= maxDiscountAmount) {
                                        const disAmount = perAmount;
                                        const disTotal = Math.round(amount - disAmount);
                                        return res.json({ amountOkey: true, disAmount, disTotal });
                                    }
                                } else {
                                    let disAmount = couponData.maxDiscountAmount;
                                    let disTotal = Math.round(amount - disAmount);
                                    return res.json({ amountOkey: true, disAmount, disTotal });
                                }
                            }
                        }
                    }
                }
            } else {
                res.json({ invalid: true });
            }
        }

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    applyCoupon
}