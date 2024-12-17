import express from 'express';
import dbConnect from './data.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Get all categories
router.get('/api/category', async (req, res) => {
    const collection = await dbConnect('Product'); // Use 'Category' collection
    const categories = await collection.find({}).toArray();
    res.json(categories);
});


// Get all products with category names
router.get('/api/products', async (req, res) => {
    const productCollection = await dbConnect('Product');

    const productsWithCategoryNames = await productCollection.aggregate([
        {
            $addFields: {
                categoryId: { $toObjectId: '$categoryId' }, // Convert string to ObjectId
            },
        },
        {
            $lookup: {
                from: 'Category',
                localField: 'categoryId',
                foreignField: '_id',
                as: 'categoryInfo',
            },
        },
        {
            $addFields: {
                categoryName: {
                    $arrayElemAt: ['$categoryInfo.categoryName', 0],
                },
            },
        },
        {
            $project: {
                _id: 1,
                productName: 1,
                productPrice: 1,
                categoryId: 1,
                categoryName: { $ifNull: ['$categoryName', 'Unknown'] },
            },
        },
    ]).toArray();

    res.status(200).json(productsWithCategoryNames);
});


//Add the product
router.post('/api/add-product', async (req, res) => {
    const formData = req.body;
    console.log("data received from client:", formData);
    const collection = await dbConnect('Product');
    const { categoryName, ...updateFields } = formData;

    const preprocessName = (name) => name.toLowerCase().replace(/\s+|[^a-zA-Z0-9]/g, '');
    const isProductDuplicate = async (formData) => {
        const inputName = preprocessName(formData['productName']);
        const productsInCategory = await collection.find({
            categoryId: formData['categoryId'],
            _id: { $ne: new ObjectId(formData['_id']) } // Exclude the product being updated
        }).toArray();
        return productsInCategory.some(product => preprocessName(product.productName) === inputName);
    };
    const isDuplicate = await isProductDuplicate(formData);
    if (isDuplicate) {
        return res.status(409).json({ message: `Product "${formData['productName']}" already exists in the category "${categoryName}"` });
    }


    // Proceed to insert the new product
    await collection.insertOne(updateFields);
    res.status(200).json({ message: `Product "${formData['productName']}" added successfully in Category "${categoryName}" Successfully!` });
});



// Edit a product
router.put('/api/update-product', async (req, res) => {
    const formData = req.body; // The updated data sent from the frontend
    console.log('Received formData for update:', formData); // Debug log
    const collection = await dbConnect('Product');

    const { _id, categoryName, ...updateFields } = formData; // Extract _id and fields to update

    const preprocessName = (name) => name.toLowerCase().replace(/\s+|[^a-zA-Z0-9]/g, '');
    const isProductDuplicate = async (formData) => {
        const inputName = preprocessName(formData['productName']);
        const productsInCategory = await collection.find({
            categoryId: formData['categoryId'],
            _id: { $ne: new ObjectId(formData['_id']) } // Exclude the product being updated
        }).toArray();
        return productsInCategory.some(product => preprocessName(product.productName) === inputName);
    };
    const isDuplicate = await isProductDuplicate(formData);
    if (isDuplicate) {
        return res.status(409).json({ message: `Product "${formData['productName']}" already exists in the category "${categoryName}"` });
    }

    await collection.updateOne(
        { _id: new ObjectId(_id) },
        { $set: updateFields }
    );
    res.status(200).json({ message: `Product "${formData['productName']}" Updated Successfully!` });
});



router.delete('/api/delete-product/:id', async (req, res) => {
    const productId = req.params.id;  // Extract the category ID from the URL parameter
    const collection = await dbConnect('Product');
    const product = await collection.findOne({ _id: new ObjectId(productId) });
    await collection.deleteOne({ _id: new ObjectId(productId) });
    res.status(200).json({ message: `Product "${product.productName}" deleted successfully!` });
});

// Get the total count of products
router.get('/api/product-count', async (req, res) => {
    const productCollection = await dbConnect('Product');
    const productCount = await productCollection.countDocuments();
    res.json({ count: productCount });
});




export default router;
