export type ArrayLikeString =
    'Int8Array' |
    'Uint8Array' |
    'Uint8ClampedArray' |
    'Int16Array' |
    'Uint16Array' |
    'Int32Array' |
    'Uint32Array' |
    'Float32Array' |
    'Float64Array';

export function atype(array:ArrayLike<number>): ArrayLikeString {
    return array.constructor.name as ArrayLikeString;
}

export function typedArray2Array(buffer:ArrayLike<number>):number[] {
    const type = atype(buffer);

    if(type.indexOf('Float') > -1) {
        const arr = [];
        const nDecimals = type === "Float32Array" ? 5 : 10;
        for(let i=0;i<buffer.length;i++) {
            const n = buffer[i].toFixed(nDecimals);
            arr.push(
                parseFloat(n.toString())
            );
        }
        return arr;
    }

    return Array.from(buffer)
}