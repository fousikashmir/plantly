const users = require("../../models/userModel")

const products = require('../../models/productModel')

const getProductPage = async (req, res) => {
    try {
        const session = req.session.user_id
        const userData = await users.findOne({ _id: session})
        const id = req.query.id
        const product = await products.findById(id)
        console.log(product)
        if (!product) {
            return res.status(404).send('Product not found');
        }

        res.render('product', { userData, session, product });
    } catch (error) {
        console.log(error);
    }
}



module.exports = {
    getProductPage
}