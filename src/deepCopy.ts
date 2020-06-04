import {
    TypeRevivers,
    Types,
    SPReviver,
    ParseReviver,
    StringifyReviver,
    TypesOfDisableDefault,
    customJSONStringify,
    customJSONParse,
    DataType,
    TypeReviverArray,
    TypeReviverMap,
    TypeReviverObject,
    TypeStringReviverArray,
    DataTypeArray,
    toTypeStringReviverFlatArray,
    TypeStringReviverFlatArray
} from "./index"
import {ExactTypeString, getStringOfType, isBaseType} from "com-tools"



export interface TypeReviversPair {
    string?:TypeRevivers<StringifyReviver>;
    parse?:TypeRevivers<ParseReviver>;
}



/**
 * StringParseTypeRevivers 的类型守卫
 * @param target
 */
export function isTypeReviversPair(target:any):target is TypeReviversPair  {
    return target && typeof target === "object" && !Array.isArray(target) && (target.string || target.parse)
}



export interface ReviverPair {
    string:StringifyReviver;
    parse:ParseReviver;
}


export type TypeReviverPairs = TypeRevivers<ReviverPair> | TypeReviversPair





interface deepCopyByJSON {
    defaultTypeReviverPairs:TypeRevivers<ReviverPair>
}




/**
 * 通过 自定义 JSON 序列人的方式 对 value 进行 深拷贝
 * @param value
 * @param dcTypeRevivers
 */
function deepCopyByJSON(value:any,dcTypeRevivers?:TypeReviverPairs,typesOfDisDefault?:TypesOfDisableDefault) {
    if (isBaseType(value)){
        return value;
    }


    if (isTypeReviversPair(dcTypeRevivers)){
        var strTypeRevivers = dcTypeRevivers.string;
        var parseTypeRevivers = dcTypeRevivers.parse;
    }else {
        strTypeRevivers = [];
        parseTypeRevivers = [] as TypeStringReviverFlatArray<ParseReviver>;
        let typeStrRevFlatArr = toTypeStringReviverFlatArray(dcTypeRevivers as TypeRevivers<ReviverPair>);
        typeStrRevFlatArr.forEach(function (tsrPair) {
            let typeName = tsrPair[0];
            let rPair = tsrPair[1];
            (<TypeStringReviverFlatArray<StringifyReviver>>strTypeRevivers).push([typeName,rPair.string]);
            (<TypeStringReviverFlatArray<ParseReviver>>parseTypeRevivers).push([typeName,rPair.parse]);
        });
    }

    var str = customJSONStringify(value,strTypeRevivers,{disDefault:typesOfDisDefault});
    return customJSONParse(str,parseTypeRevivers);
}
