import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { parseAndGenerate } from "../../src";
import { Logger } from "../../src/utils/logger";
import { typecheck } from "../utils/tsc";

const target = "extension_inheritance";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.wsdl`;
    const outdir = "./test/generated";
    const defDir = `${outdir}/extensioninheritance/definitions`;

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    it(`${target} - check definition files exist`, async () => {
        expect(existsSync(`${defDir}/WipStates.ts`)).toBe(true);
        expect(existsSync(`${defDir}/WipStatesFetchAll.ts`)).toBe(true);
        expect(existsSync(`${defDir}/WipStatesFetchAllResponse.ts`)).toBe(true);
    });

    it(`${target} - WipStates has inherited ID and Value from LookupValue`, async () => {
        const content = readFileSync(`${defDir}/WipStates.ts`, "utf-8");
        expect(content.includes("ID")).toBeTruthy();
        expect(content.includes("Value")).toBeTruthy();
        // ID should be number (from xs:int), not string
        expect(content.includes("number")).toBeTruthy();
    });

    it(`${target} - WipStatesFetchAllResult has inherited Success and ErrorMessage from ServiceResponse`, async () => {
        const content = readFileSync(`${defDir}/WipStatesFetchAllResult.ts`, "utf-8");
        expect(content.includes("Success")).toBeTruthy();
        expect(content.includes("ErrorMessage")).toBeTruthy();
        // Also has its own Items property from the extension
        expect(content.includes("Items")).toBeTruthy();
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/extensioninheritance/index.ts`);
    });
});
