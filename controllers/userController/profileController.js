
const User = require('../../models/userModel')
const users = require('../../models/userModel')
const address = require('../../models/addressModel')
const Address = require('../../models/addressModel')
const products = require('../../models/productModel')
const orders = require('../../models/orderModel')
const category = require('../../models/categoryModel')
const bcrypt = require('bcrypt')


 

const session = require('express-session');

const CategoryModel = require('../../models/categoryModel')

const getProfile = async(req,res)=>{
    try{
        const id = req.session.user_id
        console.log('User ID:', id)
        const userData = await users.findById({_id:id})
        console.log('User Data:', userData)
        
        const addressData = await address.findOne({user:id})

        res.render('profile',{userData,addressData,session})


    }catch(error){
        console.log(error.message)

    }
}

const editProfile = async(req,res)=>{
    try{
        const id=req.session.user_id
        const userData = await users.findById({_id:id})

        if(userData){
            res.render('edit',{userData})
        }else{
            res.redirect('/profile')
        }

    }catch(error){
        console.log(error.message)
    }
}

const updateProfile = async(req,res)=>{
    try{
        const id=req.session.user_id
        const{name,mob} = req.body
        await users.findByIdAndUpdate(id,{name,mob})
        res.redirect('/profile')


    }catch(error){
        console.log(error.message)
    }
}





const getAddAddress = async(req,res)=>{
    try{
        const session = req.session.user_id
        const userData = await users.findById({_id:session})
        res.render('add-address',{userData,session})

    }catch(error){
        console.log(error.message)
    }
}

const postAddAddress = async(req,res)=>{
    try{
        const user = req.session.user_id
        const userExist = await address.findOne({user:user})
        if(userExist){
            const user = req.session.user_id
            await address.updateOne({user:user},{
                $push:{
                    address:{
                        firstname:req.body.fname,
                        lastname:req.body.lname,
                        country:req.body.country,
                        state:req.body.state,
                        city:req.body.city,
                        address:req.body.address,
                        pin:req.body.pin,
                        phone:req.body.phone

                    }
                }
            })
        }
        else{
            const Address = new address({
                
                user:req.session.user_id,
               
                address:[{
                        firstname:req.body.fname,
                        lastname:req.body.lname,
                        country:req.body.country,
                        state:req.body.state,
                        city:req.body.city,
                        address:req.body.address,
                        pin:req.body.pin,
                        phone:req.body.phone

                    }]
 })
 const addressData2 = await Address.save() 
        }
        res.redirect('/checkout')

    }catch(error){
        console.log(error.message)
    }

}

const deleteAddress = async(req,res)=>{
    try{
        const userId = req.session.user_id
        const addressIndex = req.params.index
        const addressData = await address.findOne({user:userId})

        if(addressData&&addressData.address.length>0){
            addressData.address.splice(addressIndex,1)
            await addressData.save()
            res.redirect('/profile')
        }else{
            res.redirect('/profile')
        }

    }catch(error){
        console.log(error.message)
        res.redirect('/profile')
    }
}

const getEditAddress = async(req,res)=>{
    try{
        const userId = req.session.user_id;
        const addressIndex = req.params.index;
        const addressData = await address.findOne({ user: userId });
    
        if (addressData && addressData.address.length > 0) {
          const editedAddress = addressData.address[addressIndex];
          res.render('edit-address', { editedAddress, index: addressIndex });
        } else {
          res.redirect('/profile'); 
        }

    }catch(error){
        console.log(error.message)
    }
}

const postEditAddress = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const addressIndex = req.params.index;
        const { state, city, address, pin, country } = req.body;

       
        console.log('UserID:', userId);

        
        const userAddress = await Address.findOne({ user: userId }).lean()

       
        console.log('User Address:', userAddress);

        if (userAddress && userAddress.address.length > 0) {
            
            userAddress.address[addressIndex].state = state;
            userAddress.address[addressIndex].city = city;
            userAddress.address[addressIndex].address = address;
            userAddress.address[addressIndex].pin = pin;
            userAddress.address[addressIndex].country = country;

           
            await Address.findOneAndUpdate({ user: userId }, { address: userAddress.address })

            res.redirect('/profile')
        } else {
            res.redirect('/profile')
        }
    } catch (error) {
        console.error(error.message)
        res.redirect('/profile')
    }
}

const loadChangePassword = async (req, res) => {
    try {

        res.render('changepassword');
    } catch (error) {
        console.log(error.message);
    }
}

 const changePassword = async (req, res) => {
    const userId = req.session.user_id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    try {
        const user = await users.findById(userId);

       const  passwordMatch = await bcrypt.compare(currentPassword,user.password);

        if (passwordMatch) {
            if (newPassword === confirmPassword) {
                
                const hashedPassword = await bcrypt.hash(newPassword, 10);

                
                await users.findByIdAndUpdate(userId, { $set: { password:hashedPassword} });

                res.redirect('/profile');  
            } else {
                res.render('changepassword', { message: 'New passwords do not match' });
            }
        } else {
            res.render('changepassword', { message: 'Incorrect current password' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}

const getShopPage = async (req, res) => {
    try {
        const session = req?.session?.user_id;
        let userData;
        if (session) {
            userData = await users.findById({ _id: session });
        }

        var page = 1;
        if (req.query.page) {
            page = parseInt(req.query.page);
        }
        const limit = 9;

        let price = req?.query?.value;
        let Category = req?.query?.category || "All";
        let Search = req?.query?.search || "";
        Search = Search.trim();

        const sortBy = req.query.sort_by

        const categoryData = await category.find({ is_block: false }, { name: 1, _id: 0 });
        let cat = [];
        for (let i = 0; i < categoryData.length; i++) {
            cat[i] = categoryData[i].name;
        }

        let sortCriteria;
        switch(sortBy){
            case 'popularity':
                sortCriteria = { popularity :-1 };
                break;
            case 'price_low_high':
                sortCriteria = { price:1 };
                break;
            case 'price_high_low':
            sortCriteria = { price : -1}
            break;
            case 'average_ratings':
                sortCriteria = { average_rating : -1}
                break;
            case 'featured':
                sortCriteria = {is_featured: -1}
                break;
                case 'new_arrivals':
                    sortCriteria = { created_at: -1 };
                    break;
                case 'a_z':
                    sortCriteria = { name: 1 };
                    break;
                case 'z_a':
                    sortCriteria = { name: -1 };
                    break;
                default:
                    sortCriteria ={}

        }
        let sort;
        Category === "All" ? (Category = [...cat]) : (Category = req.query.category.split(','));
        price === "High" ? (sort = -1) : (sort = 1);

        const productData = await products.aggregate([
            { $match: { name: { $regex: new RegExp(Search, 'i') }, category: { $in: Category }, is_blocked: false  } },
            { $sort: { price: sort } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ]).exec();
        

        
        const totalCount = await products.countDocuments({ name: { $regex: new RegExp(Search, 'i') }, category: { $in: Category } });

        const totalPages = Math.ceil(totalCount / limit);

        const categories = await CategoryModel.find();
        const activeCategory = req.query.category || '';

        res.render('shop', {
            session,
            userData,
            categoryData,
            productData,
            price,
            Category,
            Search,
            totalPages,
            currentPage: page,
            categories,
            activeCategory,
            sortBy
        });
    } catch (error) {
        console.log(error);
    }
};



 







module.exports = {
    getProfile,
    editProfile,
    updateProfile,
    getAddAddress,
    postAddAddress,
    deleteAddress,
    getEditAddress,
    postEditAddress,
    
    loadChangePassword,
    changePassword,
    getShopPage,
    
}
 