import {getExactTypeStringOf, ExactType, ExactTypeString, getStringOfType,isBaseType,getTypeByName} from "com-tools";



// customJSONStringify 专用的 Reviver
export type StringifyReviver = (this: any, key: string,value: any,type:string ,callCount:number,stringifyOptions:StringifyReviverOptions) => any;

// customJSONParse 专用的 Reviver
export type ParseReviver = (this: any, key: string,value: any,type:string,callCount:number) => any;

// customJSONStringify 和 customJSONParse 都可用的 Reviver
export type SPReviver = (this: any, key: string,value: any,type:string ,callCount:number ,stringifyOptions:StringifyReviverOptions|undefined) => any;


export type DataType =  ExactTypeString | ExactType;
export type DataTypeArray = DataType[];
export type Types = DataType | DataTypeArray;


export type TypeReviverArray<Reviver> = [Types,Reviver][];

export type TypeStringReviverArray<Reviver> = [ExactTypeString | ExactTypeString[],Reviver][];
export type TypeStringReviverFlatArray<Reviver> = [ExactTypeString,Reviver][];


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





export interface TypeReviversPair {
    string?:TypeRevivers<StringifyReviver>;
    parse?:TypeRevivers<ParseReviver>;
}

export interface TypeReviverArrayPair {
    string?:TypeReviverArray<StringifyReviver>;
    parse?:TypeReviverArray<ParseReviver>;
}


