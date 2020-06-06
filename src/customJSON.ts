import {getExactTypeStringOf, ExactType, ExactTypeString, getStringOfType,isBaseType,getTypeByName} from "com-tools";



// customJSONStringify 专用的 Revr
export type StringifyReviver = (this: any, key: string,value: any,type:string ,callCount:number,stringifyOptions:StringifyReviverOptions) => any;

// customJSONParse 专用的 Reviver
export type ParseReviver = (this: any, key: string,value: any,type:string,callCount:number) => any;

// customJSONStringify 和 customJSONParse 都可用的 Reviver
export type SPReviver = (this: any, key: string,value: any,type:string ,callCount:number ,stringifyOptions:StringifyReviverOptions|undefined) => any;




export interface ReviverPair {
    string:StringifyReviver;
    parse:ParseReviver;
}


export type Reviver = SPReviver | StringifyReviver | ParseReviver | ReviverPair


export type DataType =  ExactTypeString | ExactType;
export type DataTypeArray = DataType[];
export type Types = DataType | DataTypeArray;


export type TypeReviverArray<Revr> = [Types,Revr][];

export type TypeStringReviverArray<Revr> = [ExactTypeString | ExactTypeString[],Revr][];
export type TypeStringReviverFlatArray<Revr> = [ExactTypeString,Revr][];


/**
 * 扁平化的 TypeReviverArray
 */
export type TypeReviverFlatArray<Revr> = [DataType,Revr][];

export interface TypeReviverObject<Revr> {
    [typeName:string]:Revr;
}

export type TypeReviverMap<Revr> = Map<Types,Revr>;

/**
 * 扁平化的 TypeReviverMap
 */
export type TypeReviverFlatMap<Revr> = Map<DataType,Revr>;






//ReviverPair 的类型守卫
export function isReviverPair(target:any):target is ReviverPair {
    return target && typeof target.string === "function" && typeof target.parse === "function"
}






export type TypeRevivers<Revr> = TypeReviverArray<Revr> | TypeReviverObject<Revr> | TypeReviverMap<Revr>;



/**
 * 将 typeRevivers 转成 TypeReviverArray
 * @param typeRevivers
 */
export function toTypeReviverArray<Revr>(typeRevivers:TypeRevivers<Revr>):TypeReviverArray<Revr> {

    switch (typeRevivers.constructor.name) {
        case "Map":{
            var typeRevArr = Array.from(typeRevivers as TypeReviverMap<Revr>);
            break;
        }
        case "Array":{
            typeRevArr = typeRevivers as TypeReviverArray<Revr>;
            break;
        }
        default:{
            typeRevArr = Object.entries(typeRevivers);
        }
    }

    return typeRevArr;
}



/**
 * 类型扁平化解析结果
 */
interface TypeFlatParseInfo<Revr> {
    typeFlat:TypeReviverFlatArray<Revr>;
    stringFlat:TypeStringReviverFlatArray<Revr>;
    trObject:TypeReviverObject<Revr>;
    typeFun:Function[];  //所有类型对应的构造函数数组，如果类型没有对应的构建函数，则不包含在内；
}



/**
 * 扁平化解析 TypeReviverArray
 * @param typeReviverArr
 */
export function flatParseTypeReviverArray<Revr>(typeReviverArr:TypeReviverArray<Revr>):TypeFlatParseInfo<Revr> {
    let typeFlatArr:TypeReviverFlatArray<Revr> = [];
    let stringFlatArr:TypeStringReviverFlatArray<Revr> = [];
    let typeFunArr:Function[] = [];

    typeReviverArr.forEach(function (typeReviver) {
        let types = typeReviver[0];
        let reviver = typeReviver[1];

        let typeArr:DataTypeArray = Array.isArray(types) ? types : [types];

        typeArr.forEach(function (dataType) {
            typeFlatArr.push([dataType,reviver]);

            switch (typeof dataType) {
                case "string":{
                    var typeName = dataType;
                    var typeFun = getTypeByName(dataType);
                    break
                }
                case "function":{
                    typeName = getStringOfType(dataType);
                    typeFun = dataType;
                    break
                }
                default:{
                    typeName = getStringOfType(dataType);
                    typeFun = getTypeByName(typeName);
                }
            }
            stringFlatArr.push([typeName,reviver]);

            if (typeof typeFun === "function"){
                typeFunArr.push(typeFun);
            }

        });
    });

    let info = {
        typeFlat:typeFlatArr,
        stringFlat:stringFlatArr,
        typeFun:typeFunArr
    };

    return Object.defineProperty(info,"trObject",{
        configurable:true,
        enumerable:true,
        get:function () {
            if (this._trObject === undefined){
                this._trObject = Object.fromEntries(stringFlatArr);
            }
            return this._trObject;
        },
        set:function (newValue) {
            this._trObject = newValue;
        }
    });
}


/**
 * 扁平化解析 TypeRevivers
 * @param typeRevivers
 */
export function flatParseTypeRevivers<Revr>(typeRevivers:TypeRevivers<Revr>):TypeFlatParseInfo<Revr>  {
    let typeReviverArr = toTypeReviverArray(typeRevivers);
    return  flatParseTypeReviverArray(typeReviverArr);
}




export function toTypeStringReviverFlatArray<Revr>(typeRevivers:TypeRevivers<Revr>):TypeStringReviverFlatArray<Revr>  {
    return  flatParseTypeRevivers(typeRevivers).stringFlat;
}


export function toTypeReviverObject<Revr>(typeRevivers:TypeRevivers<Revr>):TypeReviverObject<Revr>  {
    return flatParseTypeRevivers(typeRevivers).trObject;
}


