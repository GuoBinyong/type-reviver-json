import {StringifyReviverOptions} from "./customJSON";


//Date 原始的 toJSON 方法
const toJSONOfDate = Date.prototype.toJSON

//Date 的 StringifyReviver
export function Date_StringifyReviver(key: string,value: any,type:string ,callCount:number,stringifyOptions:StringifyReviverOptions) {
    if(stringifyOptions.skip || stringifyOptions.skipMark || (callCount === 1 && stringifyOptions.skipRootMark)){
        return toJSONOfDate.call(value);
    }
    return value.valueOf();
}

//Date 的 ParseReviver
export function Date_ParseReviver(key: string,value: any,type:string,callCount:number) {
    return new Date(value);
}

