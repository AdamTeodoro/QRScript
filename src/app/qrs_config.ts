
export default `{
    "input_path": "public/index.html",
    "output_path": "qrcode/img.png",
    "minify_config": {
        "html": {
            "minify": true,
            "htmlminifier_options": {
                "includeAutoGeneratedTags": true,
                "removeAttributeQuotes": true,
                "removeComments": true,
                "removeRedundantAttributes": true,
                "removeScriptTypeAttributes": true,
                "removeStyleLinkTypeAttributes": true,
                "sortClassName": true,
                "useShortDoctype": true,
                "collapseWhitespace": true
            }
        },
        "javascript": {
            "minify": true,
            "uglifyjs_options": { }
        },
        "css": {
            "minify": true,
            "csso_options": { }
        }
    }
}`;
