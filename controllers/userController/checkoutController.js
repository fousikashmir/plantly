
const users = require('../../models/userModel')
const address = require('../../models/addressModel')
const cart = require('../../models/cartModel')
const Address = require('../../models/addressModel')
const productModel = require('../../models/productModel')
const order = require('../../models/orderModel')

const coupon = require('../../models/couponModel')
const walletTransaction = require('../../models/walletTransactionModel')
const session =require('express-session')

const Razorpay = require('razorpay')

let dotenv = require('dotenv')
dotenv.config()

const instance = new Razorpay({
    key_id : process.env.RAZORPAY_ID_KEY,
    key_secret : process.env.RAZORPAY_SECRET_KEY
})

async function recordWalletTransaction(userId , transactionType , amount , description,timestamp){
    try{
        const transaction = new walletTransaction({
            userId,
            transactionType,
            amount,
            description,
            timestamp
        });
        await transaction.save();
        console.log('Wallet transaction recorded succesfully')

    }catch(error){
        console.log('Error recording wallet transaction',error)
    }
} 

const getCheckout = async function (req, res) {
    try {
        const availableCoupons = await coupon.find({});
        const session = req.session.user_id;
        const userData = await users.findById({ _id: session });
        const cartData = await cart.findOne({ userId: session }).populate("products.productId");
        const products = cartData.products;

        let snakePlantDiscount = 0;
        let floweringPlantsDiscount = 0;
        let couponDiscount = 0;

        // Check stock availability
        for (let i = 0; i < products.length; i++) {
            const product = products[i].productId;
            const quantityInCart = products[i].quantity;

            // Fetch the latest stock from the database
            const currentProduct = await productModel.findById(product._id);
            const currentStock = currentProduct.stock;

            if (quantityInCart > currentStock) {
               
                return res.status(400).json({
                    message: `The quantity for ${product.name} exceeds the available stock. Please adjust your cart.`
                });
            }

            // Calculate discounts as before
            if (product.name === 'snake plant') {
                snakePlantDiscount += 50 * quantityInCart;
            }
            if (product.category === 'Flowering plants') {
                floweringPlantsDiscount += (product.price * 0.2) * quantityInCart;
            }
        }

        const totalAfterSnakePlantDiscount = await cart.aggregate([
            { $match: { userId: userData._id } },
            { $unwind: "$products" },
            { $project: { productPrice: "$products.productPrice", quantity: "$products.quantity" } },
            { $group: { _id: null, total: { $sum: { $multiply: ["$productPrice", "$quantity"] } } } }
        ]);

        const totalSnakePlantDiscount = totalAfterSnakePlantDiscount.length > 0 ? totalAfterSnakePlantDiscount[0].total - snakePlantDiscount : 0;
        const totalAfterFloweringPlantDiscount = totalSnakePlantDiscount - floweringPlantsDiscount;

        const appliedCouponCode = req.body.couponCode;
        if (appliedCouponCode) {
            const Coupon = await coupon.findOne({ code: appliedCouponCode });
            if (coupon && coupon.status && coupon.expiryDate > Date.now()) {
                if (coupon.user.includes(session) || coupon.maxUsers <= coupon.user.length) {
                    return res.status(400).json({ message: "Coupon has been used or exceeded maximum usage limit" });
                }
                if (coupon.discountType === 'percentage') {
                    couponDiscount = totalAfterFloweringPlantDiscount * (coupon.discountAmount / 100);
                } else if (coupon.discountType === 'fixed') {
                    couponDiscount = Math.min(coupon.discountAmount, coupon.maxDiscountAmount || Infinity);
                }
                await coupon.updateOne(
                    { code: appliedCouponCode },
                    { $push: { user: session } }
                );
            } else {
                return res.status(400).json({ message: "Invalid or expired coupon" });
            }
        }

        const finalTotalAmount = (totalAfterFloweringPlantDiscount - couponDiscount).toFixed(2);
        const addressdata = await address.findOne({ user: session });
        const walletData = await walletTransaction.findOne({ userId: session });
        const walletAmount = walletData ? walletData.amount : 0;

        
        
        

        res.render('checkout', {
            session,
            userData,
            Total: parseFloat(finalTotalAmount),
            addressdata: addressdata || {},
            products: cartData.products,
             snakePlantDiscount,
             floweringPlantsDiscount,
             couponDiscount,
            availableCoupons,
            walletAmount
            
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while processing your request.");
    }
};



 
const placeOrder = async (req, res) => {
    try {
        const userData = await users.findOne({ _id: req.session.user_id });
        const session = req.session.user_id;

        
        const totalResult = await cart.aggregate([
            { $match: { userId: userData._id } },
            { $unwind: "$products" },
            { $project: { productPrice: "$products.productPrice", quantity: "$products.quantity" } },
            { $group: { _id: null, total: { $sum: { $multiply: ["$productPrice", "$quantity"] } } } }
        ]);

        const TotalInitially = totalResult.length > 0 ? totalResult[0].total : 0;
        let discountAmount = req.body.discountAmount || 0;
        const Total = (TotalInitially - discountAmount).toFixed(2); 
        const walletData = await walletTransaction.findOne({userId:req.session.user_id})
        const userWalletAmount = walletData?walletData.amount.toFixed(2):0
        console.log(userWalletAmount)

        let payment = req.body.payment;
        let paidAmount = 0;
        let walletAmountUsed = 0;
        let walletAmount = userWalletAmount;
        let status = payment === "online" ? "pending" : "placed"; 

        if (payment === "wallet") {
            
           
            if (userWalletAmount >= Total) {
                paidAmount = 0;  
                walletAmountUsed = Total;
                walletAmount = userWalletAmount - Total;
                status = "placed"; 

                walletData.amount = walletAmount
                await walletData.save()
            }else{ 
                return res.json({ success: false, message: "Not enough balance in the wallet." });
            }
        } else if (payment === "online" || payment === "COD") {
           
            paidAmount = req.body.amount || Total;  
            walletAmountUsed = 0;
            walletAmount = userWalletAmount;
        }

        
        if (walletAmountUsed > 0) {
            

            
            const userId = req.session.user_id;
            const transactionType = 'debit';
            const transactionAmount = walletAmountUsed;
            const transactionDescription = 'Order payment';
            await recordWalletTransaction(userId, transactionType, transactionAmount, transactionDescription);
        }

       
        const address = req.body.address;
        const city = req.body.city;
        const state = req.body.state;
        const pin = req.body.pin;
        const cartData = await cart.findOne({ userId: req.session.user_id });
        const products = cartData.products;

       
        const newOrder = new order({
            deliveryDetails: address,
            details: [{ city, state, pin }],
            user: userData.name,
            userId: userData._id,
            paymentMethod: payment,
            paid: paidAmount,
            wallet: walletAmount,
            discount: discountAmount,
            product: products,
            totalAmount: TotalInitially,
            date: Date.now(),
            status: status
        });

        const saveOrder = await newOrder.save();

        
        const product = saveOrder.product;
        for (let i = 0; i < product.length; i++) {
            const productId = product[i].productId;
            const quantity = product[i].quantity;
            await productModel.findByIdAndUpdate(productId, { $inc: { stock: -quantity } });
            const productData = await productModel.findById({ _id: productId });

            if (productData.stock === 0) {
                await productModel.findByIdAndUpdate(productId, { $set: { status: 'Out Of Stock' } });
            }
        }

        
        if (status === "placed") {
            
            await cart.deleteOne({ userId: userData._id });
            res.json({ success: true });
        } else {
           
            const orderId = saveOrder._id;
            const totalAmount = saveOrder.paid;

            var options = {
                amount: totalAmount * 100, 
                currency: "INR",
                receipt: "" + orderId
            };

            
            instance.orders.create(options, function (err, order) {
                res.json({ order });
            });
        }
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, error: error.message });
    }
};

const orderPlaced = async (req, res) => {
    try {
       
        const userData = await users.findOne({ _id: req.session.user_id })
        console.log(userData)
        const  session = req.session.user_id

        res.render('success', { session, userData })

    } catch (error) {
        console.log(error.message);

    }
}

module.exports = {
    getCheckout,
    placeOrder,
    orderPlaced,
    recordWalletTransaction
}
 
 

