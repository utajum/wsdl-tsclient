import { styleText } from "util";

export class Logger {
    static isDebug = false;
    static isLog = true;
    static isInfo = true;
    static isWarn = true;
    static isError = true;
    static colors = true;

    static disabled() {
        Logger.isDebug = false;
        Logger.isLog = false;
        Logger.isInfo = false;
        Logger.isWarn = false;
        Logger.isError = false;
    }

    static debug(str: string) {
        if (Logger.isDebug) {
            console.log(Logger.colors ? styleText("gray", str) : str);
        }
    }

    static log(str: string) {
        if (Logger.isLog) {
            console.log(str);
        }
    }

    static info(str: string) {
        if (Logger.isInfo) {
            console.log(Logger.colors ? styleText("green", str) : str);
        }
    }

    static warn(str: string) {
        if (Logger.isWarn) {
            console.log(Logger.colors ? styleText("yellow", str) : str);
        }
    }

    static error(str: string) {
        if (Logger.isError) {
            console.error(Logger.colors ? styleText("red", str) : str);
        }
    }
}
