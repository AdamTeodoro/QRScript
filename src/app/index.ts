#!/usr/bin/env node

import * as fs from 'fs';
import * as qrcode from 'qrcode';

import { Command } from 'commander';
import { promisify } from "util";
import { readFile } from 'fs/promises';

const lzw = require('lzw');

//json format
const command = new Command();
command.version('1.0.0');
const strConfig = `{
    "input_path": "",
    "output_path": ""
}
`;
const htmlMin = (htmlFileStr: string) => {
    let replacedCode = htmlFileStr;
    replacedCode.replace('<script>', 'ºts');
    replacedCode.replace('</script>', 'ºts/');
    replacedCode.replace('<html>', 'ºth');
    replacedCode.replace('</html>', 'ºth/');
    replacedCode.replace('<body>', 'ºtb');
    replacedCode.replace('</body>', 'ºtb/');
    replacedCode.replace('<header>', 'ºthe');
    replacedCode.replace('</header>', 'ºthe/');
    replacedCode.replace('<style>', 'ºtst');
    replacedCode.replace('</style>', 'ºtst/');
    replacedCode.replace('<img', 'ºti');
    replacedCode.replace('<footer', 'ºtf');
    replacedCode.replace('<div', 'ºtd');
    replacedCode.replace('</div>', 'ºtd/');
    replacedCode.replace('<nav', 'ºtn')
    //properties
    replacedCode.replace('placeholder', 'ºpp');
    replacedCode.replace(' style', 'ºps');
    replacedCode.replace('hidden', 'ºph');
    replacedCode.replace('type', 'ºpt');
    //js
    replacedCode.replace('alert(', 'ºja');
    replacedCode.replace('function', 'ºjf');
    replacedCode.replace('getElementById(', 'ºjg');
    replacedCode.replace('toString()', 'ºjt');
    return replacedCode;
}
//validator from error 
const validator = {
    'validExtension': (fileName: string, expected: string) => {
        if (fileName.split('.')[1] === expected) {
            return;
        } else {
            throw `Error: expected an file type '${expected}'`;
        }
    }
}
//cli functions qrss
const qrs = {
    //init configuration
    'init': () => {
        try {
            fs.writeFileSync('./qrs-config.json', strConfig);
        } catch(error) {
            console.log('error', error);
            throw new Error(error);
        }
    },
    'build': async () => {
        const qrsConfigFile = fs.readFileSync('./qrs-config.json');
        const qrsConfig: { 
            input_path: string,
            output_path: string
        } = JSON.parse(qrsConfigFile.toString());
        const { input_path, output_path } = qrsConfig;
        //return exception if invalid file type or nothing
        validator.validExtension(input_path, 'html');
        const buffer = await readFile(input_path);
        const htmlFileStr = buffer.toString();
        let compressed = lzw.compress(htmlMin(htmlFileStr));
        await qrcode.toFile(output_path, JSON.stringify(compressed), {
            type: 'png',
        }).catch(error => console.log(error));
    },
    'reverse': () => {}
}
//
command.command('qrs [option]')
.description('create the config file of type json.')
.action((option) => qrs[option]());

command.parse(process.argv);
