import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../src";
import { Logger } from "../../src/utils/logger";
import { typecheck } from "../utils/tsc";

const target = "extended_element";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.wsdl`;
    const outdir = "./test/generated";

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    it(`${target} - check definitions`, async () => {
        expect(existsSync(`${outdir}/extendedelement/definitions/DummyList.ts`)).toBe(true);
        expect(existsSync(`${outdir}/extendedelement/definitions/DummyRequest.ts`)).toBe(true);
        expect(existsSync(`${outdir}/extendedelement/definitions/DummyResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/extendedelement/definitions/DummyResult.ts`)).toBe(true);
        expect(existsSync(`${outdir}/extendedelement/definitions/ExtendedDummyRequest.ts`)).toBe(true);
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/extendedelement/index.ts`);
    });
});
