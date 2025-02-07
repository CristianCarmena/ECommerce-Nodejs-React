import {stripe} from "../lib/stripe.js";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
export const createCheckoutSession = async (req, res) => {

    try {
        const  {products,couponCode} = req.body;

        if(!Array.isArray(products) || products.length === 0){
            return res.status(400).json({message: "No products provided"});
        }

        let totalAmount = 0;

        const lineItems = products.map(product => {
            const amout = Math.round(product.price * 100); // stripe wants you to send it in the format of cents 
            totalAmount += product.price * product.quantity;

            return {
                price_data: {
                    currency: "eur",
                    product_data: {
                        name: product.name,
                        images: [product.image],
                    },
                    unit_amount: amount,
                },
              
            };
        });

        let coupon = null;

        if(couponCode){
            coupon = await Coupon.findOne({code: couponCode, userId: req.user._id, isActive: true});
            if(!coupon){
                return res.status(404).json({message: "Coupon not found"});
            }else{
                totalAmount -= Math.round(totalAmount * (coupon.discountPercentage / 100)); 
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: lineItems,
                mode: "payment",
                success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
                discounts: coupon ? [{
                    coupon: await createStripeCoupon(coupon.discountPercentage),
                    
                },
            ]
                : [],
                metadata: {

                    userId: req.user._id.toString(),
                    couponCode: couponCode || "",
                    products: JSON.stringify(
                        products.map((p) => ({
                            id: p.id,
                            quantity: p.quantity,
                            price: p.price
                        })) 
                    ),
                },

            });
        }
        if(totalAmount >= 20000){
            await createNewCoupon(req-user._id);
        }
        res.status(200).json({id:session.id, totalAmount: totalAmount/100});

    } catch (error) {
        
    }
};

async function createStripeCoupon(discountPercentage) {
    const coupon = await stripe.coupons.create({
        percent_off: discountPercentage,
        duration: "once",
   
    });

    return coupon.id;

};

async function createNewCoupon(userId){

    const newCoupon = new Coupon({

        code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userId: userId
    })
    await newCoupon.save();

    return newCoupon;
};

export const checkoutSuccess = async (req, res) => {

    try {
        const {session_id} = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if(session.payment_status === "paid"){
            if(session.metadata.couponCode){
                await Coupon.findOneAndUpdate({
                    code: session.metadata.couponCode, 
                    userId: session.metadata.userId},
                    {isActive: false});
            }

            //Create a new order
            const products =JSON.parse(session.metadata.products);
            const newOrder = new Order({
                user: session.metadata.userId,
                products: products.map(product => ({
                    product: product.id,
                    quantity: product.quantity,
                    price: product.price,
                })),
                totalAmount: session.amount_total / 100,
                stripeSessionId: session.id
            })

            await newOrder.save();
            res.status(200).json({
                success: true,
                message: "Order created successfully",
                orderId: newOrder._id
            });
        }   
    } catch (error) {
        console.log("Error in success controller", error.message);
        res.status(500).json({message: error.message});
        
    }
};
