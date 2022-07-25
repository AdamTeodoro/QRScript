#!/usr/bin/env node
import * as fs from 'fs';
import * as qrcode from 'qrcode';
import * as htmlMinifier from 'html-minifier';
import * as uglyfyJs from 'uglify-js';
import * as csso from 'csso';
import * as chalk from 'chalk';

import { readFile } from 'fs/promises';
import { Command } from 'commander';

import { IQRSConfig } from './interfaces/IQRSConfig';

import qrs_config from './qrs_config';

const lzw = require('lzw');

//json format
const command = new Command();
command.version('1.0.0');

const showMsg = {
    getRed: (msg: string) => {
        return chalk.default.red(msg);
    },
    green: (msg: string) => {
        console.log(chalk.default.green(msg));
    },
    red: (msg: string) => {
        console.log(chalk.default.red(msg));
    },
    yellow: (msg: string) => {
        console.log(chalk.default.yellow(msg))
    },
    blue: (msg: string) => {
        console.log(chalk.default.yellow(msg))
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
        validator.errorIfFileNotExists(deafultPath);
        const qrsConfigFile = fs.readFileSync(deafultPath);
        const qrsConfig: IQRSConfig = JSON.parse(qrsConfigFile.toString());
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
        //to save
        let replacedCode = htmlFileStr.replace('¤', '¤¤')
        .replace('<script', '¤ts')
        .replace('</script>', '¤ts/')
        .replace('<html', '¤th')
        .replace('</html>', '¤th/')
        .replace('<body', '¤tb')
        .replace('</body>', '¤tb/')
        .replace('<header', '¤the')
        .replace('</header>', '¤the/')
        .replace('<style', '¤tst')
        .replace('</style>', '¤tst/')
        .replace('<img', '¤ti')
        .replace('<footer', '¤tf')
        .replace('<div', '¤td')
        .replace('</div>', '¤td/')
        .replace('<nav', '¤tn')
        .replace('</nav>', '¤tn')
        .replace('<form', '¤tf')
        .replace('</form>', '¤tf/')
        .replace('<table', '¤tt')
        .replace('</table>', '¤tt/')
        .replace('<button', '¤tbu')
        .replace('</button>', '¤tbu/')
        // -----------------------------property
        .replace('placeholder', '¤pp')
        .replace(' style', '¤ps')
        .replace('hidden', '¤ph')
        .replace('type', '¤pt')
        .replace('class', '¤pc')
        .replace('width', '¤pw')
        .replace('height', '¤phe')
        .replace('padding', '¤ppa')
        .replace('margin', '¤pm')
        .replace('font-size', '¤pf')
        .replace('border', '¤pb')
        .replace('color', '¤pco')
        .replace('background', '¤pba')
        .replace('background-color', '¤pbac')
        .replace('background', '¤pba')
        .replace('onclick', '¤po')
        // --------------------------- javascript
        .replace('alert(', '¤ja')
        .replace('function', '¤jf')
        .replace('getElementById(', '¤jg')
        .replace('toString()', '¤jt')
        .replace('const', '¤jc')
        .replace('Number', '¤jn')
        .replace('JSON', '¤jj')
        .replace('contructor', '¤jco')
        .replace('while', '¤jw')
        .replace('return', '¤jr')
        .replace('stringify', '¤js')
        .replace('filter', '¤jfi')
        .replace('filter', '¤jfi')
        .replace('push', '¤jp')
        .replace('replace', '¤jre')
        .replace('indexOf', '¤ji')
        .replace('async', '¤jas')
        .replace('await', '¤jaw')
        .replace('length', '¤jl')
        .replace('parse', '¤jpu')
        .replace('forEach', '¤jfo')
        // ------------------------- codefyed string data
        .replace('¤¤', '¤');
        return replacedCode;
    },

    addIndexToFileName: (path: string, index: number) => {
        const finalPath = path + `/qrcode_${index}.png`;
        return finalPath;
    },

    minifyHtml: (htmlStr: string, qrs_config: IQRSConfig) => {
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

    minifyJs: (htmlStr: string, qrs_config: IQRSConfig) => {
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

    minifyCss: (htmlStr: string, qrs_config: IQRSConfig) => {
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

    minify: async (qrs_min_config: IQRSConfig) => {
        const {
            input_path,
            output_path,
        } = qrs_min_config;
        qrsService.genFolder(output_path)
        //get htmlstring
        const buffer = await readFile(input_path);
        const htmlStr = buffer.toString();
        console.log("", buffer.toString().length);
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
    },

    compactStrFile(str: string): string {
        const compactStrFile = lzw.compress(str);
        return compactStrFile.toString();
    },

    addProjectDetails: (
        splitedCode: Array<string>,
        qrsConfig: IQRSConfig
    ) => {
        const  {
            app_name,
            author,
            license
        } = qrsConfig;
        splitedCode[0] = `${app_name}/${author}/${license}/` + splitedCode[0];
        return splitedCode;
    },

    splitCode: (strCompressed: string, qrsConfig: IQRSConfig) => {
        const strSize = 2364;
        console.log("strSize: ", strCompressed.length);
        console.log("iterations: ", strCompressed.length / strSize);
        const qtdCodeSplited = strCompressed.length / strSize;
         //if division result is integer return division result else remove decimals and add 1 iteration
        let iterations = 0;
        if (Number.isInteger(qtdCodeSplited)) {
            iterations = qtdCodeSplited;
        } else {
            const exactSplitQtd = Number.parseInt(qtdCodeSplited.toString());
            iterations = (exactSplitQtd + 1);
        }
        const strSplitList: Array<string> = [];
        let strStart = 0;
        let strFinal = 0;
        for (let i = 0; i < iterations; i++) {
            strFinal = strFinal + strSize;
            const strSplit = strCompressed.substring(strStart, strFinal);
            strSplitList.push(strSplit);
            strStart = strFinal;
        }
        strSplitList.forEach((strSplit, index) => {
            const strDroped = strSplitList.splice(index, 1);
            //add 'index of qrcode/number of qrcode-' in init of str 
            strSplitList.push(`${index}/${iterations}-` + strDroped);
            console.log("index: ", index);
            console.log("interations: ", iterations);
        });
        return qrsService.addProjectDetails(
            strSplitList,
            qrsConfig
        );
    },

    generateQRCodeList: (
        strSplitList: Array<string>,
        qrs_config: IQRSConfig
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
        qrsService.genFolder('/public');
        showMsg.green("Started successfully!");
    },
    'build': async () => {
        showMsg.green("Start build . . .");
        //get default config
        const qrs_config: IQRSConfig = qrsService.getConfig();
        //minify html, css, js
        validator.errorFileIfInvalidExtension(qrs_config.input_path, 'html');
        const htmlMinStr = await qrsService.minify(qrs_config);
        console.log("recodifiedHtml: ", htmlMinStr.length);
        const recodifiedHtml = qrsService.reCodifyHtml(htmlMinStr); 
        // const compactCodeHtml = qrsService.compactStrFile(recodifiedHtml);
        const strSplitList = qrsService.splitCode(recodifiedHtml, qrs_config);
        qrsService.generateQRCodeList(strSplitList, qrs_config);
        showMsg.green("Successfully built!");
    }
}

command.command('qrs [option]')
.description('execute function with the option name.')
.action((option: "build" | "init") => qrs[option]());

command.parse(process.argv);
