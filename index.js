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
    const { userId, title, description, content } = req.body;
    const blogId = require('crypto').randomBytes(16).toString('hex');
    const createdAt = new Date().toISOString();

    const params = {
        TableName: TABLE_NAME,
        Item: { blogId, userId, title, description, content, createdAt },
    };

    try {
        await dynamoDb.put(params).promise();
        res.status(201).json({ message: 'Blog created successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health check
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
