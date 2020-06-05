import {
    TypesOfDisableDefault,
    customJSONStringify,
    customJSONParse,
    TypeReviversOptions,
    SPReviver,
    ReviverPair,
    TypeReviverMap,
    parseTypeReviversOptions,
    toTypeReviverArray,
    TypeReviverArray, StringifyReviverOptions
} from "./index"

import {isBaseType} from "com-tools"











export interface DeepCopyByJSON {
    <T>(value:T,typeReviversOpts?:TypeReviversOptions|null,typesOfDisDefault?:TypesOfDisableDefault):T;
    presetTypeReviverMap:TypeReviverMap<SPReviver | ReviverPair>;  //预置的 TypeReviverMap
}



/**
 * 创建带 presetTypeReviverMap 的 deepCopyByJSON 的工厂函数
 * @param presetTypeReviverMap
 */
export function createDeepCopyByJSONWith(presetTypeReviverMap?:TypeReviverMap<SPReviver | ReviverPair>):DeepCopyByJSON {

    /**
     * 通过 自定义 JSON 序列人的方式 对 value 进行 深拷贝
     * @param value
     * @param dcTypeRevivers
     */
    let deepCopyByJSON:DeepCopyByJSON = function <T>(value:T,typeReviversOpts?:TypeReviversOptions|null,typesOfDisDefault?:TypesOfDisableDefault):T {
        if (isBaseType(value)){
            return value;
        }

        let preTRArr = toTypeReviverArray(deepCopyByJSON.presetTypeReviverMap);

        let strAllTRArr:TypeReviverArray<SPReviver | ReviverPair> = preTRArr.slice();
        let parseAllTRArr:TypeReviverArray<SPReviver | ReviverPair> = preTRArr.slice();

        if (typeReviversOpts){
            let trsPair = parseTypeReviversOptions(typeReviversOpts);
            let strTRs = trsPair.string;
            let parseTRs = trsPair.parse;

            if (strTRs){
                let strTRArr = toTypeReviverArray(strTRs);
                strAllTRArr.concat(strTRArr as TypeReviverArray<SPReviver | ReviverPair>);
            }

            if (parseTRs){
                let parseTRArr = toTypeReviverArray(parseTRs);
                parseAllTRArr.concat(parseTRArr as TypeReviverArray<SPReviver | ReviverPair>);
            }

        }


        var str = customJSONStringify(value,strAllTRArr);
        return customJSONParse(str,parseAllTRArr);
    } as DeepCopyByJSON


    Object.defineProperty(deepCopyByJSON,"presetTypeReviverMap",{
        configurable:true,
        enumerable:true,
        get:function () {
            if (!this._presetTypeReviverMap){
                this._presetTypeReviverMap = new Map();
            }
            return this._presetTypeReviverMap;
        },
        set:function (newValue) {
            if (newValue instanceof Map){
                this._presetTypeReviverMap = newValue;
            }
        }
    });



    if (presetTypeReviverMap){
        deepCopyByJSON.presetTypeReviverMap = presetTypeReviverMap;
    }

    return deepCopyByJSON;
}


//Date 原始的 toJSON 方法
const toJSONOfDate = Date.prototype.toJSON

//Date 的 StringifyReviver
function DateStringifyReviver(key: string,value: any,type:string ,callCount:number,stringifyOptions:StringifyReviverOptions) {
    if(stringifyOptions.skip || stringifyOptions.skipMark || (callCount === 1 && stringifyOptions.skipRootMark)){
        return toJSONOfDate.call(value);
    }
    return value.valueOf();
}

//Date 的 ParseReviver
function DateParseReviver(key: string,value: any,type:string,callCount:number) {
    return new Date(value);
}



export const defaultPresetTypeReviverMap:TypeReviverMap<SPReviver | ReviverPair> = new Map([
    [Date,{string:DateStringifyReviver, parse:DateParseReviver}]
]);



/**
 * 通过 自定义 JSON 序列人的方式 对 value 进行 深拷贝
 */
export const deepCopyByJSON = createDeepCopyByJSONWith(defaultPresetTypeReviverMap);
