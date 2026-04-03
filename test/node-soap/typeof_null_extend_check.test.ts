import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../src";
import { Logger } from "../../src/utils/logger";
import { typecheck } from "../utils/tsc";

const target = "typeof_null_extend_check";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.wsdl`;
    const outdir = "./test/generated";

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    it(`${target} - check definitions`, async () => {
        expect(existsSync(`${outdir}/typeofnullextendcheck/definitions/QaSearch.ts`)).toBe(true);
        expect(existsSync(`${outdir}/typeofnullextendcheck/definitions/QaSearchResult.ts`)).toBe(true);
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/typeofnullextendcheck/index.ts`);
    });
});
