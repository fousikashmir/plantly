const session = require('express-session');
const coupon = require("../../models/couponModel")


 const getCouponListPage = async function (req, res) {
    try {
        const couponData = await coupon.find({})
        res.render('coupons', { message: couponData })
    } catch (error) {
        console.log(error);
    }
}
 


 const getCouponAddPage = async function (req, res) {
    try {
        categoryData = []
        res.render('add-coupons', { categoryData })
    } catch (error) {
        console.log(error);
    }
}
 


 const postAddCoupon = async function (req, res) {
    try {
        const newCoupon = new coupon({
            code: req.body.code,
            discountType: req.body.discountType,
            discountAmount: req.body.discountAmount,
            maxDiscountAmount: req.body.amount,
            maxCartAmount: req.body.cartamount,
            expiryDate: req.body.expirydate,
            maxUsers: req.body.couponcount
        })
        const couponData = await newCoupon.save()

        if (couponData) {
            res.redirect('/admin/coupons')
        } else {
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error);
    }
}
 
 



 const deleteCoupon = async function (req, res) {
    try {
        const id = req.query.id
       await coupon.deleteOne({_id:id})
       res.redirect("/admin/coupons")
    } catch (error) {
        console.log(error);
    }
}




 const editCoupon = async function (req, res) {
    try {
        const id = req.query.id
        const couponData = await coupon.findById({_id:id})
        // console.log(couponData);
        res.render("edit-coupon",{couponData})
    } catch (error) {
        console.log(error);
    }
}
 


 const postEditCoupon = async function (req, res) {
    try {
        const id = req.body.id
        await coupon.updateMany({_id:id},{$set:{
            code: req.body.code,
            discountType: req.body.discountType,
            discountAmount: req.body.discountAmount,
            maxDiscountAmount: req.body.amount,
            maxCartAmount: req.body.cartamount,
            expiryDate: req.body.expirydate,
            maxUsers: req.body.couponcount
        }})

        res.redirect("/admin/coupons")
    } catch (error) {
        console.log(error);
    }
}
 

module.exports = {
    getCouponListPage,
    getCouponAddPage,
    postAddCoupon,
    deleteCoupon,
    editCoupon,
    postEditCoupon
}