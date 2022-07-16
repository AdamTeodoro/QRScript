#!/usr/bin/env node

import fs from 'fs';
import qrcode from 'qrcode';
import htmlMinifier from 'html-minifier';
import uglyfyJs from 'uglify-js';
import csso from 'csso';

import { readFile } from 'fs/promises';
import { Command } from 'commander';

import { IMinifyConfig } from './interfaces/IMinConfig';

import qrs_config from './qrs_config';

const lzw = require('lzw');

//json format
const command = new Command();
command.version('1.0.0');

const showMsg = {
    getRed: (msg: string) => {
        const red = "\033[31m";
        const removeColor = '\u001b[0m';
        return red + msg + removeColor;
    },
    getGreen: (msg: string) => {
        const green = "\033[32m";
        const removeColor = '\u001b[0m';
        return green + msg + removeColor;
    },
    getYellow: (msg: string) => {
        const yellow = "\033[33m";
        const removeColor = '\u001b[0m';
        return yellow + msg + removeColor;
    },
    getBlue: (msg: string) => {
        const blue = "\033[34m";
        const removeColor = '\u001b[0m';
        return blue + msg + removeColor;
    },
    green: (msg: string) => {
        console.log(showMsg.getGreen(msg));
    },
    red: (msg: string) => {
        console.log(showMsg.getRed(msg));
    },
    yellow: (msg: string) => {
        console.log(showMsg.getYellow(msg))
    },
    blue: (msg: string) => {
        console.log(showMsg.getBlue(msg));
    },
    white(msg: string) {
        console.log(msg);
    }
}

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
        return !fs.existsSync(filePath);
    },

    errorIfFileExists: (filePath: string) => {
        if (validator.fileExists(filePath)) {
            const pathSplited = filePath.split('/');
            const lastIndex = pathSplited.length - 1;
            const fileName = pathSplited[lastIndex];
            const msg = `The file '${fileName}' already exists!`;
            throw new Error(showMsg.getRed(msg));
        }
    },

    errorIfFileNotExists: (filePath: string) => {
        if (validator.fileNotExists(filePath)) {
            const pathSplited = filePath.split('/');
            const lastIndex = pathSplited.length - 1;
            const fileName = pathSplited[lastIndex];
            const msg = `The file '${fileName}' not exists!`;
            throw new Error(showMsg.getRed(msg));
        }
    },

    errorFileIfInvalidExtension: (fileName: string, expected: string) => {
        const extensionReceived = fileName.substring(fileName.length - expected.length, fileName.length);
        if (extensionReceived !== expected) {
            const msg = `Invalid file type, expected: '${expected}'!`;
            throw new Error(showMsg.getRed(msg));
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
    genFolder(path: string) {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    },

    getConfig() {
        const deafultPath = './qrs-config.json';
        const qrsConfigFile = fs.readFileSync(deafultPath);
        const qrsConfig: IMinifyConfig = JSON.parse(qrsConfigFile.toString());
        return qrsConfig;
    },

    getIndexListOf(
        str: string,
        match: string,
        typeIndex = "initial" || "final"
    ): Array<number> {
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
        //to save
        replacedCode.replace('¤', '¤¤');
        replacedCode.replace('<script', '¤ts');
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
        replacedCode.replace('</nav>', '¤tn');
        replacedCode.replace('<form', '¤tf');
        replacedCode.replace('</form>', '¤tf/');
        replacedCode.replace('<table>', '¤tt');
        replacedCode.replace('</table>', '¤tt/');
        replacedCode.replace('<button>', '¤tbu');
        replacedCode.replace('</button>', '¤tbu/');
        //properties
        replacedCode.replace('placeholder', '¤pp');
        replacedCode.replace(' style', '¤ps');
        replacedCode.replace('hidden', '¤ph');
        replacedCode.replace('type', '¤pt');
        replacedCode.replace('class', '¤pc');
        replacedCode.replace('width', '¤pw');
        replacedCode.replace('height', '¤phe');
        replacedCode.replace('padding', '¤ppa');
        replacedCode.replace('margin', '¤pm');
        replacedCode.replace('font-size', '¤pf');
        replacedCode.replace('border', '¤pb');
        replacedCode.replace('color', '¤pco');
        replacedCode.replace('background', '¤pba');
        replacedCode.replace('background-color', '¤pbac');
        replacedCode.replace('background', '¤pba');
        replacedCode.replace('onclick', '¤po');
        //js
        replacedCode.replace('alert(', '¤ja');
        replacedCode.replace('function', '¤jf');
        replacedCode.replace('getElementById(', '¤jg');
        replacedCode.replace('toString()', '¤jt');
        replacedCode.replace('const', '¤jc');
        replacedCode.replace('Number', '¤jn');
        replacedCode.replace('JSON', '¤jj');
        replacedCode.replace('contructor', '¤jco');
        replacedCode.replace('while', '¤jw');
        replacedCode.replace('return', '¤jr');
        replacedCode.replace('stringify', '¤js');
        replacedCode.replace('filter', '¤jfi');
        replacedCode.replace('filter', '¤jfi');
        replacedCode.replace('push', '¤jp');
        replacedCode.replace('replace', '¤jre');
        replacedCode.replace('indexOf', '¤ji');
        replacedCode.replace('async', '¤jas');
        replacedCode.replace('await', '¤jaw');
        replacedCode.replace('length', '¤jl');
        replacedCode.replace('parse', '¤jpu');
        replacedCode.replace('forEach', '¤jfo');
        //get save
        replacedCode.replace('¤¤', '¤');
        return replacedCode;
    },

    addIndexToFileName: (path: string, index: number) => {
        const finalPath = path + `/qrcode_${index}.png`;
        return finalPath;
    },

    minifyHtml: (htmlStr: string, qrs_config: IMinifyConfig) => {
        const {
            minify,
            htmlminifier_options
        } = qrs_config.minify_config.html;
        if (minify) {
            showMsg.blue("Minifying html . . .");
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
            showMsg.blue("Minifying JS . . .");
            const qtdScript = htmlStr.split('<script').length / 2;
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
            for (let i = 0; i < qtdScript; i++) {
                const jsDirty = htmlStr.substring(
                    indexListOpenScript[i],
                    indexListCloseScript[i]
                );
                const indexFinalScriptTag = qrsService.getIndexListOf(
                    jsDirty,
                    '>',
                    "final"
                )[0];
                const onlyJS = jsDirty.substring(
                    indexFinalScriptTag,
                    indexListCloseScript[i]
                );
                const jsCodeMinResult = uglyfyJs.minify(onlyJS, uglifyjs_options);
                validator.errorOnGetMinJs(jsCodeMinResult);
                htmlStr = htmlStr.replace(onlyJS, jsCodeMinResult.code);
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
            showMsg.blue("Minifying CSS . . .");
            const qtdCss = htmlStr.split('<style').length / 2;
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
            for (let i = 0 ; i < qtdCss; i++) {
                let cssDirty = htmlStr.substring(
                    indexListOpenStyle[i],
                    indexListCloseStyle[i]
                );
                const indexFinalStyleTag = qrsService.getIndexListOf(
                    cssDirty,
                    '>',
                    "final"
                )[0];
                const onlyCss = cssDirty.substring(
                    indexFinalStyleTag,
                    indexListCloseStyle[i]
                );
                const cssMinResult = csso.minify(onlyCss, csso_options).css;
                htmlStr = htmlStr.replace(onlyCss, cssMinResult);
            }
        }
        return htmlStr;
    },

    minify: async (qrs_min_config: IMinifyConfig) => {
        try {
            const {
                input_path,
                output_path,
            } = qrs_min_config;
            qrsService.genFolder(output_path)
            //get htmlstring
            const buffer = await readFile(input_path);
            const htmlStr = buffer.toString();
            const onlyHtmlMin = qrsService.minifyHtml(
                htmlStr,
                qrs_min_config
            );
            const onlyHtmlJsMin = qrsService.minifyJs(
                onlyHtmlMin,
                qrs_min_config
            );
            const fullMin = qrsService.minifyCss(
                onlyHtmlJsMin,
                qrs_min_config
            );
            return fullMin;
        } catch(error) {
            throw new Error(error);
        }
    },

    compactStrFile(str: string) {
        const compactStrFile = lzw.compress(str);
        return compactStrFile.toString();
    },

    splitCode: (strCompressed: string) => {
        //get qtd iterations,
        const qtdSplit = strCompressed.length / 2364;
         //if division result is integer return division result else remove decimals and add 1 iteration
        const iterations = Number.isInteger(qtdSplit) ?
        qtdSplit : (Number.parseInt(qtdSplit.toString()) + 1);
        const strSplitList = [];
        let strStart = 0;
        let strFinal = 0;
        for (let i = 0; i < iterations; i++) {
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

    generateQRCodeList: (
        strSplitList: Array<string>,
        qrs_config: IMinifyConfig
    ) => {
        const { output_path } = qrs_config;
        strSplitList.forEach(async (strSplit, index) => {
            qrsService.genFolder(output_path);
            const finalPath = qrsService.addIndexToFileName(
                output_path,
                index++
            );
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
            ).catch((error ) => console.log("error", error))
        });
    }
}

//cli functions qrs
const qrs = {
    'init': () => {
        validator.errorIfFileExists('./qrs-config.json');
        fs.writeFileSync('./qrs-config.json', qrs_config);
        fs.writeFileSync('/public', qrs_config);
        showMsg.green("Started successfully!");
    },
    'build': async () => {
        showMsg.green("Start build . . .");
        //get default config
        const qrs_config: IMinifyConfig = qrsService.getConfig();
        //minify html, css, js
        validator.errorFileIfInvalidExtension(qrs_config.input_path, 'html');
        const htmlMinStr = await qrsService.minify(qrs_config);
        const recodifiedHtml = qrsService.reCodifyHtml(htmlMinStr);
        const compactCodeHtml = qrsService.compactStrFile(recodifiedHtml);
        const strSplitList = qrsService.splitCode(compactCodeHtml);
        qrsService.generateQRCodeList(strSplitList, qrs_config);
        showMsg.green("Build success . . .");
    }
}

command.command('qrs [option]')
.description('create the config file of type json.')
.action((option) => qrs[option]());

command.parse(process.argv);
