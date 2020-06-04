import {getExactTypeStringOf, ExactType, ExactTypeString, getStringOfType,isBaseType} from "com-tools";



// customJSONStringify 专用的 Reviver
export type StringifyReviver = (this: any, key: string,value: any,type:string ,stringifyOptions:StringifyReviverOptions) => any;

// customJSONParse 专用的 Reviver
export type ParseReviver = (this: any, key: string,value: any,type:string) => any;

// customJSONStringify 和 customJSONParse 都可用的 Reviver
export type SPReviver = (this: any, key: string,value: any,type:string ,stringifyOptions:StringifyReviverOptions|undefined) => any;


export type DataType =  ExactTypeString | ExactType;
export type DataTypeArray = DataType[];
export type Types = DataType | DataTypeArray;


export type TypeReviverArray<Reviver> = [Types,Reviver][];

export type TypeStringReviverArray<Reviver> = [ExactTypeString,Reviver][];


/**
 * 扁平化的 TypeReviverArray
 */
export type TypeReviverFlatArray<Reviver> = [DataType,Reviver][];

export interface TypeReviverObject<Reviver> {
    [typeName:string]:Reviver;
}

export type TypeReviverMap<Reviver> = Map<Types,Reviver>;

/**
 * 扁平化的 TypeReviverMap
 */
export type TypeReviverFlatMap<Reviver> = Map<DataType,Reviver>;

export type TypeRevivers<Reviver> = TypeReviverArray<Reviver> | TypeReviverObject<Reviver> | TypeReviverMap<Reviver>;


/**
 * 将 typeRevivers 转成 TypeReviverArray
 * @param typeRevivers
 */
export function toTypeReviverArray<Reviver>(typeRevivers:TypeRevivers<Reviver>):TypeReviverArray<Reviver> {

    switch (typeRevivers.constructor.name) {
        case "Map":{
            var typeRevArr = Array.from(typeRevivers as TypeReviverMap<Reviver>);
            break;
        }
        case "Array":{
            typeRevArr = typeRevivers as TypeReviverArray<Reviver>;
            break;
        }
        default:{
            typeRevArr = Object.entries(typeRevivers);
        }
    }

    return typeRevArr;
}




export function toTypeReviverObject<Reviver>(typeRevivers:TypeRevivers<Reviver>):TypeReviverObject<Reviver>  {
    let typeReviverArr = toTypeReviverArray(typeRevivers);

    let typeStrReviverArr:TypeStringReviverArray<Reviver> = typeReviverArr.reduce(function (flatArr:TypeStringReviverArray<Reviver>,typeReviver) {
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




export interface StringifyReviverOptions {
    skip?:boolean;
    skipMark?:boolean;
    skipRootMark?:boolean;   //是否跳过 顶层的 标记
}

/**
 * 需要禁止使用默认JSON序列化的类型；即禁止调用 toJSON 的类型；
 */
export type TypesOfDisableDefault = Function[] | Function;


export interface JSONStringifyOptions extends StringifyReviverOptions{
    skipRoot?:boolean;   //是否跳过 顶层的 自定义操作
    space?: string | number;
    mark?:string;   //类型标记
    disDefault?:TypesOfDisableDefault;  //需要禁止使用默认JSON序列化的类型；
}

/**
 * 默认的 Mark 值
 */
const _defaultMark = "__MarKOfCustomJSON__";


/**
 * 自定义JSON序列化；可根据数据类型来自定义序列化方案； 给合  customJSONParse  可实现对任意类型的数据 进行序列化 并完整（无信息丢失）还原；
 * @param value: any   被序列化的对象
 * @param typeRevivers?:TypeRevivers|null    定义 类型 与 其对类的 自定义序列化函数；
 * @param options:JSONStringifyOptions    选项
 */
export function customJSONStringify(value: any, typeRevivers?:TypeRevivers<StringifyReviver|ParseReviver|SPReviver>|null,options:JSONStringifyOptions = {}):string {

    let disDefault = options.disDefault;

    //禁用toJSON
    if (disDefault){
        var disTypes = Array.isArray(disDefault) ? disDefault : [disDefault];
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

    if (typeRevivers){

        let opts = Object.assign({},options);
        let mark = opts.mark as string;
        mark = opts.mark = mark == null ? _defaultMark : mark;

        let trObj = toTypeReviverObject(typeRevivers as TypeRevivers<StringifyReviver>);

        let count = 0;  // stringifyReviver 的调用次数

        let stringifyReviver = function (this: any, key: string, value: any) {
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


            let packData = [rerRes,typeStr,mark];
            Object.defineProperty(packData,mark,markPropDes);

            return packData;


        };

        var jsonStr =  JSON.stringify(value,stringifyReviver,opts.space);
    }else {
        jsonStr = JSON.stringify(value,null,options.space);
    }

    //取消禁用toJSON
    if (disTypeInfos){
        disTypeInfos.forEach(function (funInfo) {
            funInfo.type.prototype.toJSON = funInfo.toJSON;
        });
    }

    return jsonStr;
}



export enum LostRevier {
    original="original",
    parse = "parse",
    ignore = "ignore"
}



export interface JSONParseOptions {
    mark?:string | string[] | null;   //类型标记
    lostRevier?:LostRevier;   //当找不到 Revier 时，如何处理
}


/**
 * 自定义JSON解析；可根据类型自定义解析逻辑；
 * @param text
 * @param typeRevivers
 * @param options
 */
export function customJSONParse(text: string, typeRevivers?:TypeRevivers<ParseReviver|StringifyReviver|SPReviver>|null,options:JSONParseOptions = {}):any {

    let {mark = _defaultMark,lostRevier = LostRevier.parse} = options;

    if (mark == null){
        return JSON.parse(text);
    }

    var trObj = typeRevivers ? toTypeReviverObject(typeRevivers as TypeRevivers<ParseReviver>) : {};
    var marks = Array.isArray(mark) ? mark : [mark];


    function parseReviver(this: any, key: string, value: any) {
        if (isBaseType(value)){
            return value;
        }


        if (Array.isArray(value)){
            var isMarked = value.length === 3 && marks.includes(value[2]);
            if (isMarked){
                var realValue = value[0];
                var typeName = value[1];
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

        return revier.call(this,key,realValue,typeName);

    }

    return JSON.parse(text,parseReviver);
}
