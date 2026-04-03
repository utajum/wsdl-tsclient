import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../src";
import { Logger } from "../../src/utils/logger";

const target = "self_recursive";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.wsdl`;
    const outdir = "./test/generated";

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    it(`${target} - check definitions`, async () => {
        expect(existsSync(`${outdir}/selfrecursive/definitions/GetPerson.ts`)).toBe(true);
        expect(existsSync(`${outdir}/selfrecursive/definitions/GetPersonResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/selfrecursive/definitions/Person.ts`)).toBe(true);
        expect(existsSync(`${outdir}/selfrecursive/definitions/Request.ts`)).toBe(true);
    });
});
