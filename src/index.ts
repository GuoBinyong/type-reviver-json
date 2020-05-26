
type Reviver = (this: any, key: string,value: any) => any;
type DataType = any;

type TypeReviverArray = [DataType,Reviver][];
type TypeReviverObject = {
    [typeName:string]:Reviver
};
type TypeReviverMap = Map<DataType,Reviver>;

type TypeReviver = TypeReviverArray | TypeReviverObject | TypeReviverMap;



function toTypeReviverArray(typeReviver:TypeReviver):TypeReviverArray {
    let typeRevArr:TypeReviverArray = [];
    switch (typeReviver.constructor.name) {
        case "Map":{
            for (let entries of typeReviver as TypeReviverMap){
                typeRevArr.push(entries);
            }
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





function customStringify(value: any, typeReviver:TypeReviver) {
    let typeRevArr = toTypeReviverArray(typeReviver);

    function stringifyReviver(this: any, key: string,value: any) {

    }



}
