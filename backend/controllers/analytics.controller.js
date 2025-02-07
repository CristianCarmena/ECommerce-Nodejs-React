import Product from "../models/product.model.js";
import User from "../models/user.model.js";


export const getAnalytics = async (req, res) => {

    try {
        const analyticsData = await getAnalyticsData();

        const startDate = new Date();
        const endDate = new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const dailySalesData = await getDailySalesData(startDate, endDate);

        res.status(200).json({analyticsData, dailySalesData});
    } catch (error) {

        console.log("Error in getAnalytics controller", error.message);
        res.status(500).json({message: error.message});
        
    }
};

const getAnalyticsData = async () => {

    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const salesData = await Order.aggregate([
        {
            $group: {
                _id: null, //it groups all documents together 
                totalSales: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" }
            }
        }
    ])
    const {totalSales, totalRevenue} = salesData[0] || {totalSales: 0, totalRevenue: 0};

    return {users:totalUsers, products: totalProducts, totalSales, totalRevenue};
};

const getDailySalesData = async (startDate, endDate) => {

    try{
    const dailySalesData = await Order.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }          
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt"
                    }
                },
                sales: { $sum: 1 },
                revenue: { $sum: "$totalAmount" }
            },
        },
        {
            $sort: {
                _id: 1
            
        }}
    ]);     
    const dateArray = getDatesInRange(startDate, endDate);

    return dateArray.map(date => {
        const foundData = dailySalesData.find(item => item._id === date);
        return {
            date,
            sales:  foundData?.sales || 0,
            revenue: foundData?.revenue || 0
        }
    })

}catch(error){

    console.log("Error in getDailySalesData controller", error.message);
    res.status(500).json({message: error.message});
}

    }

    function getDatesInRange(startDate, endDate) {
        
        const dates = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {   
            dates.push(currentDate.toISOString().split('T')[0]);        
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    }