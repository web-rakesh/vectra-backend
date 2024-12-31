// backend/controllers/userController.js
const { pool, sql } = require('../config/mssdb'); 

// Get all blogs
exports.getAllBlogs = async (req, res) => {
    const language = req.query.language || 'en';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    try {
        const conn = await pool.getConnection();

        // Include language in the query
        const queryBlogs = `
            SELECT * FROM blog_posts
            WHERE (title LIKE @search OR content LIKE @search) AND language = @language
            ORDER BY created_at DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

        const blogs = await conn.query(queryBlogs, {
            search: `%${search}%`,
            language,
            offset,
            limit,
        });

        const queryTotal = `
            SELECT COUNT(*) as totalCount 
            FROM blog_posts 
            WHERE (title LIKE @search OR content LIKE @search) AND language = @language`;

        const totalRows = await conn.query(queryTotal, {
            search: `%${search}%`,
            language,
        });

        const totalCount = totalRows.recordset[0].totalCount;

        res.status(200).json({
            blogs: blogs.recordset,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ error: 'Failed to fetch blogs' });
    }
};


// Get blog details by slug
exports.getBlogBySlug = async (req, res) => {
    const { slug } = req.params;
    try {
        const conn = await pool.getConnection();

        // Parameterized MSSQL query
        const queryBlog = `SELECT * FROM blog_posts WHERE slug = @slug`;

        const result = await conn.query(queryBlog, { slug });

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        res.status(200).json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching blog by slug:', error);
        res.status(500).json({ error: 'Failed to fetch blog details' });
    }
};
