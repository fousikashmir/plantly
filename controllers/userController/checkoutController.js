
const users = require('../../models/userModel')
const address = require('../../models/addressModel')
const cart = require('../../models/cartModel')
const Address = require('../../models/addressModel')
const productModel = require('../../models/productModel')
const order = require('../../models/orderModel')

const coupon = require('../../models/couponModel')
const walletTransactionCollection = require('../../models/walletTransactionModel')
const session =require('express-session')

const Razorpay = require('razorpay')

let dotenv = require('dotenv')
dotenv.config()

const instance = new Razorpay({
    key_id : process.env.RAZORPAY_ID_KEY,
    key_secret : process.env.RAZORPAY_SECRET_KEY
})

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
                // Redirect to cart page with an error message if stock is insufficient
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

        const finalTotalAmount = totalAfterFloweringPlantDiscount - couponDiscount;
        const addressdata = await address.findOne({ user: session });

        res.render('checkout', {
            session,
            userData,
            Total: finalTotalAmount,
            addressdata: addressdata || {},
            products: cartData.products,
            snakePlantDiscount,
            floweringPlantsDiscount,
            couponDiscount,
            availableCoupons
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while processing your request.");
    }
};


async function recordWalletTransaction(userId , transactionType , amount , description){
    try{
        const transaction = new walletTransactionCollection({
            userId,
            transactionType,
            amount,
            description,
        });
        await transaction.save();
        console.log('Wallet transaction recorded succesfully')

    }catch(error){
        console.log('Error recording wallet transaction',error)
    }
} 
 
const placeOrder = async (req, res) => {
    try {
        const userData = await users.findOne({ _id: req.session.user_id });
        
        const session = req.session.user_id;

        const total = await cart.aggregate([
            { $match: { userId: userData._id } },
            { $unwind: "$products" },
            { $project: { productPrice: "$products.productPrice", quantity: "$products.quantity" } },
            { $group: { _id: null, total: { $sum: { $multiply: ["$productPrice", "$quantity"] } } } }
        ]);
        console.log('Total',total)

        let discountAmount = req.body.discountAmount || 0;

        const TotalInitially = total.length > 0 ? total[0].total : 0;
        
        const Total = TotalInitially - discountAmount;

        const userWalletAmount = userData.wallet;

        let paidAmount;
        let walletAmountUsed;
       
        let walletAmountBalance;

        if (userWalletAmount < TotalInitially) {
            paidAmount = req.body.amount;
            walletAmountUsed = TotalInitially - paidAmount
            console.log('walletAmountUsed',walletAmountUsed) 
            walletAmountBalance = userWalletAmount - walletAmountUsed;
        } else {
            paidAmount = 0;
            walletAmountUsed = TotalInitially;
            walletAmountBalance = userWalletAmount - TotalInitially;
        }

        await users.findOneAndUpdate({ _id: req.session.user_id }, { $set: { wallet: walletAmountBalance } });

        const userId = req.session.user_id;
        const transactionType = 'debit';
        const transactionAmount = walletAmountUsed;
        const transactionDescription = 'Order payment';
        await recordWalletTransaction(userId, transactionType, transactionAmount, transactionDescription);

        let payment = req.body.payment;
        let address = req.body.address;
        let city = req.body.city;
        let state = req.body.state;
        let pin = req.body.pin;
        

        const cartData = await cart.findOne({ userId: req.session.user_id });
        const products = cartData.products; 
        console.log('****',products)

        let status = payment === "online" ? "pending" : "placed";

        if (payment === 'wallet' && Total <= 0) {
            status = 'delivered';
        }


       
        const newOrder = new order({
            deliveryDetails: address,
            details: [{ city, state, pin }],
            user: userData.name,
            userId: userData._id,
            paymentMethod: payment,
            paid: paidAmount,
            wallet: walletAmountUsed,
            discount: discountAmount,
            product: products,
            totalAmount: TotalInitially,
            date: Date.now(),
            status: status
        });
        console.log('NewOrder',newOrder)   

        const saveOrder = await newOrder.save();
        const orderId = saveOrder._id;

        const orderData = await order.findById({ _id: orderId });
        console.log(orderData)
        const product = orderData.product;

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
           const result = await cart.deleteOne({ userId: userData._id });
            console.log('cart delete',result)
            res.json({ success: true });
        } else {
            const orderid = saveOrder._id;
            const totalamount = saveOrder.paid;

            var options = {
                amount: totalamount * 100,
                currency: "INR",
                receipt: "" + orderid
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
 
 

