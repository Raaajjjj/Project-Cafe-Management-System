import express from 'express';
import dbConnect from './data.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Get all categories
router.get('/api/category', async (req, res) => {
    const collection = await dbConnect('Category'); // Use 'Category' collection
    const categories = await collection.find({}).toArray();
    res.json(categories);
});

// Add a new category
router.post('/api/add-category', async (req, res) => {
    const formData = req.body; // Get the form data sent from the frontend
    console.log(formData)
    const collection = await dbConnect('Category');

    const preprocessName = (name) => name.toLowerCase().replace(/\s+|[^a-zA-Z0-9]/g, '');
    const iscategoryDuplicate = async (formData) => {
        const inputName = preprocessName(formData['categoryName']);
        const Category = await collection.find({
            categoryId: formData['categoryId'],
        }).toArray();
        return Category.some(category => preprocessName(category.categoryName) === inputName);
    };
    const isDuplicate = await iscategoryDuplicate(formData);
    if (isDuplicate) {
        return res.status(409).json({ message: `Category "${formData['categoryName']}" already exists` });
    }

    // If not, insert the new category
    await collection.insertOne(formData);
    res.status(200).json({ message: `Category "${formData['categoryName']}" added successfully!` });
});


// Update an existing category by ID
router.put('/api/update-category', async (req, res) => {
    const formData = req.body;  // The updated data sent from the frontend
    console.log('Received formData for update:', formData); // Debug log
    const collection = await dbConnect('Category')

    const { _id, ...updateFields } = formData; // Extract _id and fields to update

    const oldCategory = await collection.findOne({ _id: new ObjectId(_id) });

    const preprocessName = (name) => name.toLowerCase().replace(/\s+|[^a-zA-Z0-9]/g, '');
    const iscategoryDuplicate = async (formData) => {
        const inputName = preprocessName(formData['categoryName']);
        const Category = await collection.find({
            categoryId: formData['categoryId'],
        }).toArray();
        return Category.some(category => preprocessName(category.categoryName) === inputName);
    };
    const isDuplicate = await iscategoryDuplicate(formData);
    if (isDuplicate) {
        return res.status(409).json({ message: `Category "${formData['categoryName']}" already exists` });
    }

    await collection.updateOne(
        { _id: new ObjectId(_id) },
        { $set: updateFields }
    );
    res.json({ message: `Category "${oldCategory.categoryName}" has been updated to "${formData['categoryName']}" successfully!` });

});


// Delete a category by ID
/*router.delete('/api/delete-category/:id', async (req, res) => {
    const categoryId = req.params.id;  // Extract the category ID from the URL parameter
    const collection = await dbConnect('Category');
    const category = await collection.findOne({ _id: new ObjectId(categoryId) });
    await collection.deleteOne({ _id: new ObjectId(categoryId) });
    res.status(200).json({ message: `Category ${category.categoryName} deleted successfully!` });
});*/

//Delete category and its associated products
router.delete('/api/delete-category/:id', async (req, res) => {
    const categoryId = req.params.id;  // Extract the category ID from the URL parameter
    const categoryCollection = await dbConnect('Category');
    const productCollection = await dbConnect('Product');
    const category = await categoryCollection.findOne({ _id: new ObjectId(categoryId) });
    await categoryCollection.deleteOne({ _id: new ObjectId(categoryId) });
    await productCollection.deleteMany({ categoryId: categoryId });
    res.status(200).json({ message: `Category "${category.categoryName}" and its associated products deleted successfully!` });
});


// Get category count
router.get('/api/category-count', async (req, res) => {
    const collection = await dbConnect('Category'); // Use 'Category' collection
    try {
        const count = await collection.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching category count', error });
    }
});




export default router;
