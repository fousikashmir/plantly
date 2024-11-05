const users = require("../../models/userModel")
const User = require("../../models/userModel")
const products = require('../../models/productModel')
const category = require('../../models/categoryModel')

const shortid = require('shortid');
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const session = require('express-session')

const config = require('../../config/config')

let dotenv = require('dotenv')
dotenv.config()


let registerTimeEmail;
let registerTimeName;
let otp;

// bcrypt password

const securePassword = async(password)=>{
    try{
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash
    }catch(error){
        console.log(error.message)

    }
}


  //To verify user mail

  sendVerifyMail = async(name,email,otp)=>{
    registerTimeEmail = email;
    registerTimeName = name
    try{
        const transporter = nodemailer.createTransport({
            service:'gmail',
            host:"smtp.gmail.com",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:'fouziyakashmir83@gmail.com',
                pass:'8592fousi#'
            
            }
        })
        const mailOptions = {
            from:'fouziyakashmir83@gmail.com',
            to:email,
            subject:'For mail verification',
            html:`Hi ${name}, OTP for verifying your is ${otp}`   

        }

        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error)
            }else{
                console.log('Mail has sent succesfully',info.response)
            }
        })

    }catch(error){
        console.log(error.message)
    }
  }

  const getRegister = async(req,res)=>{
    try{
        res.render("register")
    }catch(error){
        
        console.log(error.message)
    }
}


const postRegister = async (req, res) => {
    console.log("Request data:", req.body)
    try {
        
        const emailExists = await users.findOne({ email: req.body.email });
        const mobileExists = await users.findOne({ mobile: req.body.mobile})

        if (emailExists) {
            res.render('register', { message: 'Email ID already registered' });
        } else if (mobileExists){
            res.render('register',{message:'Mobile number already registered'})
        }else{
            if (req.body.password == req.body.confirmPassword) {
                const password = req.body.password.trim();
                const bcryptedPassword = await securePassword(password);
                
                 const referralCode = shortid.generate();

                 const referrerCode = req.body.referralCode;
 
                 const referrer = await users.findOne({ referralCode: referrerCode });
 

             
          
              const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    mobile: req.body.mobile,
                    password: bcryptedPassword,
                    is_admin: 0,
                    is_verified: 0,
                    is_block: 0,
                    referralCode : referralCode,
                    wallet: 0, 
              })
                  
                  const userDoc = await newUser.save();
                  console.log("User successfully saved:", userDoc);
                   
                  if (userDoc) {
                      var randomNumber = Math.floor(Math.random() * 9000) + 1000;
                      otp = randomNumber;
                      sendVerifyMail(req.body.name, req.body.email, otp);
                      res.redirect('/otppage');
                  } else {

                      res.render('register', { message: 'Registration Failed' });
                      
                  }
              } else {
                  res.render('register', { message: 'Passwords do not match' });
              }
          }
      } catch (error) {
          console.log(error.message);
      }
  };

  const getOtpPage = async(req,res)=>{
    try{
        res.render('otppage')
        console.log(otp)
    }catch(error){
        console.log(error.message)
    }
}

//verifying entered otp

const verifyOtp = async(req,res)=>{
    try{
        let userotp = req.body.otp;
        if(userotp == otp){
            const updateInfo = await users.updateOne({email:registerTimeEmail},{$set:{is_verified:1}})
            console.log(updateInfo)
            req.session.successMessage = 'Successfully registered! Please login.'
            res.redirect('/login')
        }else{
            res.render('otppage',{message:'Entered otp is wrong'})
        }
    }catch(error){
        console.log(error.message)
    }
}

//Sending otp 2nd time after timer out

const resendOtp = async(req,res)=>{
    try{
        randomNumber = Math.floor(Math.random() * 9000) + 1000;
        otp = randomNumber
        sendVerifyMail(registerTimeName, registerTimeEmail, otp)
        res.redirect('otppage')

    } catch (error) {
        console.log(error);
    }

}

module.exports = {
    getRegister,
    postRegister,
    getOtpPage,
    verifyOtp,
    resendOtp
}
    
    
  


