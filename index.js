const express = require('express');
const axios = require('axios');
const _ = require('lodash');
const app = express();
const port = 8080;

const url = 'https://intent-kit-16.hasura.app/api/rest/blogs';
const headers = {
    'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
};

const cachedTime = 5 * 60 * 1000; // duration for which data will be remembered

// bonus section
const memoizedStats = _.memoize(analyzeData, undefined, cachedTime);
const memoizedSearch = _.memoize(searchBlogs, undefined, cachedTime);

app.get('/api/blog-stats', async (req, res) => {
    try {
        const analysisResult = await memoizedStats();
        res.json(analysisResult);
    }
    catch (error) {
        console.error(`Error fetching data: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch blogs data' });
    }
})

app.get('/api/blog-search', async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) {
            res.status(400).json({ error: "No query parameter found" });
            return;
        }
        const searchResult = await memoizedSearch(query);
        res.json(searchResult);
    }
    catch (error) {
        console.error(`Error in blog search: ${error.message}`);
        res.status(500).json({ error: 'Failed to do blog search'});
    }
})

// to fetch the blogs
async function fetchBlog() {
    try {
        const res = await axios.get(url, {headers});
        const data = res.data.blogs;
        return data;
    }
    catch (error) {
        throw new Error(`Failed to fetch blogs: ${error.message}`);
    }
}

// to get all the required data
async function analyzeData() {
    try {
        const data = await fetchBlog();

        // stats to be extracted
        const totalBlogs = data.length;
        const longestTitleBlog = _.maxBy(data, 'title');
        const titlesContainingPrivacy = _.filter(data, (blog) => {
            return blog.title.includes('Privacy');
        });
        const numberOfBlogsWithPrivacyTitle = titlesContainingPrivacy.length;
        const uniqueBlogTitles = _.uniqBy(data, 'title').map((blogs) => blogs.title);

        const result = {
            totalBlogs,
            longestTitleBlog,
            numberOfBlogsWithPrivacyTitle,
            uniqueBlogTitles
        }

        return result;
    }
    catch (error) {
        throw new Error(`Failed to analyze data: ${error.message}`);
    }
}

// to search for specific data
async function searchBlogs(query) {
    try {
        const data = await fetchBlog();

        const searchResult = _.filter(data, (blogs) =>
            _.includes(blogs.title, query)
        );

        return searchResult;
    }
    catch (error) {
        throw new Error(`Failed to search blogs: ${error.message}`);
    }
}

app.listen(port, () => {
    console.log(`server running on ${port}`);
})