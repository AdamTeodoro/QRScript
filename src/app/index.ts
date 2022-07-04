#!/usr/bin/env node

import * as fs from 'fs';
import * as qrcode from 'qrcode';
import * as htmlMinifier from 'html-minifier';
import * as uglyfyJs from 'uglify-js';

import { readFile } from 'fs/promises';
import { Command } from 'commander';

import qrs_config from './qrs_config';

import { IMinConfig } from './interfaces/IMinConfig';

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
        return !validator.fileNotExists(filePath);
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
    validateFileExtension: (fileName: string, expected: string) => {
        const extensionReceived = fileName.split('.')[1];
        if (extensionReceived !== expected) {
            const msg = `Invalid file type, expected: '${expected}'`;
            throw new Error(msg);
        }
        return;
    }
}

const qrsService = {
    getIndexListOf(str: string, match: string): Array<number> {
        const indexList: Array<number> = [];
        for (let i = 0; i < str.length; i++) {
            if (str.substring(i, i + match.length) == match) {
              indexList.push(i);
            }
        }
        return indexList;
    },
    codeReplaced: (htmlFileStr: string) => {
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
    minifyJs: (htmlStr: string) => {
        const qtdScript = htmlStr.split('<script>').length;
        for (let i = 0; i < qtdScript; i++) {
            const indexListOpenScript = qrsService.getIndexListOf(htmlStr, '<script>');
            const indexListCloseScript = qrsService.getIndexListOf(htmlStr, '</script>')
            const js = htmlStr.indexOf('<script>', i)
        }

    },
    minify: async (input_path: string, minify_config: IMinConfig) => {
        const { minify_code, minify_options } = minify_config;
        if (minify_code) {
            const buffer = await readFile(input_path);
            const htmlStr = buffer.toString();
            const htmlStrMin = htmlMinifier.minify(htmlStr, minify_options);
            qrsService.minifyJs(htmlStrMin)
            return htmlStrMin;
        } else {
            const buffer = await readFile(input_path);
            const htmlStr = buffer.toString();
            return htmlStr;
        }
    }
}

//cli functions qrs
const qrs = {
    //init configuration
    'init': () => {
        validator.errorIfFileExists('./qrs-config.json');
        fs.writeFileSync('./qrs-config.json', qrs_config);
    },
    'build': async () => {
        const qrsConfigFile = fs.readFileSync('./qrs-config.json');
        const qrsConfig: {
            input_path: string,
            output_path: string,
            minify_config: IMinConfig;
        } = JSON.parse(qrsConfigFile.toString());
        const { input_path, output_path, minify_config } = qrsConfig;
        validator.validateFileExtension(input_path, 'html');
        let htmlFileStr = await qrsService.minify(input_path, minify_config);
        let compressed = lzw.compress(qrsService.codeReplaced(htmlFileStr));
        const strCompressed: string = compressed.toString();
        const iterations = strCompressed.length / 2364;
        let strStart = 0;
        let strFinal = 0;
        const strSplitList = [];
        for (let i = 0; i < iterations; i++) {
            strFinal = strFinal + 2364;
            const strSplit = strCompressed.substring(strStart, strFinal);
            strSplitList.push(strSplit);
            strStart = strFinal;
        }
        if (strCompressed.length % iterations !== 0) {
            const strSplit = strCompressed.substring(
                strCompressed.length - strFinal,
                strCompressed.length
            );
            strSplitList.push(strSplit);
        }
        strSplitList.forEach((strSplit, index) => {
            const strDroped = strSplitList.splice(index);
            //add 'index of qrcode/number of qrcode-' in init of str 
            strSplitList.push(`${index}/${strSplit.length}-` + strDroped);
        });
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
//
command.command('qrs [option]')
.description('create the config file of type json.')
.action((option) => qrs[option]());

command.parse(process.argv);
