
class ManageStash {
  constructor(obj = {}) {
    this.stashFilter = function(stash){
      return true;
    };
    if (obj.stashFilter) this.stashFilter = obj.stashFilter;

    this.itemFilter = (item) => {
      return true;
    };
    if (obj.itemFilter) this.itemFilter = obj.itemFilter;

    this.callback = (stash, item) => {
      return true;
    };
    if (obj.callback) this.callback = obj.callback;
  }

  _stashItemsRemoved(stashJson) {  // Removes the list of items in copy
    let newStash = {}; let keys = Object.keys(stashJson);
    let i = keys.length;
    while(i--) { if (keys[i] != 'items') newStash[keys[i]] = stashJson[keys[i]]; }
    return newStash;
  }

  updateFilters(obj) {
    if (obj && obj.stashFilter) this.stashFilter = obj.stashFilter;
    if (obj && obj.itemFilter) this.itemFilter = obj.itemFilter;
  }

  applyFilters(stashJson){
    if (this.stashFilter(stashJson)) {
      stashJson.items
      .forEach(item => { 
        if (this.itemFilter(item)) this.callback(this._stashItemsRemoved(stashJson), item);
      });
    }
  }
}

exports.ManageStash = ManageStash;