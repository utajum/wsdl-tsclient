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
        // The original bug produced `export interface WipStates {}` — empty,
        // because xs:extension inheritance was not resolved. The fix must
        // generate actual property declarations inherited from LookupValue.
        expect(content).toMatch(/ID\?:\s*number/);
        expect(content).toMatch(/Value\?:\s*string/);
    });

    it(`${target} - WipStatesFetchAllResult has inherited Success and ErrorMessage from ServiceResponse`, async () => {
        const content = readFileSync(`${defDir}/WipStatesFetchAllResult.ts`, "utf-8");
        // Inherited from ServiceResponse base type
        expect(content).toMatch(/Success\?:\s*boolean/);
        expect(content).toMatch(/ErrorMessage\?:\s*string/);
        // Own property added by the extension
        expect(content).toMatch(/Items\?/);
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/extensioninheritance/index.ts`);
    });
});
