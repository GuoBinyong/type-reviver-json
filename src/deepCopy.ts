import {TypeRevivers,SPReviver,ParseReviver,StringifyReviver,TypesOfDisableDefault,customJSONStringify,customJSONParse} from "./index"
import {isBaseType} from "com-tools"



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


export type DeepCopyTypeRevivers = TypeReviversOptions | TypeRevivers<SPReviver>



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
