import {getExactTypeStringOf, ExactType, ExactTypeString, getStringOfType} from "com-tools"


type Reviver = (this: any, key: string,value: any) => any;


type DataType =  ExactTypeString | ExactType;
type DataTypeArray = DataType[];
type Types = DataType | DataTypeArray;


type TypeReviverArray = [Types,Reviver][];

type TypeStringReviverArray = [ExactTypeString,Reviver][];


/**
 * 扁平化的 TypeReviverArray
 */
type TypeReviverFlatArray = [DataType,Reviver][];

type TypeReviverObject = {
    [typeName:string]:Reviver
};
type TypeReviverMap = Map<Types,Reviver>;

/**
 * 扁平化的 TypeReviverMap
 */
type TypeReviverFlatMap = Map<DataType,Reviver>;

type TypeRevivers = TypeReviverArray | TypeReviverObject | TypeReviverMap;


/**
 * 将 typeRevivers 转成 TypeReviverArray
 * @param typeRevivers
 */
function toTypeReviverArray(typeRevivers:TypeRevivers):TypeReviverArray {

    switch (typeRevivers.constructor.name) {
        case "Map":{
            var typeRevArr = Array.from(typeRevivers as TypeReviverMap);
            break;
        }
        case "Array":{
            typeRevArr = typeRevivers as TypeReviverArray;
            break;
        }
        default:{
            typeRevArr = Object.entries(typeRevivers);
        }
    }

    return typeRevArr;
}




function toTypeReviverObject(typeRevivers:TypeRevivers):TypeReviverObject  {
    let typeReviverArr = toTypeReviverArray(typeRevivers);

    let typeStrReviverArr:TypeStringReviverArray = typeReviverArr.reduce(function (flatArr:TypeStringReviverArray,typeReviver) {
        let types = typeReviver[0];
        let reviver = typeReviver[1];

        let typeArr:DataTypeArray = Array.isArray(types) ? types : [types];

        typeArr.forEach(function (dataType) {
            flatArr.push([typeof dataType === "string" ? dataType : getStringOfType(dataType),reviver]);
        });

        return flatArr;

    },[]);

    return  Object.fromEntries(typeStrReviverArr);
}




function customJSONStringify(value: any, typeRevivers:TypeRevivers,typeMark:string = "[type]:",selfCall?:boolean):string {
    let trObj:TypeReviverObject = selfCall ? typeRevivers as TypeReviverObject : toTypeReviverObject(typeRevivers);

    function stringifyReviver(this: any, key: string,value: any) {
        let typeStr = getExactTypeStringOf(value);
        var revier = trObj[typeStr];
        if (!revier){
            return value;
        }

        let rerRes = revier.call(this,key,value);

        if (rerRes === undefined){
            return rerRes;
        }

        let rerStr:string = typeof rerRes === "string" ? rerRes : customJSONStringify(value,trObj,typeMark,true);
        let typePrefix = typeMark.replace(/type/i,typeStr);

        return typePrefix + rerStr;
    }

    return  JSON.stringify(value,stringifyReviver);
}












//用不到的工具-----------------




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
