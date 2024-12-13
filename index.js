const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

AWS.config.update({ region: 'us-east-1' });
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'BlogsTable';

// Get all blogs

app.get('/blogs', async (req, res) => {
    try {
        const params = { TableName: TABLE_NAME };
        const data = await dynamoDb.scan(params).promise();
        res.status(200).json(data.Items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get personal blogs
app.get('/blogs/user/:userId', async (req, res) => {
    const UserId = req.params.userId;
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'UserId = :UserId',
        ExpressionAttributeValues: { ':UserId': UserId },
    };

    try {
        const data = await dynamoDb.query(params).promise();
        res.status(200).json(data.Items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new blog
app.post('/blogs', async (req, res) => {
    const { UserId, Title, Content } = req.body;
    let date = new Date();
    const BlogId = date.getTime().toString();
    const Created = date.toDateString();

    const params = {
        TableName: TABLE_NAME,
        Item: { BlogId, UserId, Title, Content, Created },
    };

    try {
        await dynamoDb.put(params).promise();
        res.status(201).json({ message: 'Blog created successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a blog
app.post('/blogs/:blogId', async (req, res) => {
    const BlogId = req.params.blogId;
    

    const params = {
        TableName: TABLE_NAME,
        Key: {BlogId: BlogId}
    };
    try {
        const data = await dynamoDb.delete(params).promise();

        // Check if an item was deleted (DynamoDB's delete does not error if the item doesn't exist)
        if (!data.Attributes) {
            res.status(404).json({ error: 'Blog not found' });
            return;
        }

        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ error: 'Failed to delete blog' });
    }
});

// Health check
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
