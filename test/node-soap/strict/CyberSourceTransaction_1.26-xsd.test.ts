import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../../src";
import { Logger } from "../../../src/utils/logger";
import { typecheck } from "../../utils/tsc";

const target = "strict/CyberSourceTransaction_1.26";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.xsd`;
    const outdir = "./test/generated/strict-xsd";

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    // t.test(`${target} - check definitions`, async t => {
    //     t.equal(existsSync(`${outdir}/A/definitions/BankSvcRq.ts`), true);
    //     t.equal(existsSync(`${outdir}/A/definitions/BankSvcRs.ts`), true);
    //     t.equal(existsSync(`${outdir}/A/definitions/ARq.ts`), true);
    //     t.equal(existsSync(`${outdir}/A/definitions/ARs.ts`), true);
    //     t.equal(existsSync(`${outdir}/A/definitions/PaymentRq.ts`), true);
    //     t.equal(existsSync(`${outdir}/A/definitions/PaymentRs.ts`), true);
    //     t.end();
    // });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/cybersourcetransaction126/index.ts`);
    });
});
