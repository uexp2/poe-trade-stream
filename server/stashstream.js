const request = require('request')
const JSONStream = require('JSONStream')
const http = require('http')

class StashStream {
  constructor(start_change_id, obj = {}) {
    this.next_change_id = start_change_id;
    this.url_formatted_src = 'http://www.pathofexile.com/api/public-stash-tabs?id='
    this.count = 0;

    this.mod = (obj.mod? obj.mod : 0)
    this.onDiffIdTime = (obj.onDiffIdTime ? obj.onDiffIdTime : 100);
    this.onSameIdTime = (obj.onSameIdTime ? obj.onSameIdTime : 2000);
    this.onRequestError = obj.onRequestError || (() => {});

    this.onErrorTimeDefl = 20;
    this.onErrorTimeCurr = this.onErrorTimeDefl;
    this.countErrors = 0;
    //this.agent = new http.Agent({ keepAlive: true })
  }

  streamJSONFetch(perStashCallback) {
    //this.streamRecursiveRequest(perStashCallback);
    this.streamLoopedRequest(perStashCallback);
  }
  
  streamRecursiveRequest(perStashCallback) {
    let onHeaderRecievedRecursive = (nextWaitTimeMilli) => {
      setTimeout(() => {this.streamRecursiveRequest(perStashCallback)}, nextWaitTimeMilli);
    }

    request({url: this.url_formatted_src + this.next_change_id})
    .on('error', err => {
      console.log('error', err)
    })
    .pipe(this._newJsonStreamObject(perStashCallback, onHeaderRecievedRecursive))
  }

  _sigmoid(num) {
    let k = 200;
    let a = 5;
    let b = -0.01;
    let yShift = 50;

    return Math.floor((k/(1 + Math.exp(a + b*num)) + yShift)/10)*10;
  }

  streamLoopedRequest(perStashCallback) {
    let unblock = () => {};
    let timeOnStart = null;
    let totalRunningAvg = new AvgRequestTime(null);
    let avgReqTime = new AvgRequestTime(5);
    let inFastLoopState = true;

    let onHeaderRecieved = (milliTimeOut, next_change_id) => {
      let callTime = (new Date() - timeOnStart);
      avgReqTime.addTime(callTime);
      totalRunningAvg.addTime(callTime);

      //console.log(inFastLoopState, avgReqTime.get(), callTime, next_change_id, totalRunningAvg.get())

      if (next_change_id === null) {
        setTimeout(unblock, milliTimeOut);
        return;
      }

      if (inFastLoopState) {
        if (this.next_change_id === next_change_id || avgReqTime.get() < 850) {
          inFastLoopState = false;
          setTimeout(unblock, 300);
          return;
        }
        unblock();
        return;
      }

      if (avgReqTime.get() > 1100) {
        if (avgReqTime.get() > 1500) inFastLoopState = true;
        unblock();
        return;
      } else if (avgReqTime.get() < 1000) {
        setTimeout(unblock, this._sigmoid(1000 - avgReqTime.get()) + 750);
        return;
      } else {
        setTimeout(unblock, 300);
        return;
      }
    };

    // Start looped requests
    (async ()=> {
      let loopState = true;
      while(loopState) {
        timeOnStart = new Date();
        request({url: this.url_formatted_src + this.next_change_id})
        .on('error', err => {
          loopState = false;
          setTimeout(unblock, 1000);
          this.onRequestError(err);
        })
        .pipe(this._newJsonStreamObject(perStashCallback, onHeaderRecieved));
        await new Promise(res => {unblock = res;});
      }
    })();
  }

  _newJsonStreamObject(perStashCallback, headerRecieved) {
    let stream = JSONStream.parse(['stashes',true]);
    stream.on('header', data => {
      if (this.mod > 0) this.count++;

      if (!data.next_change_id) {
        if (this.mod > 0) console.log('ERROR! Timeout:', this.onErrorTimeCurr, 'seconds', new Date().toLocaleTimeString());
        this.onErrorTimeCurr = this.onErrorTimeCurr + 5;
        this.countErrors++;
        if (this.countErrors > 5) process.exit();
        headerRecieved(this.onErrorTimeCurr*1000, null)
      } else if (this.next_change_id != data.next_change_id) {
        if (this.mod > 0 && this.count % this.mod === 0) console.log(this.count, this.next_change_id, '----', new Date().toLocaleTimeString());
        headerRecieved(this.onDiffIdTime, data.next_change_id);
        this.next_change_id = data.next_change_id;
        this.onErrorTimeCurr = this.onErrorTimeDefl;
      } else {
        if (this.mod > 0) console.log(this.count, this.next_change_id, 'same', new Date().toLocaleTimeString());
        headerRecieved(this.onSameIdTime, data.next_change_id);
        this.onErrorTimeCurr = this.onErrorTimeDefl;
      }
    });
    stream.on('data', perStashCallback);
    return stream;
  };
}

class AvgRequestTime {
  constructor(prevN = 3) {
    this.prevN = prevN;
    this.arrayTime = [];

    this.runningAvg = 0;
    this.n = 0;
  }

  addTime(millisecond) {
    if (this.prevN === null) {
      this.runningAvg = (this.runningAvg*this.n)/(this.n+1) + millisecond/(this.n + 1);
      this.n++;
      return this;
    }

    this.arrayTime.push(millisecond);
    if (this.arrayTime.length > this.prevN) {
      this.arrayTime.shift()
    }
    return this;
  }

  get() {
    if (this.prevN === null) {
      return Math.floor(this.runningAvg);
    } else {
      return Math.floor((this.arrayTime.reduce((a, b) => a + b) / this.arrayTime.length)/10)*10;
    }
  }
}

exports.StashStream = StashStream;