export function toTypeReviverMap<Revr>(typeRevivers:TypeRevivers<Revr>):TypeReviverMap<Revr> {

    switch (typeRevivers.constructor.name) {
        case "Map":{
            var typeRevMap = typeRevivers as TypeReviverMap<Revr>;
            break;
        }
        case "Array":{
            typeRevMap = new Map(typeRevivers as TypeReviverArray<Revr>);
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



export interface JSONStringifyOptions extends StringifyReviverOptions{
    skipRoot?:boolean;   //是否跳过 顶层的 自定义操作
    space?: string | number;
    mark?:string | null ;   //类型标记
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
export function customJSONStringify<Revr extends Reviver>(value: any, typeRevivers?:TypeRevivers<Revr>|null,options:JSONStringifyOptions = {}):string {

    try {

        if  (typeRevivers){
            var parseInfo =  flatParseTypeRevivers(typeRevivers);
            let disDefaultArr = parseInfo.typeFun;

            //禁用toJSON
            if (disDefaultArr.length > 0){
                var disTypeInfos:{ type:Function, toJSON:Function }[] | undefined  = disDefaultArr.reduce(function (infoArr:{ type:Function, toJSON:Function }[],fun) {
                    let toJSON = fun.prototype.toJSON;

                    if (toJSON){
                        fun.prototype.toJSON = undefined;
                        infoArr.push({
                            type:fun,
                            toJSON:toJSON
                        });
                    }

                    return infoArr;
                },[]);
            }

            var trObj = parseInfo.trObject;

            if (trObj){

                let opts = Object.assign({},options);

                let mark = opts.mark as string;
                mark = opts.mark = mark == null ? _defaultMark : mark ;
                let markType = mark + "Type";
                let markValue = mark + "Value";


                let callCount = 0;  // stringifyReviver 的调用次数

                let stringifyReviver = function (this: any, key: string, value: any) {
                    ++callCount;

                    //此处的写法没有问题，这样写是为了提高性能
                    switch (key) {
                        case mark:;
                        case markType:;
                        case markValue:return value;
                    }


                    if (opts.skipRoot && callCount === 1){  //需要跳过这次处理
                        return value;
                    }


                    let typeName = getExactTypeStringOf(value);
                    let revier = trObj[typeName];
                    let revierFun:StringifyReviver = typeof revier === "function" ? <StringifyReviver>revier : (<ReviverPair>revier).string;

                    if (!revierFun){
                        return value;
                    }

                    let rerOpts = Object.assign({},opts);
                    let rerRes = revierFun.call(this,key,value,typeName,callCount,rerOpts);


                    if (rerOpts.skip){ //需要放在上一句 `revier.call(this,key,value,typeName,callCount,rerOpts)` 的后面，因为 revier 可修改 rerOpts 的值
                        return value;
                    }


                    /*
                    在以下任一情况下，均不会添加 mark
                    - revier 返回 undefined  :  `rerRes === undefined`
                    - skipMark 为 true : `rerOpts.skipMark`
                    - value 是被 customJSONStringify 最初序列化的目标（即：根） 且  skipRootMark 为 true : `rerOpts.skipRootMark && callCount === 1`
                    */
                    if (rerRes === undefined || rerOpts.skipMark || (rerOpts.skipRootMark && callCount === 1)){
                        return rerRes;
                    }

                    return {
                        [mark]:true,
                        [markType]:typeName,
                        [markValue]:rerRes
                    };
                };

                var jsonStr =  JSON.stringify(value,stringifyReviver,opts.space);
            }

        }


        // @ts-ignore
        if (!trObj) {
            jsonStr = JSON.stringify(value,null,options.space);
        }

    }catch (e) {
        throw e;
    }finally {
        //取消禁用toJSON
        if (disTypeInfos && disTypeInfos.length > 0){
            disTypeInfos.forEach(function (funInfo) {
                funInfo.type.prototype.toJSON = funInfo.toJSON;
            });
        }

        // @ts-ignore
        return jsonStr;
    }
}



export enum LostRevier {
    original="original",
    parse = "parse",
    ignore = "ignore"
}



export interface JSONParseOptions {
    mark?:string | null;   //类型标记
    lostRevier?:LostRevier;   //当找不到 Revier 时，如何处理
}


/**
 * 自定义JSON解析；可根据类型自定义解析逻辑；
 * @param text
 * @param typeRevivers
 * @param options
 */
export function customJSONParse<Revr extends Reviver>(text: string, typeRevivers?:TypeRevivers<Revr>|null ,options:JSONParseOptions = {}):any {

    let lostRevier = options.lostRevier || LostRevier.parse ;

    if (typeRevivers) {
        let parseInfo = flatParseTypeRevivers(typeRevivers);
        var trObj = parseInfo.trObject;
    }


    // @ts-ignore
    if (!trObj && lostRevier === LostRevier.original){
        return JSON.parse(text);
    }

    let mark = options.mark == null ? _defaultMark : options.mark ;
    let markType = mark + "Type";
    let markValue = mark + "Value";

    let callCount = 0;  // parseReviver 的调用次数

    function parseReviver(this: any, key: string, value: any) {
        ++callCount;
        if (isBaseType(value)){
            return value;
        }


        let typeName = value[markType];
        if (!(typeName && value[mark])){
            return value;
        }

        var realValue = value[markValue];



        let revier = trObj[typeName];
        let revierFun:ParseReviver = typeof revier === "function" ? <ParseReviver>revier : (<ReviverPair>revier).parse;

        if (!revierFun){
            switch (lostRevier) {
                case LostRevier.ignore: return undefined;
                case LostRevier.original:return value;
                default: return realValue;
            }
        }

        return revierFun.call(this,key,realValue,typeName,callCount);
    }

    return JSON.parse(text,parseReviver);
}
