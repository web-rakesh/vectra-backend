const { pool, sql } = require('../config/mssdb'); 

// Get all testimonials filtered by language
exports.getAllTestimonials = async (req, res) => {
       const language = req.query.language || 'en';

    try {
        const conn = await pool;

        // Query to fetch all services for the specified language
        const queryServices = `
            SELECT * FROM testimonials
            WHERE language = @Language
            ORDER BY created_at DESC;
        `;

        // Execute the query
        const result = await conn.request()
            .input('Language', sql.NVarChar, language)
            .query(queryServices);

        // Send the retrieved services as the response
        res.status(200).json({
            services: result.recordset,
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
};
