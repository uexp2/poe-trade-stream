const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const app = express()

const { whisperFormatter } = require('./collection.js')
const { StashStream } = require('./stashstream.js')
const { ManageStash } = require('./managestash.js')
const { FilterChainItem } = require('./filtergenerator.js')
const { scrapeEndStreamId } = require('./scrapeEndStreamId.js')


//~~~~~~~~~~~~~~~ WebSocket
const WebSocketServer = require('websocket').server;
const http = require('http');

const EventEmitter = require('events');
class NewStashEvent extends EventEmitter {}
const stashEvent = new NewStashEvent();

const server = http.createServer((req, res) => {
  res.writeHead(404);
  res.end();
});

server.listen(1366, () => { console.log((new Date()), 'WebSocket Server listening on port 1366') })

wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false
});

function originIsAllowed(origin) {
  //verify origin for security in future
  return true;
}

const defaultItemFilterState = {
  compoundName: 'The Mayor',
  league: 'Betrayal',
  price:{
    num:[Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY], 
    currencyType: 'chaos'},
};

wsServer.on('request', request => {
  if (!originIsAllowed(request.origin)) { request.reject(); return; }
  const connection = request.accept(null, request.origin);
  let thisItemFilter = defaultItemFilterState;
  let thisStashFilter = null;

  let itemFilter = (item) => {  // RET: bool
    return (new FilterChainItem(thisItemFilter)).eval(item, true);
  };
  
  let stashFilter = (stash) => {
    return stash.public;
  };
  
  // this function is called when a stash and item matches the filters
  let stashReturn = (stash, item) => {
    console.log(whisperFormatter(stash, item));
    connection.send(JSON.stringify({stash:stash, item:item})); 
  };

  const mngStash = new ManageStash({stashFilter: stashFilter,
                                    itemFilter: itemFilter,
  // Called when the stash and item matches the filter. Param (stash, item)
                                    callback: stashReturn}); 

  // Function needs to be named so that it can be removed from listener
  // at later date
  function onNewStash(stash) {
    // ---> RECEIVED NEW STASH FROM STASH STREAM
    mngStash.applyFilters(stash)
  }
  stashEvent.on('newStash', onNewStash);

  connection.on('message', message => {
    if (message.type === 'utf8') {
      [command, data] = JSON.parse(message.utf8Data);
      console.log(command, data);
      if (command === 'newFilters') {
        if (Object.keys(data).length === 0 && data.constructor === Object) return; // no filters passed
        if (data.itemFilterObj) thisItemFilter = data.itemFilterObj;
        if (data.stashFilterObj) thisStashFilter = data.stashFilterObj;
      }
    }
  });

  connection.on('close', () => {
    stashEvent.removeListener('newStash', onNewStash)
  })

  connection.onerror = (err) => {
    console.log(err);
    console.log('ERROR Websocket');
  }
});

//~~~~~~~Fetch latest stash id

let numRequestError = 0;
const restartScrape = (err) => {
  numRequestError++;
  console.log('A REQUEST ERROR HAS OCCURED');
  console.log(err, numRequestError);
  setTimeout(startScrape, 20*1000);
}
const startScrape = async () => {
  scrapeEndStreamId()
  .then(data => {
    console.log(data)
    const stream = new StashStream(data, { mod: 10, onRequestError:restartScrape });
    stream.streamJSONFetch(stash => {
      stashEvent.emit('newStash', stash); // SEND TO SOCKET HANDLER --->
    });
  })
  .catch(err => {
    console.log('Scrape catch error')
    console.error(err)
    process.exit()
  })
}
startScrape();

//~~~~~~~~~END
app.use('/static', express.static(path.join(__dirname, '../build/static')))

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())


app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../build', 'index.html'))
})

app.get('/api/test', (req, res, next) => {
  res.send({ exp: 'Test' })
})

app.listen(process.env.PORT || 3001)
