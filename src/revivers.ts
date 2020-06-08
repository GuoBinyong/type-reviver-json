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







// URL ----------



//原始的 toJSON 方法

// @ts-ignore
const URL_toJSON = URL.prototype.toJSON

//StringifyReviver
export function URL_StringifyReviver(key: string,value: any,type:string ,callCount:number,stringifyOptions:StringifyReviverOptions) {
    if(URL_toJSON && (stringifyOptions.skip || stringifyOptions.skipMark || (callCount === 1 && stringifyOptions.skipRootMark))){
        return URL_toJSON.call(value);
    }
    return value.href;
}

//ParseReviver
export function URL_ParseReviver(key: string,value: any,type:string,callCount:number) {
    return new URL(value);
}






// RegExp ----------



//原始的 toJSON 方法

// @ts-ignore
const RegExp_toJSON = RegExp.prototype.toJSON

//StringifyReviver
export function RegExp_StringifyReviver(key: string,value:any,type:string ,callCount:number,stringifyOptions:StringifyReviverOptions) {
    if(stringifyOptions.skip || stringifyOptions.skipMark || (callCount === 1 && stringifyOptions.skipRootMark)){
        return RegExp_toJSON ? RegExp_toJSON.call(value) : value.toString();
    }

    return {
        source:value.source,
        flags:value.flags
    };
}

//ParseReviver
export function RegExp_ParseReviver(key: string,value: any,type:string,callCount:number) {
    let {source,flags} = value;
    let reg = new RegExp(source,flags);
    return reg;
}





// Function ----------



//原始的 toJSON 方法

// @ts-ignore
const Function_toJSON = Function.prototype.toJSON

//StringifyReviver
export function Function_StringifyReviver(key: string,value:any,type:string ,callCount:number,stringifyOptions:StringifyReviverOptions) {
    if(Function_toJSON && stringifyOptions.skip || stringifyOptions.skipMark || (callCount === 1 && stringifyOptions.skipRootMark)){
        return Function_toJSON.call(value);
    }
    return {
        source:value.toString(),
        name:value.name
    };
}

//ParseReviver
export function Function_ParseReviver(key: string,value: any,type:string,callCount:number) {
    /*
    考虑到安全和性能的原因，弃用 eval，改用 Function；
    */
    let {source,name} = value;
    //判断函数代码是否是匿名函数
    let hasName = /function\s+[A-Za-z_$]+[\w$]*\s*\(/.test(source);

    if (!hasName && /^[A-Za-z_$]+[\w$]*$/.test(name)){ // 当 函数代码是匿名函数 且 name 是有效的标识符
        var funBody = `"use strict"; var ${name} = ${source} ; return ${name}`;
    }else {
        funBody = `"use strict"; return (${source})`;
    }
    return (new Function(funBody))();

    /*
    匿名函数 不能用于 函数声明，只能用于函数表达式；
    所以，如果 value 是匿名函数，则 `eval(value);` 会报错： `Uncaught SyntaxError: Function statements require a function name`
    此时，只需要用 `()` 将其转为 函数表达式 即可；
    */
    // return eval(`(${value})`);

}
