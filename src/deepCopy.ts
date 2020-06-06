import {
    customJSONStringify,
    customJSONParse,
    TypeReviverMap,
    toTypeReviverArray,
    TypeReviverArray,
    TypeRevivers,
    Reviver
} from "./index"

import {isBaseType} from "com-tools"









export interface TypeReviversPair {
    string?:TypeRevivers<Reviver>;
    parse?:TypeRevivers<Reviver>;
}



/**
 * StringParseTypeRevivers 的类型守卫
 * @param target
 */
export function isTypeReviversPair(target:any):target is TypeReviversPair  {
    return target && typeof target === "object" && !Array.isArray(target) && (target.string || target.parse)
}



export type TypeReviversOptions = TypeRevivers<Reviver> | TypeReviversPair







export interface DeepCopyByJSON {
    <T>(value:T,typeReviversOpts?:TypeReviversOptions|null):T;
    presetTypeReviverMap:TypeReviverMap<Reviver>;  //预置的 TypeReviverMap
}



/**
 * 创建带 presetTypeReviverMap 的 deepCopyByJSON 的工厂函数
 * @param presetTypeReviverMap
 */
export function createDeepCopyByJSONWith(presetTypeReviverMap?:TypeReviverMap<Reviver>):DeepCopyByJSON {

    /**
     * 通过 自定义 JSON 序列人的方式 对 value 进行 深拷贝
     * @param value
     * @param dcTypeRevivers
     */
    let deepCopyByJSON:DeepCopyByJSON = function <T>(value:T,typeReviversOpts?:TypeReviversOptions|null):T {
        if (isBaseType(value)){
            return value;
        }

        let preTRArr = toTypeReviverArray(deepCopyByJSON.presetTypeReviverMap);

        if (typeReviversOpts){
            if (isTypeReviversPair(typeReviversOpts)){
                let strTRs = typeReviversOpts.string;
                if (strTRs){
                    let strTRArr = toTypeReviverArray(strTRs);
                    var strAllTRArr:TypeReviverArray<Reviver> | undefined = preTRArr.concat(strTRArr);
                }

                let parseTRs = typeReviversOpts.parse;
                if (parseTRs){
                    let parseTRArr = toTypeReviverArray(parseTRs);
                    var parseAllTRArr:TypeReviverArray<Reviver> | undefined  = preTRArr.concat(parseTRArr);
                }

            }else {
                let trArr = toTypeReviverArray(typeReviversOpts);
                strAllTRArr = preTRArr.concat(trArr);
                parseAllTRArr = strAllTRArr;
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




import {Date_StringifyReviver,Date_ParseReviver} from "./revivers"


export const defaultPresetTypeReviverMap:TypeReviverMap<Reviver> = new Map([
    [Date,{string:Date_StringifyReviver, parse:Date_ParseReviver}]
]);



/**
 * 通过 自定义 JSON 序列人的方式 对 value 进行 深拷贝
 */
export const deepCopyByJSON = createDeepCopyByJSONWith(defaultPresetTypeReviverMap);
