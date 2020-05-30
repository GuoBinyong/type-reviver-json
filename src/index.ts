import {getTypeStringOf} from "com-tools"


type Reviver = (this: any, key: string,value: any) => any;
type DataType = any;

type TypeReviverArray = [DataType,Reviver][];
type TypeReviverObject = {
    [typeName:string]:Reviver
};
type TypeReviverMap = Map<DataType,Reviver>;

type TypeReviver = TypeReviverArray | TypeReviverObject | TypeReviverMap;



function toTypeReviverArray(typeReviver:TypeReviver):TypeReviverArray {

    switch (typeReviver.constructor.name) {
        case "Map":{
            var typeRevArr = Array.from(typeReviver as TypeReviverMap);
            break;
        }
        case "Array":{
            typeRevArr = typeReviver as TypeReviverArray;
            break;
        }
        default:{
            typeRevArr = Object.entries(typeReviver);
        }
    }

    return typeRevArr;
}


function toTypeReviverMap(typeReviver:TypeReviver):TypeReviverMap {
    switch (typeReviver.constructor.name) {
        case "Map":{
            var typeRevMap = typeReviver as TypeReviverMap;
            break;
        }
        case "Array":{
            typeRevMap = new Map(typeReviver as TypeReviverArray);
            break;
        }
        default:{
            typeRevMap = new Map(Object.entries(typeReviver));
        }
    }

    return typeRevMap;
}





function customStringify(value: any, typeReviver:TypeReviver) {
    let typeRevMap = toTypeReviverMap(typeReviver);

    function stringifyReviver(this: any, key: string,value: any) {


    }



}
