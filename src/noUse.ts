

//用不到的工具-----------------


import {DataTypeArray, TypeReviverArray, TypeReviverFlatArray} from "./index";

export function typeReviverArrayToTypeReviverFlatArray<Reviver>(typeReviverArr:TypeReviverArray<Reviver>):TypeReviverFlatArray<Reviver> {
    return  typeReviverArr.reduce(function (flatArr:TypeReviverFlatArray<Reviver>,typeReviver) {
        let types = typeReviver[0];
        let reviver = typeReviver[1];

        let typeArr:DataTypeArray = Array.isArray(types) ? types : [types];

        typeArr.forEach(function (dataType) {
            flatArr.push([dataType ,reviver]);
        });

        return flatArr;

    },[]);
}



//类型名字的正则
import {getStringOfType} from "com-tools";

var typeNameRegExp = /^[$\w]+$/;

/**
 * 类型 和 值 的 信息
 */
interface TypeValueInfo {
    mark:string;
    type:string;
    value:string;
    text:string;
}

function getTypeAndValue(text:string,marks:(string|null)[],typeRevivers:TypeReviverObject): TypeValueInfo | null {
    let typeName!:string;
    let itsMark = marks.find(function (markStr) {
        if (!markStr){
            return false
        }

        let index = text.indexOf(markStr);
        if (index < 0){
            return false;
        }

        let typeStr = text.substring(0,index);
        if (typeNameRegExp.test(typeStr)){
            typeName = typeStr;
            return true
        }
    });

    if (!itsMark){
        return null;
    }

    return itsMark ? {
        mark:itsMark,
        type:typeName,
        value:text.replace(typeName + itsMark,""),
        text:text
    } : null;
}





/**
 * 将 typeRevivers 转成 TypeReviverMap
 * @param typeRevivers
 */
function toTypeReviverMap(typeRevivers:TypeRevivers):TypeReviverMap {
    switch (typeRevivers.constructor.name) {
        case "Map":{
            var typeRevMap = typeRevivers as TypeReviverMap;
            break;
        }
        case "Array":{
            typeRevMap = new Map(typeRevivers as TypeReviverArray);
            break;
        }
        default:{
            typeRevMap = new Map(Object.entries(typeRevivers));
        }
    }

    return typeRevMap;
}




/**
 * 扁平化 并扩展 TypeReviverArray
 * 扁平化 会把 TypeReviverArray 中 [DataTypeArray,Reviver] 映射关系 改成  多个 [DataType,Reviver] 的映射关系
 * 扩展 会把 给 TypeReviverArray 增给第个 TypeReviver 增加一个对应  [DataType的名字,Reviver]，DataType的名字 就是 DataType 的字符串表示
 * @param TypeReviverFlatArray
 */
function flatExtendTypeReviverArray(typeReviverArr:TypeReviverArray):TypeReviverFlatArray {
    return  typeReviverArr.reduce(function (flatArr:TypeReviverFlatArray,typeReviver) {
        let types = typeReviver[0];
        let reviver = typeReviver[1];

        let typeArr:DataTypeArray = Array.isArray(types) ? types : [types];

        typeArr.forEach(function (dataType) {
            flatArr.push([dataType,reviver]);
            if (typeof dataType !== "string"){
                let typeStr = getStringOfType(dataType);
                flatArr.push([typeStr,reviver])
            }
        });

        return flatArr;

    },[] as TypeReviverFlatArray);
}


/**
 * 扁平化 并扩展 TypeRevivers
 * @param typeRevivers
 */
function flatExtendTypeRevivers(typeRevivers:TypeRevivers):TypeReviverFlatArray {
    let trArr = toTypeReviverArray(typeRevivers);
    return flatExtendTypeReviverArray(trArr);
}


/**
 * 将 typeRevivers 扁平化并扩展成 TypeReviverFlatMap
 * @param typeRevivers
 */
function flatExtendToTypeReviverFlatMap(typeRevivers:TypeRevivers):TypeReviverFlatMap {
    let flatArr = flatExtendTypeRevivers(typeRevivers);
    return  new Map(flatArr);
}
