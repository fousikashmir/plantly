const users = require("../../models/userModel")
const User = require("../../models/userModel")
const bcrypt = require('bcrypt')


const getLogin = async(req,res)=>{
    try{
        const message = req.session.successMessage;
    
    
    req.session.successMessage = null;
        res.render('login',{message:message})
    }catch(error){
        console.log(error.message)
    }
}

 //post login -
const postLogin = async(req,res)=>{
    try{
        const emailEntered = req.body.email;
        const passwordEntered = req.body.password;
        const userDb = await users.findOne({email:emailEntered})
        
        
            if (userDb && userDb.is_verified === 1 ) {

                if (userDb.is_block === 1) {
                    return res.render('login', { message: 'Your account is blocked. Please contact support.' });
                }
    
               
           const passwordMatch = await bcrypt.compare(passwordEntered,userDb.password)
            
            if(passwordMatch){
                const user_id =  userDb._id;
                req.session.user_id = user_id;
                res.redirect('/')
            }else{
                res.render('login',{message:'incorrect password'})
            }
            }else{
                res.render('login',{message:'user not found'})
            }
        }
          catch(error){
        console.log(error.message)
    }
}



module.exports = {
    getLogin,
    postLogin

}

