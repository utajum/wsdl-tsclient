import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../../src";
import { Logger } from "../../../src/utils/logger";
import { typecheck } from "../../utils/tsc";

const target = "elementref/foo";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.wsdl`;
    const outdir = "./test/generated/elementref";

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    it(`${target} - check definitions`, async () => {
        expect(existsSync(`${outdir}/foo/definitions/BankSvcRq.ts`)).toBe(true);
        expect(existsSync(`${outdir}/foo/definitions/BankSvcRs.ts`)).toBe(true);
        expect(existsSync(`${outdir}/foo/definitions/FooRq.ts`)).toBe(true);
        expect(existsSync(`${outdir}/foo/definitions/FooRs.ts`)).toBe(true);
        expect(existsSync(`${outdir}/foo/definitions/PaymentRq.ts`)).toBe(true);
        expect(existsSync(`${outdir}/foo/definitions/PaymentRs.ts`)).toBe(true);
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/foo/index.ts`);
    });
});
