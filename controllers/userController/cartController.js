
const users = require('../../models/userModel')
const product = require('../../models/productModel')
const cart = require('../../models/cartModel')
const session = require('express-session')


const addToCart = async (req, res) => {
    try {
        const productId = req.body.id;
        const productData = await product.findById(productId);

        if (!productData) {
            return res.status(400).json({ success: false, message: 'Product not found' });
        }

        const productStock = productData.stock;
        if (productStock < 1) {
            return res.status(400).json({ success: false, message: 'Out of stock, keep it added in wishlist' });
        }

        if (!req.session.user_id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const userid = req.session.user_id;
        const userData = await users.findById({_id:userid});

        if (!userData) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        let cartData = await cart.findOne({ userId:userid });

        if (cartData) {
            const productExist = cartData.products.findIndex(product => product.productId.toString() === productId);
            if (productExist !== -1) {
                await cart.updateOne(
                    { userId:userid, "products.productId": productId },
                    { $inc: { "products.$.quantity": 1 } }
                );
                return res.json({ success: true });
            } else {
                await cart.updateOne(
                    { userId:req.session.user_id },
                    { $push: { products: { productId, productPrice: productData.price, quantity: 1 } } }
                );
                return res.json({ success: true });
            }
        } else {
            const newCart = new cart({
                userId: userData._id,
                products: [{
                    productId,
                    productPrice: productData.price,
                    quantity: 1
                }]
            });

            cartData = await newCart.save();
            if (cartData) {
                return res.json({ success: true });
            } else {
                return res.status(500).json({ success: false, message: 'Failed to create cart' });
            }
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: 'An error occurred' });
    }
};



      const getCart = async(req,res)=>{
        try{ 
           
            const session = req.session.user_id
            const userData = await users.findOne({_id:session})
            const cartData = await cart.findOne({userId:session}).populate("products.productId")
            console.log(cartData,'cartdata')

           


            if(cartData){
                if(cartData.products.length>0){
                    const products = cartData.products

                    let Total = 0
                    let outOfStockProducts = []
                    for(let i=0;i<products.length;i++){
                        const product = products[i].productId

                        if(product){
                        const productStock = product.stock
                        const cartQuantity = products[i].quantity
                        const productPrice = products[i].productPrice;

                     console.log('Product:', product);
                    console.log('Product Stock:', productStock);
                    console.log('Cart Quantity:', cartQuantity);
                    console.log(productPrice)
                        if(productStock >= cartQuantity){
                            Total += productPrice*cartQuantity
                            console.log(`Running Total after product ${i}:`, Total);

                        }else{
                            outOfStockProducts.push(product._id)
                        }
                        }else {
                            // Handle null productId, e.g., remove it from the cart or notify the user
                            console.log(`Product with ID ${products[i]._id} is missing from the database.`);
                            outOfStockProducts.push(products[i]._id);
                        }
    
                    }
                    console.log(Total)
                    const userCartId = userData._id
                    res.render('cart',{userData,session,Total,userCartId,products,
                        outOfStockProducts})
                }else{
                    res.render('cartEmpty',{session,userData,message:"No product added"})
                }
                }
            }catch(error){
            console.log(error.message)
        }
    }
      
    const cartQuantityIncrease = async (req, res, next) => {
        try {
    
            let cartId = req.body.cart;
            const proId = req.body.product;
            let quantity = parseInt(req.body.quantity)
            let count = parseInt(req.body.count)
    
    
            const Product = await product.findById({ _id: proId });
    
            const productStock = Product.stock;
    
            if (count === 1 && (quantity + 1) > productStock) {
    
                return res.status(400).json({ success: false, message: 'Stock limit will be exceeded' });
            }
    
            if ((count === -1) && (quantity === 1)) {
                res.json({ remove: true })
            
        }else {
                await cart.updateOne({ userId: req.session.user_id, "products.productId": proId }, { $inc: { "products.$.quantity": count } });
            }
            next();
        } catch (error) {
            console.log(error.message);
        }
    }

    const totalProductPrice = async(req,res)=>{
        try{
            const user = await users.findOne({_id:req.session.user_id})
            let total = await cart.aggregate([
                {
                    $match:{
                        userId:user._id
                    }
                },
                {
                    $unwind:"$products"
                },
                {
                    $project:{
                        price:"$products.productPrice",
                        quantity:"$products.quantity"
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:["$price","$quantity"]}}
                    }
                }

            ])
            let Total = total[0]?.total || 0;
            console.log(Total)
            res.json({success:true,Total})

        }catch(error){
            console.log(error.message)
        }
    }

    const postRemoveProduct = async(req,res)=>{
     try{
             const proId = req.query.id
             console.log(proId)
             const session = req.session.user_id
             const result = await cart.findOneAndUpdate({userId:session},{$pull:{products:{productId:proId}}})
             console.log(result)
             res.json({remove:true})

     }catch(error){
             console.log(error.message)
        }
     }

    
    

    


module.exports = {
    addToCart,
    getCart,
    cartQuantityIncrease,
    totalProductPrice,
    postRemoveProduct
}