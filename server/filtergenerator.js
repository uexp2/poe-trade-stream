
class FilterChainItem {
  constructor(objFilter) {
    this.objFilter = objFilter;
    this.boolValue = true;

    //filter possibly too small
    this.filterTooSmall = (Object.keys(this.objFilter).length <= 1 && !this.objFilter.compoundName);

    delete this.objFilter.eval;
    delete this.objFilter.constructor;

    if (objFilter.price) {
      if (!objFilter.price.num[0]) objFilter.price.num[0] = Number.NEGATIVE_INFINITY;
      if (!objFilter.price.num[1]) objFilter.price.num[1] = Number.POSITIVE_INFINITY;
    }
  }

  eval(item = null, reset = false){
    if (this.filterTooSmall) return false;
    if (!item) return this.boolValue;
    let keys = Object.keys(this.objFilter);
    for (let i = 0, len = keys.length; i < len && this.boolValue; i++) {
      this[keys[i]](item);
    }
    let ret = this.boolValue;
    this.boolValue = (this.boolValue || reset);
    return ret;
  }

  compoundName(itemStream) {
    if (!this.boolValue) return this;
    let local = (this.objFilter.compoundName === (itemStream.name + ' ' + itemStream.typeLine) || 
                this.objFilter.compoundName === itemStream.name || 
                this.objFilter.compoundName === itemStream.typeLine);
    this.boolValue = this.boolValue && local;
    return this;
  }

  league(itemStream) {
    if (!this.boolValue) return this;
    let local = itemStream.league === this.objFilter.league;
    this.boolValue = this.boolValue && local;
    return this;
  }

  // objFilter.price = {num:[<Number>, <Number>], type:<string>} = {num:[5, Number.POSITIVE_INFINITY], currencyType:'chaos'}
  price(itemStream) {
    if (!this.boolValue) return this;
    if (!itemStream.note) { this.boolValue = false; return this; }
    let [noteHeader, itemPrice, currencyType] = (itemStream.note).split(' ');
    itemPrice = parseInt(itemPrice);
    if (itemPrice === NaN) { this.boolValue = false; return this; }
    let local = ((noteHeader === '~price' || noteHeader === '~b/o') &&
                (currencyType === this.objFilter.price.currencyType) &&
                (this.objFilter.price.num[0] <= itemPrice && itemPrice <= this.objFilter.price.num[1]));
    this.boolValue = this.boolValue && local;
    return this;
  }
}

exports.FilterChainItem = FilterChainItem;
