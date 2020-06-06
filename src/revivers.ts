import {StringifyReviverOptions} from "./customJSON";


// Date ----------

//原始的 toJSON 方法
const Date_toJSON = Date.prototype.toJSON

//StringifyReviver
export function Date_StringifyReviver(key: string,value: any,type:string ,callCount:number,stringifyOptions:StringifyReviverOptions) {
    if(stringifyOptions.skip || stringifyOptions.skipMark || (callCount === 1 && stringifyOptions.skipRootMark)){
        return Date_toJSON ? Date_toJSON.call(value) : value.toString();
    }
    return value.valueOf();
}

//ParseReviver
export function Date_ParseReviver(key: string,value: any,type:string,callCount:number) {
    return new Date(value);
}





// Map ----------



//原始的 toJSON 方法

// @ts-ignore
const Map_toJSON = Map.prototype.toJSON

//StringifyReviver
export function Map_StringifyReviver(key: string,value: any,type:string ,callCount:number,stringifyOptions:StringifyReviverOptions) {
    if(Map_toJSON && (stringifyOptions.skip || stringifyOptions.skipMark || (callCount === 1 && stringifyOptions.skipRootMark))){
        return Map_toJSON.call(value);
    }
    return Array.from(value);
}

//ParseReviver
export function Map_ParseReviver(key: string,value: any,type:string,callCount:number) {
    return new Map(value);
}






// Set ----------



//原始的 toJSON 方法

// @ts-ignore
const Set_toJSON = Set.prototype.toJSON

//StringifyReviver
export function Set_StringifyReviver(key: string,value: any,type:string ,callCount:number,stringifyOptions:StringifyReviverOptions) {
    if(Set_toJSON && (stringifyOptions.skip || stringifyOptions.skipMark || (callCount === 1 && stringifyOptions.skipRootMark))){
        return Set_toJSON.call(value);
    }
    return Array.from(value);
}

//ParseReviver
export function Set_ParseReviver(key: string,value: any,type:string,callCount:number) {
    return new Set(value);
}
