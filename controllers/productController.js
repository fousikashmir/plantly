const products = require('../models/productModel')

const session = require('express-session')


// GET PRODUCTS PAGE
 const getProducts = async (req, res) => {
    try {
        const productsData = await products.find()
        res.render('products')
    } catch (error) {
        console.log(error)
    }
}

const getAddProducts = async(req,res)=>{
    try{
    res.render('add-products')
}catch(error){
    console.log(error.message)
}
}

 const addProducts = async(req,res)=>{
    try{
        const img=[]
        for(let i=0;i<req.files.length;i++){
            img[i]=req.files[i].file.name
        }
        let status;
        if(req.body.stock<=0){
            status='out of stock'
        }else{
            status='In stock'
        }
        const productData = new products({
            name:req.body.name,
            price:req.body.price,
            description:req.body.description,
            image:img,
            stock:req.body.stock,
            status:status,
            is_blocked:false

        })
        const categoryDoc = await productData.save()
        res.redirect('/admin/products')

    }catch(error){
        console.log(error.message)
    }
 }

module.exports = {
    getProducts,
    getAddProducts,
    addProducts
}