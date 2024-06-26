const users = require("../../models/userModel")

const products = require('../../models/productModel')

const getProductPage = async (req, res) => {
    try {
        const session = req.session.user_id
        const userData = await users.findOne({ _id: session })
        const id = req.params.id
        const product = await products.findById(id)
        console.log(product)
        if (session) {
            res.render('product', { userData, session, product });
        }
        else {
            res.render('product', { userData, session, product })
        }
    } catch (error) {
        console.log(error);
    }
}

const getShopPage = async(req,res)=>{
    try{
        res.render('shop')
    }catch(error){
        console.log(error.message)
    }
}

module.exports = {
    getProductPage,
    getShopPage
}