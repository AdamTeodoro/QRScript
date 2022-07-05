#!/usr/bin/env node

import * as fs from 'fs';
import * as qrcode from 'qrcode';
import * as htmlMinifier from 'html-minifier';
import * as uglyfyJs from 'uglify-js';
import * as csso from 'csso';

import { readFile } from 'fs/promises';
import { Command } from 'commander';

import { IMinifyConfig } from './interfaces/IMinConfig';

import qrs_config from './qrs_config';

const lzw = require('lzw');

//json format
const command = new Command();
command.version('1.0.0');

//validator from error 
const validator = {

    fileExists: (filePath: string) => {
        if (fs.existsSync(filePath)) {
            return true;
        } else {
            return false;
        }
    },

    fileNotExists: (filePath: string) => {
        return !validator.fileExists(filePath);
    },

    errorIfFileExists: (filePath: string) => {
        if (validator.fileExists(filePath)) {
            const filePathSplit = filePath.split('/');
            const fileNameAndExtension = filePathSplit[filePathSplit.length - 1];
            const fileName = fileNameAndExtension.split('.')[0]
            const msg = `The file '${fileName}' already exists!`;
            throw new Error(msg);
        }
    },

    errorIfFileNotExists: (filePath: string) => {
        if (validator.fileNotExists(filePath)) {
            const filePathSplit = filePath.split('/');
            const fileNameAndExtension = filePathSplit[filePathSplit.length - 1];
            const fileName = fileNameAndExtension.split('.')[0]
            const msg = `The file '${fileName}' already exists!`;
            throw new Error(msg);
        }
    },

    errorFileExtension: (fileName: string, expected: string) => {
        const extensionReceived = fileName.split('.')[1];
        if (extensionReceived !== expected) {
            const msg = `Invalid file type, expected: '${expected}'!`;
            throw new Error(msg);
        }
        return;
    },

    errorOnGetMinJs: (minResult: uglyfyJs.MinifyOutput) => {
        if (minResult.error) {
            throw minResult.error;
        }
    }
}

