import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../src";
import { Logger } from "../../src/utils/logger";
import { typecheck } from "../utils/tsc";

const target = "ws-policy";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.wsdl`;
    const outdir = "./test/generated";

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    it(`${target} - check definitions`, async () => {
        expect(existsSync(`${outdir}/wspolicy/definitions/DummyList.ts`)).toBe(true);
        expect(existsSync(`${outdir}/wspolicy/definitions/DummyRequest.ts`)).toBe(true);
        expect(existsSync(`${outdir}/wspolicy/definitions/DummyResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/wspolicy/definitions/DummyResult.ts`)).toBe(true);
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/wspolicy/index.ts`);
    });
});
