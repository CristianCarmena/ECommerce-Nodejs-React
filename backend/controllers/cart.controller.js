import Product from "../models/product.model.js";

export const addToCart = async (req, res) => {


    try {

        const { productId} = req.body;
        const user = req.user;
        const existingItem = user.cartItems.find(item => item.id === productId);
        if(existingItem){
            existingItem.quantity += 1;
        }else{
            user.cartItems.push({id: productId, quantity: 1});
        }
        await user.save();
        res.status(200).json({message: "Product added to cart successfully"});
    } catch (error) {
        console.log("Error in AddToCart controller", error.message);
        res.status(500).json({message: error.message});
        
    }
};

export const removeAllFromCart = async (req, res) => {

    try {

        const { productId} = req.body;
        const user = req.user;
     
        if(!productId){
            user.cartItems = [];
        }else{
            user.cartItems = user.cartItems.filter(item => item.id !== productId);
        }
        await user.save();
        res.status(200).json({message: "Product added to cart successfully"});
    } catch (error) {
        console.log("Error in AddToCart controller", error.message);
        res.status(500).json({message: error.message});
        
    }



};

export const updateQuantity = async (req, res) => {

    try {
        const {id:productId} = req.params;
        const {quantity} = req.body;
        const user = req.user;
        const existingItem = user.cartItems.find(item => item.id === productId);
        if(existingItem){
            if(quantity === 0){
                user.cartItems = user.cartItems.filter(item => item.id !== productId);  
                await user.save();
                res.status(200).json({message: "Product removed from cart successfully"});
        }

        existingItem.quantity = quantity;
        await user.save();
        res.status(200).json({message: "Product quantity updated successfully"});
    }else{
        res.status(404).json({message: "Product not found in cart"});
    }
      
        
    } catch (error) {
        console.log("Error in updateQuantity controller", error.message);
        res.status(500).json({message: error.message}); 
        
    }
};

export const getCartProducts = async (req, res) => {
    try {

        const products = await Product.find({id:{$in: req.user.cartItems}});

        //add quantity for each product
        const cartItems = products.map(product =>{
            const item = req.user.cartItems.find(item => item.id === product.id);
            return {...product.toJSON(), quantity: item.quantity};
        })
        res.status(200).json({cartItems});
        
    } catch (error) {
        console.log("Error in getCartProducts controller", error.message);
        res.status(500).json({message: error.message});
        
    }
};
