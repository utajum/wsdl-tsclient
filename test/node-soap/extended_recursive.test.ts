import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../src";
import { Logger } from "../../src/utils/logger";
import { typecheck } from "../utils/tsc";

const target = "extended_recursive";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.wsdl`;
    const outdir = "./test/generated";

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    it(`${target} - check definitions`, async () => {
        expect(existsSync(`${outdir}/extendedrecursive/definitions/Department.ts`)).toBe(true);
        expect(existsSync(`${outdir}/extendedrecursive/definitions/GetPerson.ts`)).toBe(true);
        expect(existsSync(`${outdir}/extendedrecursive/definitions/GetPersonResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/extendedrecursive/definitions/GetPersonResult.ts`)).toBe(true);
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/extendedrecursive/index.ts`);
    });
});
