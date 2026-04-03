import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../src";
import { Logger } from "../../src/utils/logger";
import { typecheck } from "../utils/tsc";

const target = "list_parameter";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.wsdl`;
    const outdir = "./test/generated";

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    it(`${target} - check definitions`, async () => {
        expect(existsSync(`${outdir}/listparameter/definitions/About.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/AboutResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/AddTimesheet.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/AddTimesheetCommitPerPeriod.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/AddTimesheetCommitPerPeriodResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/AddTimesheetEntryByChargeCode.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/AddTimesheetEntryByChargeCodeResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/AddTimesheetResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/AddTimesheetWithDefaultDistribution.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/AddTimesheetWithDefaultDistributionResponse.ts`)).toBe(
            true,
        );
        expect(existsSync(`${outdir}/listparameter/definitions/AppSetup.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/Credentials.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/DeleteTimesheetEntry.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/DeleteTimesheetEntryResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/Entries.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/Entry.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/EntryError.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/EntryList.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/ErrorList.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/Filter.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetAppSetup.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetAppSetupResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetAppSetupResult.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetFlexiTimecode.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetFlexiTimecodeResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetFlexiTimecodeResult.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetFreeDimInformation.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetFreeDimInformationResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetIdsParameters.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetIdsParametersResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetResourceIdFromLoggedInUser.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetResourceIdFromLoggedInUserResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetResourceIdFromLoggedInUserResult.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTimesheet.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTimesheetFilter.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTimesheetFilterResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTimesheetFilterResult.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTimesheetResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTimesheetValues.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTimesheetValuesResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTimesheetValuesResult.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTimesheetValuesWithRelatedColumns.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTimesheetValuesWithRelatedColumnsResponse.ts`)).toBe(
            true,
        );
        expect(existsSync(`${outdir}/listparameter/definitions/GetTimesheetWorkSchedule.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTimesheetWorkScheduleResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTimesheetWorkScheduleResult.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTitlesById.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTitlesByIdResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/GetTitlesByIdResult.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/IdentifierList.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/Input.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/Input1.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/Input2.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/Input3.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/Input4.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/PeriodList.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/PeriodType.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/Response.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/TimesheetItem.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/TimesheetResponseList.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/TimesheetValue.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/TimesheetValueInfo.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/TimesheetValueInfoList.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/TimesheetValueList.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/Title.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/WorkDay.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/WorkDayList.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/WorkUnit.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/WorkUnitList.ts`)).toBe(true);
        expect(existsSync(`${outdir}/listparameter/definitions/WorkflowLog.ts`)).toBe(true);
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/listparameter/index.ts`);
    });
});
