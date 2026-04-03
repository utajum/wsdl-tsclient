import path from "path";
import { parseWsdl } from "./parser";
import { generate } from "./generator";
import { now, timeElapsed } from "./utils/timer";
import { Logger } from "./utils/logger";

export { generate } from "./generator";
export { parseWsdl } from "./parser";

export enum ModelPropertyNaming {
    "camelCase" = "camelCase",
    "PascalCase" = "PascalCase",
}
export interface Options {
    /**
     * Generate only Definitions
     * @default false
     */
    emitDefinitionsOnly: boolean;
    /**
     * Prefix for generated interface names
     * @default ""
     */
    modelNamePrefix: string;
    /**
     * Suffix for generated interface names
     * @default ""
     */
    modelNameSuffix: string;
    /**
     * Case-insensitive name while parsing definition names
     * @default false
     */
    caseInsensitiveNames: boolean;
    /**
     * Use wsdl schema type names instead of parameter names for generated interface names
     * @default false
     */
    useWsdlTypeNames: boolean;
    /**
     * Maximum count of definition's with same name but increased suffix. Will throw an error if exceed
     * @default 64
     */
    maxRecursiveDefinitionName: number;
    /**
     * Property naming convention ('camelCase' or 'PascalCase')"
     */
    modelPropertyNaming: ModelPropertyNaming | undefined;
    /**
     * Generate imports with .js suffix
     */
    esm: boolean;
    /**
     * Print verbose logs
     * @default false
     */
    verbose: boolean;
    /**
     * Suppress all logs
     * @default false
     */
    quiet: boolean;
    /**
     * Logs with colors
     * @default true
     */
    colors: boolean;
}

export const defaultOptions: Options = {
    emitDefinitionsOnly: false,
    modelNamePrefix: "",
    modelNameSuffix: "",
    caseInsensitiveNames: false,
    useWsdlTypeNames: false,
    maxRecursiveDefinitionName: 64,
    modelPropertyNaming: undefined,
    esm: false,
    //
    verbose: false,
    quiet: false,
    colors: true,
};

export async function parseAndGenerate(
    wsdlPath: string,
    outDir: string,
    options: Partial<Options> = {},
): Promise<void> {
    const mergedOptions: Options = {
        ...defaultOptions,
        ...options,
    };

    if (options.verbose) {
        Logger.isDebug = true;
    }
    if (options.colors === false) {
        Logger.colors = false;
    }
    if (options.quiet) {
        Logger.isDebug = false;
        Logger.isLog = false;
        Logger.isInfo = false;
        Logger.isWarn = false;
        Logger.isError = false;
    }

    // Logger.debug(`Options: ${JSON.stringify(mergedOptions, null, 2)}`);

    const timeParseStart = now();
    const parsedWsdl = await parseWsdl(wsdlPath, mergedOptions);
    Logger.debug(`Parser time: ${timeElapsed(timeParseStart)}ms`);

    const timeGenerateStart = now();
    await generate(parsedWsdl, path.join(outDir, parsedWsdl.name.toLowerCase()), mergedOptions);
    Logger.debug(`Generator time: ${timeElapsed(timeGenerateStart)}ms`);

    Logger.info(`Generating finished: ${timeElapsed(timeParseStart)}ms`);
}
