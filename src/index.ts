import {getExactTypeStringOf, ExactType, ExactTypeString, getStringOfType,isBaseType} from "com-tools";




type Reviver = (this: any, key: string,value: any,type:string ,stringifyOptions:StringifyReviverOptions|undefined) => any;


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
    skip?:boolean;
    skipMark?:boolean;
    skipRootMark?:boolean;   //是否跳过 顶层的 标记
}



interface JSONStringifyOptions extends StringifyReviverOptions{
    skipRoot?:boolean;   //是否跳过 顶层的 自定义操作
    space?: string | number;
    mark?:string;   //类型标记
}






export function customJSONStringify(value: any, typeRevivers:TypeRevivers,options:JSONStringifyOptions = {}):string {
    let opts = Object.assign({},options);
    let mark = opts.mark as string;
    mark = opts.mark = mark == null ? "|=|" : mark;

    let trObj = toTypeReviverObject(typeRevivers);

    let count = 0;  // stringifyReviver 的调用次数

    function stringifyReviver(this: any, key: string, value: any) {
        ++count;

        let isMarked = value != null && value[mark];  // value 是被标记的数据，表示已经处理过了，不用再处理了
        let needSkip = opts.skipRoot && count === 1;   //需要跳过这次处理
        if (isMarked || needSkip){
            return value;
        }


        let typeStr = getExactTypeStringOf(value);
        let revier = trObj[typeStr];
        if (!revier){
            return value;
        }

        let rerOpts = Object.assign({},opts);
        let rerRes = revier.call(this,key,value,typeStr,rerOpts); //需要放在


        if (rerOpts.skip){ //需要放在上一句 `revier.call(this,key,value,rerOpts)` 的后面，因为 revier 可修改 rerOpts 的值
            return value;
        }


        /*
        在以下任一情况下，均不会添加 mark
        - revier 返回 undefined  :  `rerRes === undefined`
        - skipMark 为 true : `rerOpts.skipMark`
        - value 是被 customJSONStringify 最初序列化的目标（即：根） 且  skipRootMark 为 true : `rerOpts.skipRootMark && count === 1`
        */
        if (rerRes === undefined || rerOpts.skipMark || (rerOpts.skipRootMark && count === 1)){
            return rerRes;
        }

        if  (isBaseType(rerRes)){
            return JSON.stringify({
                [mark]:true,
                type:typeStr,
                value:rerRes
            });
        }

        let markPropDes = {
            configurable:true,
            writable:true,
            enumerable: false,
            value:true
        };

        Object.defineProperty(rerRes,mark,markPropDes);


        let packData = [mark,typeStr,rerRes];
        Object.defineProperty(packData,mark,markPropDes);

        return packData;


    }

    return  JSON.stringify(value,stringifyReviver,opts.space);
}



export enum LostRevier {
    original="original",
    parse = "parse",
    ignore = "ignore"
}



interface JSONParseOptions {
    mark?:string | string[] | null;   //类型标记
    lostRevier?:LostRevier;   //当找不到 Revier 时，如何处理
}





export function customJSONParse(text: string, typeRevivers:TypeRevivers,options:JSONParseOptions = {}):any {

    let {mark = "|=|",lostRevier = LostRevier.parse} = options;

    if (mark == null){
        return JSON.parse(text);
    }

    var trObj = toTypeReviverObject(typeRevivers);
    var marks = Array.isArray(mark) ? mark : [mark];
    // var downOpts = Object.assign({},options,{mark:marks,lostRevier:lostRevier});

    // if (selfCall){
    //     // var trObj:TypeReviverObject = typeRevivers as TypeReviverObject
    //     // var marks = mark as string[];
    //     // var downOpts = options;
    // }else {
    //     trObj = toTypeReviverObject(typeRevivers);
    //     marks = Array.isArray(mark) ? mark : [mark];
    //     downOpts = Object.assign({},options,{mark:marks,lostRevier:lostRevier});
    // }


    function parseReviver(this: any, key: string, value: any) {
        if (isBaseType(value)){
            return value;
        }


        if (Array.isArray(value)){
            var isMarked = value.length === 3 && marks.includes(value[0]);
            if (isMarked){
                var typeName = value[1];
                var realValue = value[2];
            }
        }else {
            typeName = value["type"];
            isMarked = typeName && marks.some(function (markStr) {return value[markStr]});
            if (isMarked){
                realValue = value["value"];
            }
        }

        if (!isMarked){
            return value;
        }

        let revier = trObj[typeName];

        if (!revier){
            switch (lostRevier) {
                case LostRevier.ignore: return undefined;
                case LostRevier.original:return value;
                default: return realValue;
            }
        }


        // let rerRes = revier.call(this,key,realValue,typeName);

        return revier.call(this,key,realValue,typeName,undefined);

    }


}