export interface TypeReviverFlatArrayPair {
    string?:TypeReviverFlatArray<StringifyReviver>;
    parse?:TypeReviverFlatArray<ParseReviver>;
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

//ReviverPair 的类型守卫
function isReviverPair(target:any):target is ReviverPair {
    return target && typeof target.string === "function" && typeof target.parse === "function"
}






export type TypeRevivers<Reviver> = TypeReviverArray<Reviver> | TypeReviverObject<Reviver> | TypeReviverMap<Reviver>;

export type TypeReviversOptions = TypeRevivers<SPReviver | ReviverPair> | TypeReviversPair


/**
 * 解析 TypeReviversOptions 到 TypeReviversPair；
 * 它会自动将 TypeRevivers<ReviverPair>  拆分成 TypeRevivers<StringifyReviver> 和 TypeRevivers<ParseReviver>
 * @param trOpts
 */
export function parseTypeReviversOptions(trOpts:TypeReviversOptions):TypeReviversPair {
    if (isTypeReviversPair(trOpts)){
        return trOpts;
    }

    let trArr = toTypeReviverArray(trOpts);
    let hasPair = trArr.some(function (typeReviver) {
        return isReviverPair(typeReviver[1]);
    });

    if (hasPair){
        var strTypeRevivers:TypeReviverArray<StringifyReviver> = [];
        var parseTypeRevivers:TypeReviverArray<ParseReviver> = [];

        trArr.forEach(function (typeReviver) {
            let reviver = typeReviver[1];
            if (typeof reviver === "function"){
                strTypeRevivers.push(typeReviver as [Types,StringifyReviver]);
                parseTypeRevivers.push(typeReviver as [Types,ParseReviver]);
            }else {
                let types = typeReviver[0];
                strTypeRevivers.push([types,reviver.string]);
                parseTypeRevivers.push([types,reviver.parse]);
            }
        });

    }else {
        strTypeRevivers = trArr as TypeReviverArray<StringifyReviver>;
        parseTypeRevivers = trArr as TypeReviverArray<ParseReviver>;
    }

    return {
        string:strTypeRevivers,
        parse:parseTypeRevivers
    };
}


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



/**
 * 类型扁平化解析结果
 */
interface TypeFlatParseInfo<Reviver> {
    typeFlat:TypeReviverFlatArray<Reviver>;
    stringFlat:TypeStringReviverFlatArray<Reviver>;
    trObject:TypeReviverObject<Reviver>;
    typeFun:Function[];  //所有类型对应的构造函数数组，如果类型没有对应的构建函数，则不包含在内；
}



/**
 * 扁平化解析 TypeReviverArray
 * @param typeReviverArr
 */
export function flatParseTypeReviverArray<Reviver>(typeReviverArr:TypeReviverArray<Reviver>):TypeFlatParseInfo<Reviver> {
    let typeFlatArr:TypeReviverFlatArray<Reviver> = [];
    let stringFlatArr:TypeStringReviverFlatArray<Reviver> = [];
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
export function flatParseTypeRevivers<Reviver>(typeRevivers:TypeRevivers<Reviver>):TypeFlatParseInfo<Reviver>  {
    let typeReviverArr = toTypeReviverArray(typeRevivers);
    return  flatParseTypeReviverArray(typeReviverArr);
}




export function toTypeStringReviverFlatArray<Reviver>(typeRevivers:TypeRevivers<Reviver>):TypeStringReviverFlatArray<Reviver>  {
    return  flatParseTypeRevivers(typeRevivers).stringFlat;
}


export function toTypeReviverObject<Reviver>(typeRevivers:TypeRevivers<Reviver>):TypeReviverObject<Reviver>  {
    return flatParseTypeRevivers(typeRevivers).trObject;
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
export function customJSONStringify(value: any, typeReviversOpts?:TypeReviversOptions|null,options:JSONStringifyOptions = {}):string {

    try {


        if  (typeReviversOpts){
            let trsPair = parseTypeReviversOptions(typeReviversOpts);
            let typeRevivers = trsPair.string;

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
                    mark = opts.mark = mark == null ? _defaultMark : mark;


                    let callCount = 0;  // stringifyReviver 的调用次数

                    let stringifyReviver = function (this: any, key: string, value: any) {
                        ++callCount;

                        let isMarked = value != null && value[mark];  // value 是被标记的数据，表示已经处理过了，不用再处理了
                        let needSkip = opts.skipRoot && callCount === 1;   //需要跳过这次处理
                        if (isMarked || needSkip){
                            return value;
                        }


                        let typeStr = getExactTypeStringOf(value);
                        let revier = trObj[typeStr];
                        if (!revier){
                            return value;
                        }

                        let rerOpts = Object.assign({},opts);
                        let rerRes = revier.call(this,key,value,typeStr,callCount,rerOpts);


                        if (rerOpts.skip){ //需要放在上一句 `revier.call(this,key,value,typeStr,callCount,rerOpts)` 的后面，因为 revier 可修改 rerOpts 的值
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

                        if  (isBaseType(rerRes)){
                            /*
                             此处要手动拼装，不能用
                             ```
                             JSON.stringify({
                                [mark]:true,
                                type:typeStr,
                                value:rerRes
                            });
                            ```
                            原因：
                            此处返回后，JSON.stringify 会对 reviver 返回的值再次进行 JSON.stringify，这会导致字符串外面又包一层引号，从而会导致在解析时会把该值作为 字符串解析，而不是 JSON 对象；
                             */
                            let valueStr = typeof rerRes === "string" ? `"${rerRes}"` : rerRes;
                            return `{"${mark}":true,"type":"${typeStr}","value":${valueStr}`;

                            // return JSON.stringify({
                            //     [mark]:true,
                            //     type:typeStr,
                            //     value:rerRes
                            // });
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
                }

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
    mark?:string | string[] | null;   //类型标记
    lostRevier?:LostRevier;   //当找不到 Revier 时，如何处理
}


/**
 * 自定义JSON解析；可根据类型自定义解析逻辑；
 * @param text
 * @param typeRevivers
 * @param options
 */
export function customJSONParse(text: string, typeReviversOpts?:TypeReviversOptions|null ,options:JSONParseOptions = {}):any {

    let {mark = _defaultMark,lostRevier = LostRevier.parse} = options;

    if (mark == null){
        return JSON.parse(text);
    }

    var marks = Array.isArray(mark) ? mark : [mark];

    var trObj:TypeReviverObject<ParseReviver> = {};

    if  (typeReviversOpts) {
        let trsPair = parseTypeReviversOptions(typeReviversOpts);
        let typeRevivers = trsPair.parse;

        if (typeRevivers) {
            let parseInfo = flatParseTypeRevivers(typeRevivers);
            trObj = parseInfo.trObject;
        }
    }

    let callCount = 0;  // parseReviver 的调用次数

    function parseReviver(this: any, key: string, value: any) {
        ++callCount;
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

        return revier.call(this,key,realValue,typeName,callCount);
    }

    return JSON.parse(text,parseReviver);
}
