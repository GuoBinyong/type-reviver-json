import {TypeRevivers,SPReviver,ParseReviver,StringifyReviver,customJSONStringify,customJSONParse} from "./index"
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
 * 需要禁止使用默认JSON序列化的类型；即禁止调用 toJSON 的类型；
 */
type TypesOfDisableDefault = Function[] | Function;



/**
 * 通过 自定义 JSON 序列人的方式 对 value 进行 深拷贝
 * @param value
 * @param dcTypeRevivers
 */
function deepCopyByJSON(value:any,dcTypeRevivers?:DeepCopyTypeRevivers,typesOfDisDefault?:TypesOfDisableDefault) {
    if (isBaseType(value)){
        return value;
    }

    if (typesOfDisDefault){
        var disTypes = Array.isArray(typesOfDisDefault) ? typesOfDisDefault : [typesOfDisDefault];
        var disTypeInfos:{ type:Function, name:string, toJSON?:Function }[] | undefined = disTypes.map(function (fun) {
            let toJSON = fun.prototype.toJSON;
            fun.prototype.toJSON = undefined;

            return {
                type:fun,
                name:fun.name,
                toJSON:toJSON
            };
        });
    }



    let strTypeRevivers = dcTypeRevivers as TypeRevivers<StringifyReviver> | undefined;
    let parseTypeRevivers = dcTypeRevivers as TypeRevivers<ParseReviver> | undefined;

    if (isTypeReviversOptions(dcTypeRevivers)){
        strTypeRevivers = dcTypeRevivers.string;
        parseTypeRevivers = dcTypeRevivers.parse;
    }

    var str = customJSONStringify(value,strTypeRevivers);

    if (disTypeInfos){
        disTypeInfos.forEach(function (funInfo) {
            funInfo.type.prototype.toJSON = funInfo.toJSON;
        })
    }

    return customJSONParse(str,parseTypeRevivers);
}
