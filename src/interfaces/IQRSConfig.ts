import  * as htmlminifier from 'html-minifier';
import * as uglyfyJs  from 'uglify-js';
import * as csso from 'csso';

export interface IQRSConfig {
    app_name: string,
    author: string,
    license: string,
    input_path: string;
    output_path: string;
    minify_config: {
        html: {
            minify: boolean,
            htmlminifier_options: htmlminifier.Options,
        },
        javascript: {
            minify: boolean,
            uglifyjs_options: uglyfyJs.CompressOptions
        },
        css: {
            minify: boolean,
            csso_options: csso.CompressOptions,
        }
    }
}