const qrsService = {

    getConfig() {
        const deafultPath = './qrs-config.json';
        validator.errorIfFileNotExists(deafultPath);
        const qrsConfigFile = fs.readFileSync(deafultPath);
        const qrsConfig: IMinifyConfig = JSON.parse(qrsConfigFile.toString());
        return qrsConfig;
    },

    getIndexListOf(str: string, match: string, typeIndex = "initial" || "final"): Array<number> {
        const indexList: Array<number> = [];
        for (let i = 0; i < str.length; i++) {
            if (str.substring(i, i + match.length) == match) {
                if (typeIndex === "initial") {
                    indexList.push(i);
                } else {
                    indexList.push(i + match.length);
                }
            }
        }
        return indexList;
    },

    reCodifyHtml: (htmlFileStr: string) => {
        let replacedCode = htmlFileStr;
        replacedCode.replace('¤', '¤¤');
        replacedCode.replace('<script>', '¤ts');
        replacedCode.replace('</script>', '¤ts/');
        replacedCode.replace('<html>', '¤th');
        replacedCode.replace('</html>', '¤th/');
        replacedCode.replace('<body>', '¤tb');
        replacedCode.replace('</body>', '¤tb/');
        replacedCode.replace('<header>', '¤the');
        replacedCode.replace('</header>', '¤the/');
        replacedCode.replace('<style>', '¤tst');
        replacedCode.replace('</style>', '¤tst/');
        replacedCode.replace('<img', '¤ti');
        replacedCode.replace('<footer', '¤tf');
        replacedCode.replace('<div', '¤td');
        replacedCode.replace('</div>', '¤td/');
        replacedCode.replace('<nav', '¤tn');
        replacedCode.replace('</nav>', '¤tn')
        //properties
        replacedCode.replace('placeholder', '¤pp');
        replacedCode.replace(' style', '¤ps');
        replacedCode.replace('hidden', '¤ph');
        replacedCode.replace('type', '¤pt');
        replacedCode.replace('class', '¤pc');
        //js
        replacedCode.replace('alert(', '¤ja');
        replacedCode.replace('function', '¤jf');
        replacedCode.replace('getElementById(', '¤jg');
        replacedCode.replace('toString()', '¤jt');
        replacedCode.replace('¤¤', '¤');
        return replacedCode;
    },

    addIndexToPath: (path: string, index: number) => {
        const splitPath = path.split('.');
        const finalPath = splitPath[0] + `_${index}.${splitPath[1]}`;
        return finalPath;
    },

    minifyHtml: (htmlStr: string, qrs_config: IMinifyConfig) => {
        const {
            minify,
            htmlminifier_options
        } = qrs_config.minify_config.html;
        if (minify) {
            htmlStr = htmlMinifier.minify(htmlStr, htmlminifier_options);
        }
        return htmlStr;
    },

    minifyJs: (htmlStr: string, qrs_config: IMinifyConfig) => {
        const {
            minify,
            uglifyjs_options
        } = qrs_config.minify_config.javascript;
        if (minify) {
            const qtdScript = htmlStr.split('<script>').length;
            const indexListOpenScript = qrsService.getIndexListOf(
                htmlStr,
                '<script',
                "final"
            );
            const indexListCloseScript = qrsService.getIndexListOf(
                htmlStr,
                '</script>',
                "initial"
            );
            for (let i = qtdScript; i > 0; i--) {
                let jsDirty = htmlStr.substring(
                    indexListOpenScript[i],
                    indexListCloseScript[i]
                );
                const indexFinalScriptTag = qrsService.getIndexListOf(
                    jsDirty,
                    '>',
                    "final"
                )[0];
                const jsCodeClean = jsDirty.substring(
                    indexFinalScriptTag,
                    indexListCloseScript[i]
                );
                const jsCodeMinResult = uglyfyJs.minify(jsCodeClean, uglifyjs_options);
                validator.errorOnGetMinJs(jsCodeMinResult);
                htmlStr = htmlStr.replace(jsCodeClean, jsCodeMinResult.code);
            }
        }
        return htmlStr;
    },

    minifyCss: (htmlStr: string, qrs_config: IMinifyConfig) => {
        const {
            minify,
            csso_options
        } = qrs_config.minify_config.css;
        if (minify) {
            const qtdCss = htmlStr.split('<style>').length;
            const indexListOpenStyle = qrsService.getIndexListOf(
                htmlStr,
                '<style',
                "final"
            );
            const indexListCloseStyle = qrsService.getIndexListOf(
                htmlStr,
                '</style>',
                "initial"
            );
            for (let i = qtdCss; i > 0; i--) {
                let cssDirty = htmlStr.substring(
                    indexListOpenStyle[i],
                    indexListCloseStyle[i]
                );
                const indexFinalStyleTag = qrsService.getIndexListOf(
                    cssDirty,
                    '>',
                    "final"
                )[0];
                const cssClean = cssDirty.substring(
                    indexFinalStyleTag,
                    indexListCloseStyle[i]
                );
                const cssMinResult = csso.minify(cssClean, csso_options).css;
                htmlStr = cssMinResult;
            }
        }
        return htmlStr;
    },

    minify: async (input_path: string, qrs_config: IMinifyConfig) => {
        try {
            //get htmlstring
            const buffer = await readFile(input_path);
            const htmlStr = buffer.toString();
            const htmlStrMin = qrsService.minifyCss(
                qrsService.minifyJs(
                    qrsService.minifyHtml(
                        htmlStr,
                        qrs_config
                    ),
                    qrs_config
                ),
                qrs_config
            );
            return htmlStrMin;
        } catch(error) {
            console.log('error', error);
        }
    },

    compactStrFile(str: string) {
        return lzw.compress(str).toString();
    },

    splitCode: (strCompressed: string) => {
        const iterations = strCompressed.length / 2364;
        const strSplitList = [];
        let strStart = 0;
        let strFinal = 0;
        for (let i = 1; i < iterations; i++) {
            strFinal = strFinal + 2364;
            const strSplit = strCompressed.substring(strStart, strFinal);
            strSplitList.push(strSplit);
            strStart = strFinal;
        }
        strSplitList.forEach((strSplit, index) => {
            const strDroped = strSplitList.splice(index);
            //add 'index of qrcode/number of qrcode-' in init of str 
            strSplitList.push(`${index}/${strSplit.length}-` + strDroped);
        });
        return strSplitList;
    },

    genQRCodeList: (strSplitList: Array<string>, qrs_config: IMinifyConfig) => {
        const { output_path } = qrs_config;
        strSplitList.forEach(async (strSplit, index) => {
            const finalPath = qrsService.addIndexToPath(output_path, index);
            await qrcode.toFile(
                finalPath,
                strSplit, 
                {
                    type: 'png',
                    version: 40,
                    scale: 2,
                    width: 1980,
                    errorCorrectionLevel: 'L',
                }
            );
        });
    }
}

//cli functions qrs
const qrs = {
    //init configuration
    'init': () => {
        validator.errorIfFileExists('./qrs-config.json');
        fs.writeFileSync('./qrs-config.json', qrs_config);
        console.log("Started successfully!")
    },
    'build': async () => {
        console.log("Start build . . .");
        //get default config
        const qrs_config: IMinifyConfig = qrsService.getConfig();
        const { input_path, output_path } = qrs_config;
        //minify html, css, js
        validator.errorFileExtension(input_path, 'html');
        const htmlMinStr = await qrsService.minify(input_path, qrs_config);
        const recodifiedHtml = qrsService.reCodifyHtml(htmlMinStr);
        const compactCodeHtml = qrsService.compactStrFile(recodifiedHtml);
        const strSplitList = qrsService.splitCode(compactCodeHtml);
        qrsService.genQRCodeList(strSplitList, qrs_config);
        console.log("Successfully built!");
    }
}
//
command.command('qrs [option]')
.description('create the config file of type json.')
.action((option) => qrs[option]());

command.parse(process.argv);
