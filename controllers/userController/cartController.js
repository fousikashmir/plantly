const session = require('session')
const users = require('../../models/userModel')
const products = require('../../models/productModel')
const carts = require('../../models/cartModel')

const addToCart = async(req,res)=>{
    try{
        const productId = req.body.id;
        const productData = await products.findById({_id:productId})

        const productStock = productData.stock;
        if(productStock<1){
            return res.status(400).json({success:false,message:'Out of Stock,add it to wishlist'})
        }else{
            if(req.session.user_id){
                const userid = req.session.user_id
                const userData = await users.findById({_id:userid})
            }
        }
      
    }
    catch(error){
        console.log(error)
    }
}


module.exports = {
    addToCart,
}