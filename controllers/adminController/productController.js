const products = require('../../models/productModel')
const category = require('../../models/categoryModel')

const session = require('express-session')


// GET PRODUCTS PAGE
 const getProducts = async (req, res) => {
    try {
        const productData = await products.find()
        res.render('products',{message:productData})
    } catch (error) {
        console.log(error)
    }
}

const getAddProducts = async(req,res)=>{
    try{
        const categoryData = await category.find({is_block:0})
    res.render('add-products',{categoryData})
}catch(error){
    console.log(error.message)
}
}

 const addProducts = async(req,res)=>{
    try{
        const img=[]
        for( i=0;i<req.files.length;i++){
            img[i]=req.files[i].filename
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
            category:req.body.category,
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

 const deleteProduct = async(req,res)=>{
    try{
        const id = req.query.id
        await products.deleteOne({_id:id})
        res.redirect('/admin/products')

    }catch(error){
        console.log(error.message)
    }
 }

 const editProduct = async(req,res)=>{
    try{
        const id = req.query.id
        const productData = await products.findById({_id:id})

        const categoryData = await category.find({is_block:0})
        if(productData){
            res.render('edit-product',{productData,categoryData})
        }
        else{
            res.redirect('/admin/products')
        }

    }catch(error){
        console.log(error.message)
    }
 }

 const postEditProduct = async(req,res)=>{
    try{
        let status
        if(req.body.stock<=0){
            status='Out Of Stock'
        }else{
            status='In Stock'
        }
        const id = req.body.id
        const filesArray = req.files
        const filenamesArray = filesArray.map(file=>file.filename)

        if(req.files){
            const newData = await products.updateMany({_id:id},{
                $set:{
                    name:req.body.name,
                    price:req.body.price,
                    category:req.body.category,
                    description:req.body.description,
                    stock:req.body.stock,
                    status:status
                },
                $push:{
                    image:{$each:filenamesArray}
                }
            })
            res.redirect('/admin/products')
        }
        else{

        }

    }catch(error){
        console.log(error.message)
        
    }
 }

 const deleteImage = async(req,res)=>{
    try{
        const position = req.body.position
        const id = req.body.id
        const productImage = await products.findById(id)
        const image = productImage.image[position]
        const data = await products.updateOne({_id:id},{$pullAll:{image:[image]}})

        if(data){
            res.json({success:true})
        }else{
            res.redirect('/admin/products')
        }

    }catch(error){
        console.log(error.message)
    }
 }

 const blockProduct = async(req,res)=>{
    try{
        const id = req.query.id
        await products.updateOne({_id:id},{$set:{is_blocked:true}})
        res.redirect('/admin/products')

    }catch(error){
        console.log(error.message)
    }
 }

 const unBlockProduct = async(req,res)=>{
    try{
        const id = req.query.id
        await products.updateOne({_id:id},{$set:{is_blocked:false}})
        res.redirect('/admin/products')

    }catch(error){
        console.log(error.message)
    }
 }
module.exports = {
    getProducts,
    getAddProducts,
    addProducts,
    deleteProduct,
    editProduct,
    postEditProduct,
    deleteImage,
    blockProduct,
    unBlockProduct
}