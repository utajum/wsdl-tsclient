import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../src";
import { Logger } from "../../src/utils/logger";
import { typecheck } from "../utils/tsc";

const target = "builtin_types";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.wsdl`;
    const outdir = "./test/generated";

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    it(`${target} - check definitions`, async () => {
        expect(existsSync(`${outdir}/builtintypes/definitions/Xsduration.ts`)).toBe(true);
        expect(existsSync(`${outdir}/builtintypes/definitions/XsnonNegativeInteger.ts`)).toBe(true);
        expect(existsSync(`${outdir}/builtintypes/definitions/XsnonNegativeInteger1.ts`)).toBe(true);
        expect(existsSync(`${outdir}/builtintypes/definitions/Xsstring.ts`)).toBe(true);
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/builtintypes/index.ts`);
    });
});
