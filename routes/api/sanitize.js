const sanitizeHtml = require('sanitize-html');

// POST request to sanitize user input
exports.sanitizeContent = (req, res) => {
    const { content } = req.body;

    const cleanContent = sanitizeHtml(content, {
        allowedTags: [], // Allow no tags (fully sanitize)
        allowedAttributes: {}
    });

    res.status(200).json({ cleanContent });
};
