import {getExactTypeStringOf, ExactType, ExactTypeString, getStringOfType} from "com-tools";


type Reviver = (this: any, key: string,value: any,options:StringifyReviverOptions) => any;


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




interface StringifyReviverOptions {
    mark?:string | null;   //类型标记
    skip?:boolean;
    skipMark?:boolean;
    skipRootMark?:boolean;   //是否跳过 顶层的 标记
};



interface JSONStringifyOptions extends StringifyReviverOptions{
    skipRoot?:boolean;   //是否跳过 顶层的 自定义操作
    space?: string | number;
}






export function customJSONStringify(value: any, typeRevivers:TypeRevivers,options:JSONStringifyOptions = {},selfCall?:boolean):string {
    if (selfCall){
        var opts = options;
        var trObj:TypeReviverObject = typeRevivers as TypeReviverObject
    }else {
        opts = Object.assign({mark:"|=|"},options);
        trObj = toTypeReviverObject(typeRevivers);
    }

    let count = 0;

    function stringifyReviver(this: any, key: string, value: any) {
        ++count;
        if ((selfCall || opts.skipRoot) && count === 1){
            return value;
        }


        let typeStr = getExactTypeStringOf(value);
        let revier = trObj[typeStr];
        if (!revier){
            return value;
        }

        let rerOpts = Object.assign({},opts);
        let rerRes = revier.call(this,key,value,rerOpts);


        if (rerOpts.skip){
            return value;
        }

        let mark = rerOpts.mark;

        /*
        在以下任一情况下，均不会添加 mark
        - revier 返回 undefined  :  `rerRes === undefined`
        - mark 没有定义 :  `!mark`
        - skipMark 为 true : `rerOpts.skipMark`
        - value 是被 customJSONStringify 最初序列化的目标（即：根） 且  skipRootMark 为 true : `rerOpts.skipRootMark && !selfCall && count === 1`
        */
        if (rerRes === undefined || !mark || rerOpts.skipMark || (rerOpts.skipRootMark && !selfCall && count === 1)){
            return rerRes;
        }

        let rerStr:string = typeof rerRes === "string" ? rerRes : customJSONStringify(value,trObj,opts,true);
        rerStr = typeStr + mark + rerStr;

        return rerStr;
    }

    return  JSON.stringify(value,stringifyReviver,opts.space);
}



export enum LostRevier {
    original="original",
    remove = "remove",
    parse = "parse",
    ignore = "ignore"
}



interface JSONParseOptions {
    mark?:string | string[] | null;   //类型标记
    lostRevier?:LostRevier;   //当找不到 Revier 时，如何处理
}



//类型名字的正则
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


export function customJSONParse(text: string, typeRevivers:TypeRevivers,options:JSONParseOptions = {},selfCall?:boolean):any {

    let {mark = "|=|",lostRevier = LostRevier.parse} = options;

    if (!mark){
        return JSON.parse(text);
    }

    if (selfCall){
        var trObj:TypeReviverObject = typeRevivers as TypeReviverObject
        var marks = mark as string[];
        var downOpts = options;
    }else {
        trObj = toTypeReviverObject(typeRevivers);
        marks = Array.isArray(mark) ? mark : [mark];
        downOpts = Object.assign({},options,{mark:marks,lostRevier:lostRevier});
    }


    function parseReviver(this: any, key: string, value: any) {
        if (typeof value !== "string"){
            return value;
        }

        let tvInfo = getTypeAndValue(value,marks,trObj);

        if (!tvInfo){
            return value;
        }

        let {type:typeName,value:realValue,mark:itsMark} = getTypeAndValue(value,marks,trObj) as TypeValueInfo;
        let revier = trObj[typeName];

        if (!revier){
            switch (lostRevier) {
                case LostRevier.ignore: return undefined;
                case LostRevier.original:return value;
                case LostRevier.remove:return realValue;
                default:{
                    return customJSONParse(value,trObj,downOpts,true);
                }
            }
        }


        let rerRes = revier.call(this,key,realValue);




    }


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
