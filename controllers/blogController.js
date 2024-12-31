// backend/controllers/userController.js
const { pool, sql } = require('../config/mssdb'); 

// Get all blogs
exports.getAllBlogs = async (req, res) => {
    const language = req.query.language || 'en';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    try {
        const conn = await pool.getConnection();

        // Query to fetch paginated blog posts
        const queryBlogs = `
            SELECT * 
            FROM blog_posts
            WHERE (title LIKE @search OR content LIKE @search) AND language = @language
            ORDER BY created_at DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
        `;

        const blogsResult = await conn.request()
            .input('search', sql.NVarChar, `%${search}%`)
            .input('language', sql.NVarChar, language)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(queryBlogs);

        // Query to fetch the total count of blog posts
        const queryTotal = `
            SELECT COUNT(*) as totalCount 
            FROM blog_posts 
            WHERE (title LIKE @search OR content LIKE @search) AND language = @language;
        `;

        const totalRowsResult = await conn.request()
            .input('search', sql.NVarChar, `%${search}%`)
            .input('language', sql.NVarChar, language)
            .query(queryTotal);

        const totalCount = totalRowsResult.recordset[0].totalCount;

        // Send response with blogs and pagination data
        res.status(200).json({
            blogs: blogsResult.recordset,
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

        // Use a parameterized query for MSSQL
        const queryBlog = `SELECT * FROM blog_posts WHERE slug = @Slug`;

        // Execute the query
        const result = await conn.request()
            .input('Slug', sql.NVarChar, slug)
            .query(queryBlog);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        res.status(200).json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching blog by slug:', error);
        res.status(500).json({ error: 'Failed to fetch blog details' });
    }
};
