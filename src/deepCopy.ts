import {
    TypeRevivers,
    Types,
    SPReviver,
    ParseReviver,
    StringifyReviver,
    TypesOfDisableDefault,
    customJSONStringify,
    customJSONParse,
    DataType, TypeReviverArray, TypeReviverMap, TypeReviverObject, TypeStringReviverArray, DataTypeArray
} from "./index"
import {ExactTypeString, getStringOfType, isBaseType} from "com-tools"



export interface TypeReviversOptions {
    string?:TypeRevivers<StringifyReviver>;
    parse?:TypeRevivers<ParseReviver>;
}



/**
 * StringParseTypeRevivers 的类型守卫
 * @param target
 */
export function isTypeReviversOptions(target:any):target is TypeReviversOptions  {
    return target && typeof target === "object" && !Array.isArray(target) && (target.string || target.parse)
}



export interface ReviverPair {
    string:StringifyReviver;
    parse:ParseReviver;
}



export type TypeReviverPairArray = [Types,ReviverPair][];

export type TypeStringReviverPairArray = [ExactTypeString,ReviverPair][];


/**
 * 扁平化的 TypeReviverPairArray
 */
export type TypeReviverPairFlatArray = [DataType,ReviverPair][];

export interface TypeReviverPairObject {
    [typeName:string]:ReviverPair;
}

export type TypeReviverPairMap = Map<Types,ReviverPair>;

/**
 * 扁平化的 TypeReviverMap
 */
export type TypeReviverPairFlatMap = Map<DataType,ReviverPair>;

export type TypeReviverPairs = TypeReviverPairArray | TypeReviverPairObject | TypeReviverPairMap;




export type DeepCopyTypeRevivers = TypeReviversOptions | TypeReviverPairs;



/**
 * 将 typeRevivers 转成 TypeReviverArray
 * @param typeRevivers
 */
export function toTypeReviverPairArray(typeReviverPairs:TypeReviverPairs):TypeReviverPairArray {

    switch (typeReviverPairs.constructor.name) {
        case "Map":{
            var trPairArr = Array.from(typeReviverPairs as TypeReviverPairMap);
            break;
        }
        case "Array":{
            trPairArr = typeReviverPairs as TypeReviverPairArray;
            break;
        }
        default:{
            trPairArr = Object.entries(typeReviverPairs);
        }
    }

    return trPairArr;
}




export function toTypeReviverPairObject(typeReviverPairs:TypeReviverPairs):TypeReviverPairObject  {
    let trPairArr = toTypeReviverPairArray(typeReviverPairs);

    let typeStrRevPairArr:TypeStringReviverPairArray = trPairArr.reduce(function (flatArr:TypeStringReviverPairArray,typeReviverPair) {
        let types = typeReviverPair[0];
        let reviverPair = typeReviverPair[1];

        let typeArr:DataTypeArray = Array.isArray(types) ? types : [types];

        typeArr.forEach(function (dataType) {
            flatArr.push([typeof dataType === "string" ? dataType : getStringOfType(dataType),reviverPair]);
        });

        return flatArr;

    },[]);

    return  Object.fromEntries(typeStrRevPairArr);
}

export function toTypeReviverMap<Reviver>(typeRevivers:TypeRevivers<Reviver>):TypeReviverMap<Reviver> {

    switch (typeRevivers.constructor.name) {
        case "Map":{
            var typeRevMap = typeRevivers as TypeReviverMap<Reviver>;
            break;
        }
        case "Array":{
            typeRevMap = new Map(typeRevivers as TypeReviverArray<Reviver>);
            break;
        }
        default:{
            typeRevMap = new Map(Object.entries(typeRevivers));
        }
    }

    return typeRevMap;
}







interface deepCopyByJSON {

}




/**
 * 通过 自定义 JSON 序列人的方式 对 value 进行 深拷贝
 * @param value
 * @param dcTypeRevivers
 */
function deepCopyByJSON(value:any,dcTypeRevivers?:DeepCopyTypeRevivers,typesOfDisDefault?:TypesOfDisableDefault) {
    if (isBaseType(value)){
        return value;
    }

    let strTypeRevivers = dcTypeRevivers as TypeRevivers<StringifyReviver> | undefined;
    let parseTypeRevivers = dcTypeRevivers as TypeRevivers<ParseReviver> | undefined;

    if (isTypeReviversOptions(dcTypeRevivers)){
        strTypeRevivers = dcTypeRevivers.string;
        parseTypeRevivers = dcTypeRevivers.parse;
    }

    var str = customJSONStringify(value,strTypeRevivers,{disDefault:typesOfDisDefault});
    return customJSONParse(str,parseTypeRevivers);
}
