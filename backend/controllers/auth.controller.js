    import User from "../models/user.model.js"; 
    import jwt from "jsonwebtoken";
    import { redis } from "../lib/redis.js";
    const generateToken = (userId) =>{

        const accessToken = jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'});
        const refreshToken = jwt.sign({userId}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'});

        return {accessToken, refreshToken};
        
    };

    const storeRefreshToken = async (userId, refreshToken) =>{
        await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7*24*60*60); // 7 days
    }

    const setCookies = (accessToken, refreshToken, res) =>{

        res.cookie("accessToken", accessToken, {
            httpOnly: true, //prevent XSS atacks, cross-site scripting attack
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict", //prevents CSRF attack, cross-site request forgery   
            maxAge: 15*60*1000 //15 minutes
    });



        res.cookie("refreshToken", refreshToken, {
            httpOnly: true, //prevent XSS atacks, cross-site scripting attack
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict", //prevents CSRF attack, cross-site request forgery   
            maxAge: 7*24*60*60*1000 //7 days
    });

};
    export const signup =  async (req,res) =>{

        const{email,password, name} = req.body;

        try{
            const userExists = await User.findOne({email});

            if(userExists){
            return res.status(400).json({message: "User already exists"});
            }
            const user = await User.create({name,email,password});

             //Authenticate user

             const {accessToken, refreshToken} =  generateToken(user._id);
             await storeRefreshToken(user._id, refreshToken);
 
             setCookies(accessToken, refreshToken, res);
        
            res.status(201).json({user: {_id: user._id, name: user.name, email: user.email, role: user.role} , message: "User  created successfully"});

           

        }catch(error){
            console.log("Error in signup controller", error.message);


            res.status(500).json({message: error.message});    
        }   

        

    

    }
    export const login =  async (req,res) =>{

       try {
         

        const {email, password} = req.body;

        const user = await User.findOne({email});

        if(user && (await user.comparePassword(password))){

            const {accessToken, refreshToken} =  generateToken(user._id);

            await storeRefreshToken(user._id, refreshToken);

            setCookies(accessToken, refreshToken, res);

            res.json({user: {_id: user._id, name: user.name, email: user.email, role: user.role}});


        }else{
            res.status(401).json({message: "Invalid email or password"});
        }


       } catch (error) {

        console.log("Error in login controller", error.message);
        res.status(500).json({message: error.message});

        
       }

    }
    export const logout =  async (req,res) =>{

       try {

        const refreshToken = req.cookies.refreshToken;

        if(refreshToken){
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

            await redis.del(`refresh_token:${decoded.userId}`);


        }
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({message: "User logged out successfully"});
        
       } catch (error) {
        console.log("Error in logout controller", error.message);

        res.statues(500).json({message: "Server erro", error: error.message});
        
       }

    }


    export const refreshToken =  async (req,res) =>{

        try {

            const refreshToken = req.cookies.refreshToken;

            if(!refreshToken){
                return res.status(401).json({message: "Unauthorized"});
            }
         
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

            const storeToken = await redis.get(`refresh_token:${decoded.userId}`);

            if(storeToken !== refreshToken){
                return res.status(401).json({message: "Unauthorized"});
            }
            const accessToken = jwt.sign({userId: decoded.userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'});

            res.cookie("accessToken", accessToken, {
                httpOnly: true, 
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict", 
                maxAge: 15*60*1000 
        });

        res.json({message: "Token refreshed successfully"});
        } catch (error) {

            console.log("Error in refresh token controller", error.message);
            res.status(500).json({message: "Server error", error: error.message});
            
        }

    }

    export const getProfile =  async (req,res) =>{

        try {
            res.json(req.user)
        } catch (error) {

            console.log("Error in get profile controller", error.message);
            res.status(500).json({message: error.message});
            
        }

        
    }