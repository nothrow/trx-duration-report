export class Timespan
{
    static parse(input: string | undefined) : number {
        if (!input) return 0;

        const tsRegex = /^(\d{1,2}|\d\.\d{2}):([0-5]\d):([0-5]\d\.*\d+)?$/
        const result = input.match(tsRegex);
        if (!result) return 0;

        // 1: hours
        // 2: minutes
        // 3: seconds
        return (
            parseInt(result[1]) * 60 * 60 + 
            parseInt(result[2]) * 60 + 
            parseFloat(result[3]));
        // 00:00:00.0060000
    }

}