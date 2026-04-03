import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../src";
import { Logger } from "../../src/utils/logger";
import { typecheck } from "../utils/tsc";

const target = "redefined-ns";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.wsdl`;
    const outdir = "./test/generated";

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    it(`${target} - check definitions`, async () => {
        expect(existsSync(`${outdir}/redefinedns/definitions/VerificationData.ts`)).toBe(true);
        expect(existsSync(`${outdir}/redefinedns/definitions/VerificationRequest.ts`)).toBe(true);
        expect(existsSync(`${outdir}/redefinedns/definitions/Verify.ts`)).toBe(true);
        expect(existsSync(`${outdir}/redefinedns/definitions/VerifyResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/redefinedns/definitions/VerifyResult.ts`)).toBe(true);
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/redefinedns/index.ts`);
    });
});
