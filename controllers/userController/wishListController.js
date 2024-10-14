const product = require('../../models/productModel')
const user = require('../../models/userModel')
const wishlist = require('../../models/wishlistModel')
const cart = require('../../models/cartModel')
const mongoose=require('mongoose')



const addToWishList = async(req,res) => {
    try{
        const productId = req.body.id
        const session = req.session.user_id
        const productData = await product.findOne({_id:productId})
        const userData = await user.findOne({_id:session})
        const wishListData = await wishlist.findOne({ user:userData._id})
        if(wishListData){
            const wishListExists = wishListData.product.findIndex((product) => product.productId == productId)
            if(wishListExists != -1){
                res.json({ productExist : true})
            }else {
                await wishlist.updateOne({user: userData._id},
                    {
                        $push:{
                            product : [{
                                productId:productData._id,
                                name:productData.name,
                                price:productData.price
                            }]
                        }
                    } )
            }
            res.json({ status:true})
        } else{
            const wishList = new wishlist({
                user:userData._id,
                product:[{
                    productId:productData.id,
                    name:productData.name,
                    price:productData.price
                }]

            })
            await wishList.save()
            res.json({status:true})
        }
    }catch(error){
        console.log(error.message)
    }

}

const getWishList = async(req,res)=>{
    try{
        const session = req.session.user_id
        const userData = await user.findOne({_id:session})
        const wishListData = await wishlist.findOne({user:userData._id}).populate("product.productId")

        if(wishListData){
            const products = wishListData.product
            res.render('wishlist',{session,userData,products})
        }
        else{
            res.render('wishlist-empty',{session,userData})
        }

    }catch(error){
        console.log(error.message)
    }
}

const addToCartFromWishlist = async(req,res)=>{
    try{
        const productid = req.body.id
        const productData = await product.findById({_id:productid}) 
        const session = req.session.user_id
        const userData = await user.findById({_id:session})

        if(productData.stock<1){
            return res.status(400).json({success:false,message:'Out of stock'})
        }else{
            const cartData = await cart.findOne({userId : session})
            if (cartData){
                const productExists = await cartData.products.findIndex((argument)=> argument.productId == productid)
                if(productExists != -1){
                    await wishlist.updateOne({user:session}, { $pull:{ product: { productId : productid}}})
                    res.json({ success : true})
                }else{
                    await cart.findOneAndUpdate({userId:session}, {$push: { products : { productId : productid, productPrice : productData.price,quantity:1}}})
                    await wishlist.updateOne({user:session}, {$pull : { product : { productId : productid }}})
                    res.json({ success : true })
                }

            }else{
                await wishlist.updateOne({user: session }, {$pull: {product : { productId : productid}}})
                const newCart = new cart({
                    userId : userData._id,
                    userName:userData.name,
                    products:[{
                        productId:productid,
                        productPrice:productData.price,
                        quantity:1
                    }]
                })
                const newCartData = await newCart.save()
                if(newCartData){
                    res.json({ success: true})
                }else{
                    res.redirect('/wishlist')
                }
            }
        }


    }catch(error){
        console.log(error.message)
    }

}

const removeProduct = async (req, res) => {
    try {
        const productid = req.query.id;
        const session = req.session.user_id;
        console.log("Attempting to delete product ID:", productid, "for user:", session);

        // Convert productid to ObjectId only if it isn't already
        if (!mongoose.Types.ObjectId.isValid(productid)) {
            console.error('Invalid product ID:', productid);
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        const productIdObj = new mongoose.Types.ObjectId(productid);

        

        const productMatch = await wishlist.findOne({ "product.productId": productIdObj });
console.log("Product ID Match Result:", productMatch);


        const wishlistData = await wishlist.findOne({ user: String(session) });
console.log("Wishlist data for user:", wishlistData);
console.log("Database Product ID:", wishlistData.product[0].productId.toString());
console.log("Queried Product ID:", productIdObj.toString());


    

        const match = await wishlist.findOne({ user: session, "product.productId": productIdObj });
if (match) {
    console.log("Found match, attempting to remove product");
    const result = await wishlist.updateOne(
        { user: session },
        { $pull: { product: { productId: productIdObj } } }
    );
    console.log("Pull result:", result);
    res.json({ remove: true });
} else {
    console.log("No match found for product.");
    res.json({ remove: false });
}


       
    } catch (error) {
        console.error("Error occurred:", error.message);
        res.status(500).json({ remove: false, message: error.message });
    }
};






module.exports = {
    addToWishList,
    getWishList,
    addToCartFromWishlist,
    removeProduct
}