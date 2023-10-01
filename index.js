const express = require('express');
const axios = require('axios');
const _ = require('lodash');
const app = express();
const port = 8080;

const url = 'https://intent-kit-16.hasura.app/api/rest/blogs';
const headers = {
    'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
};

const cachedTime = 5 * 60 * 1000; // duratio;n for which data will be remembered

const memoizedStats = _.memoize(analyzeData, undefined, cachedTime);

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

// to fetch the blogs
async function fetchBlog() {
    const res = await axios.get(url, {headers});
    const data = res.data.blogs;
    return data;
}

// to get all the required data
async function analyzeData() {
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

app.listen(port, () => {
    console.log(`server running on ${port}`);
})