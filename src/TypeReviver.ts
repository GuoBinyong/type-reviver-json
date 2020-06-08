import {ExactType, ExactTypeName, getNameOfType, getTypeByName} from "type-tls";


export type DataType =  ExactTypeName | ExactType;
export type DataTypeArray = DataType[];
export type Types = DataType | DataTypeArray;


export type TypeReviverArray<Reviver> = [Types,Reviver][];

export type TypeNameReviverArray<Reviver> = [ExactTypeName | ExactTypeName[],Reviver][];
export type TypeNameReviverFlatArray<Reviver> = [ExactTypeName,Reviver][];


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



/**
 * 类型扁平化解析结果
 */
interface TypeFlatParseInfo<Reviver> {
    typeFlat:TypeReviverFlatArray<Reviver>;
    nameFlat:TypeNameReviverFlatArray<Reviver>;
    trObject:TypeReviverObject<Reviver>;
    typeFun:Function[];  //所有类型对应的构造函数数组，如果类型没有对应的构建函数，则不包含在内；
}



/**
 * 扁平化解析 TypeReviverArray
 * @param typeReviverArr
 */
export function flatParseTypeReviverArray<Reviver>(typeReviverArr:TypeReviverArray<Reviver>):TypeFlatParseInfo<Reviver> {
    let typeFlatArr:TypeReviverFlatArray<Reviver> = [];
    let nameFlatArr:TypeNameReviverFlatArray<Reviver> = [];
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
                    typeName = getNameOfType(dataType);
                    typeFun = dataType;
                    break
                }
                default:{
                    typeName = getNameOfType(dataType);
                    typeFun = getTypeByName(typeName);
                }
            }
            nameFlatArr.push([typeName,reviver]);

            if (typeof typeFun === "function"){
                typeFunArr.push(typeFun);
            }

        });
    });

    let info = {
        typeFlat:typeFlatArr,
        nameFlat:nameFlatArr,
        typeFun:typeFunArr
    };

    return Object.defineProperty(info,"trObject",{
        configurable:true,
        enumerable:true,
        get:function () {
            if (this._trObject === undefined){
                this._trObject = Object.fromEntries(nameFlatArr);
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


export function toTypeReviverFlatArray<Reviver>(typeRevivers:TypeRevivers<Reviver>):TypeReviverFlatArray<Reviver>  {
    let typeReviverArr = toTypeReviverArray(typeRevivers);
    return typeReviverArr.reduce(function (flatArray,typeReviver) {
        let types = typeReviver[0];
        let reviver = typeReviver[1];

        let typeArr:DataTypeArray = Array.isArray(types) ? types : [types];

        typeArr.forEach(function (dataType) {
            flatArray.push([dataType,reviver]);
        });
        return flatArray;
    },[] as TypeReviverFlatArray<Reviver>);
}


export function toTypeNameReviverFlatArray<Reviver>(typeRevivers:TypeRevivers<Reviver>):TypeNameReviverFlatArray<Reviver>  {
    let typeReviverArr = toTypeReviverArray(typeRevivers);
    return typeReviverArr.reduce(function (flatArray,typeReviver) {
        let types = typeReviver[0];
        let reviver = typeReviver[1];

        let typeArr:DataTypeArray = Array.isArray(types) ? types : [types];

        typeArr.forEach(function (dataType) {
            flatArray.push([typeof dataType === "string" ? dataType : getNameOfType(dataType),reviver]);
        });
        return flatArray;
    },[] as TypeNameReviverFlatArray<Reviver>);
}


export function toTypeReviverObject<Reviver>(typeRevivers:TypeRevivers<Reviver>):TypeReviverObject<Reviver>  {
    let flatArr = toTypeNameReviverFlatArray(typeRevivers);
    return Object.fromEntries(flatArr);
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



export function toTypeReviverFlatMap<Reviver>(typeRevivers:TypeRevivers<Reviver>):TypeReviverFlatMap<Reviver>  {
    let flatArr = toTypeReviverFlatArray(typeRevivers);
    return new Map(flatArr);
}
