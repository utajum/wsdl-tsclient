import camelcase from "camelcase";

interface CaseOptions {
    pascalCase?: boolean;
}

export function changeCase(input: string, options?: CaseOptions) {
    if (!options?.pascalCase) {
        return input.replace(/\./g, ""); // need to remove dots in the input string, otherwise, code generation fails
    }
    return camelcase(input, options);
}
