import _ from 'lodash';

export namespace BasisPointUtil {
  export function numToBP(num: number | string) {
    return _.round(parseFloat(String(num)) * 10000);
  }

  export function bpToNum(bp: number, precision = 2) {
    return _.round(bp / 10000, precision);
  }
}
